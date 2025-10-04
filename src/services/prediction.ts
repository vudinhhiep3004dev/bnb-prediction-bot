import { BinanceService } from './binance.js';
import { AIService } from './ai.js';
import { calculateIndicators, calculatePredictedPrice } from '../utils/indicators.js';
import { PredictionResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class PredictionService {
  private binanceService: BinanceService;
  private aiService: AIService;

  constructor() {
    this.binanceService = new BinanceService();
    this.aiService = new AIService();
  }

  /**
   * Generate a complete prediction for BNB price
   */
  async generatePrediction(symbol: string = 'BNBUSDT'): Promise<PredictionResult> {
    try {
      logger.info(`Generating prediction for ${symbol}...`);

      // Step 1: Fetch enhanced market data (includes order book & trade flow)
      logger.info('Fetching enhanced market data from Binance...');
      const marketData = await this.binanceService.getEnhancedMarketData(
        symbol,
        '5m',
        100
      );

      // Step 2: Calculate technical indicators with recent trades for volume delta
      logger.info('Calculating technical indicators...');
      const recentTrades = marketData.recentTrades
        ? await this.binanceService.getRecentTrades(symbol, 100)
        : undefined;
      const indicators = calculateIndicators(marketData.klines, recentTrades);

      // Step 3: Get AI prediction
      logger.info('Requesting AI analysis...');
      const aiPrediction = await this.aiService.generatePrediction({
        marketData,
        indicators,
      });

      // Step 4: Calculate predicted price
      logger.info('Calculating predicted price...');
      const priceCalculation = calculatePredictedPrice(
        marketData.currentPrice,
        aiPrediction.prediction,
        indicators,
        marketData.orderBook,
        marketData.recentTrades
      );

      // Step 5: Format result
      const result: PredictionResult = {
        prediction: aiPrediction.prediction,
        confidence: aiPrediction.confidence,
        currentPrice: marketData.currentPrice,
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
      };

      logger.info('Prediction generated successfully:', {
        prediction: result.prediction,
        confidence: result.confidence,
        predictedPrice: result.predictedPrice,
        expectedChange: result.expectedChange,
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

