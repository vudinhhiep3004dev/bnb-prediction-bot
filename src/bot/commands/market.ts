import { Context } from 'telegraf';
import { PredictionService } from '../../services/prediction.js';
import { logger } from '../../utils/logger.js';

const predictionService = new PredictionService();

export async function marketCommand(ctx: Context) {
  try {
    const loadingMsg = await ctx.reply('📊 Đang lấy thông tin thị trường...');

    const summary = await predictionService.getMarketSummary();

    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    await ctx.reply(summary, { parse_mode: 'Markdown' });

    logger.info(`Market summary sent to user ${ctx.from?.id}`);
  } catch (error) {
    logger.error('Error in market command:', error);
    await ctx.reply('❌ Không thể lấy thông tin thị trường. Vui lòng thử lại sau.');
  }
}

