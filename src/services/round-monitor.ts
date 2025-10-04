import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { PredictionRound, RoundTiming } from '../types/index.js';
import { ChainlinkService } from './chainlink.js';

// PancakeSwap Prediction Contract on BSC
const PANCAKESWAP_PREDICTION_BNBUSD = '0x18b2a687610328590bc8f2e5fedde3b582a49cda';

// PancakeSwap Prediction Contract ABI (only functions we need)
const PREDICTION_CONTRACT_ABI = [
  'function currentEpoch() view returns (uint256)',
  'function rounds(uint256 epoch) view returns (uint256 epoch, uint256 startTimestamp, uint256 lockTimestamp, uint256 closeTimestamp, int256 lockPrice, int256 closePrice, uint256 lockOracleId, uint256 closeOracleId, uint256 totalAmount, uint256 bullAmount, uint256 bearAmount, uint256 rewardBaseCalAmount, uint256 rewardAmount, bool oracleCalled)',
  'function intervalSeconds() view returns (uint256)',
  'function bufferSeconds() view returns (uint256)',
];

export class RoundMonitorService {
  private chainlinkService: ChainlinkService;
  private contract: ethers.Contract | null = null;
  private intervalSeconds: number = 300; // Default 5 minutes
  private bufferSeconds: number = 30; // Default 30 seconds

  constructor(chainlinkService: ChainlinkService) {
    this.chainlinkService = chainlinkService;
    this.initializeContract();
  }

  /**
   * Initialize PancakeSwap Prediction contract
   */
  private async initializeContract(): Promise<void> {
    try {
      const provider = this.chainlinkService.getProvider();
      if (!provider) {
        throw new Error('Chainlink provider not initialized');
      }

      this.contract = new ethers.Contract(
        PANCAKESWAP_PREDICTION_BNBUSD,
        PREDICTION_CONTRACT_ABI,
        provider
      );

      // Get contract parameters
      this.intervalSeconds = Number(await this.contract.intervalSeconds());
      this.bufferSeconds = Number(await this.contract.bufferSeconds());

      logger.info('✅ PancakeSwap Prediction contract initialized:', {
        address: PANCAKESWAP_PREDICTION_BNBUSD,
        intervalSeconds: this.intervalSeconds,
        bufferSeconds: this.bufferSeconds,
      });
    } catch (error) {
      logger.error('Error initializing PancakeSwap Prediction contract:', error);
      throw error;
    }
  }

  /**
   * Get current epoch (round number)
   */
  async getCurrentEpoch(): Promise<bigint> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      const epoch = await this.contract!.currentEpoch();
      return epoch;
    } catch (error) {
      logger.error('Error getting current epoch:', error);
      throw error;
    }
  }

  /**
   * Get round data by epoch
   */
  async getRound(epoch: bigint): Promise<PredictionRound> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      const roundData = await this.contract!.rounds(epoch);

      const round: PredictionRound = {
        epoch: roundData[0],
        startTimestamp: Number(roundData[1]),
        lockTimestamp: Number(roundData[2]),
        closeTimestamp: Number(roundData[3]),
        lockPrice: roundData[4] !== 0n ? Number(roundData[4]) / 1e8 : null,
        closePrice: roundData[5] !== 0n ? Number(roundData[5]) / 1e8 : null,
        totalAmount: roundData[8],
        bullAmount: roundData[9],
        bearAmount: roundData[10],
        rewardBaseCalAmount: roundData[11],
        rewardAmount: roundData[12],
        oracleCalled: roundData[13],
      };

      return round;
    } catch (error) {
      logger.error(`Error getting round ${epoch}:`, error);
      throw error;
    }
  }

  /**
   * Get current round data
   */
  async getCurrentRound(): Promise<PredictionRound> {
    const epoch = await this.getCurrentEpoch();
    return this.getRound(epoch);
  }

  /**
   * Get round timing information
   */
  async getRoundTiming(): Promise<RoundTiming> {
    try {
      const currentEpoch = await this.getCurrentEpoch();
      const currentRound = await this.getRound(currentEpoch);

      const now = Math.floor(Date.now() / 1000);
      const nextRoundStart = currentRound.closeTimestamp;
      const timeUntilNextRound = nextRoundStart - now;

      // Optimal prediction time: 30 seconds before next round starts
      const optimalPredictionTime = nextRoundStart - 30;
      const isOptimalTime = now >= optimalPredictionTime - 5 && now <= optimalPredictionTime + 5;

      const timing: RoundTiming = {
        currentEpoch,
        nextRoundStart,
        timeUntilNextRound,
        optimalPredictionTime,
        isOptimalTime,
      };

      logger.info('Round timing:', {
        currentEpoch: currentEpoch.toString(),
        timeUntilNextRound: `${timeUntilNextRound}s`,
        isOptimalTime,
      });

      return timing;
    } catch (error) {
      logger.error('Error getting round timing:', error);
      throw error;
    }
  }

  /**
   * Wait until optimal prediction time (30s before next round)
   */
  async waitForOptimalPredictionTime(): Promise<void> {
    try {
      const timing = await this.getRoundTiming();

      if (timing.isOptimalTime) {
        logger.info('Already at optimal prediction time');
        return;
      }

      const waitTime = timing.optimalPredictionTime - Math.floor(Date.now() / 1000);

      if (waitTime > 0) {
        logger.info(`Waiting ${waitTime}s until optimal prediction time...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        logger.info('✅ Optimal prediction time reached');
      } else {
        logger.warn('Optimal prediction time has passed, proceeding anyway');
      }
    } catch (error) {
      logger.error('Error waiting for optimal prediction time:', error);
      throw error;
    }
  }

  /**
   * Check if we're in the betting phase (before lock)
   */
  async isInBettingPhase(): Promise<boolean> {
    try {
      const currentRound = await this.getCurrentRound();
      const now = Math.floor(Date.now() / 1000);

      // Betting phase is between start and lock
      return now >= currentRound.startTimestamp && now < currentRound.lockTimestamp;
    } catch (error) {
      logger.error('Error checking betting phase:', error);
      return false;
    }
  }

  /**
   * Get time until lock for current round
   */
  async getTimeUntilLock(): Promise<number> {
    try {
      const currentRound = await this.getCurrentRound();
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, currentRound.lockTimestamp - now);
    } catch (error) {
      logger.error('Error getting time until lock:', error);
      return 0;
    }
  }

  /**
   * Get locked price for a specific round (if available)
   */
  async getLockedPrice(epoch?: bigint): Promise<number | null> {
    try {
      const targetEpoch = epoch || (await this.getCurrentEpoch());
      const round = await this.getRound(targetEpoch);
      return round.lockPrice;
    } catch (error) {
      logger.error('Error getting locked price:', error);
      return null;
    }
  }
}

