/**
 * Backtesting Framework for BNB Prediction Bot
 * Tests accuracy of predictions against historical data
 */

export interface BacktestResult {
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  accuracy: number; // Percentage
  winRate: number; // Percentage
  profitLoss: number; // Simulated P&L
  sharpeRatio: number; // Risk-adjusted returns
  maxDrawdown: number; // Maximum drawdown percentage
  avgConfidence: number; // Average confidence level
  accuracyByConfidence: {
    high: { total: number; correct: number; accuracy: number }; // Confidence > 75%
    medium: { total: number; correct: number; accuracy: number }; // Confidence 50-75%
    low: { total: number; correct: number; accuracy: number }; // Confidence < 50%
  };
  accuracyByMarketCondition: {
    trending: { total: number; correct: number; accuracy: number };
    ranging: { total: number; correct: number; accuracy: number };
    volatile: { total: number; correct: number; accuracy: number };
  };
  predictions: PredictionRecord[];
}

export interface PredictionRecord {
  timestamp: Date;
  prediction: 'UP' | 'DOWN';
  confidence: number;
  currentPrice: number;
  predictedPrice: number;
  actualPrice: number; // Price after 5 minutes
  actualChange: number; // Actual % change
  correct: boolean;
  profitLoss: number; // Simulated P&L for this trade
  marketCondition: 'TRENDING' | 'RANGING' | 'VOLATILE';
}

/**
 * Calculate backtest results from prediction records
 */
