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
            content: `You are an expert cryptocurrency trading analyst specializing in short-term price predictions for the PancakeSwap Prediction game.
Your task is to analyze market data and technical indicators to predict whether BNB price will go UP or DOWN in the next 5 minutes.

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

    return `Analyze the following BNB/USDT market data and predict the price movement in the next 5 minutes:

CURRENT MARKET DATA:
- Current Price: $${marketData.currentPrice.toFixed(2)}
- 24h Change: ${marketData.priceChangePercent24h.toFixed(2)}%
- 24h High: $${marketData.high24h.toFixed(2)}
- 24h Low: $${marketData.low24h.toFixed(2)}
- 24h Volume: ${marketData.volume24h.toFixed(2)} BNB

TECHNICAL INDICATORS:
- RSI (14): ${indicators.rsi.toFixed(2)} ${this.getRSISignal(indicators.rsi)}
- MACD: ${indicators.macd.macd.toFixed(4)}
- MACD Signal: ${indicators.macd.signal.toFixed(4)}
- MACD Histogram: ${indicators.macd.histogram.toFixed(4)} ${indicators.macd.histogram > 0 ? '(Bullish)' : '(Bearish)'}
- EMA 9: $${indicators.ema.ema9.toFixed(2)}
- EMA 21: $${indicators.ema.ema21.toFixed(2)}
- EMA 50: $${indicators.ema.ema50.toFixed(2)}
- Bollinger Bands:
  * Upper: $${indicators.bollingerBands.upper.toFixed(2)}
  * Middle: $${indicators.bollingerBands.middle.toFixed(2)}
  * Lower: $${indicators.bollingerBands.lower.toFixed(2)}
- Volume Ratio: ${indicators.volumeProfile.currentVolumeRatio.toFixed(2)}x average

RECENT PRICE ACTION (Last 10 candles):
${this.formatRecentCandles(marketData.klines.slice(-10))}

Based on this data, predict whether the price will go UP or DOWN in the next 5 minutes.
Consider:
1. RSI levels (oversold/overbought)
2. MACD crossovers and momentum
3. EMA trends and crossovers
4. Bollinger Bands position
5. Volume patterns
6. Recent price action and momentum

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

