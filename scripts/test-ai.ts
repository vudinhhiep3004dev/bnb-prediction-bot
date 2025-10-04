#!/usr/bin/env tsx

/**
 * Test script for AI service
 * Usage: bun run scripts/test-ai.ts
 */

import { config, validateConfig } from '../src/config/index.js';
import { AIService } from '../src/services/ai.js';
import { BinanceService } from '../src/services/binance.js';
import { calculateIndicators } from '../src/utils/indicators.js';

async function testAIService() {
  console.log('🧪 Testing AI Service...\n');

  try {
    // Validate config
    console.log('🔧 Validating configuration...');
    validateConfig();
    console.log('✅ Configuration valid\n');

    // Initialize services
    const aiService = new AIService();
    const binanceService = new BinanceService();

    // Get market data
    console.log('📊 Fetching market data...');
    const marketData = await binanceService.getMarketData('BNBUSDT', '5m', 100);
    console.log(`✅ Market data retrieved: $${marketData.currentPrice.toFixed(2)}\n`);

    // Calculate indicators
    console.log('📈 Calculating technical indicators...');
    const indicators = calculateIndicators(marketData.klines);
    console.log('✅ Indicators calculated (v2.0.0):');
    console.log(`   RSI (9): ${indicators.rsi.toFixed(2)}`);
    console.log(`   MACD: ${indicators.macd.macd.toFixed(4)}`);
    console.log(`   EMA5: $${indicators.ema.ema5.toFixed(2)}`);
    console.log(`   EMA13: $${indicators.ema.ema13.toFixed(2)}`);
    console.log(`   EMA21: $${indicators.ema.ema21.toFixed(2)}`);
    console.log(`   MFI (9): ${indicators.mfi.value.toFixed(2)} - ${indicators.mfi.signal}`);
    console.log(`   OBV: ${indicators.obv.trend}`);
    console.log(`   Volume Delta: ${indicators.volumeDelta.trend}`);
    console.log();

    // Generate prediction
    console.log('🤖 Generating AI prediction...');
    console.log('⏳ This may take 10-15 seconds...\n');

    const prediction = await aiService.generatePrediction({
      marketData,
      indicators,
    });

    console.log('✅ Prediction generated successfully!\n');
    console.log('═'.repeat(50));
    console.log('📊 PREDICTION RESULT');
    console.log('═'.repeat(50));
    console.log(`🎯 Prediction: ${prediction.prediction}`);
    console.log(`📊 Confidence: ${prediction.confidence.toFixed(1)}%`);
    console.log(`⚠️  Risk Level: ${prediction.riskLevel}`);
    console.log(`\n💡 Reasoning:\n${prediction.reasoning}`);
    console.log(`\n🔑 Key Factors:`);
    prediction.keyFactors.forEach((factor, i) => {
      console.log(`   ${i + 1}. ${factor}`);
    });
    console.log(`\n💬 Suggested Action:\n${prediction.suggestedAction}`);
    console.log('═'.repeat(50));
    console.log();

    console.log('✅ All tests passed! AI service is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAIService();

