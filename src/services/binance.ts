import axios from 'axios';
import { BinanceKline, BinanceTicker24hr, MarketData } from '../types/index.js';
import { logger } from '../utils/logger.js';

const BINANCE_API_BASE = 'https://api.binance.com';

export class BinanceService {
  /**
   * Get kline/candlestick data for BNB/USDT
   */
  async getKlines(
    symbol: string = 'BNBUSDT',
    interval: string = '5m',
    limit: number = 100
  ): Promise<BinanceKline[]> {
    try {
      const response = await axios.get(`${BINANCE_API_BASE}/api/v3/klines`, {
        params: {
          symbol,
          interval,
          limit,
        },
      });

      return response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteAssetVolume: kline[7],
        numberOfTrades: kline[8],
        takerBuyBaseAssetVolume: kline[9],
        takerBuyQuoteAssetVolume: kline[10],
      }));
    } catch (error) {
      logger.error('Error fetching klines from Binance:', error);
      throw new Error('Failed to fetch kline data from Binance');
    }
  }

  /**
   * Get 24hr ticker price change statistics
   */
  async get24hrTicker(symbol: string = 'BNBUSDT'): Promise<BinanceTicker24hr> {
    try {
      const response = await axios.get(`${BINANCE_API_BASE}/api/v3/ticker/24hr`, {
        params: { symbol },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching 24hr ticker from Binance:', error);
      throw new Error('Failed to fetch 24hr ticker from Binance');
    }
  }

  /**
   * Get current price
   */
  async getCurrentPrice(symbol: string = 'BNBUSDT'): Promise<number> {
    try {
      const response = await axios.get(`${BINANCE_API_BASE}/api/v3/ticker/price`, {
        params: { symbol },
      });

      return parseFloat(response.data.price);
    } catch (error) {
      logger.error('Error fetching current price from Binance:', error);
      throw new Error('Failed to fetch current price from Binance');
    }
  }

  /**
   * Get comprehensive market data for analysis
   */
  async getMarketData(
    symbol: string = 'BNBUSDT',
    interval: string = '5m',
    limit: number = 100
  ): Promise<MarketData> {
    try {
      const [klines, ticker24hr] = await Promise.all([
        this.getKlines(symbol, interval, limit),
        this.get24hrTicker(symbol),
      ]);

      return {
        currentPrice: parseFloat(ticker24hr.lastPrice),
        priceChange24h: parseFloat(ticker24hr.priceChange),
        priceChangePercent24h: parseFloat(ticker24hr.priceChangePercent),
        volume24h: parseFloat(ticker24hr.volume),
        high24h: parseFloat(ticker24hr.highPrice),
        low24h: parseFloat(ticker24hr.lowPrice),
        klines,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Error fetching market data:', error);
      throw new Error('Failed to fetch market data');
    }
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(symbol: string = 'BNBUSDT', limit: number = 100) {
    try {
      const response = await axios.get(`${BINANCE_API_BASE}/api/v3/trades`, {
        params: {
          symbol,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching recent trades from Binance:', error);
      throw new Error('Failed to fetch recent trades from Binance');
    }
  }

  /**
   * Get order book depth
   */
  async getOrderBook(symbol: string = 'BNBUSDT', limit: number = 100) {
    try {
      const response = await axios.get(`${BINANCE_API_BASE}/api/v3/depth`, {
        params: {
          symbol,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching order book from Binance:', error);
      throw new Error('Failed to fetch order book from Binance');
    }
  }
}

