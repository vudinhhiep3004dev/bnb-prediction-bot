import { Context } from 'telegraf';
import { logger } from '../../utils/logger.js';

export async function helpCommand(ctx: Context) {
  try {
    const helpMessage = `
📚 **HƯỚNG DẪN SỬ DỤNG BOT**

**Các lệnh cơ bản:**

/predict - Nhận dự đoán giá BNB
  • Bot sẽ phân tích thị trường
  • Dự đoán UP (tăng) hoặc DOWN (giảm)
  • Hiển thị độ tin cậy và các chỉ số

/market - Xem tổng quan thị trường
  • Giá hiện tại
  • Thay đổi 24h
  • Volume và các chỉ số khác

/help - Hiển thị hướng dẫn này

/about - Thông tin về bot

**Cách sử dụng dự đoán:**

1️⃣ Gọi lệnh /predict
2️⃣ Đợi bot phân tích (10-15 giây)
3️⃣ Xem kết quả dự đoán
4️⃣ Đánh giá độ tin cậy
5️⃣ Quyết định có đặt cược hay không

**Hiểu kết quả dự đoán:**

🎯 **Dự đoán:** UP hoặc DOWN
📊 **Độ tin cậy:**
  • 80-100%: Rất cao 🔥
  • 70-79%: Cao ✅
  • 60-69%: Trung bình 👍
  • 50-59%: Thấp ⚠️
  • <50%: Rất thấp ❓

📈 **RSI (Relative Strength Index):**
  • >70: Quá mua (có thể giảm)
  • 30-70: Trung lập
  • <30: Quá bán (có thể tăng)

**Lưu ý quan trọng:**

⚠️ Bot chỉ là công cụ hỗ trợ
⚠️ Không đảm bảo 100% chính xác
⚠️ Luôn quản lý rủi ro
⚠️ Chỉ đầu tư số tiền bạn có thể mất
⚠️ DYOR (Do Your Own Research)

**PancakeSwap Prediction:**

• Mỗi round: 5 phút
• Phí: 3% trên tổng pool
• Thắng: Chia pool theo tỷ lệ
• Thua: Mất toàn bộ số đặt cược

🔗 **Link hữu ích:**
• PancakeSwap: https://pancakeswap.finance/prediction
• Docs: https://docs.pancakeswap.finance/play/prediction

Có câu hỏi? Liên hệ admin! 💬
`;

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    logger.info(`Help command used by user ${ctx.from?.id}`);
  } catch (error) {
    logger.error('Error in help command:', error);
    await ctx.reply('❌ Không thể hiển thị hướng dẫn. Vui lòng thử lại sau.');
  }
}

