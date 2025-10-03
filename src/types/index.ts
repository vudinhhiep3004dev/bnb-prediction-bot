// Binance API Types
export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

// Market Analysis Types
export interface MarketData {
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  klines: BinanceKline[];
  timestamp: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ema: {
    ema9: number;
    ema21: number;
    ema50: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  volumeProfile: {
    averageVolume: number;
    currentVolumeRatio: number;
  };
}

// AI Prediction Types
export interface PredictionRequest {
  marketData: MarketData;
  indicators: TechnicalIndicators;
  historicalAccuracy?: number;
}

export interface PredictionResponse {
  prediction: 'UP' | 'DOWN';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedAction: string;
}

// Cloudflare AI Gateway Types
export interface CloudflareAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface CloudflareAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configuration Types
export interface BotConfig {
  telegramToken: string;
  cloudflare: {
    accountId: string;
    gatewayId: string;
    apiKey: string;
  };
  binance: {
    apiKey?: string;
    apiSecret?: string;
  };
  prediction: {
    intervalMinutes: number;
    lookbackHours: number;
  };
}

// Bot Command Types
export interface PredictionResult {
  prediction: 'UP' | 'DOWN';
  confidence: number;
  currentPrice: number;
  reasoning: string;
  indicators: {
    rsi: number;
    trend: string;
    volume: string;
  };
  timestamp: Date;
}

