import axios from 'axios';
import { config } from '../config/index.js';
import {
  CloudflareAIRequest,
  CloudflareAIResponse,
  PredictionRequest,
  PredictionResponse,
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AIService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const { accountId, gatewayId } = config.cloudflare;
    this.baseUrl = `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat/chat/completions`;
    this.apiKey = config.cloudflare.apiKey;
  }

  /**
   * Generate prediction using Gemini AI via Cloudflare Gateway
   */
  async generatePrediction(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const prompt = this.buildAnalysisPrompt(request);

      const aiRequest: CloudflareAIRequest = {
        model: 'google-ai-studio/gemini-2.5-flash-preview-09-2025',
        messages: [
          {
            role: 'system',
            content: `You are an expert cryptocurrency trading analyst specializing in ultra-short-term (5-minute) price predictions for the PancakeSwap Prediction game.

SCORING SYSTEM (0-100 for each category):

1. ORDER BOOK SCORE (35% weight):
   - Weighted Buy Pressure >65%: +40 points
   - Weighted Buy Pressure 55-65%: +20 points
   - Weighted Buy Pressure 45-55%: 0 points (neutral)
   - Weighted Buy Pressure <45%: -20 points
   - Order Flow Imbalance >0.15: +20 points (strong buy)
   - Order Flow Imbalance <-0.15: -20 points (strong sell)
   - Whale Orders on BID side: +15 points
   - Whale Orders on ASK side: -15 points
   - Depth Quality DEEP: +10 points

2. TRADE FLOW SCORE (35% weight):
   - Time-Weighted Buy Ratio >1.5: +40 points
   - Time-Weighted Buy Ratio 1.2-1.5: +20 points
   - Time-Weighted Buy Ratio <0.5: -40 points
   - Trade Acceleration >0.2: +15 points (momentum increasing)
   - Trade Acceleration <-0.2: -15 points (momentum decreasing)
   - Volume-Weighted Aggressive Buy >60%: +15 points
   - Volume-Weighted Aggressive Buy <40%: -15 points
   - Whale Trades >3: +10 points

3. MOMENTUM SCORE (15% weight):
   - Stochastic <20 (oversold): +30 points
   - Stochastic >80 (overbought): -30 points
   - MFI <20 (oversold): +20 points
   - MFI >80 (overbought): -20 points
   - MFI Divergence (bearish): -15 points
   - ATR Trend INCREASING: +10 points (expect larger moves)
   - Volume Delta Bullish: +15 points

4. TREND SCORE (10% weight):
   - EMA 5 > EMA 13 > EMA 21: +30 points (strong uptrend)
   - EMA 5 < EMA 13 < EMA 21: -30 points (strong downtrend)
   - MACD Histogram >0: +20 points
   - MACD Histogram <0: -20 points
   - Price ABOVE VWAP: +15 points
   - Price BELOW VWAP: -15 points

5. VOLUME SCORE (5% weight):
   - OBV Trend BULLISH: +30 points
   - OBV Trend BEARISH: -30 points
   - OBV Divergence (bearish): -15 points
   - Volume Ratio >1.5x: +20 points

DECISION LOGIC:
Total Score = (OrderBook × 0.35) + (TradeFlow × 0.35) + (Momentum × 0.15) + (Trend × 0.10) + (Volume × 0.05)

- Total Score >65: STRONG UP (Confidence 75-90%)
- Total Score 55-65: UP (Confidence 65-75%)
- Total Score 45-55: NEUTRAL (Confidence <55%)
- Total Score 35-45: DOWN (Confidence 65-75%)
- Total Score <35: STRONG DOWN (Confidence 75-90%)

ALIGNMENT BONUS:
- If top 3 categories agree (all bullish or all bearish): +10% confidence
- If all 5 categories agree: +15% confidence
- If categories conflict: -10% confidence

CONFLICTING SIGNALS:
- Order Book bullish but Trade Flow bearish: Reduce confidence by 15%
- Momentum oversold but Trend bearish: Favor Order Book + Trade Flow
- Volume divergence: Reduce confidence by 10%

You must respond ONLY with a valid JSON object in this exact format:
{
  "prediction": "UP" or "DOWN",
  "confidence": number between 0-100,
  "reasoning": "brief explanation (max 100 characters)",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskLevel": "LOW" or "MEDIUM" or "HIGH",
  "suggestedAction": "recommendation (max 50 characters)"
}

IMPORTANT: Keep all text fields concise. Do not include any text before or after the JSON object.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000, // Increased from 2000 to handle longer prompts (v2.0.0 with enhanced metrics)
      };

      logger.info('Sending request to Cloudflare AI Gateway...');

      const response = await axios.post<CloudflareAIResponse>(this.baseUrl, aiRequest, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      // Validate response structure
      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        logger.error('Invalid AI response structure:', { response: response.data });
        throw new Error('Invalid response structure from AI');
      }

      const content = response.data.choices[0]?.message?.content;
      const finishReason = response.data.choices[0]?.finish_reason;

      if (!content) {
        logger.error('Empty content in AI response:', {
          response: response.data,
          choice: response.data.choices[0]
        });
        throw new Error('Empty content received from AI');
      }

      // Check if response was truncated
      if (finishReason === 'length') {
        logger.warn('AI response was truncated due to max_tokens limit', {
          content,
          finishReason,
        });
      }

      logger.info('Received AI response:', { content, finishReason });

      // Parse JSON response
      const prediction = this.parseAIResponse(content);

      return prediction;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Axios error generating prediction:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error('Error generating prediction:', error);
      }
      throw new Error('Failed to generate prediction from AI');
    }
  }

  /**
   * Build analysis prompt from market data
   */
  private buildAnalysisPrompt(request: PredictionRequest): string {
    const { marketData, indicators } = request;

    // Build order book section with ENHANCED metrics
    let orderBookSection = '';
    if (marketData.orderBook) {
      const ob = marketData.orderBook;
      orderBookSection = `
ORDER BOOK:
- Spread: $${ob.bidAskSpread.toFixed(4)} (${ob.bidAskSpreadPercent.toFixed(3)}%)
- Bid Vol: ${ob.totalBidVolume.toFixed(2)} | Ask Vol: ${ob.totalAskVolume.toFixed(2)} BNB
- Buy Pressure: ${(ob.buyPressure * 100).toFixed(1)}%
- Weighted Buy Pressure: ${(ob.weightedBuyPressure * 100).toFixed(1)}% ${ob.weightedBuyPressure > 0.65 ? '[STRONG BUY]' : ob.weightedBuyPressure < 0.35 ? '[STRONG SELL]' : ''}
- Order Flow Imbalance: ${ob.orderFlowImbalance.toFixed(3)} ${ob.orderFlowImbalance > 0.15 ? '[BUY]' : ob.orderFlowImbalance < -0.15 ? '[SELL]' : ''}
- Whales: ${ob.whaleActivity.whaleOrderCount} orders, ${ob.whaleActivity.whaleVolume.toFixed(2)} BNB, Side: ${ob.whaleActivity.whaleSide}
- Depth: ${ob.depthQuality}`;
    }

    // Build trade flow section with ENHANCED metrics
    let tradeFlowSection = '';
    if (marketData.recentTrades) {
      const tf = marketData.recentTrades;
      tradeFlowSection = `
TRADE FLOW (100 trades):
- Buy: ${tf.totalBuyVolume.toFixed(2)} | Sell: ${tf.totalSellVolume.toFixed(2)} BNB
- Buy/Sell Ratio: ${tf.buySellRatio.toFixed(2)}
- Time-Weighted Ratio: ${tf.timeWeightedBuyRatio.toFixed(2)} ${tf.timeWeightedBuyRatio > 1.5 ? '[STRONG BUY]' : tf.timeWeightedBuyRatio < 0.5 ? '[STRONG SELL]' : ''}
- Velocity: ${tf.tradeVelocity.toFixed(2)} t/s | Acceleration: ${(tf.tradeAcceleration * 100).toFixed(1)}%
- Large Orders: ${tf.largeOrderCount} | Whale Trades: ${tf.whaleTradeCount}
- Aggressive Buy: ${tf.aggressiveBuyPercent.toFixed(1)}% | Sell: ${tf.aggressiveSellPercent.toFixed(1)}%
- Vol-Weighted Agg Buy: ${tf.volumeWeightedAggressiveBuy.toFixed(1)}%
- Trend: ${tf.recentTrend}`;
    }

    return `Analyze the following BNB/USDT market data and predict the price movement in the next 5 minutes:

CURRENT MARKET DATA:
- Current Price: $${marketData.currentPrice.toFixed(2)}
- 24h Change: ${marketData.priceChangePercent24h.toFixed(2)}%
- 24h High: $${marketData.high24h.toFixed(2)}
- 24h Low: $${marketData.low24h.toFixed(2)}
- 24h Volume: ${marketData.volume24h.toFixed(2)} BNB
${orderBookSection}
${tradeFlowSection}

INDICATORS:
- RSI(9): ${indicators.rsi.toFixed(2)} ${this.getRSISignal(indicators.rsi)}
- MFI(9): ${indicators.mfi.value.toFixed(2)} ${indicators.mfi.signal} ${indicators.mfi.divergence ? '[DIV]' : ''}
- Stoch(9): K=${indicators.stochastic.k.toFixed(1)} D=${indicators.stochastic.d.toFixed(1)} ${indicators.stochastic.signal}
- MACD: ${indicators.macd.macd.toFixed(4)} Sig: ${indicators.macd.signal.toFixed(4)} Hist: ${indicators.macd.histogram.toFixed(4)}
- EMA: 5=$${indicators.ema.ema5.toFixed(2)} 13=$${indicators.ema.ema13.toFixed(2)} 21=$${indicators.ema.ema21.toFixed(2)} ${indicators.ema.ema5 > indicators.ema.ema13 && indicators.ema.ema13 > indicators.ema.ema21 ? '[BULL]' : indicators.ema.ema5 < indicators.ema.ema13 && indicators.ema.ema13 < indicators.ema.ema21 ? '[BEAR]' : ''}
- VWAP: $${indicators.vwap.value.toFixed(2)} ${indicators.vwap.position} ${Math.abs(indicators.vwap.priceVsVWAP).toFixed(2)}% | Bands: ${indicators.vwap.upperBand.toFixed(2)}-${indicators.vwap.lowerBand.toFixed(2)}
- ATR(10): ${indicators.atr.value.toFixed(4)} ${indicators.atr.percent.toFixed(2)}% ${indicators.atr.level} ${indicators.atr.trend}
- BB(12): U=${indicators.bollingerBands.upper.toFixed(2)} M=${indicators.bollingerBands.middle.toFixed(2)} L=${indicators.bollingerBands.lower.toFixed(2)} %B=${indicators.bollingerBands.percentB.toFixed(3)} BW=${(indicators.bollingerBands.bandwidth * 100).toFixed(2)}%
- Vol Ratio: ${indicators.volumeProfile.currentVolumeRatio.toFixed(2)}x
- OBV: ${indicators.obv.trend} ${indicators.obv.divergence ? '[DIV]' : ''}
- Vol Delta: ${indicators.volumeDelta.current.toFixed(2)} Cum=${indicators.volumeDelta.cumulative.toFixed(2)} ${indicators.volumeDelta.trend}

RECENT PRICE ACTION (Last 10 candles):
${this.formatRecentCandles(marketData.klines.slice(-10))}

Predict UP or DOWN for next 5 minutes.

SCORING (0-100 each):
1. OrderBook: weighted pressure + imbalance + whales (35%)
2. TradeFlow: time-weighted ratio + acceleration + whales (35%)
3. Momentum: Stoch + MFI + ATR + VolDelta (15%)
4. Trend: EMA + MACD + VWAP (10%)
5. Volume: OBV + VolDelta + divergences (5%)
Total = weighted sum. Adjust confidence for alignment.

PRIORITY: Order Book & Trade Flow > Indicators for 5min.`;
  }

  /**
   * Get RSI signal interpretation
   */
  private getRSISignal(rsi: number): string {
    if (rsi > 70) return '(Overbought)';
    if (rsi < 30) return '(Oversold)';
    return '(Neutral)';
  }

  /**
   * Format recent candles for prompt
   */
  private formatRecentCandles(klines: any[]): string {
    return klines
      .map((k, i) => {
        const open = parseFloat(k.open);
        const close = parseFloat(k.close);
        const change = ((close - open) / open) * 100;
        const direction = change > 0 ? '📈' : '📉';
        return `${i + 1}. ${direction} O: $${open.toFixed(2)} C: $${close.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`;
      })
      .join('\n');
  }

  /**
   * Parse AI response to PredictionResponse
   */
  private parseAIResponse(content: string): PredictionResponse {
    try {
      // Validate input
      if (!content || typeof content !== 'string') {
        logger.error('Invalid content type:', { content, type: typeof content });
        throw new Error('Content must be a non-empty string');
      }

      // Remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      // Trim again after removing markdown
      jsonStr = jsonStr.trim();

      if (!jsonStr) {
        logger.error('Empty JSON string after processing:', { original: content });
        throw new Error('Empty JSON string after processing markdown removal');
      }

      // Check if JSON is complete (has closing brace)
      if (!jsonStr.endsWith('}')) {
        logger.error('Incomplete JSON response detected:', {
          jsonStr,
          endsWithBrace: jsonStr.endsWith('}'),
          lastChars: jsonStr.slice(-20),
        });
        throw new Error('Incomplete JSON response - response was likely truncated');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.prediction || !['UP', 'DOWN'].includes(parsed.prediction)) {
        logger.error('Invalid prediction value:', { parsed });
        throw new Error('Invalid prediction value');
      }

      return {
        prediction: parsed.prediction,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        keyFactors: parsed.keyFactors || [],
        riskLevel: parsed.riskLevel || 'MEDIUM',
        suggestedAction: parsed.suggestedAction || 'Proceed with caution',
      };
    } catch (error) {
      logger.error('Error parsing AI response:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      logger.error('Raw content:', { content: content || 'undefined/null' });

      // Throw error instead of returning fallback to make the issue visible
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