export function calculateBacktestResults(
  predictions: PredictionRecord[]
): BacktestResult {
  if (predictions.length === 0) {
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      accuracy: 0,
      winRate: 0,
      profitLoss: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      avgConfidence: 0,
      accuracyByConfidence: {
        high: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        low: { total: 0, correct: 0, accuracy: 0 },
      },
      accuracyByMarketCondition: {
        trending: { total: 0, correct: 0, accuracy: 0 },
        ranging: { total: 0, correct: 0, accuracy: 0 },
        volatile: { total: 0, correct: 0, accuracy: 0 },
      },
      predictions: [],
    };
  }

  const totalPredictions = predictions.length;
  const correctPredictions = predictions.filter((p) => p.correct).length;
  const incorrectPredictions = totalPredictions - correctPredictions;
  const accuracy = (correctPredictions / totalPredictions) * 100;
  const winRate = accuracy; // Same as accuracy for binary predictions

  // Calculate P&L (assuming $100 bet per prediction)
  const betSize = 100;
  const profitLoss = predictions.reduce((sum, p) => sum + p.profitLoss, 0);

  // Calculate Sharpe Ratio
  const returns = predictions.map((p) => (p.profitLoss / betSize) * 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Calculate Max Drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;

  for (const p of predictions) {
    cumulative += p.profitLoss;
    if (cumulative > peak) {
      peak = cumulative;
    }
    const drawdown = ((peak - cumulative) / Math.max(peak, betSize)) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Calculate average confidence
  const avgConfidence =
    predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions;

  // Accuracy by confidence level
  const highConfidence = predictions.filter((p) => p.confidence > 75);
  const mediumConfidence = predictions.filter((p) => p.confidence >= 50 && p.confidence <= 75);
  const lowConfidence = predictions.filter((p) => p.confidence < 50);

  const accuracyByConfidence = {
    high: {
      total: highConfidence.length,
      correct: highConfidence.filter((p) => p.correct).length,
      accuracy:
        highConfidence.length > 0
          ? (highConfidence.filter((p) => p.correct).length / highConfidence.length) * 100
          : 0,
    },
    medium: {
      total: mediumConfidence.length,
      correct: mediumConfidence.filter((p) => p.correct).length,
      accuracy:
        mediumConfidence.length > 0
          ? (mediumConfidence.filter((p) => p.correct).length / mediumConfidence.length) * 100
          : 0,
    },
    low: {
      total: lowConfidence.length,
      correct: lowConfidence.filter((p) => p.correct).length,
      accuracy:
        lowConfidence.length > 0
          ? (lowConfidence.filter((p) => p.correct).length / lowConfidence.length) * 100
          : 0,
    },
  };

  // Accuracy by market condition
  const trending = predictions.filter((p) => p.marketCondition === 'TRENDING');
  const ranging = predictions.filter((p) => p.marketCondition === 'RANGING');
  const volatile = predictions.filter((p) => p.marketCondition === 'VOLATILE');

  const accuracyByMarketCondition = {
    trending: {
      total: trending.length,
      correct: trending.filter((p) => p.correct).length,
      accuracy:
        trending.length > 0
          ? (trending.filter((p) => p.correct).length / trending.length) * 100
          : 0,
    },
    ranging: {
      total: ranging.length,
      correct: ranging.filter((p) => p.correct).length,
      accuracy:
        ranging.length > 0 ? (ranging.filter((p) => p.correct).length / ranging.length) * 100 : 0,
    },
    volatile: {
      total: volatile.length,
      correct: volatile.filter((p) => p.correct).length,
      accuracy:
        volatile.length > 0
          ? (volatile.filter((p) => p.correct).length / volatile.length) * 100
          : 0,
    },
  };

  return {
    totalPredictions,
    correctPredictions,
    incorrectPredictions,
    accuracy,
    winRate,
    profitLoss,
    sharpeRatio,
    maxDrawdown,
    avgConfidence,
    accuracyByConfidence,
    accuracyByMarketCondition,
    predictions,
  };
}

/**
 * Determine market condition from indicators
 */
export function determineMarketCondition(
  atrPercent: number,
  emaAlignment: boolean,
  bollingerBandwidth: number
): 'TRENDING' | 'RANGING' | 'VOLATILE' {
  // Volatile: High ATR
  if (atrPercent > 2.5) {
    return 'VOLATILE';
  }

  // Trending: EMAs aligned and moderate ATR
  if (emaAlignment && atrPercent > 1.0) {
    return 'TRENDING';
  }

  // Ranging: Low ATR and narrow Bollinger Bands
  if (atrPercent < 1.0 && bollingerBandwidth < 0.02) {
    return 'RANGING';
  }

  // Default to ranging
  return 'RANGING';
}

/**
 * Format backtest results for display
 */
export function formatBacktestResults(results: BacktestResult): string {
  return `
📊 BACKTEST RESULTS
==================

Overall Performance:
- Total Predictions: ${results.totalPredictions}
- Correct: ${results.correctPredictions} ✅
- Incorrect: ${results.incorrectPredictions} ❌
- Accuracy: ${results.accuracy.toFixed(2)}%
- Win Rate: ${results.winRate.toFixed(2)}%

Financial Metrics:
- Profit/Loss: $${results.profitLoss.toFixed(2)}
- Sharpe Ratio: ${results.sharpeRatio.toFixed(3)}
- Max Drawdown: ${results.maxDrawdown.toFixed(2)}%
- Avg Confidence: ${results.avgConfidence.toFixed(1)}%

Accuracy by Confidence Level:
- High (>75%): ${results.accuracyByConfidence.high.accuracy.toFixed(1)}% (${results.accuracyByConfidence.high.correct}/${results.accuracyByConfidence.high.total})
- Medium (50-75%): ${results.accuracyByConfidence.medium.accuracy.toFixed(1)}% (${results.accuracyByConfidence.medium.correct}/${results.accuracyByConfidence.medium.total})
- Low (<50%): ${results.accuracyByConfidence.low.accuracy.toFixed(1)}% (${results.accuracyByConfidence.low.correct}/${results.accuracyByConfidence.low.total})

Accuracy by Market Condition:
- Trending: ${results.accuracyByMarketCondition.trending.accuracy.toFixed(1)}% (${results.accuracyByMarketCondition.trending.correct}/${results.accuracyByMarketCondition.trending.total})
- Ranging: ${results.accuracyByMarketCondition.ranging.accuracy.toFixed(1)}% (${results.accuracyByMarketCondition.ranging.correct}/${results.accuracyByMarketCondition.ranging.total})
- Volatile: ${results.accuracyByMarketCondition.volatile.accuracy.toFixed(1)}% (${results.accuracyByMarketCondition.volatile.correct}/${results.accuracyByMarketCondition.volatile.total})
`;
}

/**
 * Calculate simulated P&L for a prediction
 * Assumes PancakeSwap Prediction game rules: 1.96x payout for correct prediction
 */
export function calculatePredictionPL(
  prediction: 'UP' | 'DOWN',
  actualChange: number,
  betSize: number = 100
): number {
  const correct =
    (prediction === 'UP' && actualChange > 0) || (prediction === 'DOWN' && actualChange < 0);

  if (correct) {
    return betSize * 0.96; // 1.96x payout - original bet = 0.96x profit
  } else {
    return -betSize; // Lose the bet
  }
}

