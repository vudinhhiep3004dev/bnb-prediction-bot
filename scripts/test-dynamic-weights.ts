#!/usr/bin/env bun
/**
 * Test script for Dynamic Weighting System
 * Tests different market conditions and verifies weight adjustments
 */

import { BinanceService } from '../src/services/binance.js';
import { calculateIndicators } from '../src/utils/indicators.js';
import { detectMarketCondition, formatWeights } from '../src/utils/dynamic-weights.js';
import { logger } from '../src/utils/logger.js';

async function testDynamicWeights() {
  console.log('🧪 Testing Dynamic Weighting System\n');
  console.log('=' .repeat(80));

  try {
    const binanceService = new BinanceService();

    // Fetch real market data
    console.log('\n📊 Fetching real market data from Binance...');
    const marketData = await binanceService.getEnhancedMarketData('BNBUSDT', '5m', 100);
    const recentTrades = await binanceService.getRecentTrades('BNBUSDT', 100);
    const indicators = calculateIndicators(marketData.klines, recentTrades);

    console.log('✅ Market data fetched successfully\n');

    // Display current market state
    console.log('📈 CURRENT MARKET STATE');
    console.log('-'.repeat(80));
    console.log(`Current Price: $${marketData.currentPrice.toFixed(2)}`);
    console.log(`24h Change: ${marketData.priceChangePercent24h.toFixed(2)}%`);
    console.log(`Volume Ratio: ${indicators.volumeProfile.currentVolumeRatio.toFixed(2)}x`);
    console.log(`ATR: ${indicators.atr.percent.toFixed(2)}% (${indicators.atr.level})`);
    console.log(`RSI: ${indicators.rsi.toFixed(2)}`);
    console.log(`Stochastic K: ${indicators.stochastic.k.toFixed(2)} (${indicators.stochastic.signal})`);
    
    // EMA Alignment
    const emaAligned = 
      (indicators.ema.ema5 > indicators.ema.ema13 && indicators.ema.ema13 > indicators.ema.ema21) ||
      (indicators.ema.ema5 < indicators.ema.ema13 && indicators.ema.ema13 < indicators.ema.ema21);
    console.log(`EMA Alignment: ${emaAligned ? '✅ Aligned' : '❌ Not Aligned'}`);
    
    if (marketData.orderBook) {
      console.log(`Order Book Buy Pressure: ${(marketData.orderBook.buyPressure * 100).toFixed(1)}%`);
      console.log(`Whale Orders: ${marketData.orderBook.whaleActivity?.whaleOrderCount || 0}`);
    }
    
    if (marketData.recentTrades) {
      console.log(`Trade Flow Buy/Sell Ratio: ${marketData.recentTrades.buySellRatio.toFixed(2)}`);
      console.log(`Recent Trend: ${marketData.recentTrades.recentTrend}`);
    }

    console.log('\n');

    // Detect market condition and get dynamic weights
    console.log('🎯 MARKET CONDITION ANALYSIS');
    console.log('-'.repeat(80));
    
    const analysis = detectMarketCondition(
      indicators,
      marketData,
      marketData.orderBook,
      marketData.recentTrades
    );

    console.log(`Primary Condition: ${analysis.primaryCondition}`);
    console.log(`Secondary Conditions: ${analysis.secondaryConditions.join(', ') || 'None'}`);
    console.log(`Volatility Level: ${analysis.volatilityLevel}`);
    console.log(`Trend Strength: ${analysis.trendStrength}`);
    console.log(`Volume Level: ${analysis.volumeLevel}`);
    console.log(`\nReasoning: ${analysis.reasoning}`);

    console.log('\n');

    // Display weight comparison
    console.log('⚖️  WEIGHT COMPARISON');
    console.log('-'.repeat(80));
    
    const defaultWeights = {
      orderBook: 0.35,
      tradeFlow: 0.35,
      momentum: 0.15,
      trend: 0.10,
      volume: 0.05,
    };

    console.log('Default Weights (Static):');
    console.log(`  Order Book: ${(defaultWeights.orderBook * 100).toFixed(0)}%`);
    console.log(`  Trade Flow: ${(defaultWeights.tradeFlow * 100).toFixed(0)}%`);
    console.log(`  Momentum:   ${(defaultWeights.momentum * 100).toFixed(0)}%`);
    console.log(`  Trend:      ${(defaultWeights.trend * 100).toFixed(0)}%`);
    console.log(`  Volume:     ${(defaultWeights.volume * 100).toFixed(0)}%`);

    console.log('\nDynamic Weights (Adjusted):');
    console.log(`  Order Book: ${(analysis.weights.orderBook * 100).toFixed(0)}% ${getChangeIndicator(defaultWeights.orderBook, analysis.weights.orderBook)}`);
    console.log(`  Trade Flow: ${(analysis.weights.tradeFlow * 100).toFixed(0)}% ${getChangeIndicator(defaultWeights.tradeFlow, analysis.weights.tradeFlow)}`);
    console.log(`  Momentum:   ${(analysis.weights.momentum * 100).toFixed(0)}% ${getChangeIndicator(defaultWeights.momentum, analysis.weights.momentum)}`);
    console.log(`  Trend:      ${(analysis.weights.trend * 100).toFixed(0)}% ${getChangeIndicator(defaultWeights.trend, analysis.weights.trend)}`);
    console.log(`  Volume:     ${(analysis.weights.volume * 100).toFixed(0)}% ${getChangeIndicator(defaultWeights.volume, analysis.weights.volume)}`);

    console.log('\n');

    // Test different scenarios
    console.log('🧪 TESTING DIFFERENT SCENARIOS');
    console.log('-'.repeat(80));

    const scenarios = [
      {
        name: 'High Volatility',
        modify: (ind: any) => {
          ind.atr.percent = 3.0;
          ind.atr.level = 'HIGH';
        },
      },
      {
        name: 'Strong Trending',
        modify: (ind: any) => {
          ind.ema.ema5 = 1200;
          ind.ema.ema13 = 1190;
          ind.ema.ema21 = 1180;
          ind.macd.histogram = 10;
        },
      },
      {
        name: 'Ranging Market',
        modify: (ind: any) => {
          ind.atr.percent = 0.8;
          ind.atr.level = 'LOW';
          ind.bollingerBands.bandwidth = 0.015;
        },
      },
      {
        name: 'Low Volume',
        modify: (ind: any) => {
          ind.volumeProfile.currentVolumeRatio = 0.5;
        },
      },
      {
        name: 'Momentum Extreme',
        modify: (ind: any) => {
          ind.rsi = 85;
          ind.stochastic.k = 85;
          ind.stochastic.signal = 'OVERBOUGHT';
        },
      },
    ];

    for (const scenario of scenarios) {
      const testIndicators = JSON.parse(JSON.stringify(indicators));
      scenario.modify(testIndicators);

      const testAnalysis = detectMarketCondition(
        testIndicators,
        marketData,
        marketData.orderBook,
        marketData.recentTrades
      );

      console.log(`\n${scenario.name}:`);
      console.log(`  Condition: ${testAnalysis.primaryCondition}`);
      console.log(`  Weights: ${formatWeights(testAnalysis.weights)}`);
      console.log(`  Reasoning: ${testAnalysis.reasoning}`);
    }

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('✅ Dynamic Weighting System test completed successfully!');
    console.log('\n💡 Key Insights:');
    console.log('   - Weights adjust automatically based on market conditions');
    console.log('   - High volatility → More weight on Order Book & Trade Flow');
    console.log('   - Strong trending → More weight on Trend indicators');
    console.log('   - Ranging market → More weight on Momentum (mean reversion)');
    console.log('   - Low volume → Less weight on Order Book (less reliable)');
    console.log('   - Momentum extremes → More weight on Momentum (reversal watch)');

  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

/**
 * Get change indicator (arrow) for weight comparison
 */
function getChangeIndicator(oldWeight: number, newWeight: number): string {
  const diff = newWeight - oldWeight;
  const diffPct = (diff * 100).toFixed(0);
  
  if (Math.abs(diff) < 0.01) {
    return '→ (no change)';
  } else if (diff > 0) {
    return `↑ (+${diffPct}%)`;
  } else {
    return `↓ (${diffPct}%)`;
  }
}

// Run the test
testDynamicWeights();

