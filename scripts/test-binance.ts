#!/usr/bin/env tsx

/**
 * Test script for Binance API connection
 * Usage: bun run scripts/test-binance.ts
 */

import { BinanceService } from '../src/services/binance.js';

async function testBinanceAPI() {
  console.log('🧪 Testing Binance API Connection...\n');

  const binanceService = new BinanceService();

  try {
    // Test 1: Get current price
    console.log('📊 Test 1: Getting current BNB price...');
    const price = await binanceService.getCurrentPrice('BNBUSDT');
    console.log(`✅ Current BNB Price: $${price.toFixed(2)}\n`);

    // Test 2: Get 24hr ticker
    console.log('📈 Test 2: Getting 24hr ticker data...');
    const ticker = await binanceService.get24hrTicker('BNBUSDT');
    console.log(`✅ 24h Change: ${ticker.priceChangePercent}%`);
    console.log(`   High: $${parseFloat(ticker.highPrice).toFixed(2)}`);
    console.log(`   Low: $${parseFloat(ticker.lowPrice).toFixed(2)}`);
    console.log(`   Volume: ${parseFloat(ticker.volume).toFixed(2)} BNB\n`);

    // Test 3: Get klines
    console.log('🕯️ Test 3: Getting kline data (last 10 candles)...');
    const klines = await binanceService.getKlines('BNBUSDT', '5m', 10);
    console.log(`✅ Retrieved ${klines.length} candles`);
    console.log('   Last 3 candles:');
    klines.slice(-3).forEach((k, i) => {
      const open = parseFloat(k.open);
      const close = parseFloat(k.close);
      const change = ((close - open) / open) * 100;
      const emoji = change > 0 ? '📈' : '📉';
      console.log(
        `   ${emoji} ${i + 1}. O: $${open.toFixed(2)} C: $${close.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`
      );
    });
    console.log();

    // Test 4: Get market data
    console.log('🎯 Test 4: Getting comprehensive market data...');
    const marketData = await binanceService.getMarketData('BNBUSDT', '5m', 50);
    console.log(`✅ Market Data Retrieved:`);
    console.log(`   Current Price: $${marketData.currentPrice.toFixed(2)}`);
    console.log(`   24h Change: ${marketData.priceChangePercent24h.toFixed(2)}%`);
    console.log(`   24h Volume: ${marketData.volume24h.toFixed(2)} BNB`);
    console.log(`   Klines: ${marketData.klines.length} candles`);
    console.log();

    console.log('✅ All tests passed! Binance API is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testBinanceAPI();

