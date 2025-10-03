import dotenv from 'dotenv';
import { BotConfig } from '../types/index.js';

dotenv.config();

export const config: BotConfig = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    gatewayId: process.env.CLOUDFLARE_GATEWAY_ID || '',
    apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY || '',
  },
  binance: {
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  },
  prediction: {
    intervalMinutes: parseInt(process.env.PREDICTION_INTERVAL_MINUTES || '5'),
    lookbackHours: parseInt(process.env.ANALYSIS_LOOKBACK_HOURS || '24'),
  },
};

// Validate required configuration
export function validateConfig(): void {
  const required = [
    { key: 'TELEGRAM_BOT_TOKEN', value: config.telegramToken },
    { key: 'CLOUDFLARE_ACCOUNT_ID', value: config.cloudflare.accountId },
    { key: 'CLOUDFLARE_GATEWAY_ID', value: config.cloudflare.gatewayId },
    { key: 'GOOGLE_AI_STUDIO_API_KEY', value: config.cloudflare.apiKey },
  ];

  const missing = required.filter((item) => !item.value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.map((m) => m.key).join(', ')}`
    );
  }
}

