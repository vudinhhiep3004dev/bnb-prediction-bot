#!/usr/bin/env tsx

/**
 * Test script for technical indicators
 * Usage: bun run scripts/test-indicators.ts
 */

import { BinanceService } from '../src/services/binance.js';
import { calculateIndicators } from '../src/utils/indicators.js';

async function testIndicators() {
  console.log('🧪 Testing Technical Indicators...\n');

  const binanceService = new BinanceService();

  try {
    // Get market data
    console.log('📊 Fetching BNB market data...');
    const marketData = await binanceService.getMarketData('BNBUSDT', '5m', 100);
    console.log(`✅ Retrieved ${marketData.klines.length} candles\n`);

    // Calculate indicators
    console.log('📈 Calculating technical indicators...');
    const indicators = calculateIndicators(marketData.klines);

    console.log('═'.repeat(50));
    console.log('📊 TECHNICAL INDICATORS');
    console.log('═'.repeat(50));

    // RSI
    console.log('\n📉 RSI (Relative Strength Index)');
    console.log(`   Value: ${indicators.rsi.toFixed(2)}`);
    if (indicators.rsi > 70) {
      console.log('   Status: 🔴 Overbought (>70)');
    } else if (indicators.rsi < 30) {
      console.log('   Status: 🟢 Oversold (<30)');
    } else {
      console.log('   Status: 🟡 Neutral (30-70)');
    }

    // MACD
    console.log('\n📊 MACD (Moving Average Convergence Divergence)');
    console.log(`   MACD Line: ${indicators.macd.macd.toFixed(4)}`);
    console.log(`   Signal Line: ${indicators.macd.signal.toFixed(4)}`);
    console.log(`   Histogram: ${indicators.macd.histogram.toFixed(4)}`);
    if (indicators.macd.histogram > 0) {
      console.log('   Status: 🟢 Bullish (Histogram > 0)');
    } else {
      console.log('   Status: 🔴 Bearish (Histogram < 0)');
    }

    // EMA
    console.log('\n📈 EMA (Exponential Moving Average)');
    console.log(`   EMA(9):  $${indicators.ema.ema9.toFixed(2)}`);
    console.log(`   EMA(21): $${indicators.ema.ema21.toFixed(2)}`);
    console.log(`   EMA(50): $${indicators.ema.ema50.toFixed(2)}`);
    console.log(`   Current: $${marketData.currentPrice.toFixed(2)}`);

    if (
      indicators.ema.ema9 > indicators.ema.ema21 &&
      indicators.ema.ema21 > indicators.ema.ema50
    ) {
      console.log('   Status: 🟢 Strong Uptrend');
    } else if (
      indicators.ema.ema9 < indicators.ema.ema21 &&
      indicators.ema.ema21 < indicators.ema.ema50
    ) {
      console.log('   Status: 🔴 Strong Downtrend');
    } else {
      console.log('   Status: 🟡 Mixed Signals');
    }

    // Bollinger Bands
    console.log('\n📊 Bollinger Bands');
    console.log(`   Upper:  $${indicators.bollingerBands.upper.toFixed(2)}`);
    console.log(`   Middle: $${indicators.bollingerBands.middle.toFixed(2)}`);
    console.log(`   Lower:  $${indicators.bollingerBands.lower.toFixed(2)}`);
    console.log(`   Current: $${marketData.currentPrice.toFixed(2)}`);

    const bbPosition =
      (marketData.currentPrice - indicators.bollingerBands.lower) /
      (indicators.bollingerBands.upper - indicators.bollingerBands.lower);

    if (bbPosition > 0.8) {
      console.log('   Status: 🔴 Near Upper Band (Overbought)');
    } else if (bbPosition < 0.2) {
      console.log('   Status: 🟢 Near Lower Band (Oversold)');
    } else {
      console.log('   Status: 🟡 Middle Range');
    }

    // Volume
    console.log('\n📊 Volume Analysis');
    console.log(
      `   Average Volume: ${indicators.volumeProfile.averageVolume.toFixed(2)} BNB`
    );
    console.log(
      `   Current Ratio: ${indicators.volumeProfile.currentVolumeRatio.toFixed(2)}x`
    );

    if (indicators.volumeProfile.currentVolumeRatio > 1.5) {
      console.log('   Status: 🔥 High Volume');
    } else if (indicators.volumeProfile.currentVolumeRatio > 1.0) {
      console.log('   Status: 📊 Above Average');
    } else if (indicators.volumeProfile.currentVolumeRatio > 0.7) {
      console.log('   Status: 📉 Below Average');
    } else {
      console.log('   Status: 💤 Low Volume');
    }

    console.log('\n' + '═'.repeat(50));

    // Overall signal
    console.log('\n🎯 Overall Signal:');
    let bullishSignals = 0;
    let bearishSignals = 0;

    if (indicators.rsi < 30) bullishSignals++;
    if (indicators.rsi > 70) bearishSignals++;
    if (indicators.macd.histogram > 0) bullishSignals++;
    if (indicators.macd.histogram < 0) bearishSignals++;
    if (
      indicators.ema.ema9 > indicators.ema.ema21 &&
      indicators.ema.ema21 > indicators.ema.ema50
    )
      bullishSignals++;
    if (
      indicators.ema.ema9 < indicators.ema.ema21 &&
      indicators.ema.ema21 < indicators.ema.ema50
    )
      bearishSignals++;

    console.log(`   Bullish Signals: ${bullishSignals}`);
    console.log(`   Bearish Signals: ${bearishSignals}`);

    if (bullishSignals > bearishSignals) {
      console.log('   Recommendation: 📈 BULLISH');
    } else if (bearishSignals > bullishSignals) {
      console.log('   Recommendation: 📉 BEARISH');
    } else {
      console.log('   Recommendation: ➡️  NEUTRAL');
    }

    console.log('\n✅ All indicators calculated successfully!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testIndicators();

