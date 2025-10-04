import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { ChainlinkPriceData } from '../types/index.js';

// Chainlink BNB/USD Price Feed on BSC
const CHAINLINK_BNB_USD_ADDRESS = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE';

// BSC RPC endpoints (fallback list)
const BSC_RPC_URLS = [
  'https://bsc-dataseed.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
  'https://bsc.publicnode.com',
];

// Chainlink Aggregator ABI (only functions we need)
const CHAINLINK_AGGREGATOR_ABI = [
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() view returns (uint8)',
];

export class ChainlinkService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private currentRpcIndex = 0;
  private decimals: number = 8; // Default for BNB/USD

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize provider with fallback support
   */
  private async initializeProvider(): Promise<void> {
    for (let i = 0; i < BSC_RPC_URLS.length; i++) {
      try {
        const rpcUrl = BSC_RPC_URLS[this.currentRpcIndex];
        logger.info(`Attempting to connect to BSC RPC: ${rpcUrl}`);

        this.provider = new ethers.JsonRpcProvider(rpcUrl, {
          chainId: 56,
          name: 'binance',
        });

        // Test connection
        await this.provider.getBlockNumber();

        this.contract = new ethers.Contract(
          CHAINLINK_BNB_USD_ADDRESS,
          CHAINLINK_AGGREGATOR_ABI,
          this.provider
        );

        // Get decimals
        this.decimals = await this.contract.decimals();

        logger.info(`✅ Connected to BSC RPC: ${rpcUrl}`);
        logger.info(`✅ Chainlink decimals: ${this.decimals}`);
        return;
      } catch (error) {
        logger.warn(`Failed to connect to RPC ${BSC_RPC_URLS[this.currentRpcIndex]}:`, error);
        this.currentRpcIndex = (this.currentRpcIndex + 1) % BSC_RPC_URLS.length;

        if (i === BSC_RPC_URLS.length - 1) {
          logger.error('All RPC endpoints failed');
          throw new Error('Failed to connect to any BSC RPC endpoint');
        }
      }
    }
  }

  /**
   * Get latest price from Chainlink oracle
   */
  async getLatestPrice(): Promise<ChainlinkPriceData> {
    try {
      if (!this.contract) {
        await this.initializeProvider();
      }

      const [roundId, answer, , updatedAt] = await this.contract!.latestRoundData();

      // Convert BigInt answer to number properly
      // First convert to string, then to number, then divide
      const answerNumber = Number(answer.toString());
      const decimalsNumber = Number(this.decimals);
      const price = answerNumber / 10 ** decimalsNumber;

      const priceData: ChainlinkPriceData = {
        price,
        roundId,
        updatedAt: Number(updatedAt.toString()),
        source: 'CHAINLINK',
      };

      logger.info('Chainlink price fetched:', {
        price: price.toFixed(2),
        roundId: roundId.toString(),
        updatedAt: new Date(Number(updatedAt) * 1000).toISOString(),
      });

      return priceData;
    } catch (error) {
      logger.error('Error fetching Chainlink price:', error);

      // Try to reconnect with next RPC
      this.currentRpcIndex = (this.currentRpcIndex + 1) % BSC_RPC_URLS.length;
      this.provider = null;
      this.contract = null;

      throw new Error('Failed to fetch price from Chainlink oracle');
    }
  }

  /**
   * Get price with retry logic
   */
  async getPriceWithRetry(maxRetries: number = 3): Promise<ChainlinkPriceData | null> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.getLatestPrice();
      } catch (error) {
        logger.warn(`Chainlink price fetch attempt ${i + 1}/${maxRetries} failed`);
        if (i === maxRetries - 1) {
          logger.error('All Chainlink price fetch attempts failed');
          return null;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return null;
  }

  /**
   * Check if Chainlink price is fresh (updated within last 60 seconds)
   */
  async isPriceFresh(maxAgeSeconds: number = 60): Promise<boolean> {
    try {
      const priceData = await this.getLatestPrice();
      const now = Math.floor(Date.now() / 1000);
      const age = now - priceData.updatedAt;

      logger.info(`Chainlink price age: ${age}s (max: ${maxAgeSeconds}s)`);

      return age <= maxAgeSeconds;
    } catch (error) {
      logger.error('Error checking Chainlink price freshness:', error);
      return false;
    }
  }

  /**
   * Get provider for other contract interactions
   */
  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }
}

