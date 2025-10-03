# BNB Prediction Bot 🤖

Telegram bot dự đoán giá BNB tăng hay giảm trong 5 phút sử dụng AI (Gemini) để chơi game Prediction trên PancakeSwap.

## Tính năng

- 🔮 Dự đoán giá BNB tăng/giảm trong 5 phút
- 🤖 Sử dụng AI Gemini 2.5 Flash thông qua Cloudflare AI Gateway
- 📊 Phân tích dữ liệu từ Binance API (klines, volume, indicators)
- 💬 Giao diện Telegram bot thân thiện
- 📈 Hiển thị độ tin cậy của dự đoán
- 🎯 Tích hợp với PancakeSwap Prediction game

## Công nghệ sử dụng

- **Runtime**: Node.js + TypeScript
- **Bot Framework**: Telegraf
- **AI Model**: Gemini 2.5 Flash Preview (via Cloudflare AI Gateway)
- **Data Source**: Binance API
- **Deployment**: Vultr VPS

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd bnb-prediction-bot
```

### 2. Cài đặt dependencies

```bash
bun install
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Điền các thông tin cần thiết:

- `TELEGRAM_BOT_TOKEN`: Token từ [@BotFather](https://t.me/botfather)
- `CLOUDFLARE_ACCOUNT_ID`: Account ID từ Cloudflare Dashboard
- `CLOUDFLARE_GATEWAY_ID`: Gateway ID từ AI Gateway
- `GOOGLE_AI_STUDIO_API_KEY`: API key từ Google AI Studio

### 4. Chạy bot

Development:
```bash
bun run dev
```

Production:
```bash
bun run build
bun start
```

## Cách sử dụng

1. Tìm bot trên Telegram và bấm `/start`
2. Sử dụng lệnh `/predict` để nhận dự đoán giá BNB
3. Bot sẽ phân tích và trả về:
   - Dự đoán: UP (tăng) hoặc DOWN (giảm)
   - Độ tin cậy (%)
   - Lý do phân tích
   - Giá hiện tại và các chỉ số kỹ thuật

## Cấu trúc dự án

```
bnb-prediction-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── bot/
│   │   ├── bot.ts           # Telegram bot setup
│   │   └── commands/        # Bot commands
│   ├── services/
│   │   ├── binance.ts       # Binance API service
│   │   ├── ai.ts            # Cloudflare AI Gateway service
│   │   └── prediction.ts    # Prediction logic
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   └── config/              # Configuration
├── dist/                    # Compiled JavaScript
├── .env                     # Environment variables
└── package.json
```

## API References

- [Binance API Documentation](https://developers.binance.com/docs/binance-spot-api-docs/rest-api)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [PancakeSwap Prediction](https://docs.pancakeswap.finance/play/prediction)
- [Telegraf Documentation](https://telegraf.js.org/)

## Deployment trên Vultr

### 1. Tạo VPS trên Vultr

- Chọn Ubuntu 22.04 LTS
- Tối thiểu 1GB RAM
- Cài đặt Node.js 20+

### 2. Deploy

```bash
# SSH vào server
ssh root@your-server-ip

# Clone và setup
git clone <repository-url>
cd bnb-prediction-bot
bun install
cp .env.example .env
# Chỉnh sửa .env với thông tin thực

# Build và chạy
bun run build
```

### 3. Sử dụng PM2 để chạy liên tục

```bash
bun add -g pm2
pm2 start dist/index.js --name bnb-prediction-bot
pm2 save
pm2 startup
```

## Lưu ý

- Bot này chỉ mang tính chất tham khảo, không phải lời khuyên đầu tư
- Luôn DYOR (Do Your Own Research) trước khi đặt cược
- PancakeSwap Prediction có phí 3% trên mỗi round
- Mỗi round kéo dài 5 phút

## License

MIT

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

