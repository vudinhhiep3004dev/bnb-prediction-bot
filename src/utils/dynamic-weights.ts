import { TechnicalIndicators, MarketData, OrderBookData, TradeFlowData } from '../types/index.js';
import { logger } from './logger.js';

/**
 * Market condition types for dynamic weight adjustment
 */
export type MarketCondition = 
  | 'HIGH_VOLATILITY'      // ATR > 2.5%, wide BB
  | 'STRONG_TRENDING'      // EMAs aligned, MACD strong
  | 'RANGING'              // Low ATR, narrow BB
  | 'LOW_VOLUME'           // Volume < 0.7x average
  | 'WHALE_ACTIVITY'       // Large orders detected
  | 'MOMENTUM_EXTREME'     // RSI/Stochastic extreme
  | 'NORMAL';              // Default condition

/**
 * Dynamic weights for each scoring category
 */
export interface DynamicWeights {
  orderBook: number;    // 0-1
  tradeFlow: number;    // 0-1
  momentum: number;     // 0-1
  trend: number;        // 0-1
  volume: number;       // 0-1
}

/**
 * Market condition analysis result
 */
export interface MarketConditionAnalysis {
  primaryCondition: MarketCondition;
  secondaryConditions: MarketCondition[];
  weights: DynamicWeights;
  reasoning: string;
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  trendStrength: 'WEAK' | 'MODERATE' | 'STRONG';
  volumeLevel: 'LOW' | 'NORMAL' | 'HIGH';
}

/**
 * Default weights (baseline)
 */
const DEFAULT_WEIGHTS: DynamicWeights = {
  orderBook: 0.35,
  tradeFlow: 0.35,
  momentum: 0.15,
  trend: 0.10,
  volume: 0.05,
};

/**
 * Detect current market condition based on indicators
 */
export function detectMarketCondition(
  indicators: TechnicalIndicators,
  marketData: MarketData,
  orderBook?: OrderBookData,
  tradeFlow?: TradeFlowData
): MarketConditionAnalysis {
  const conditions: MarketCondition[] = [];
  let primaryCondition: MarketCondition = 'NORMAL';
  
  // 1. Check Volatility (ATR)
  const volatilityLevel = indicators.atr.level;
  if (indicators.atr.percent > 2.5) {
    conditions.push('HIGH_VOLATILITY');
    primaryCondition = 'HIGH_VOLATILITY';
  }
  
  // 2. Check Trend Strength (EMA alignment + MACD)
  const emaAligned = 
    (indicators.ema.ema5 > indicators.ema.ema13 && indicators.ema.ema13 > indicators.ema.ema21) ||
    (indicators.ema.ema5 < indicators.ema.ema13 && indicators.ema.ema13 < indicators.ema.ema21);
  
  const macdStrong = Math.abs(indicators.macd.histogram) > 5;
  
  let trendStrength: 'WEAK' | 'MODERATE' | 'STRONG' = 'WEAK';
  if (emaAligned && macdStrong) {
    conditions.push('STRONG_TRENDING');
    if (primaryCondition === 'NORMAL') primaryCondition = 'STRONG_TRENDING';
    trendStrength = 'STRONG';
  } else if (emaAligned || macdStrong) {
    trendStrength = 'MODERATE';
  }
  
  // 3. Check Volume Level
  const volumeRatio = indicators.volumeProfile.currentVolumeRatio;
  let volumeLevel: 'LOW' | 'NORMAL' | 'HIGH' = 'NORMAL';
  
  if (volumeRatio < 0.7) {
    conditions.push('LOW_VOLUME');
    if (primaryCondition === 'NORMAL') primaryCondition = 'LOW_VOLUME';
    volumeLevel = 'LOW';
  } else if (volumeRatio > 1.5) {
    volumeLevel = 'HIGH';
  }
  
  // 4. Check Ranging Market (Low ATR + Narrow BB)
  if (indicators.atr.percent < 1.0 && indicators.bollingerBands.bandwidth < 0.02) {
    conditions.push('RANGING');
    if (primaryCondition === 'NORMAL') primaryCondition = 'RANGING';
  }
  
  // 5. Check Whale Activity
  if (orderBook?.whaleActivity && orderBook.whaleActivity.whaleOrderCount > 3) {
    conditions.push('WHALE_ACTIVITY');
  }
  
  // 6. Check Momentum Extremes
  const rsiExtreme = indicators.rsi < 25 || indicators.rsi > 75;
  const stochExtreme = indicators.stochastic.k < 20 || indicators.stochastic.k > 80;
  
  if (rsiExtreme || stochExtreme) {
    conditions.push('MOMENTUM_EXTREME');
  }
  
  // Calculate dynamic weights based on conditions
  const weights = calculateDynamicWeights(
    primaryCondition,
    conditions,
    volatilityLevel,
    trendStrength,
    volumeLevel
  );
  
  // Generate reasoning
  const reasoning = generateReasoning(primaryCondition, conditions, weights);
  
  return {
    primaryCondition,
    secondaryConditions: conditions.filter(c => c !== primaryCondition),
    weights,
    reasoning,
    volatilityLevel,
    trendStrength,
    volumeLevel,
  };
}

/**
 * Calculate dynamic weights based on market conditions
 */
