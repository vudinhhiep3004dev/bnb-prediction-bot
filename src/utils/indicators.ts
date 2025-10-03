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
 * Analyze Order Book Depth
 */
export function analyzeOrderBook(orderBook: BinanceOrderBook): OrderBookData {
  const bids = orderBook.bids.slice(0, 20); // Top 20 bids
  const asks = orderBook.asks.slice(0, 20); // Top 20 asks

  const topBidPrice = parseFloat(bids[0][0]);
  const topAskPrice = parseFloat(asks[0][0]);

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
  };
}

/**
 * Analyze Recent Trade Flow
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
    };
  }

  let totalBuyVolume = 0;
  let totalSellVolume = 0;
  let aggressiveBuyCount = 0;
  let aggressiveSellCount = 0;

  const tradeSizes: number[] = [];

  for (const trade of trades) {
    const qty = parseFloat(trade.qty);
    tradeSizes.push(qty);

    if (trade.isBuyerMaker) {
      // Buyer is maker = passive buy, seller is taker = aggressive sell
      totalSellVolume += qty;
      aggressiveSellCount++;
    } else {
      // Buyer is taker = aggressive buy
      totalBuyVolume += qty;
      aggressiveBuyCount++;
    }
  }

  const totalVolume = totalBuyVolume + totalSellVolume;
  const buySellRatio = totalSellVolume > 0 ? totalBuyVolume / totalSellVolume : 1;

  // Calculate trade velocity (trades per second)
  const timeSpan = trades[trades.length - 1].time - trades[0].time;
  const tradeVelocity = timeSpan > 0 ? (trades.length / timeSpan) * 1000 : 0;

  // Calculate average trade size
  const avgTradeSize = tradeSizes.reduce((a, b) => a + b, 0) / tradeSizes.length;

  // Count large orders (> 2x average)
  const largeOrderCount = tradeSizes.filter((size) => size > avgTradeSize * 2).length;

  // Calculate aggressive percentages
  const aggressiveBuyPercent = (aggressiveBuyCount / trades.length) * 100;
  const aggressiveSellPercent = (aggressiveSellCount / trades.length) * 100;

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
  };
}

/**
 * Calculate all technical indicators
 */
export function calculateIndicators(klines: BinanceKline[]): TechnicalIndicators {
  const closePrices = klines.map((k) => parseFloat(k.close));
  const volumes = klines.map((k) => parseFloat(k.volume));

  const rsi = calculateRSI(closePrices);
  const macd = calculateMACD(closePrices);
  const bollingerBands = calculateBollingerBands(closePrices);

  const ema9 = calculateEMA(closePrices, 9);
  const ema21 = calculateEMA(closePrices, 21);
  const ema50 = calculateEMA(closePrices, 50);

  const averageVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];
  const currentVolumeRatio = currentVolume / averageVolume;

  // Calculate new indicators
  const atrValue = calculateATR(klines);
  const currentPrice = closePrices[closePrices.length - 1];
  const atrPercent = (atrValue / currentPrice) * 100;

  const stochastic = calculateStochastic(klines);
  const vwapValue = calculateVWAP(klines);
  const priceVsVWAP = ((currentPrice - vwapValue) / vwapValue) * 100;

  return {
    rsi,
    macd,
    ema: { ema9, ema21, ema50 },
    bollingerBands,
    volumeProfile: {
      averageVolume,
      currentVolumeRatio,
    },
    atr: {
      value: atrValue,
      percent: atrPercent,
      level: atrPercent < 1 ? 'LOW' : atrPercent < 2 ? 'MEDIUM' : 'HIGH',
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
    },
  };
}

