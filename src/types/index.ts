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

export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][];
}

export interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
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
  orderBook?: OrderBookData;
  recentTrades?: TradeFlowData;
}

export interface OrderBookData {
  bidAskSpread: number;
  bidAskSpreadPercent: number;
  totalBidVolume: number;
  totalAskVolume: number;
  buyPressure: number; // 0-1, higher = more buy pressure
  imbalanceRatio: number; // -1 to 1, positive = more bids
  topBidPrice: number;
  topAskPrice: number;
  depthQuality: 'THIN' | 'NORMAL' | 'DEEP';
  // ENHANCED METRICS
  weightedBuyPressure: number; // Weighted by distance from current price
  orderFlowImbalance: number; // Advanced imbalance metric
  whaleActivity: {
    whaleOrderCount: number;
    whaleVolume: number;
    whaleSide: 'BID' | 'ASK' | 'BALANCED';
  };
}

export interface TradeFlowData {
  totalBuyVolume: number;
  totalSellVolume: number;
  buySellRatio: number;
  tradeVelocity: number; // trades per second
  avgTradeSize: number;
  largeOrderCount: number;
  aggressiveBuyPercent: number;
  aggressiveSellPercent: number;
  recentTrend: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  // ENHANCED METRICS
  timeWeightedBuyRatio: number; // Recent trades weighted more
  tradeAcceleration: number; // Velocity change rate
  whaleTradeCount: number; // Trades > 5x average
  volumeWeightedAggressiveBuy: number; // Weighted by trade size
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ema: {
    ema5: number;
    ema13: number;
    ema21: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  volumeProfile: {
    averageVolume: number;
    currentVolumeRatio: number;
  };
  atr: {
    value: number;
    percent: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  };
  stochastic: {
    k: number;
    d: number;
    signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  };
  vwap: {
    value: number;
    priceVsVWAP: number;
    position: 'ABOVE' | 'BELOW';
    upperBand: number;
    lowerBand: number;
  };
  // NEW INDICATORS
  mfi: {
    value: number;
    signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
    divergence: boolean;
  };
  obv: {
    value: number;
    trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    divergence: boolean;
  };
  volumeDelta: {
    current: number;
    cumulative: number;
    trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  };
}

// AI Prediction Types
export interface PredictionRequest {
  marketData: MarketData;
  indicators: TechnicalIndicators;
  historicalAccuracy?: number;
  dynamicWeights?: {
    orderBook: number;
    tradeFlow: number;
    momentum: number;
    trend: number;
    volume: number;
  };
  marketCondition?: string;
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

// Chainlink Oracle Types
export interface ChainlinkPriceData {
  price: number;
  roundId: bigint;
  updatedAt: number;
  source: 'CHAINLINK';
}

// PancakeSwap Prediction Round Types
export interface PredictionRound {
  epoch: bigint;
  startTimestamp: number;
  lockTimestamp: number;
  closeTimestamp: number;
  lockPrice: number | null;
  closePrice: number | null;
  totalAmount: bigint;
  bullAmount: bigint;
  bearAmount: bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount: bigint;
  oracleCalled: boolean;
}

export interface RoundTiming {
  currentEpoch: bigint;
  nextRoundStart: number;
  timeUntilNextRound: number;
  optimalPredictionTime: number; // 30s before next round
  isOptimalTime: boolean;
}

// Price Source Types
export interface PriceData {
  price: number;
  source: 'CHAINLINK' | 'BINANCE';
  timestamp: number;
  confidence: number; // 0-1, based on source reliability
}

export interface HybridPriceData {
  chainlinkPrice: number | null;
  binancePrice: number;
  selectedPrice: number;
  selectedSource: 'CHAINLINK' | 'BINANCE';
  priceDifference: number; // Absolute difference
  priceDifferencePercent: number; // Percentage difference
  confidenceAdjustment: number; // Multiplier for prediction confidence
  timestamp: number;
}

// Bot Command Types
export interface PredictionResult {
  prediction: 'UP' | 'DOWN';
  confidence: number;
  currentPrice: number;
  predictedPrice: number; // Giá dự kiến
  priceRange: {
    min: number; // Giá thấp nhất dự kiến
    max: number; // Giá cao nhất dự kiến
  };
  expectedChange: number; // Thay đổi dự kiến (%)
  reasoning: string;
  indicators: {
    rsi: number;
    trend: string;
    volume: string;
  };
  timestamp: Date;
  // NEW: Hybrid price info
  priceSource?: 'CHAINLINK' | 'BINANCE';
  priceConfidence?: number;
  roundInfo?: {
    currentEpoch: bigint;
    timeUntilLock: number;
  };
}

