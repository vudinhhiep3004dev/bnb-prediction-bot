import { logger } from '../utils/logger.js';
import { HybridPriceData, PriceData } from '../types/index.js';
import { ChainlinkService } from './chainlink.js';
import { BinanceService } from './binance.js';

/**
 * Hybrid Price Service
 * Combines Chainlink and Binance prices with intelligent fallback
 */
export class HybridPriceService {
  private chainlinkService: ChainlinkService;
  private binanceService: BinanceService;

  // Thresholds for price difference warnings
  private readonly PRICE_DIFF_WARNING_PERCENT = 0.2; // 0.2%
  private readonly PRICE_DIFF_CRITICAL_PERCENT = 0.5; // 0.5%

  constructor(chainlinkService: ChainlinkService, binanceService: BinanceService) {
    this.chainlinkService = chainlinkService;
    this.binanceService = binanceService;
  }

  /**
   * Get hybrid price data with intelligent source selection
   */
  async getHybridPrice(symbol: string = 'BNBUSDT'): Promise<HybridPriceData> {
    try {
      logger.info('Fetching hybrid price data...');

      // Fetch both prices in parallel
      const [chainlinkResult, binanceResult] = await Promise.allSettled([
        this.chainlinkService.getPriceWithRetry(2),
        this.binanceService.getCurrentPrice(symbol),
      ]);

      // Extract Chainlink price (may be null if failed)
      const chainlinkPrice =
        chainlinkResult.status === 'fulfilled' ? chainlinkResult.value?.price || null : null;

      // Extract Binance price (should always succeed)
      const binancePriceValue =
        binanceResult.status === 'fulfilled' ? binanceResult.value : null;

      if (!binancePriceValue) {
        throw new Error('Failed to fetch Binance price (critical)');
      }

      // Determine which price to use
      const { selectedPrice, selectedSource, confidenceAdjustment } = this.selectBestPrice(
        chainlinkPrice,
        binancePriceValue
      );

      // Calculate price differences
      const priceDifference = chainlinkPrice
        ? Math.abs(chainlinkPrice - binancePriceValue)
        : 0;
      const priceDifferencePercent = chainlinkPrice
        ? (priceDifference / binancePriceValue) * 100
        : 0;

      // Log warnings if price difference is significant
      if (chainlinkPrice && priceDifferencePercent > this.PRICE_DIFF_WARNING_PERCENT) {
        const level =
          priceDifferencePercent > this.PRICE_DIFF_CRITICAL_PERCENT ? 'error' : 'warn';
        logger[level]('Significant price difference detected:', {
          chainlink: chainlinkPrice.toFixed(2),
          binance: binancePriceValue.toFixed(2),
          difference: priceDifference.toFixed(2),
          differencePercent: priceDifferencePercent.toFixed(3) + '%',
        });
      }

      const hybridData: HybridPriceData = {
        chainlinkPrice,
        binancePrice: binancePriceValue,
        selectedPrice,
        selectedSource,
        priceDifference,
        priceDifferencePercent,
        confidenceAdjustment,
        timestamp: Date.now(),
      };

      logger.info('Hybrid price data:', {
        selectedPrice: selectedPrice.toFixed(2),
        selectedSource,
        confidenceAdjustment: (confidenceAdjustment * 100).toFixed(1) + '%',
        chainlinkAvailable: chainlinkPrice !== null,
      });

      return hybridData;
    } catch (error) {
      logger.error('Error getting hybrid price:', error);
      throw error;
    }
  }

  /**
   * Select best price source with confidence adjustment
   */
  private selectBestPrice(
    chainlinkPrice: number | null,
    binancePrice: number
  ): {
    selectedPrice: number;
    selectedSource: 'CHAINLINK' | 'BINANCE';
    confidenceAdjustment: number;
  } {
    // If Chainlink is not available, use Binance
    if (chainlinkPrice === null) {
      logger.warn('Chainlink price not available, using Binance as fallback');
      return {
        selectedPrice: binancePrice,
        selectedSource: 'BINANCE',
        confidenceAdjustment: 0.95, // 5% confidence penalty for using fallback
      };
    }

    // Calculate price difference
    const priceDiff = Math.abs(chainlinkPrice - binancePrice);
    const priceDiffPercent = (priceDiff / binancePrice) * 100;

    // If prices are very close (< 0.1%), use Chainlink with full confidence
    if (priceDiffPercent < 0.1) {
      return {
        selectedPrice: chainlinkPrice,
        selectedSource: 'CHAINLINK',
        confidenceAdjustment: 1.0, // Full confidence
      };
    }

    // If prices differ by 0.1-0.3%, use Chainlink with slight confidence reduction
    if (priceDiffPercent < 0.3) {
      return {
        selectedPrice: chainlinkPrice,
        selectedSource: 'CHAINLINK',
        confidenceAdjustment: 0.98, // 2% confidence penalty
      };
    }

    // If prices differ by 0.3-0.5%, use Chainlink with moderate confidence reduction
    if (priceDiffPercent < 0.5) {
      logger.warn('Moderate price difference, reducing confidence');
      return {
        selectedPrice: chainlinkPrice,
        selectedSource: 'CHAINLINK',
        confidenceAdjustment: 0.95, // 5% confidence penalty
      };
    }

    // If prices differ by > 0.5%, use average with significant confidence reduction
    logger.error('Large price difference detected, using average price');
    const averagePrice = (chainlinkPrice + binancePrice) / 2;
    return {
      selectedPrice: averagePrice,
      selectedSource: 'CHAINLINK', // Still mark as Chainlink for tracking
      confidenceAdjustment: 0.9, // 10% confidence penalty
    };
  }

  /**
   * Get price data with source information
   */
  async getPriceData(symbol: string = 'BNBUSDT'): Promise<PriceData> {
    const hybridData = await this.getHybridPrice(symbol);

    return {
      price: hybridData.selectedPrice,
      source: hybridData.selectedSource,
      timestamp: hybridData.timestamp,
      confidence: hybridData.confidenceAdjustment,
    };
  }

  /**
   * Check if Chainlink is available and healthy
   */
  async isChainlinkHealthy(): Promise<boolean> {
    try {
      const isFresh = await this.chainlinkService.isPriceFresh(60);
      return isFresh;
    } catch (error) {
      logger.error('Error checking Chainlink health:', error);
      return false;
    }
  }

  /**
   * Get detailed price comparison for debugging
   */
  async getPriceComparison(symbol: string = 'BNBUSDT'): Promise<{
    chainlink: number | null;
    binance: number;
    difference: number;
    differencePercent: number;
    recommendation: string;
  }> {
    const hybridData = await this.getHybridPrice(symbol);

    let recommendation = '';
    if (!hybridData.chainlinkPrice) {
      recommendation = 'Use Binance (Chainlink unavailable)';
    } else if (hybridData.priceDifferencePercent < 0.1) {
      recommendation = 'Use Chainlink (prices match)';
    } else if (hybridData.priceDifferencePercent < 0.3) {
      recommendation = 'Use Chainlink (acceptable difference)';
    } else if (hybridData.priceDifferencePercent < 0.5) {
      recommendation = 'Use Chainlink with caution (moderate difference)';
    } else {
      recommendation = 'Use average (large difference detected)';
    }

    return {
      chainlink: hybridData.chainlinkPrice,
      binance: hybridData.binancePrice,
      difference: hybridData.priceDifference,
      differencePercent: hybridData.priceDifferencePercent,
      recommendation,
    };
  }
}

