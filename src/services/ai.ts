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

EXPERTISE:
- Order book analysis and market microstructure
- Real-time trade flow and aggressive order detection
- Short-term momentum indicators (Stochastic, ATR, VWAP)
- Volume-weighted price analysis
- Market depth and liquidity assessment

PREDICTION METHODOLOGY FOR 5-MINUTE TIMEFRAME:
1. PRIMARY (70% weight): Order Book Pressure + Recent Trade Flow
   - Bid/Ask imbalance shows immediate buying/selling pressure
   - Aggressive buy/sell ratio indicates market sentiment RIGHT NOW
   - Large orders signal institutional/whale activity

2. SECONDARY (20% weight): Short-term Momentum
   - Stochastic for overbought/oversold (better than RSI for 5min)
   - ATR for volatility assessment
   - VWAP for institutional price reference

3. TERTIARY (10% weight): Traditional Indicators
   - MACD, RSI, EMA for trend confirmation
   - Bollinger Bands for volatility context

DECISION RULES:
- Strong Buy Signal: Buy Pressure >60% + Aggressive Buyers >55% + Stochastic <30
- Strong Sell Signal: Buy Pressure <40% + Aggressive Sellers >55% + Stochastic >70
- High Confidence (>75%): When order book, trade flow, and momentum ALL align
- Medium Confidence (50-75%): When 2 out of 3 factors align
- Low Confidence (<50%): When factors are mixed or neutral

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
        max_tokens: 2000,
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

    // Build order book section
    let orderBookSection = '';
    if (marketData.orderBook) {
      const ob = marketData.orderBook;
      orderBookSection = `
ORDER BOOK ANALYSIS (Real-time Market Depth):
- Bid/Ask Spread: $${ob.bidAskSpread.toFixed(4)} (${ob.bidAskSpreadPercent.toFixed(3)}%)
- Total Bid Volume: ${ob.totalBidVolume.toFixed(2)} BNB
- Total Ask Volume: ${ob.totalAskVolume.toFixed(2)} BNB
- Buy Pressure: ${(ob.buyPressure * 100).toFixed(1)}% ${ob.buyPressure > 0.55 ? '(Strong Buy)' : ob.buyPressure < 0.45 ? '(Strong Sell)' : '(Balanced)'}
- Imbalance Ratio: ${ob.imbalanceRatio.toFixed(3)} ${ob.imbalanceRatio > 0.1 ? '(More Bids)' : ob.imbalanceRatio < -0.1 ? '(More Asks)' : '(Balanced)'}
- Depth Quality: ${ob.depthQuality}
- Top Bid: $${ob.topBidPrice.toFixed(2)} | Top Ask: $${ob.topAskPrice.toFixed(2)}`;
    }

    // Build trade flow section
    let tradeFlowSection = '';
    if (marketData.recentTrades) {
      const tf = marketData.recentTrades;
      tradeFlowSection = `
RECENT TRADE FLOW (Last 100 trades):
- Buy Volume: ${tf.totalBuyVolume.toFixed(2)} BNB
- Sell Volume: ${tf.totalSellVolume.toFixed(2)} BNB
- Buy/Sell Ratio: ${tf.buySellRatio.toFixed(2)} ${tf.buySellRatio > 1.2 ? '(Buyers Dominating)' : tf.buySellRatio < 0.8 ? '(Sellers Dominating)' : '(Balanced)'}
- Trade Velocity: ${tf.tradeVelocity.toFixed(2)} trades/sec
- Avg Trade Size: ${tf.avgTradeSize.toFixed(4)} BNB
- Large Orders: ${tf.largeOrderCount} (>2x avg)
- Aggressive Buyers: ${tf.aggressiveBuyPercent.toFixed(1)}%
- Aggressive Sellers: ${tf.aggressiveSellPercent.toFixed(1)}%
- Recent Trend: ${tf.recentTrend}`;
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

TECHNICAL INDICATORS:
- RSI (14): ${indicators.rsi.toFixed(2)} ${this.getRSISignal(indicators.rsi)}
- Stochastic: %K=${indicators.stochastic.k.toFixed(1)} %D=${indicators.stochastic.d.toFixed(1)} ${indicators.stochastic.signal}
- MACD: ${indicators.macd.macd.toFixed(4)}
- MACD Signal: ${indicators.macd.signal.toFixed(4)}
- MACD Histogram: ${indicators.macd.histogram.toFixed(4)} ${indicators.macd.histogram > 0 ? '(Bullish)' : '(Bearish)'}
- EMA 9: $${indicators.ema.ema9.toFixed(2)}
- EMA 21: $${indicators.ema.ema21.toFixed(2)}
- EMA 50: $${indicators.ema.ema50.toFixed(2)}
- VWAP: $${indicators.vwap.value.toFixed(2)} (Price is ${indicators.vwap.position} VWAP by ${Math.abs(indicators.vwap.priceVsVWAP).toFixed(2)}%)
- ATR: ${indicators.atr.value.toFixed(4)} (${indicators.atr.percent.toFixed(2)}% - ${indicators.atr.level} volatility)
- Bollinger Bands:
  * Upper: $${indicators.bollingerBands.upper.toFixed(2)}
  * Middle: $${indicators.bollingerBands.middle.toFixed(2)}
  * Lower: $${indicators.bollingerBands.lower.toFixed(2)}
- Volume Ratio: ${indicators.volumeProfile.currentVolumeRatio.toFixed(2)}x average

RECENT PRICE ACTION (Last 10 candles):
${this.formatRecentCandles(marketData.klines.slice(-10))}

Based on this comprehensive data, predict whether the price will go UP or DOWN in the next 5 minutes.

CRITICAL FACTORS TO CONSIDER (in order of importance for 5-minute prediction):
1. **Order Book Pressure** - Real-time buy/sell pressure and imbalance (MOST IMPORTANT for short-term)
2. **Recent Trade Flow** - Aggressive buying/selling in last 100 trades (VERY IMPORTANT)
3. **ATR & Volatility** - Current market volatility level
4. **Stochastic Oscillator** - Short-term momentum (better than RSI for 5min)
5. **VWAP Position** - Price relative to volume-weighted average
6. **RSI levels** - Oversold/overbought conditions
7. **MACD crossovers** - Momentum direction
8. **EMA trends** - Short-term trend (EMA9 vs EMA21)
9. **Bollinger Bands** - Volatility and price extremes
10. **Volume patterns** - Confirmation of moves

IMPORTANT: For 5-minute predictions, prioritize ORDER BOOK and TRADE FLOW data over longer-term indicators!

Provide your prediction in the required JSON format.`;
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

