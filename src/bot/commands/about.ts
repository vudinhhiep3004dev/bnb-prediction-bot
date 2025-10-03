import { Context } from 'telegraf';
import { logger } from '../../utils/logger.js';

export async function aboutCommand(ctx: Context) {
  try {
    const aboutMessage = `
ℹ️ **VỀ BNB PREDICTION BOT**

**Phiên bản:** 1.0.0

**Mô tả:**
Bot dự đoán giá BNB sử dụng AI để hỗ trợ chơi game Prediction trên PancakeSwap.

**Công nghệ:**
🤖 AI Model: Gemini 2.5 Flash Preview
☁️ Infrastructure: Cloudflare AI Gateway
📊 Data Source: Binance API
💬 Platform: Telegram Bot API

**Tính năng:**
✅ Dự đoán giá BNB trong 5 phút
✅ Phân tích kỹ thuật chuyên sâu
✅ Tính toán độ tin cậy
✅ Cập nhật thị trường real-time
✅ Giao diện thân thiện

**Chỉ số phân tích:**
• RSI (Relative Strength Index)
• MACD (Moving Average Convergence Divergence)
• EMA (Exponential Moving Average)
• Bollinger Bands
• Volume Analysis
• Price Action

**Cách hoạt động:**
1. Thu thập dữ liệu từ Binance
2. Tính toán các chỉ số kỹ thuật
3. Phân tích bằng AI Gemini
4. Đưa ra dự đoán và độ tin cậy

**Disclaimer:**
⚠️ Bot này chỉ mang tính chất tham khảo
⚠️ Không phải lời khuyên tài chính
⚠️ Không đảm bảo lợi nhuận
⚠️ Người dùng tự chịu trách nhiệm

**Liên hệ:**
📧 Email: support@example.com
🌐 Website: https://example.com
💬 Telegram: @admin

**Open Source:**
⭐ GitHub: https://github.com/yourusername/bnb-prediction-bot

Cảm ơn bạn đã sử dụng bot! 🙏
`;

    await ctx.reply(aboutMessage, { parse_mode: 'Markdown' });
    logger.info(`About command used by user ${ctx.from?.id}`);
  } catch (error) {
    logger.error('Error in about command:', error);
    await ctx.reply('❌ Không thể hiển thị thông tin. Vui lòng thử lại sau.');
  }
}