function calculateDynamicWeights(
  primaryCondition: MarketCondition,
  allConditions: MarketCondition[],
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  trendStrength: 'WEAK' | 'MODERATE' | 'STRONG',
  volumeLevel: 'LOW' | 'NORMAL' | 'HIGH'
): DynamicWeights {
  // Start with default weights
  let weights = { ...DEFAULT_WEIGHTS };
  
  // Adjust based on primary condition
  switch (primaryCondition) {
    case 'HIGH_VOLATILITY':
      // In high volatility, order book and trade flow are most reliable
      weights = {
        orderBook: 0.40,   // +5%
        tradeFlow: 0.40,   // +5%
        momentum: 0.12,    // -3%
        trend: 0.05,       // -5%
        volume: 0.03,      // -2%
      };
      break;
      
    case 'STRONG_TRENDING':
      // In strong trends, trend indicators become more important
      weights = {
        orderBook: 0.25,   // -10%
        tradeFlow: 0.25,   // -10%
        momentum: 0.15,    // same
        trend: 0.25,       // +15%
        volume: 0.10,      // +5%
      };
      break;
      
    case 'RANGING':
      // In ranging markets, momentum and mean reversion matter more
      weights = {
        orderBook: 0.30,   // -5%
        tradeFlow: 0.30,   // -5%
        momentum: 0.25,    // +10%
        trend: 0.05,       // -5%
        volume: 0.10,      // +5%
      };
      break;
      
    case 'LOW_VOLUME':
      // In low volume, order book is less reliable
      weights = {
        orderBook: 0.20,   // -15%
        tradeFlow: 0.20,   // -15%
        momentum: 0.25,    // +10%
        trend: 0.25,       // +15%
        volume: 0.10,      // +5%
      };
      break;
      
    case 'WHALE_ACTIVITY':
      // When whales are active, order book and trade flow are critical
      weights = {
        orderBook: 0.45,   // +10%
        tradeFlow: 0.40,   // +5%
        momentum: 0.10,    // -5%
        trend: 0.03,       // -7%
        volume: 0.02,      // -3%
      };
      break;
      
    case 'MOMENTUM_EXTREME':
      // At momentum extremes, watch for reversals
      weights = {
        orderBook: 0.30,   // -5%
        tradeFlow: 0.30,   // -5%
        momentum: 0.30,    // +15%
        trend: 0.05,       // -5%
        volume: 0.05,      // same
      };
      break;
      
    case 'NORMAL':
    default:
      // Use default weights
      weights = { ...DEFAULT_WEIGHTS };
      break;
  }
  
  // Fine-tune based on secondary conditions
  if (allConditions.includes('WHALE_ACTIVITY') && primaryCondition !== 'WHALE_ACTIVITY') {
    // Boost order book slightly
    weights.orderBook += 0.05;
    weights.trend = Math.max(0.02, weights.trend - 0.03);
    weights.volume = Math.max(0.02, weights.volume - 0.02);
  }

  if (allConditions.includes('MOMENTUM_EXTREME') && primaryCondition !== 'MOMENTUM_EXTREME') {
    // Boost momentum slightly
    weights.momentum += 0.05;
    weights.volume = Math.max(0.02, weights.volume - 0.05);
  }

  // Ensure no negative weights
  Object.keys(weights).forEach(key => {
    weights[key as keyof DynamicWeights] = Math.max(0.02, weights[key as keyof DynamicWeights]);
  });

  // Normalize to ensure sum = 1.0
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    Object.keys(weights).forEach(key => {
      weights[key as keyof DynamicWeights] /= sum;
    });
  }
  
  return weights;
}

/**
 * Generate human-readable reasoning for weight adjustment
 */
function generateReasoning(
  primaryCondition: MarketCondition,
  allConditions: MarketCondition[],
  weights: DynamicWeights
): string {
  const reasons: string[] = [];
  
  switch (primaryCondition) {
    case 'HIGH_VOLATILITY':
      reasons.push('High volatility detected - prioritizing real-time order flow');
      break;
    case 'STRONG_TRENDING':
      reasons.push('Strong trend detected - increasing trend indicator weight');
      break;
    case 'RANGING':
      reasons.push('Ranging market - focusing on momentum and mean reversion');
      break;
    case 'LOW_VOLUME':
      reasons.push('Low volume - reducing order book reliability');
      break;
    case 'WHALE_ACTIVITY':
      reasons.push('Whale activity detected - prioritizing order book analysis');
      break;
    case 'MOMENTUM_EXTREME':
      reasons.push('Momentum extreme - watching for potential reversal');
      break;
    default:
      reasons.push('Normal market conditions - using balanced weights');
  }
  
  // Add secondary condition notes
  if (allConditions.includes('WHALE_ACTIVITY') && primaryCondition !== 'WHALE_ACTIVITY') {
    reasons.push('Whale orders present');
  }
  if (allConditions.includes('MOMENTUM_EXTREME') && primaryCondition !== 'MOMENTUM_EXTREME') {
    reasons.push('Momentum at extreme levels');
  }
  
  return reasons.join('; ');
}

/**
 * Format weights for display in logs or UI
 */
export function formatWeights(weights: DynamicWeights): string {
  return `OrderBook: ${(weights.orderBook * 100).toFixed(0)}%, ` +
         `TradeFlow: ${(weights.tradeFlow * 100).toFixed(0)}%, ` +
         `Momentum: ${(weights.momentum * 100).toFixed(0)}%, ` +
         `Trend: ${(weights.trend * 100).toFixed(0)}%, ` +
         `Volume: ${(weights.volume * 100).toFixed(0)}%`;
}

/**
 * Log market condition analysis
 */
export function logMarketCondition(analysis: MarketConditionAnalysis): void {
  logger.info('🎯 Market Condition Analysis:', {
    primary: analysis.primaryCondition,
    secondary: analysis.secondaryConditions,
    volatility: analysis.volatilityLevel,
    trend: analysis.trendStrength,
    volume: analysis.volumeLevel,
  });
  
  logger.info('⚖️  Dynamic Weights Applied:', {
    weights: formatWeights(analysis.weights),
    reasoning: analysis.reasoning,
  });
}

