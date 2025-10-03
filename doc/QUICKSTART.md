# Quick Start Guide - BNB Prediction Bot

## 🚀 Bắt đầu nhanh trong 5 phút

### Bước 1: Cài đặt Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd bnb-prediction-bot

# Cài đặt dependencies với Bun
bun install
```

### Bước 2: Lấy API Keys

#### 2.1. Telegram Bot Token

1. Mở Telegram, tìm [@BotFather](https://t.me/botfather)
2. Gửi `/newbot`
3. Đặt tên: `BNB Prediction Bot`
4. Đặt username: `your_bnb_prediction_bot`
5. Copy token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

#### 2.2. Cloudflare AI Gateway

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vào **AI** > **AI Gateway**
3. Click **Create Gateway**
4. Tên gateway: `bnb-prediction`
5. Copy:
   - Account ID: `abc123def456`
   - Gateway ID: `bnb-prediction`

#### 2.3. Google AI Studio API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API Key**
3. Tạo key mới
4. Copy key: `AIzaSy...`

### Bước 3: Cấu hình Environment

```bash
# Copy file example
cp .env.example .env

# Chỉnh sửa .env
nano .env
```

Điền thông tin:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
CLOUDFLARE_ACCOUNT_ID=abc123def456
CLOUDFLARE_GATEWAY_ID=bnb-prediction
GOOGLE_AI_STUDIO_API_KEY=AIzaSy...
```

### Bước 4: Chạy Bot

```bash
# Development mode (với hot reload)
bun run dev

# Production mode
bun run build
bun start
```

### Bước 5: Test Bot

1. Mở Telegram
2. Tìm bot của bạn
3. Gửi `/start`
4. Thử `/predict`

## 📱 Các lệnh Bot

- `/start` - Bắt đầu
- `/predict` - Dự đoán giá BNB
- `/market` - Xem thị trường
- `/help` - Hướng dẫn
- `/about` - Thông tin bot

## 🔧 Troubleshooting

### Lỗi "Missing required environment variables"

```bash
# Kiểm tra .env
cat .env

# Đảm bảo có đủ các biến:
# - TELEGRAM_BOT_TOKEN
# - CLOUDFLARE_ACCOUNT_ID
# - CLOUDFLARE_GATEWAY_ID
# - GOOGLE_AI_STUDIO_API_KEY
```

### Lỗi kết nối Binance API

```bash
# Test connection
curl https://api.binance.com/api/v3/ping

# Nếu bị block, thử VPN hoặc proxy
```

### Lỗi Cloudflare AI Gateway

```bash
# Kiểm tra credentials
# Đảm bảo Account ID và Gateway ID đúng
# Kiểm tra API key còn hiệu lực
```

## 📊 Kiểm tra Logs

```bash
# Xem logs trong development
# Logs sẽ hiển thị trực tiếp trong console

# Xem logs trong production
tail -f logs/combined.log
tail -f logs/error.log
```

## 🚀 Deploy lên Production

Xem hướng dẫn chi tiết trong [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy với PM2

```bash
# Build
bun run build

# Start với PM2
pm2 start ecosystem.config.cjs

# Save
pm2 save

# Auto-start on reboot
pm2 startup
```

## 💡 Tips

1. **Test trước khi deploy**: Luôn test bot ở local trước
2. **Monitor logs**: Theo dõi logs để phát hiện lỗi sớm
3. **Backup .env**: Lưu file .env ở nơi an toàn
4. **Update thường xuyên**: Cập nhật dependencies định kỳ
5. **Rate limiting**: Cẩn thận với API rate limits

## 📚 Tài liệu tham khảo

- [README.md](./README.md) - Tổng quan dự án
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Hướng dẫn deploy chi tiết
- [Binance API Docs](https://developers.binance.com/docs/binance-spot-api-docs/rest-api)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [PancakeSwap Prediction](https://docs.pancakeswap.finance/play/prediction)

## ❓ Cần giúp đỡ?

- Tạo issue trên GitHub
- Liên hệ admin
- Xem logs để debug

## 🎉 Hoàn thành!

Bot của bạn đã sẵn sàng! Chúc bạn may mắn với các dự đoán! 🚀

