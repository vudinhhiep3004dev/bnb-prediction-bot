import { BinanceService } from './binance.js';
import { AIService } from './ai.js';
import { ChainlinkService } from './chainlink.js';
import { RoundMonitorService } from './round-monitor.js';
import { HybridPriceService } from './hybrid-price.js';
import { calculateIndicators, calculatePredictedPrice } from '../utils/indicators.js';
import { PredictionResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class PredictionService {
  private binanceService: BinanceService;
  private aiService: AIService;
  private chainlinkService: ChainlinkService;
  private roundMonitorService: RoundMonitorService;
  private hybridPriceService: HybridPriceService;

  constructor() {
    this.binanceService = new BinanceService();
    this.aiService = new AIService();
    this.chainlinkService = new ChainlinkService();
    this.roundMonitorService = new RoundMonitorService(this.chainlinkService);
    this.hybridPriceService = new HybridPriceService(
      this.chainlinkService,
      this.binanceService
    );
  }

  /**
   * Generate a complete prediction for BNB price using Hybrid Approach
   */
  async generatePrediction(symbol: string = 'BNBUSDT'): Promise<PredictionResult> {
    try {
      logger.info(`🚀 Generating HYBRID prediction for ${symbol}...`);

      // Step 1: Get hybrid price data (Chainlink + Binance)
      logger.info('📊 Step 1: Fetching hybrid price data...');
      const hybridPrice = await this.hybridPriceService.getHybridPrice(symbol);

      logger.info('✅ Hybrid price obtained:', {
        selectedPrice: hybridPrice.selectedPrice.toFixed(2),
        source: hybridPrice.selectedSource,
        chainlinkAvailable: hybridPrice.chainlinkPrice !== null,
        confidenceAdjustment: (hybridPrice.confidenceAdjustment * 100).toFixed(1) + '%',
      });

      // Step 2: Get round timing information
      logger.info('⏰ Step 2: Checking round timing...');
      let roundTiming;
      let timeUntilLock = 0;
      try {
        roundTiming = await this.roundMonitorService.getRoundTiming();
        timeUntilLock = await this.roundMonitorService.getTimeUntilLock();

        logger.info('✅ Round timing obtained:', {
          currentEpoch: roundTiming.currentEpoch.toString(),
          timeUntilNextRound: `${roundTiming.timeUntilNextRound}s`,
          timeUntilLock: `${timeUntilLock}s`,
          isOptimalTime: roundTiming.isOptimalTime,
        });
      } catch (error) {
        logger.warn('⚠️  Could not fetch round timing (non-critical):', error);
      }

      // Step 3: Fetch enhanced market data (includes order book & trade flow)
      logger.info('📈 Step 3: Fetching enhanced market data from Binance...');
      const marketData = await this.binanceService.getEnhancedMarketData(
        symbol,
        '5m',
        100
      );

      // Override current price with hybrid price
      marketData.currentPrice = hybridPrice.selectedPrice;

      // Step 4: Calculate technical indicators with recent trades for volume delta
      logger.info('🔢 Step 4: Calculating technical indicators...');
      const recentTrades = marketData.recentTrades
        ? await this.binanceService.getRecentTrades(symbol, 100)
        : undefined;
      const indicators = calculateIndicators(marketData.klines, recentTrades);

      // Step 5: Get AI prediction
      logger.info('🤖 Step 5: Requesting AI analysis...');
      const aiPrediction = await this.aiService.generatePrediction({
        marketData,
        indicators,
      });

      // Step 6: Apply confidence adjustment based on price source
      logger.info('⚖️  Step 6: Applying confidence adjustment...');
      const adjustedConfidence = aiPrediction.confidence * hybridPrice.confidenceAdjustment;

      logger.info('Confidence adjustment:', {
        original: aiPrediction.confidence.toFixed(1) + '%',
        adjustment: (hybridPrice.confidenceAdjustment * 100).toFixed(1) + '%',
        adjusted: adjustedConfidence.toFixed(1) + '%',
      });

      // Step 7: Calculate predicted price
      logger.info('💰 Step 7: Calculating predicted price...');
      const priceCalculation = calculatePredictedPrice(
        hybridPrice.selectedPrice,
        aiPrediction.prediction,
        indicators,
        marketData.orderBook,
        marketData.recentTrades
      );

      // Step 8: Format result
      const result: PredictionResult = {
        prediction: aiPrediction.prediction,
        confidence: adjustedConfidence,
        currentPrice: hybridPrice.selectedPrice,
        predictedPrice: priceCalculation.predictedPrice,
        priceRange: priceCalculation.priceRange,
        expectedChange: priceCalculation.expectedChange,
        reasoning: aiPrediction.reasoning,
        indicators: {
          rsi: indicators.rsi,
          trend: this.determineTrend(indicators),
          volume: this.determineVolumeSignal(indicators.volumeProfile.currentVolumeRatio),
        },
        timestamp: new Date(),
        // NEW: Add hybrid price info
        priceSource: hybridPrice.selectedSource,
        priceConfidence: hybridPrice.confidenceAdjustment,
        roundInfo: roundTiming
          ? {
              currentEpoch: roundTiming.currentEpoch,
              timeUntilLock,
            }
          : undefined,
      };

      logger.info('✅ HYBRID prediction generated successfully:', {
        prediction: result.prediction,
        confidence: result.confidence.toFixed(1) + '%',
        predictedPrice: result.predictedPrice.toFixed(2),
        expectedChange: result.expectedChange.toFixed(2) + '%',
        priceSource: result.priceSource,
        priceConfidence: ((result.priceConfidence || 1) * 100).toFixed(1) + '%',
      });

      return result;
    } catch (error) {
      logger.error('Error generating prediction:', error);
      throw error;
    }
  }

  /**
   * Determine overall trend from indicators (updated for new EMAs)
   */
  private determineTrend(indicators: any): string {
    const { ema, macd } = indicators;

    let bullishSignals = 0;
    let bearishSignals = 0;

    // EMA trend (updated to use ema5, ema13, ema21)
    if (ema.ema5 > ema.ema13 && ema.ema13 > ema.ema21) {
      bullishSignals++;
    } else if (ema.ema5 < ema.ema13 && ema.ema13 < ema.ema21) {
      bearishSignals++;
    }

    // MACD
    if (macd.histogram > 0) {
      bullishSignals++;
    } else {
      bearishSignals++;
    }

    // RSI
    if (indicators.rsi > 50) {
      bullishSignals++;
    } else {
      bearishSignals++;
    }

    if (bullishSignals > bearishSignals) {
      return '📈 Bullish';
    } else if (bearishSignals > bullishSignals) {
      return '📉 Bearish';
    } else {
      return '➡️ Neutral';
    }
  }

  /**
   * Determine volume signal
   */
  private determineVolumeSignal(volumeRatio: number): string {
    if (volumeRatio > 1.5) {
      return '🔥 High Volume';
    } else if (volumeRatio > 1.0) {
      return '📊 Above Average';
    } else if (volumeRatio > 0.7) {
      return '📉 Below Average';
    } else {
      return '💤 Low Volume';
    }
  }

  /**
   * Get quick market summary
   */
  async getMarketSummary(symbol: string = 'BNBUSDT'): Promise<string> {
    try {
      const ticker = await this.binanceService.get24hrTicker(symbol);
      const currentPrice = parseFloat(ticker.lastPrice);
      const change24h = parseFloat(ticker.priceChangePercent);
      const volume24h = parseFloat(ticker.volume);
      const high24h = parseFloat(ticker.highPrice);
      const low24h = parseFloat(ticker.lowPrice);

      const emoji = change24h > 0 ? '📈' : '📉';

      return `${emoji} **BNB Market Summary**

💰 Current Price: $${currentPrice.toFixed(2)}
📊 24h Change: ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%
📈 24h High: $${high24h.toFixed(2)}
📉 24h Low: $${low24h.toFixed(2)}
💹 24h Volume: ${volume24h.toFixed(2)} BNB`;
    } catch (error) {
      logger.error('Error getting market summary:', error);
      throw error;
    }
  }
}

