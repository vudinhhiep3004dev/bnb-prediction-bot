import { validateConfig } from './config/index.js';
import { TelegramBot } from './bot/bot.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('='.repeat(50));
    logger.info('BNB Prediction Bot Starting...');
    logger.info('='.repeat(50));

    // Validate configuration
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('Configuration validated successfully');

    // Create logs directory if it doesn't exist
    const fs = await import('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
      logger.info('Created logs directory');
    }

    // Initialize and start bot
    logger.info('Initializing Telegram bot...');
    const bot = new TelegramBot();
    await bot.start();

    logger.info('='.repeat(50));
    logger.info('Bot is now running!');
    logger.info('Press Ctrl+C to stop');
    logger.info('='.repeat(50));
  } catch (error) {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

// Start the application
main();

