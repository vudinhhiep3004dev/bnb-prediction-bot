import { Context } from 'telegraf';
import { logger } from '../../utils/logger.js';

export async function startCommand(ctx: Context) {
  try {
    const welcomeMessage = `
🤖 **Chào mừng đến với BNB Prediction Bot!**

Bot này sử dụng AI (Gemini 2.5 Flash) để phân tích và dự đoán giá BNB sẽ tăng hay giảm trong 5 phút tới, giúp bạn chơi game Prediction trên PancakeSwap.

📊 **Các lệnh có sẵn:**

/predict - Nhận dự đoán giá BNB cho 5 phút tới
/market - Xem tổng quan thị trường BNB
/help - Hướng dẫn sử dụng
/about - Thông tin về bot

⚠️ **Lưu ý quan trọng:**
• Bot chỉ mang tính chất tham khảo
• Không phải lời khuyên đầu tư
• Luôn DYOR trước khi đặt cược
• PancakeSwap Prediction có phí 3%

🎯 **Cách chơi PancakeSwap Prediction:**
1. Truy cập: https://pancakeswap.finance/prediction
2. Chọn BNB/USD
3. Dự đoán UP (tăng) hoặc DOWN (giảm)
4. Đặt cược và chờ kết quả sau 5 phút

Bắt đầu bằng lệnh /predict để nhận dự đoán đầu tiên! 🚀
`;

    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    logger.info(`User ${ctx.from?.id} started the bot`);
  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('Đã xảy ra lỗi. Vui lòng thử lại sau.');
  }
}

