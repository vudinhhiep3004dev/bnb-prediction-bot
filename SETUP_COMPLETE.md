# 🎉 Setup Hoàn Tất - BNB Prediction Bot

Chúc mừng! Dự án BNB Prediction Bot đã được tạo thành công!

## 📁 Cấu trúc dự án

```
bnb-prediction-bot/
├── src/                          # Source code
│   ├── bot/                      # Telegram bot
│   │   ├── bot.ts               # Bot setup
│   │   └── commands/            # Bot commands
│   │       ├── start.ts
│   │       ├── predict.ts
│   │       ├── market.ts
│   │       ├── help.ts
│   │       └── about.ts
│   ├── services/                # Business logic
│   │   ├── binance.ts          # Binance API
│   │   ├── ai.ts               # AI service
│   │   └── prediction.ts       # Prediction logic
│   ├── types/                   # TypeScript types
│   ├── utils/                   # Utilities
│   │   ├── logger.ts
│   │   └── indicators.ts
│   ├── config/                  # Configuration
│   └── index.ts                 # Entry point
├── scripts/                     # Deployment scripts
│   ├── auto-deploy.sh          # Auto deploy
│   ├── setup-server.sh         # Server setup
│   ├── deploy-bot.sh           # Deploy bot
│   ├── update-bot.sh           # Update bot
│   ├── check-health.sh         # Health check
│   ├── backup.sh               # Backup
│   ├── test-binance.ts         # Test Binance API
│   ├── test-ai.ts              # Test AI service
│   └── test-indicators.ts      # Test indicators
├── docs/                        # Documentation
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── DEPLOY_GUIDE.md
│   ├── DEPLOYMENT.md
│   ├── API_DOCUMENTATION.md
│   ├── CONTRIBUTING.md
│   └── CHANGELOG.md
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
├── ecosystem.config.cjs         # PM2 config
├── Dockerfile
└── deploy.sh
```

## 🚀 Bước tiếp theo

### 1. Cài đặt Dependencies

```bash
bun install
```

### 2. Cấu hình Environment

```bash
cp .env.example .env
nano .env
```

Điền các thông tin:
- `TELEGRAM_BOT_TOKEN` - Từ @BotFather
- `CLOUDFLARE_ACCOUNT_ID` - Từ Cloudflare Dashboard
- `CLOUDFLARE_GATEWAY_ID` - Từ AI Gateway
- `GOOGLE_AI_STUDIO_API_KEY` - Từ Google AI Studio

### 3. Test Local

```bash
# Test Binance API
bun run test:binance

# Test Technical Indicators
bun run test:indicators

# Test AI Service
bun run test:ai

# Run bot in development
bun run dev
```

### 4. Deploy lên Production

Xem hướng dẫn chi tiết trong [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

**Quick deploy:**
```bash
# SSH vào VPS
ssh root@YOUR_VPS_IP

# Auto deploy
curl -fsSL https://raw.githubusercontent.com/yourusername/bnb-prediction-bot/main/scripts/auto-deploy.sh | bash
```

## 📚 Tài liệu

- **[README.md](./README.md)** - Tổng quan dự án
- **[QUICKSTART.md](./QUICKSTART.md)** - Bắt đầu nhanh trong 5 phút
- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - Hướng dẫn deploy chi tiết
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Hướng dẫn đóng góp

## 🛠️ Scripts có sẵn

### Development
```bash
bun run dev          # Run in development mode
bun run build        # Build for production
bun start            # Start production build
```

### Testing
```bash
bun run test:binance     # Test Binance API
bun run test:ai          # Test AI service
bun run test:indicators  # Test technical indicators
bun run test:all         # Run all tests
```

### Code Quality
```bash
bun run lint         # Lint code
bun run format       # Format code
```

### Deployment (on server)
```bash
./scripts/setup-server.sh    # Setup server environment
./scripts/deploy-bot.sh      # Deploy/update bot
./scripts/update-bot.sh      # Update to latest version
./scripts/check-health.sh    # Health check
./scripts/backup.sh          # Backup configuration
```

## 🔑 API Keys cần thiết

### 1. Telegram Bot Token
- Truy cập: [@BotFather](https://t.me/botfather)
- Lệnh: `/newbot`
- Format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Cloudflare AI Gateway
- Dashboard: https://dash.cloudflare.com/
- Vào: AI → AI Gateway → Create Gateway
- Cần: Account ID và Gateway ID

### 3. Google AI Studio API Key
- Truy cập: https://aistudio.google.com/
- Click: Get API Key
- Format: `AIzaSy...`

## ✅ Checklist

- [ ] Đã cài đặt dependencies (`bun install`)
- [ ] Đã tạo và cấu hình file `.env`
- [ ] Đã test Binance API (`bun run test:binance`)
- [ ] Đã test AI service (`bun run test:ai`)
- [ ] Đã test bot locally (`bun run dev`)
- [ ] Đã tạo VPS trên Vultr
- [ ] Đã deploy bot lên production
- [ ] Đã test bot trên Telegram
- [ ] Đã setup monitoring và logs
- [ ] Đã setup backup

## 🎯 Tính năng chính

✅ Dự đoán giá BNB trong 5 phút (UP/DOWN)
✅ Phân tích kỹ thuật với RSI, MACD, EMA, Bollinger Bands
✅ AI-powered predictions với Gemini 2.5 Flash
✅ Độ tin cậy và risk assessment
✅ Real-time market data từ Binance
✅ Telegram bot interface
✅ Logging và monitoring
✅ Auto-restart với PM2
✅ Docker support

## 🔧 Troubleshooting

### Bot không start
```bash
pm2 logs bnb-prediction-bot --err
cat .env
```

### Lỗi API
```bash
curl https://api.binance.com/api/v3/ping
bun run test:binance
```

### Memory issues
```bash
pm2 restart bnb-prediction-bot --max-memory-restart 500M
```

Xem thêm trong [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md#troubleshooting)

## 📊 Monitoring

```bash
# Check status
pm2 status

# View logs
pm2 logs bnb-prediction-bot

# Monitor resources
pm2 monit

# Health check
./scripts/check-health.sh
```

## 🔄 Update

```bash
cd /opt/bnb-prediction-bot
./scripts/update-bot.sh
```

## 💾 Backup

```bash
./scripts/backup.sh
```

Backups được lưu tại: `~/backups/bnb-prediction-bot/`

## 📞 Support

- **GitHub Issues**: https://github.com/yourusername/bnb-prediction-bot/issues
- **Documentation**: Xem các file .md trong dự án
- **Telegram**: @your_telegram

## 🎓 Học thêm

- [Binance API Docs](https://developers.binance.com/docs/binance-spot-api-docs/rest-api)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [PancakeSwap Prediction](https://docs.pancakeswap.finance/play/prediction)
- [Telegraf Docs](https://telegraf.js.org/)
- [Technical Analysis](https://www.investopedia.com/technical-analysis-4689657)

## ⚠️ Disclaimer

Bot này chỉ mang tính chất tham khảo và giáo dục. Không phải lời khuyên đầu tư. Luôn DYOR (Do Your Own Research) và chỉ đầu tư số tiền bạn có thể mất.

## 📝 License

MIT License - Xem [LICENSE](./LICENSE)

---

**Chúc bạn thành công với bot! 🚀**

Nếu thấy hữu ích, hãy star ⭐ repository!

