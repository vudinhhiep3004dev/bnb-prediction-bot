import { Context } from 'telegraf';
import { PredictionService } from '../../services/prediction.js';
import { logger } from '../../utils/logger.js';

const predictionService = new PredictionService();

export async function predictCommand(ctx: Context) {
  try {
    // Send initial message
    const loadingMsg = await ctx.reply('🔮 Đang phân tích thị trường và tạo dự đoán...\n⏳ Vui lòng đợi...');

    // Generate prediction
    const prediction = await predictionService.generatePrediction();

    // Format prediction message
    const emoji = prediction.prediction === 'UP' ? '📈' : '📉';
    const confidenceEmoji = getConfidenceEmoji(prediction.confidence);
    const riskEmoji = getRiskEmoji(prediction.confidence);
    const priceChangeEmoji = prediction.expectedChange > 0 ? '🟢' : '🔴';

    // Format predicted price với màu sắc
    const predictedPriceText =
      prediction.prediction === 'UP'
        ? `🟢 $${prediction.predictedPrice.toFixed(2)}`
        : `🔴 $${prediction.predictedPrice.toFixed(2)}`;

    // Format price source info
    const priceSourceEmoji = prediction.priceSource === 'CHAINLINK' ? '🔗' : '📊';
    const priceSourceText = prediction.priceSource === 'CHAINLINK' ? 'Chainlink Oracle' : 'Binance';
    const priceConfidenceText = prediction.priceConfidence
      ? `${(prediction.priceConfidence * 100).toFixed(0)}%`
      : '100%';

    // Format round info
    let roundInfoText = '';
    if (prediction.roundInfo) {
      const timeUntilLock = prediction.roundInfo.timeUntilLock;
      const minutes = Math.floor(timeUntilLock / 60);
      const seconds = timeUntilLock % 60;
      roundInfoText = `\n🎲 **Vòng hiện tại:** #${prediction.roundInfo.currentEpoch.toString()}`;
      if (timeUntilLock > 0) {
        roundInfoText += `\n⏱️ **Thời gian còn lại:** ${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    const message = `
${emoji} **DỰ ĐOÁN GIÁ BNB - 5 PHÚT TỚI**

🎯 **Dự đoán:** ${prediction.prediction === 'UP' ? '📈 TĂNG (UP)' : '📉 GIẢM (DOWN)'}
${confidenceEmoji} **Độ tin cậy:** ${prediction.confidence.toFixed(1)}%
${riskEmoji} **Mức độ rủi ro:** ${getRiskLevel(prediction.confidence)}

💰 **Giá hiện tại:** $${prediction.currentPrice.toFixed(2)}
${priceSourceEmoji} **Nguồn giá:** ${priceSourceText} (${priceConfidenceText})
🎯 **Giá dự kiến:** ${predictedPriceText}
${priceChangeEmoji} **Thay đổi dự kiến:** ${prediction.expectedChange > 0 ? '+' : ''}${prediction.expectedChange.toFixed(2)}%

📊 **Khoảng giá dự kiến:**
• Thấp nhất: $${prediction.priceRange.min.toFixed(2)}
• Cao nhất: $${prediction.priceRange.max.toFixed(2)}
${roundInfoText}

📈 **Chỉ số kỹ thuật:**
• RSI: ${prediction.indicators.rsi.toFixed(2)} ${getRSIStatus(prediction.indicators.rsi)}
• Xu hướng: ${prediction.indicators.trend}
• Khối lượng: ${prediction.indicators.volume}

💡 **Phân tích:**
${prediction.reasoning}

⏰ **Thời gian:** ${prediction.timestamp.toLocaleString('vi-VN')}

⚠️ **Lưu ý:**
• Dự đoán sử dụng ${priceSourceText} - cùng nguồn với PancakeSwap
• Giá dự kiến dựa trên phân tích kỹ thuật và có thể sai lệch
• Thị trường crypto biến động cao, giá có thể thay đổi đột ngột
• Chỉ mang tính chất tham khảo, không phải lời khuyên đầu tư
• Hãy quản lý rủi ro cẩn thận và chỉ đầu tư số tiền bạn có thể mất

🎮 **Chơi ngay:** https://pancakeswap.finance/prediction
`;

    // Delete loading message and send result
    await ctx.telegram.deleteMessage(ctx.chat!.id, loadingMsg.message_id);
    await ctx.reply(message, { parse_mode: 'Markdown' });

    logger.info(`Prediction sent to user ${ctx.from?.id}:`, {
      prediction: prediction.prediction,
      confidence: prediction.confidence,
    });
  } catch (error) {
    logger.error('Error in predict command:', error);
    await ctx.reply(
      '❌ Đã xảy ra lỗi khi tạo dự đoán. Vui lòng thử lại sau.\n\n' +
        'Nếu lỗi vẫn tiếp tục, hãy liên hệ admin.'
    );
  }
}

function getConfidenceEmoji(confidence: number): string {
  if (confidence >= 80) return '🔥';
  if (confidence >= 70) return '✅';
  if (confidence >= 60) return '👍';
  if (confidence >= 50) return '⚠️';
  return '❓';
}

function getRiskEmoji(confidence: number): string {
  if (confidence >= 70) return '🟢';
  if (confidence >= 50) return '🟡';
  return '🔴';
}

function getRiskLevel(confidence: number): string {
  if (confidence >= 70) return 'Thấp';
  if (confidence >= 50) return 'Trung bình';
  return 'Cao';
}

function getRSIStatus(rsi: number): string {
  if (rsi > 70) return '(Quá mua)';
  if (rsi < 30) return '(Quá bán)';
  return '(Trung lập)';
}

