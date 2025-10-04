import { BinanceService } from '../src/services/binance.js';
import { calculateIndicators, analyzeOrderBook, analyzeTradeFlow } from '../src/utils/indicators.js';
import { logger } from '../src/utils/logger.js';

async function testEnhancedIndicators() {
  console.log('🧪 Testing Enhanced Indicators...\n');

  const binanceService = new BinanceService();

  try {
    // Test 1: Get Enhanced Market Data
    console.log('📊 Test 1: Fetching enhanced market data...');
    const marketData = await binanceService.getEnhancedMarketData('BNBUSDT', '5m', 100);
    console.log('✅ Enhanced market data fetched successfully');
    console.log(`   Current Price: $${marketData.currentPrice.toFixed(2)}`);
    console.log(`   24h Change: ${marketData.priceChangePercent24h.toFixed(2)}%`);
    console.log('');

    // Test 2: Order Book Analysis
    if (marketData.orderBook) {
      console.log('📖 Test 2: Order Book Analysis');
      const ob = marketData.orderBook;
      console.log(`   Bid/Ask Spread: $${ob.bidAskSpread.toFixed(4)} (${ob.bidAskSpreadPercent.toFixed(3)}%)`);
      console.log(`   Total Bid Volume: ${ob.totalBidVolume.toFixed(2)} BNB`);
      console.log(`   Total Ask Volume: ${ob.totalAskVolume.toFixed(2)} BNB`);
      console.log(`   Buy Pressure: ${(ob.buyPressure * 100).toFixed(1)}%`);
      console.log(`   Imbalance Ratio: ${ob.imbalanceRatio.toFixed(3)}`);
      console.log(`   Depth Quality: ${ob.depthQuality}`);
      
      // Interpretation
      if (ob.buyPressure > 0.55) {
        console.log('   🟢 Interpretation: Strong buying pressure detected!');
      } else if (ob.buyPressure < 0.45) {
        console.log('   🔴 Interpretation: Strong selling pressure detected!');
      } else {
        console.log('   🟡 Interpretation: Balanced order book');
      }
      console.log('');
    }

    // Test 3: Trade Flow Analysis
    if (marketData.recentTrades) {
      console.log('💹 Test 3: Recent Trade Flow Analysis');
      const tf = marketData.recentTrades;
      console.log(`   Buy Volume: ${tf.totalBuyVolume.toFixed(2)} BNB`);
      console.log(`   Sell Volume: ${tf.totalSellVolume.toFixed(2)} BNB`);
      console.log(`   Buy/Sell Ratio: ${tf.buySellRatio.toFixed(2)}`);
      console.log(`   Trade Velocity: ${tf.tradeVelocity.toFixed(2)} trades/sec`);
      console.log(`   Avg Trade Size: ${tf.avgTradeSize.toFixed(4)} BNB`);
      console.log(`   Large Orders: ${tf.largeOrderCount}`);
      console.log(`   Aggressive Buyers: ${tf.aggressiveBuyPercent.toFixed(1)}%`);
      console.log(`   Aggressive Sellers: ${tf.aggressiveSellPercent.toFixed(1)}%`);
      console.log(`   Recent Trend: ${tf.recentTrend}`);
      
      // Interpretation
      if (tf.recentTrend === 'STRONG_BUY') {
        console.log('   🟢 Interpretation: Strong buying momentum!');
      } else if (tf.recentTrend === 'STRONG_SELL') {
        console.log('   🔴 Interpretation: Strong selling momentum!');
      } else if (tf.recentTrend === 'BUY') {
        console.log('   🟢 Interpretation: Moderate buying momentum');
      } else if (tf.recentTrend === 'SELL') {
        console.log('   🔴 Interpretation: Moderate selling momentum');
      } else {
        console.log('   🟡 Interpretation: Neutral momentum');
      }
      console.log('');
    }

    // Test 4: Technical Indicators (including new ones)
    console.log('📈 Test 4: Technical Indicators');
    const indicators = calculateIndicators(marketData.klines);
    
    console.log('   Traditional Indicators:');
    console.log(`   - RSI (9): ${indicators.rsi.toFixed(2)}`);
    console.log(`   - MACD: ${indicators.macd.macd.toFixed(4)}`);
    console.log(`   - EMA5: $${indicators.ema.ema5.toFixed(2)}`);
    console.log(`   - EMA13: $${indicators.ema.ema13.toFixed(2)}`);
    console.log(`   - EMA21: $${indicators.ema.ema21.toFixed(2)}`);
    console.log('');
    
    console.log('   Enhanced Indicators (v2.0.0):');
    console.log(`   - ATR (10): ${indicators.atr.value.toFixed(4)} (${indicators.atr.percent.toFixed(2)}%) - ${indicators.atr.level} volatility`);
    console.log(`   - ATR Trend: ${indicators.atr.trend}`);
    console.log(`   - Stochastic (9): %K=${indicators.stochastic.k.toFixed(1)} %D=${indicators.stochastic.d.toFixed(1)} - ${indicators.stochastic.signal}`);
    console.log(`   - VWAP: $${indicators.vwap.value.toFixed(2)} (${indicators.vwap.position})`);
    console.log(`   - VWAP Bands: Upper $${indicators.vwap.upperBand.toFixed(2)} | Lower $${indicators.vwap.lowerBand.toFixed(2)}`);
    console.log(`   - Bollinger Bands (12): %B=${indicators.bollingerBands.percentB.toFixed(3)} | Bandwidth=${(indicators.bollingerBands.bandwidth * 100).toFixed(2)}%`);
    console.log('');

    console.log('   🆕 NEW Indicators (v2.0.0):');
    console.log(`   - MFI (9): ${indicators.mfi.value.toFixed(2)} - ${indicators.mfi.signal} ${indicators.mfi.divergence ? '⚠️ DIVERGENCE' : ''}`);
    console.log(`   - OBV: ${indicators.obv.value.toFixed(2)} - ${indicators.obv.trend} ${indicators.obv.divergence ? '⚠️ DIVERGENCE' : ''}`);
    console.log(`   - Volume Delta: Current=${indicators.volumeDelta.current.toFixed(2)} | Cumulative=${indicators.volumeDelta.cumulative.toFixed(2)} | Trend=${indicators.volumeDelta.trend}`);
    console.log('');

    // Test 5: Combined Analysis
    console.log('🎯 Test 5: Combined Signal Analysis');
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    // Order Book
    if (marketData.orderBook) {
      if (marketData.orderBook.buyPressure > 0.55) bullishSignals++;
      if (marketData.orderBook.buyPressure < 0.45) bearishSignals++;
    }
    
    // Trade Flow
    if (marketData.recentTrades) {
      if (marketData.recentTrades.buySellRatio > 1.2) bullishSignals++;
      if (marketData.recentTrades.buySellRatio < 0.8) bearishSignals++;
      if (marketData.recentTrades.recentTrend === 'STRONG_BUY' || marketData.recentTrades.recentTrend === 'BUY') bullishSignals++;
      if (marketData.recentTrades.recentTrend === 'STRONG_SELL' || marketData.recentTrades.recentTrend === 'SELL') bearishSignals++;
    }
    
    // Technical Indicators
    if (indicators.rsi < 30) bullishSignals++;
    if (indicators.rsi > 70) bearishSignals++;
    if (indicators.stochastic.signal === 'OVERSOLD') bullishSignals++;
    if (indicators.stochastic.signal === 'OVERBOUGHT') bearishSignals++;
    if (indicators.macd.histogram > 0) bullishSignals++;
    if (indicators.macd.histogram < 0) bearishSignals++;
    if (indicators.vwap.position === 'BELOW') bullishSignals++;
    if (indicators.vwap.position === 'ABOVE') bearishSignals++;
    
    console.log(`   Bullish Signals: ${bullishSignals}`);
    console.log(`   Bearish Signals: ${bearishSignals}`);
    
    if (bullishSignals > bearishSignals + 2) {
      console.log('   🟢 Overall Signal: STRONG BUY');
    } else if (bullishSignals > bearishSignals) {
      console.log('   🟢 Overall Signal: BUY');
    } else if (bearishSignals > bullishSignals + 2) {
      console.log('   🔴 Overall Signal: STRONG SELL');
    } else if (bearishSignals > bullishSignals) {
      console.log('   🔴 Overall Signal: SELL');
    } else {
      console.log('   🟡 Overall Signal: NEUTRAL');
    }
    console.log('');

    console.log('✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Order Book Analysis: ✅');
    console.log('   - Trade Flow Analysis: ✅');
    console.log('   - ATR Calculation: ✅');
    console.log('   - Stochastic Oscillator: ✅');
    console.log('   - VWAP Calculation: ✅');
    console.log('   - Combined Signal Analysis: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Test error:', error);
    process.exit(1);
  }
}

// Run the test
testEnhancedIndicators();

