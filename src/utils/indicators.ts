import {
  BinanceKline,
  TechnicalIndicators,
  BinanceOrderBook,
  BinanceTrade,
  OrderBookData,
  TradeFlowData,
} from '../types/index.js';

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral if not enough data
  }

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      gains += changes[i];
    } else {
      losses += Math.abs(changes[i]);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[prices.length - 1];
  }

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdValues = [];
  for (let i = 26; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdValues.push(e12 - e26);
  }

  const signal = calculateEMA(macdValues, 9);
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    const current = prices[prices.length - 1];
    return { upper: current, middle: current, lower: current };
  }

  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;

  const variance =
    slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: middle + stdDev * standardDeviation,
    middle,
    lower: middle - stdDev * standardDeviation,
  };
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(klines: BinanceKline[], period: number = 14): number {
  if (klines.length < period + 1) {
    return 0;
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < klines.length; i++) {
    const high = parseFloat(klines[i].high);
    const low = parseFloat(klines[i].low);
    const prevClose = parseFloat(klines[i - 1].close);

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate average of last 'period' true ranges
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(
  klines: BinanceKline[],
  period: number = 14,
  smoothK: number = 3
): { k: number; d: number } {
  if (klines.length < period) {
    return { k: 50, d: 50 };
  }

  const recentKlines = klines.slice(-period);
  const closes = recentKlines.map((k) => parseFloat(k.close));
  const highs = recentKlines.map((k) => parseFloat(k.high));
  const lows = recentKlines.map((k) => parseFloat(k.low));

  const currentClose = closes[closes.length - 1];
  const lowestLow = Math.min(...lows);
  const highestHigh = Math.max(...highs);

  let k = 50;
  if (highestHigh !== lowestLow) {
    k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  }

  // Calculate %D (SMA of %K) - simplified version
  const d = k; // In a full implementation, this would be SMA of last 3 %K values

  return { k, d };
}

/**
 * Calculate VWAP (Volume Weighted Average Price)
 */
export function calculateVWAP(klines: BinanceKline[]): number {
  if (klines.length === 0) return 0;

  let totalPriceVolume = 0;
  let totalVolume = 0;

  for (const kline of klines) {
    const high = parseFloat(kline.high);
    const low = parseFloat(kline.low);
    const close = parseFloat(kline.close);
    const volume = parseFloat(kline.volume);

    const typicalPrice = (high + low + close) / 3;
    totalPriceVolume += typicalPrice * volume;
    totalVolume += volume;
  }

  return totalVolume > 0 ? totalPriceVolume / totalVolume : 0;
}

/**
 * Analyze Order Book Depth with Enhanced Metrics
 */
export function analyzeOrderBook(
  orderBook: BinanceOrderBook,
  currentPrice?: number
): OrderBookData {
  const bids = orderBook.bids.slice(0, 20); // Top 20 bids
  const asks = orderBook.asks.slice(0, 20); // Top 20 asks

  const topBidPrice = parseFloat(bids[0][0]);
  const topAskPrice = parseFloat(asks[0][0]);
  const midPrice = currentPrice || (topBidPrice + topAskPrice) / 2;

  const bidAskSpread = topAskPrice - topBidPrice;
  const bidAskSpreadPercent = (bidAskSpread / topBidPrice) * 100;

  // Calculate total volumes
  const totalBidVolume = bids.reduce((sum, [, qty]) => sum + parseFloat(qty), 0);
  const totalAskVolume = asks.reduce((sum, [, qty]) => sum + parseFloat(qty), 0);

  // Calculate buy pressure (0-1, higher = more buy pressure)
  const totalVolume = totalBidVolume + totalAskVolume;
  const buyPressure = totalVolume > 0 ? totalBidVolume / totalVolume : 0.5;

  // Calculate imbalance ratio (-1 to 1, positive = more bids)
  const imbalanceRatio =
    totalVolume > 0 ? (totalBidVolume - totalAskVolume) / totalVolume : 0;

  // ENHANCED: Weighted buy pressure (closer to current price = more important)
  let weightedBidVolume = 0;
  let weightedAskVolume = 0;

  for (const [price, qty] of bids) {
    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(qty);
    const distance = Math.abs(priceNum - midPrice) / midPrice;
    const weight = Math.exp(-distance * 100); // Exponential decay
    weightedBidVolume += qtyNum * weight;
  }

  for (const [price, qty] of asks) {
    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(qty);
    const distance = Math.abs(priceNum - midPrice) / midPrice;
    const weight = Math.exp(-distance * 100);
    weightedAskVolume += qtyNum * weight;
  }

  const weightedTotal = weightedBidVolume + weightedAskVolume;
  const weightedBuyPressure = weightedTotal > 0 ? weightedBidVolume / weightedTotal : 0.5;

  // ENHANCED: Order Flow Imbalance (more sophisticated than simple ratio)
  const orderFlowImbalance =
    weightedTotal > 0 ? (weightedBidVolume - weightedAskVolume) / weightedTotal : 0;

  // ENHANCED: Whale Detection (orders > 10x average)
  const allOrders = [...bids, ...asks];
  const avgOrderSize = totalVolume / allOrders.length;
  const whaleThreshold = avgOrderSize * 10;

  const whaleOrders = allOrders.filter(([, qty]) => parseFloat(qty) > whaleThreshold);
  const whaleVolume = whaleOrders.reduce((sum, [, qty]) => sum + parseFloat(qty), 0);

  // Determine whale side
  const whaleBidVolume = bids
    .filter(([, qty]) => parseFloat(qty) > whaleThreshold)
    .reduce((sum, [, qty]) => sum + parseFloat(qty), 0);
  const whaleAskVolume = asks
    .filter(([, qty]) => parseFloat(qty) > whaleThreshold)
    .reduce((sum, [, qty]) => sum + parseFloat(qty), 0);

  let whaleSide: 'BID' | 'ASK' | 'BALANCED';
  if (whaleBidVolume > whaleAskVolume * 1.5) {
    whaleSide = 'BID';
  } else if (whaleAskVolume > whaleBidVolume * 1.5) {
    whaleSide = 'ASK';
  } else {
    whaleSide = 'BALANCED';
  }

  // Determine depth quality
  let depthQuality: 'THIN' | 'NORMAL' | 'DEEP';
  if (totalVolume < 50) {
    depthQuality = 'THIN';
  } else if (totalVolume < 200) {
    depthQuality = 'NORMAL';
  } else {
    depthQuality = 'DEEP';
  }

  return {
    bidAskSpread,
    bidAskSpreadPercent,
    totalBidVolume,
    totalAskVolume,
    buyPressure,
    imbalanceRatio,
    topBidPrice,
    topAskPrice,
    depthQuality,
    // Enhanced metrics
    weightedBuyPressure,
    orderFlowImbalance,
    whaleActivity: {
      whaleOrderCount: whaleOrders.length,
      whaleVolume,
      whaleSide,
    },
  };
}

/**
 * Analyze Recent Trade Flow with Enhanced Metrics
 */
export function analyzeTradeFlow(trades: BinanceTrade[]): TradeFlowData {
  if (trades.length === 0) {
    return {
      totalBuyVolume: 0,
      totalSellVolume: 0,
      buySellRatio: 1,
      tradeVelocity: 0,
      avgTradeSize: 0,
      largeOrderCount: 0,
      aggressiveBuyPercent: 0,
      aggressiveSellPercent: 0,
      recentTrend: 'NEUTRAL',
      timeWeightedBuyRatio: 1,
      tradeAcceleration: 0,
      whaleTradeCount: 0,
      volumeWeightedAggressiveBuy: 50,
    };
  }

  let totalBuyVolume = 0;
  let totalSellVolume = 0;
  let aggressiveBuyCount = 0;
  let aggressiveSellCount = 0;
  let weightedBuyVolume = 0;
  let weightedSellVolume = 0;
  let volumeWeightedAggressiveBuyVolume = 0;
  let volumeWeightedAggressiveSellVolume = 0;

  const tradeSizes: number[] = [];
  const now = Date.now();

  for (const trade of trades) {
    const qty = parseFloat(trade.qty);
    tradeSizes.push(qty);

    // Time weight (recent trades more important)
    const age = (now - trade.time) / 1000; // seconds
    const timeWeight = Math.exp(-age / 60); // Decay over 60 seconds

    if (trade.isBuyerMaker) {
      // Buyer is maker = passive buy, seller is taker = aggressive sell
      totalSellVolume += qty;
      aggressiveSellCount++;
      weightedSellVolume += qty * timeWeight;
      volumeWeightedAggressiveSellVolume += qty;
    } else {
      // Buyer is taker = aggressive buy
      totalBuyVolume += qty;
      aggressiveBuyCount++;
      weightedBuyVolume += qty * timeWeight;
      volumeWeightedAggressiveBuyVolume += qty;
    }
  }

  const totalVolume = totalBuyVolume + totalSellVolume;
  const buySellRatio = totalSellVolume > 0 ? totalBuyVolume / totalSellVolume : 1;

  // ENHANCED: Time-weighted buy ratio (recent trades weighted more)
  const weightedTotal = weightedBuyVolume + weightedSellVolume;
  const timeWeightedBuyRatio =
    weightedTotal > 0 ? weightedBuyVolume / weightedSellVolume : 1;

  // Calculate trade velocity (trades per second)
  const timeSpan = trades[trades.length - 1].time - trades[0].time;
  const tradeVelocity = timeSpan > 0 ? (trades.length / timeSpan) * 1000 : 0;

  // ENHANCED: Trade acceleration (velocity change)
  const midPoint = Math.floor(trades.length / 2);
  const firstHalfTime = trades[midPoint].time - trades[0].time;
  const secondHalfTime = trades[trades.length - 1].time - trades[midPoint].time;

  const firstHalfVelocity = firstHalfTime > 0 ? (midPoint / firstHalfTime) * 1000 : 0;
  const secondHalfVelocity =
    secondHalfTime > 0 ? ((trades.length - midPoint) / secondHalfTime) * 1000 : 0;

  const tradeAcceleration =
    firstHalfVelocity > 0 ? (secondHalfVelocity - firstHalfVelocity) / firstHalfVelocity : 0;

  // Calculate average trade size
  const avgTradeSize = tradeSizes.reduce((a, b) => a + b, 0) / tradeSizes.length;

  // Count large orders (> 2x average)
  const largeOrderCount = tradeSizes.filter((size) => size > avgTradeSize * 2).length;

  // ENHANCED: Whale trade count (> 5x average)
  const whaleTradeCount = tradeSizes.filter((size) => size > avgTradeSize * 5).length;

  // Calculate aggressive percentages
  const aggressiveBuyPercent = (aggressiveBuyCount / trades.length) * 100;
  const aggressiveSellPercent = (aggressiveSellCount / trades.length) * 100;

  // ENHANCED: Volume-weighted aggressive buy percentage
  const totalAggressiveVolume =
    volumeWeightedAggressiveBuyVolume + volumeWeightedAggressiveSellVolume;
  const volumeWeightedAggressiveBuy =
    totalAggressiveVolume > 0
      ? (volumeWeightedAggressiveBuyVolume / totalAggressiveVolume) * 100
      : 50;

  // Determine recent trend
  let recentTrend: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  if (buySellRatio > 2) {
    recentTrend = 'STRONG_BUY';
  } else if (buySellRatio > 1.2) {
    recentTrend = 'BUY';
  } else if (buySellRatio < 0.5) {
    recentTrend = 'STRONG_SELL';
  } else if (buySellRatio < 0.8) {
    recentTrend = 'SELL';
  } else {
    recentTrend = 'NEUTRAL';
  }

  return {
    totalBuyVolume,
    totalSellVolume,
    buySellRatio,
    tradeVelocity,
    avgTradeSize,
    largeOrderCount,
    aggressiveBuyPercent,
    aggressiveSellPercent,
    recentTrend,
    // Enhanced metrics
    timeWeightedBuyRatio,
    tradeAcceleration,
    whaleTradeCount,
    volumeWeightedAggressiveBuy,
  };
}

/**
 * Calculate all technical indicators with optimized periods for 5-minute trading
 */
export function calculateIndicators(
  klines: BinanceKline[],
  recentTrades?: BinanceTrade[]
): TechnicalIndicators {
  const closePrices = klines.map((k) => parseFloat(k.close));
  const volumes = klines.map((k) => parseFloat(k.volume));

  // OPTIMIZED PERIODS FOR 5-MINUTE TRADING
  const rsi = calculateRSI(closePrices, 9); // Reduced from 14 to 9
  const macd = calculateMACD(closePrices);
  const bollingerBands = calculateBollingerBands(closePrices, 12); // Reduced from 20 to 12

  // OPTIMIZED EMAs: 5, 13, 21 (instead of 9, 21, 50)
  const ema5 = calculateEMA(closePrices, 5);
  const ema13 = calculateEMA(closePrices, 13);
  const ema21 = calculateEMA(closePrices, 21);

  const averageVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];
  const currentVolumeRatio = currentVolume / averageVolume;

  // Calculate ATR with optimized period
  const atrValue = calculateATR(klines, 10); // Reduced from 14 to 10
  const currentPrice = closePrices[closePrices.length - 1];
  const atrPercent = (atrValue / currentPrice) * 100;

  // ATR trend (increasing or decreasing volatility)
  const recentATR = calculateATR(klines.slice(-20), 10);
  const olderATR = calculateATR(klines.slice(-40, -20), 10);
  let atrTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  if (recentATR > olderATR * 1.1) {
    atrTrend = 'INCREASING';
  } else if (recentATR < olderATR * 0.9) {
    atrTrend = 'DECREASING';
  } else {
    atrTrend = 'STABLE';
  }

  // Calculate Stochastic with optimized period
  const stochastic = calculateStochastic(klines, 9); // Reduced from 14 to 9

  // Calculate VWAP with bands
  const vwapValue = calculateVWAP(klines);
  const priceVsVWAP = ((currentPrice - vwapValue) / vwapValue) * 100;

  // VWAP bands (±1 standard deviation)
  const vwapDeviations = closePrices.map((price) => Math.abs(price - vwapValue));
  const vwapStdDev =
    Math.sqrt(
      vwapDeviations.reduce((sum, dev) => sum + dev * dev, 0) / vwapDeviations.length
    ) || 0;
  const vwapUpperBand = vwapValue + vwapStdDev;
  const vwapLowerBand = vwapValue - vwapStdDev;

  // Bollinger Bands %B and Bandwidth
  const bbRange = bollingerBands.upper - bollingerBands.lower;
  const percentB =
    bbRange > 0 ? (currentPrice - bollingerBands.lower) / bbRange : 0.5;
  const bandwidth = bbRange / bollingerBands.middle;

  // NEW INDICATORS
  const mfi = calculateMFI(klines, 9); // Period 9 for 5-minute
  const obv = calculateOBV(klines);
  const volumeDelta = recentTrades
    ? calculateVolumeDelta(recentTrades)
    : { current: 0, cumulative: 0, trend: 'NEUTRAL' as const };

  return {
    rsi,
    macd,
    ema: { ema5, ema13, ema21 },
    bollingerBands: {
      ...bollingerBands,
      bandwidth,
      percentB,
    },
    volumeProfile: {
      averageVolume,
      currentVolumeRatio,
    },
    atr: {
      value: atrValue,
      percent: atrPercent,
      level: atrPercent < 1 ? 'LOW' : atrPercent < 2 ? 'MEDIUM' : 'HIGH',
      trend: atrTrend,
    },
    stochastic: {
      k: stochastic.k,
      d: stochastic.d,
      signal:
        stochastic.k < 20 ? 'OVERSOLD' : stochastic.k > 80 ? 'OVERBOUGHT' : 'NEUTRAL',
    },
    vwap: {
      value: vwapValue,
      priceVsVWAP: priceVsVWAP,
      position: currentPrice > vwapValue ? 'ABOVE' : 'BELOW',
      upperBand: vwapUpperBand,
      lowerBand: vwapLowerBand,
    },
    mfi,
    obv,
    volumeDelta,
  };
}

/**
 * Calculate predicted price using WEIGHTED SCORING SYSTEM
 * This replaces the old multiplicative approach with a more robust weighted sum
 */
export function calculatePredictedPrice(
  currentPrice: number,
  prediction: 'UP' | 'DOWN',
  indicators: TechnicalIndicators,
  orderBook?: OrderBookData,
  tradeFlow?: TradeFlowData
): {
  predictedPrice: number;
  priceRange: { min: number; max: number };
  expectedChange: number;
} {
  // ============================================
  // STEP 1: CALCULATE INDIVIDUAL SCORES (0-100)
  // ============================================

  // 1.1 ORDER BOOK SCORE (0-100)
  let orderBookScore = 50; // Neutral default
  if (orderBook) {
    const weightedPressure = orderBook.weightedBuyPressure;
    const imbalance = orderBook.orderFlowImbalance;
    const whales = orderBook.whaleActivity;

    // Base score from weighted pressure
    orderBookScore = weightedPressure * 100;

    // Adjust for imbalance
    if (imbalance > 0.15) {
      orderBookScore += 15; // Strong buy imbalance
    } else if (imbalance < -0.15) {
      orderBookScore -= 15; // Strong sell imbalance
    }

    // Adjust for whale activity
    if (whales.whaleSide === 'BID') {
      orderBookScore += 10; // Whales buying
    } else if (whales.whaleSide === 'ASK') {
      orderBookScore -= 10; // Whales selling
    }

    // Clamp to 0-100
    orderBookScore = Math.max(0, Math.min(100, orderBookScore));
  }

  // 1.2 TRADE FLOW SCORE (0-100)
  let tradeFlowScore = 50; // Neutral default
  if (tradeFlow) {
    const timeWeightedRatio = tradeFlow.timeWeightedBuyRatio;
    const acceleration = tradeFlow.tradeAcceleration;
    const volumeWeightedAggressive = tradeFlow.volumeWeightedAggressiveBuy;

    // Base score from time-weighted ratio
    if (timeWeightedRatio > 1.5) {
      tradeFlowScore = 80;
    } else if (timeWeightedRatio > 1.2) {
      tradeFlowScore = 70;
    } else if (timeWeightedRatio > 1.0) {
      tradeFlowScore = 60;
    } else if (timeWeightedRatio < 0.5) {
      tradeFlowScore = 20;
    } else if (timeWeightedRatio < 0.8) {
      tradeFlowScore = 30;
    } else {
      tradeFlowScore = 50;
    }

    // Adjust for acceleration
    if (acceleration > 0.2) {
      tradeFlowScore += 10; // Momentum accelerating
    } else if (acceleration < -0.2) {
      tradeFlowScore -= 10; // Momentum decelerating
    }

    // Adjust for volume-weighted aggressive buy
    if (volumeWeightedAggressive > 60) {
      tradeFlowScore += 10;
    } else if (volumeWeightedAggressive < 40) {
      tradeFlowScore -= 10;
    }

    // Whale trades bonus
    if (tradeFlow.whaleTradeCount > 3) {
      tradeFlowScore += 5;
    }

    // Clamp to 0-100
    tradeFlowScore = Math.max(0, Math.min(100, tradeFlowScore));
  }

  // 1.3 MOMENTUM SCORE (0-100)
  let momentumScore = 50;

  // Stochastic contribution
  const stochK = indicators.stochastic.k;
  if (stochK < 20) {
    momentumScore += 20; // Oversold
  } else if (stochK > 80) {
    momentumScore -= 20; // Overbought
  }

  // MFI contribution
  if (indicators.mfi.value < 20) {
    momentumScore += 15; // Oversold
  } else if (indicators.mfi.value > 80) {
    momentumScore -= 15; // Overbought
  }

  // MFI divergence
  if (indicators.mfi.divergence) {
    momentumScore += prediction === 'UP' ? -10 : 10; // Divergence is bearish for UP
  }

  // ATR trend
  if (indicators.atr.trend === 'INCREASING') {
    momentumScore += 5; // Volatility increasing
  }

  // Clamp to 0-100
  momentumScore = Math.max(0, Math.min(100, momentumScore));

  // 1.4 TREND SCORE (0-100)
  let trendScore = 50;

  // EMA alignment
  if (indicators.ema.ema5 > indicators.ema.ema13 && indicators.ema.ema13 > indicators.ema.ema21) {
    trendScore = 75; // Strong uptrend
  } else if (
    indicators.ema.ema5 < indicators.ema.ema13 &&
    indicators.ema.ema13 < indicators.ema.ema21
  ) {
    trendScore = 25; // Strong downtrend
  }

  // MACD contribution
  if (indicators.macd.histogram > 0) {
    trendScore += 10;
  } else {
    trendScore -= 10;
  }

  // VWAP position
  if (indicators.vwap.position === 'ABOVE') {
    trendScore += 10;
  } else {
    trendScore -= 10;
  }

  // Clamp to 0-100
  trendScore = Math.max(0, Math.min(100, trendScore));

  // 1.5 VOLUME SCORE (0-100)
  let volumeScore = 50;

  // OBV trend
  if (indicators.obv.trend === 'BULLISH') {
    volumeScore = 70;
  } else if (indicators.obv.trend === 'BEARISH') {
    volumeScore = 30;
  }

  // Volume Delta
  if (indicators.volumeDelta.trend === 'BULLISH') {
    volumeScore += 15;
  } else if (indicators.volumeDelta.trend === 'BEARISH') {
    volumeScore -= 15;
  }

  // OBV divergence
  if (indicators.obv.divergence) {
    volumeScore += prediction === 'UP' ? -10 : 10;
  }

  // Clamp to 0-100
  volumeScore = Math.max(0, Math.min(100, volumeScore));

  // ============================================
  // STEP 2: WEIGHTED SUM (REPLACE MULTIPLICATIVE)
  // ============================================

  // Define weights (total = 1.0)
  const weights = {
    orderBook: 0.35, // 35% - Most important for 5-minute
    tradeFlow: 0.35, // 35% - Most important for 5-minute
    momentum: 0.15, // 15% - Short-term momentum
    trend: 0.10, // 10% - Trend confirmation
    volume: 0.05, // 5% - Volume confirmation
  };

  // Calculate weighted score (0-100)
  const totalScore =
    orderBookScore * weights.orderBook +
    tradeFlowScore * weights.tradeFlow +
    momentumScore * weights.momentum +
    trendScore * weights.trend +
    volumeScore * weights.volume;

  // Convert score to direction strength (-1 to 1)
  // 50 = neutral, 100 = strong bullish, 0 = strong bearish
  const directionStrength = (totalScore - 50) / 50;

  // ============================================
  // STEP 3: CALCULATE BASE MOVEMENT
  // ============================================

  const atrValue = indicators.atr.value;
  const bbUpper = indicators.bollingerBands.upper;
  const bbLower = indicators.bollingerBands.lower;

  // Base movement: Use 30% of ATR for 5-minute (more realistic than 50%)
  let baseMovement = atrValue * 0.3;

  // Adjust for volatility trend
  if (indicators.atr.trend === 'INCREASING') {
    baseMovement *= 1.2; // Expect larger moves
  } else if (indicators.atr.trend === 'DECREASING') {
    baseMovement *= 0.8; // Expect smaller moves
  }

  // Adjust for volatility level
  if (indicators.atr.level === 'HIGH') {
    baseMovement *= 1.2;
  } else if (indicators.atr.level === 'LOW') {
    baseMovement *= 0.8;
  }

  // ============================================
  // STEP 4: CALCULATE PREDICTED PRICE
  // ============================================

  // Apply direction strength to base movement
  const adjustedMovement = baseMovement * Math.abs(directionStrength);

  let predictedPrice: number;
  if (prediction === 'UP') {
    predictedPrice = currentPrice + adjustedMovement;

    // Cap at Bollinger Band upper (unless very strong bullish signal)
    if (totalScore < 75 && predictedPrice > bbUpper) {
      predictedPrice = bbUpper * 0.99;
    }

    // Cap at VWAP upper band if not strong signal
    if (totalScore < 70 && predictedPrice > indicators.vwap.upperBand) {
      predictedPrice = indicators.vwap.upperBand * 0.99;
    }
  } else {
    // DOWN prediction
    predictedPrice = currentPrice - adjustedMovement;

    // Cap at Bollinger Band lower (unless very strong bearish signal)
    // Only cap if score is bearish (< 50)
    if (totalScore < 25 && predictedPrice < bbLower) {
      predictedPrice = bbLower * 1.01;
    }

    // Cap at VWAP lower band if not strong signal
    if (totalScore < 30 && predictedPrice < indicators.vwap.lowerBand) {
      predictedPrice = indicators.vwap.lowerBand * 1.01;
    }
  }

  // ============================================
  // STEP 5: CALCULATE PRICE RANGE
  // ============================================

  // Range width based on ATR and confidence
  const confidenceFromScore = Math.abs(totalScore - 50) / 50; // 0 to 1
  const rangeWidth = atrValue * 0.25 * (1 - confidenceFromScore * 0.3); // Narrower range for high confidence

  const priceRange = {
    min: predictedPrice - rangeWidth,
    max: predictedPrice + rangeWidth,
  };

  // Ensure range stays within reasonable bounds
  if (priceRange.max > bbUpper * 1.02) {
    priceRange.max = bbUpper * 1.02;
  }
  if (priceRange.min < bbLower * 0.98) {
    priceRange.min = bbLower * 0.98;
  }

  // ============================================
  // STEP 6: CALCULATE EXPECTED CHANGE
  // ============================================

  const expectedChange = ((predictedPrice - currentPrice) / currentPrice) * 100;

  return {
    predictedPrice: Number(predictedPrice.toFixed(2)),
    priceRange: {
      min: Number(priceRange.min.toFixed(2)),
      max: Number(priceRange.max.toFixed(2)),
    },
    expectedChange: Number(expectedChange.toFixed(3)),
  };
}

/**
 * Calculate Money Flow Index (MFI) - RSI with volume
 * Better than RSI for short-term trading as it incorporates volume
 */
export function calculateMFI(klines: BinanceKline[], period: number = 9): {
  value: number;
  signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  divergence: boolean;
} {
  if (klines.length < period + 1) {
    return { value: 50, signal: 'NEUTRAL', divergence: false };
  }

  const typicalPrices: number[] = [];
  const moneyFlows: number[] = [];

  // Calculate typical price and money flow for each period
  for (let i = 0; i < klines.length; i++) {
    const high = parseFloat(klines[i].high);
    const low = parseFloat(klines[i].low);
    const close = parseFloat(klines[i].close);
    const volume = parseFloat(klines[i].volume);

    const typicalPrice = (high + low + close) / 3;
    typicalPrices.push(typicalPrice);
    moneyFlows.push(typicalPrice * volume);
  }

  // Calculate positive and negative money flow
  let positiveFlow = 0;
  let negativeFlow = 0;

  for (let i = klines.length - period; i < klines.length; i++) {
    if (i > 0) {
      if (typicalPrices[i] > typicalPrices[i - 1]) {
        positiveFlow += moneyFlows[i];
      } else if (typicalPrices[i] < typicalPrices[i - 1]) {
        negativeFlow += moneyFlows[i];
      }
    }
  }

  // Calculate MFI
  const moneyFlowRatio = negativeFlow === 0 ? 100 : positiveFlow / negativeFlow;
  const mfi = 100 - 100 / (1 + moneyFlowRatio);

  // Determine signal
  let signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
  if (mfi < 20) {
    signal = 'OVERSOLD';
  } else if (mfi > 80) {
    signal = 'OVERBOUGHT';
  } else {
    signal = 'NEUTRAL';
  }

  // Simple divergence detection (price up but MFI down, or vice versa)
  const priceChange =
    parseFloat(klines[klines.length - 1].close) -
    parseFloat(klines[klines.length - period].close);
  const mfiChange = mfi - 50; // Compare to neutral
  const divergence = (priceChange > 0 && mfiChange < -10) || (priceChange < 0 && mfiChange > 10);

  return { value: mfi, signal, divergence };
}

/**
 * Calculate On-Balance Volume (OBV)
 * Tracks cumulative volume flow to identify accumulation/distribution
 */
export function calculateOBV(klines: BinanceKline[]): {
  value: number;
  trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  divergence: boolean;
} {
  if (klines.length < 2) {
    return { value: 0, trend: 'NEUTRAL', divergence: false };
  }

  let obv = 0;
  const obvValues: number[] = [0];

  // Calculate OBV
  for (let i = 1; i < klines.length; i++) {
    const currentClose = parseFloat(klines[i].close);
    const previousClose = parseFloat(klines[i - 1].close);
    const volume = parseFloat(klines[i].volume);

    if (currentClose > previousClose) {
      obv += volume;
    } else if (currentClose < previousClose) {
      obv -= volume;
    }
    // If close === previousClose, OBV stays the same

    obvValues.push(obv);
  }

  // Determine trend (compare recent OBV to older OBV)
  const recentOBV = obvValues.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const olderOBV = obvValues.slice(-20, -10).reduce((a, b) => a + b, 0) / 10;

  let trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  if (recentOBV > olderOBV * 1.05) {
    trend = 'BULLISH';
  } else if (recentOBV < olderOBV * 0.95) {
    trend = 'BEARISH';
  } else {
    trend = 'NEUTRAL';
  }

  // Divergence detection (price up but OBV down, or vice versa)
  const priceChange =
    parseFloat(klines[klines.length - 1].close) - parseFloat(klines[klines.length - 20].close);
  const obvChange = recentOBV - olderOBV;
  const divergence = (priceChange > 0 && obvChange < 0) || (priceChange < 0 && obvChange > 0);

  return { value: obv, trend, divergence };
}

/**
 * Calculate Volume Delta
 * Difference between buy and sell volume over time
 */
export function calculateVolumeDelta(trades: BinanceTrade[]): {
  current: number;
  cumulative: number;
  trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
} {
  if (trades.length === 0) {
    return { current: 0, cumulative: 0, trend: 'NEUTRAL' };
  }

  let cumulativeDelta = 0;
  const deltas: number[] = [];

  for (const trade of trades) {
    const volume = parseFloat(trade.qty);
    const delta = trade.isBuyerMaker ? -volume : volume; // Buyer maker = sell, else = buy

    cumulativeDelta += delta;
    deltas.push(delta);
  }

  // Current delta (last 10 trades)
  const currentDelta = deltas.slice(-10).reduce((a, b) => a + b, 0);

  // Determine trend
  const recentDelta = deltas.slice(-30).reduce((a, b) => a + b, 0);
  const olderDelta = deltas.slice(-60, -30).reduce((a, b) => a + b, 0);

  let trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  if (recentDelta > Math.abs(olderDelta) * 0.2) {
    trend = 'BULLISH';
  } else if (recentDelta < -Math.abs(olderDelta) * 0.2) {
    trend = 'BEARISH';
  } else {
    trend = 'NEUTRAL';
  }

  return { current: currentDelta, cumulative: cumulativeDelta, trend };
}

