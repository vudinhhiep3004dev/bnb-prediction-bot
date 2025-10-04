/**
 * Test script for Price Prediction feature
 * Tests the new predicted price calculation functionality
 */

import { BinanceService } from '../src/services/binance.js';
import { calculateIndicators, calculatePredictedPrice } from '../src/utils/indicators.js';
import { logger } from '../src/utils/logger.js';

async function testPricePrediction() {
  console.log('🧪 Testing Price Prediction Feature...\n');

  try {
    // 1. Fetch market data
    console.log('📊 Fetching market data from Binance...');
    const binanceService = new BinanceService();
    const marketData = await binanceService.getEnhancedMarketData('BNBUSDT', '5m', 100);

    console.log(`✅ Current Price: $${marketData.currentPrice.toFixed(2)}`);
    console.log(`✅ 24h Change: ${marketData.priceChangePercent24h.toFixed(2)}%`);
    console.log(`✅ Order Book: ${marketData.orderBook ? 'Available' : 'Not Available'}`);
    console.log(`✅ Trade Flow: ${marketData.recentTrades ? 'Available' : 'Not Available'}\n`);

    // 2. Calculate indicators
    console.log('📈 Calculating technical indicators...');
    const indicators = calculateIndicators(marketData.klines);

    console.log(`✅ RSI: ${indicators.rsi.toFixed(2)}`);
    console.log(`✅ ATR: ${indicators.atr.value.toFixed(2)} (${indicators.atr.percent.toFixed(2)}%)`);
    console.log(`✅ ATR Level: ${indicators.atr.level}`);
    console.log(`✅ Bollinger Bands:`);
    console.log(`   - Upper: $${indicators.bollingerBands.upper.toFixed(2)}`);
    console.log(`   - Middle: $${indicators.bollingerBands.middle.toFixed(2)}`);
    console.log(`   - Lower: $${indicators.bollingerBands.lower.toFixed(2)}`);
    console.log(`✅ VWAP: $${indicators.vwap.value.toFixed(2)} (${indicators.vwap.position})`);
    console.log(`✅ Stochastic: K=${indicators.stochastic.k.toFixed(2)}, D=${indicators.stochastic.d.toFixed(2)} (${indicators.stochastic.signal})\n`);

    // 3. Test UP prediction
    console.log('🔼 Testing UP Prediction:');
    const upPrediction = calculatePredictedPrice(
      marketData.currentPrice,
      'UP',
      indicators,
      marketData.orderBook,
      marketData.recentTrades
    );

    console.log(`✅ Predicted Price: $${upPrediction.predictedPrice.toFixed(2)}`);
    console.log(`✅ Price Range: $${upPrediction.priceRange.min.toFixed(2)} - $${upPrediction.priceRange.max.toFixed(2)}`);
    console.log(`✅ Expected Change: ${upPrediction.expectedChange > 0 ? '+' : ''}${upPrediction.expectedChange.toFixed(3)}%`);
    console.log(`✅ Price Difference: +$${(upPrediction.predictedPrice - marketData.currentPrice).toFixed(2)}\n`);

    // 4. Test DOWN prediction
    console.log('🔽 Testing DOWN Prediction:');
    const downPrediction = calculatePredictedPrice(
      marketData.currentPrice,
      'DOWN',
      indicators,
      marketData.orderBook,
      marketData.recentTrades
    );

    console.log(`✅ Predicted Price: $${downPrediction.predictedPrice.toFixed(2)}`);
    console.log(`✅ Price Range: $${downPrediction.priceRange.min.toFixed(2)} - $${downPrediction.priceRange.max.toFixed(2)}`);
    console.log(`✅ Expected Change: ${downPrediction.expectedChange > 0 ? '+' : ''}${downPrediction.expectedChange.toFixed(3)}%`);
    console.log(`✅ Price Difference: -$${(marketData.currentPrice - downPrediction.predictedPrice).toFixed(2)}\n`);

    // 5. Display Order Book Analysis (if available)
    if (marketData.orderBook) {
      console.log('📖 Order Book Analysis:');
      console.log(`✅ Buy Pressure: ${(marketData.orderBook.buyPressure * 100).toFixed(2)}%`);
      console.log(`✅ Bid/Ask Spread: ${marketData.orderBook.bidAskSpreadPercent.toFixed(4)}%`);
      console.log(`✅ Imbalance Ratio: ${marketData.orderBook.imbalanceRatio.toFixed(3)}`);
      console.log(`✅ Depth Quality: ${marketData.orderBook.depthQuality}\n`);
    }

    // 6. Display Trade Flow Analysis (if available)
    if (marketData.recentTrades) {
      console.log('💹 Trade Flow Analysis:');
      console.log(`✅ Buy/Sell Ratio: ${marketData.recentTrades.buySellRatio.toFixed(3)}`);
      console.log(`✅ Aggressive Buyers: ${marketData.recentTrades.aggressiveBuyPercent.toFixed(2)}%`);
      console.log(`✅ Aggressive Sellers: ${marketData.recentTrades.aggressiveSellPercent.toFixed(2)}%`);
      console.log(`✅ Trade Velocity: ${marketData.recentTrades.tradeVelocity.toFixed(2)} trades/sec`);
      console.log(`✅ Recent Trend: ${marketData.recentTrades.recentTrend}\n`);
    }

    // 7. Validation checks
    console.log('✅ Validation Checks:');
    
    // Check if UP prediction is higher than current price
    if (upPrediction.predictedPrice > marketData.currentPrice) {
      console.log('✅ UP prediction is higher than current price ✓');
    } else {
      console.log('❌ UP prediction should be higher than current price ✗');
    }

    // Check if DOWN prediction is lower than current price
    if (downPrediction.predictedPrice < marketData.currentPrice) {
      console.log('✅ DOWN prediction is lower than current price ✓');
    } else {
      console.log('❌ DOWN prediction should be lower than current price ✗');
    }

    // Check if price ranges are valid
    if (upPrediction.priceRange.min < upPrediction.priceRange.max) {
      console.log('✅ UP price range is valid ✓');
    } else {
      console.log('❌ UP price range is invalid ✗');
    }

    if (downPrediction.priceRange.min < downPrediction.priceRange.max) {
      console.log('✅ DOWN price range is valid ✓');
    } else {
      console.log('❌ DOWN price range is invalid ✗');
    }

    // Check if predicted prices are within Bollinger Bands (with some tolerance)
    const bbUpper = indicators.bollingerBands.upper * 1.02;
    const bbLower = indicators.bollingerBands.lower * 0.98;

    if (upPrediction.predictedPrice <= bbUpper) {
      console.log('✅ UP prediction is within reasonable bounds (BB upper) ✓');
    } else {
      console.log('⚠️  UP prediction exceeds BB upper (might be valid in high momentum)');
    }

    if (downPrediction.predictedPrice >= bbLower) {
      console.log('✅ DOWN prediction is within reasonable bounds (BB lower) ✓');
    } else {
      console.log('⚠️  DOWN prediction is below BB lower (might be valid in high momentum)');
    }

    console.log('\n🎉 Price Prediction Test Completed Successfully!');
  } catch (error) {
    console.error('❌ Error testing price prediction:', error);
    logger.error('Error in test-price-prediction:', error);
    process.exit(1);
  }
}

// Run the test
testPricePrediction();

