/**
 * Backtest Script - Test bot accuracy with historical data
 * 
 * Usage:
 *   bun run src/scripts/run-backtest.ts
 * 
 * This script will:
 * 1. Fetch historical 5-minute candles
 * 2. Run predictions for each candle
 * 3. Compare predictions with actual price movements
 * 4. Generate accuracy report
 */

import { BinanceService } from '../services/binance';
import { PredictionService } from '../services/prediction';
import {
  calculateBacktestResults,
  formatBacktestResults,
  calculatePredictionPL,
  type PredictionRecord,
} from '../utils/backtesting';
import { logger } from '../utils/logger';
import { writeFileSync } from 'fs';

const SYMBOL = 'BNBUSDT';
const INTERVAL = '5m';
const BACKTEST_PERIODS = 10; // Test last 10 5-minute periods (50 minutes) - reduced for quick test

async function runBacktest() {
  logger.info('🚀 Starting backtest...');
  logger.info(`Symbol: ${SYMBOL}, Interval: ${INTERVAL}, Periods: ${BACKTEST_PERIODS}`);

  const binanceService = new BinanceService();
  const predictionService = new PredictionService();

  try {
    // Fetch historical data (need extra candles for indicators)
    const totalCandles = BACKTEST_PERIODS + 100; // Extra for indicator calculation
    logger.info(`Fetching ${totalCandles} historical candles...`);

    const klines = await binanceService.getKlines(SYMBOL, INTERVAL, totalCandles);
    logger.info(`✅ Fetched ${klines.length} candles`);

    const predictions: PredictionRecord[] = [];

    // Run predictions for each period
    for (let i = 100; i < klines.length - 1; i++) {
      // Need at least 100 candles for indicators
      const currentCandles = klines.slice(0, i + 1);
      const currentPrice = parseFloat(currentCandles[currentCandles.length - 1].close);
      const nextPrice = parseFloat(klines[i + 1].close); // Actual price after 5 minutes

      try {
        // Make prediction using live data (includes order book and trade flow)
        const prediction = await predictionService.generatePrediction(SYMBOL);

        // Calculate actual change
        const actualChange = ((nextPrice - currentPrice) / currentPrice) * 100;

        // Determine if prediction was correct
        const correct =
          (prediction.prediction === 'UP' && actualChange > 0) ||
          (prediction.prediction === 'DOWN' && actualChange < 0);

        // Calculate P&L
        const profitLoss = calculatePredictionPL(prediction.prediction, actualChange);

        // Determine market condition (simplified - use trend from prediction)
        let marketCondition: 'TRENDING' | 'RANGING' | 'VOLATILE' = 'RANGING';
        if (prediction.indicators.trend.includes('STRONG')) {
          marketCondition = 'TRENDING';
        } else if (prediction.indicators.volume.includes('HIGH')) {
          marketCondition = 'VOLATILE';
        }

        // Record prediction
        const record: PredictionRecord = {
          timestamp: new Date(currentCandles[currentCandles.length - 1].closeTime),
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          currentPrice,
          predictedPrice: prediction.predictedPrice,
          actualPrice: nextPrice,
          actualChange,
          correct,
          profitLoss,
          marketCondition,
        };

        predictions.push(record);

        // Log progress every 10 predictions
        if (predictions.length % 10 === 0) {
          const currentAccuracy =
            (predictions.filter((p) => p.correct).length / predictions.length) * 100;
          logger.info(
            `Progress: ${predictions.length}/${BACKTEST_PERIODS} | Current Accuracy: ${currentAccuracy.toFixed(1)}%`
          );
        }
      } catch (error) {
        logger.error(`Error making prediction at index ${i}:`, error);
        continue;
      }
    }

    // Calculate results
    logger.info('\n📊 Calculating backtest results...');
    const results = calculateBacktestResults(predictions);

    // Display results
    console.log(formatBacktestResults(results));

    // Save results to file
    const resultsPath = 'backtest-results.json';
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    logger.info(`\n💾 Results saved to ${resultsPath}`);

    // Display top 10 best and worst predictions
    console.log('\n🏆 TOP 10 BEST PREDICTIONS:');
    const bestPredictions = [...predictions]
      .sort((a, b) => b.profitLoss - a.profitLoss)
      .slice(0, 10);

    bestPredictions.forEach((p, i) => {
      console.log(
        `${i + 1}. ${p.prediction} @ $${p.currentPrice.toFixed(2)} → $${p.actualPrice.toFixed(2)} (${p.actualChange.toFixed(2)}%) | Confidence: ${p.confidence.toFixed(0)}% | P&L: $${p.profitLoss.toFixed(2)}`
      );
    });

    console.log('\n💔 TOP 10 WORST PREDICTIONS:');
    const worstPredictions = [...predictions]
      .sort((a, b) => a.profitLoss - b.profitLoss)
      .slice(0, 10);

    worstPredictions.forEach((p, i) => {
      console.log(
        `${i + 1}. ${p.prediction} @ $${p.currentPrice.toFixed(2)} → $${p.actualPrice.toFixed(2)} (${p.actualChange.toFixed(2)}%) | Confidence: ${p.confidence.toFixed(0)}% | P&L: $${p.profitLoss.toFixed(2)}`
      );
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (results.accuracy < 55) {
      console.log('❌ Accuracy is below 55%. Consider:');
      console.log('   - Adjusting indicator weights');
      console.log('   - Reviewing AI prompt decision rules');
      console.log('   - Adding more market context');
    } else if (results.accuracy < 65) {
      console.log('⚠️  Accuracy is moderate (55-65%). Consider:');
      console.log('   - Fine-tuning confidence thresholds');
      console.log('   - Analyzing which market conditions perform best');
    } else {
      console.log('✅ Accuracy is good (>65%)! Consider:');
      console.log('   - Testing with live data');
      console.log('   - Implementing position sizing based on confidence');
    }

    if (results.accuracyByConfidence.high.accuracy > results.accuracy + 10) {
      console.log(
        '\n💎 High confidence predictions are significantly better! Consider only trading high confidence signals.'
      );
    }

    if (results.maxDrawdown > 30) {
      console.log(
        '\n⚠️  Max drawdown is high (>30%). Consider implementing better risk management.'
      );
    }

    logger.info('\n✅ Backtest completed!');
  } catch (error) {
    logger.error('❌ Backtest failed:', error);
    process.exit(1);
  }
}

// Run backtest
runBacktest().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

