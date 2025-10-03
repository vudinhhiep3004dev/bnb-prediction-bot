import { Telegraf, Context } from 'telegraf';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { startCommand } from './commands/start.js';
import { predictCommand } from './commands/predict.js';
import { marketCommand } from './commands/market.js';
import { helpCommand } from './commands/help.js';
import { aboutCommand } from './commands/about.js';

export class TelegramBot {
  private bot: Telegraf;

  constructor() {
    this.bot = new Telegraf(config.telegramToken);
    this.setupCommands();
    this.setupMiddleware();
    this.setupErrorHandling();
  }

  /**
   * Setup bot commands
   */
  private setupCommands(): void {
    // Command handlers
    this.bot.command('start', startCommand);
    this.bot.command('predict', predictCommand);
    this.bot.command('market', marketCommand);
    this.bot.command('help', helpCommand);
    this.bot.command('about', aboutCommand);

    // Handle unknown commands
    this.bot.on('text', async (ctx: Context) => {
      const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
      
      if (text.startsWith('/')) {
        await ctx.reply(
          '❓ Lệnh không hợp lệ.\n\n' +
            'Sử dụng /help để xem danh sách lệnh có sẵn.'
        );
      } else {
        await ctx.reply(
          '💬 Xin chào! Tôi là bot dự đoán giá BNB.\n\n' +
            'Sử dụng /predict để nhận dự đoán hoặc /help để xem hướng dẫn.'
        );
      }
    });

    logger.info('Bot commands registered');
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Log all incoming messages
    this.bot.use(async (ctx: Context, next) => {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const messageType = ctx.updateType;

      logger.info('Incoming update:', {
        userId,
        username,
        messageType,
      });

      await next();
    });

    // Rate limiting could be added here
    // Anti-spam measures could be added here
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.bot.catch((err: any, ctx: Context) => {
      logger.error('Bot error:', {
        error: err,
        userId: ctx.from?.id,
        updateType: ctx.updateType,
      });

      ctx.reply(
        '❌ Đã xảy ra lỗi không mong muốn.\n\n' +
          'Vui lòng thử lại sau hoặc liên hệ admin nếu lỗi vẫn tiếp tục.'
      ).catch((e) => {
        logger.error('Failed to send error message:', e);
      });
    });

    // Handle process errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
    });
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting Telegram bot...');

      // Enable graceful stop
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));

      // Launch bot
      await this.bot.launch();

      logger.info('Bot started successfully!');
      logger.info('Bot username:', (await this.bot.telegram.getMe()).username);
    } catch (error) {
      logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * Stop the bot gracefully
   */
  private stop(signal: string): void {
    logger.info(`Received ${signal}, stopping bot...`);
    this.bot.stop(signal);
    logger.info('Bot stopped');
    process.exit(0);
  }

  /**
   * Get bot instance
   */
  getBot(): Telegraf {
    return this.bot;
  }
}

