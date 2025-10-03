# Contributing to BNB Prediction Bot

Cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án! 🎉

## Cách đóng góp

### Báo cáo Bug

1. Kiểm tra [Issues](https://github.com/yourusername/bnb-prediction-bot/issues) xem bug đã được báo cáo chưa
2. Nếu chưa, tạo issue mới với:
   - Mô tả chi tiết bug
   - Các bước tái hiện
   - Kết quả mong đợi vs thực tế
   - Logs (nếu có)
   - Môi trường (OS, Node version, etc.)

### Đề xuất tính năng

1. Tạo issue với label `enhancement`
2. Mô tả rõ tính năng
3. Giải thích tại sao cần tính năng này
4. Đề xuất cách implement (nếu có)

### Pull Request

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/bnb-prediction-bot.git
cd bnb-prediction-bot

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Run in development mode
bun run dev
```

## Code Style

- Sử dụng TypeScript
- Follow Prettier config
- Follow ESLint rules
- Viết code rõ ràng, dễ hiểu
- Comment cho logic phức tạp

### Format code

```bash
bun run format
```

### Lint code

```bash
bun run lint
```

## Commit Messages

Sử dụng conventional commits:

- `feat:` - Tính năng mới
- `fix:` - Sửa bug
- `docs:` - Cập nhật documentation
- `style:` - Format code, không thay đổi logic
- `refactor:` - Refactor code
- `test:` - Thêm tests
- `chore:` - Cập nhật dependencies, config

Ví dụ:
```
feat: add support for ETH prediction
fix: resolve API timeout issue
docs: update deployment guide
```

## Testing

Trước khi submit PR:

1. Test bot locally
2. Kiểm tra không có lỗi TypeScript
3. Chạy lint và format
4. Test các tính năng liên quan

```bash
# Build
bun run build

# Test bot
bun run dev
# Thử các lệnh trong Telegram
```

## Project Structure

```
src/
├── bot/              # Telegram bot logic
│   ├── bot.ts       # Bot setup
│   └── commands/    # Bot commands
├── services/        # Business logic
│   ├── binance.ts   # Binance API
│   ├── ai.ts        # AI service
│   └── prediction.ts # Prediction logic
├── types/           # TypeScript types
├── utils/           # Utilities
│   ├── logger.ts    # Logging
│   └── indicators.ts # Technical indicators
├── config/          # Configuration
└── index.ts         # Entry point
```

## Areas for Contribution

### High Priority

- [ ] Thêm support cho BTC, ETH prediction
- [ ] Implement caching để giảm API calls
- [ ] Thêm rate limiting
- [ ] Viết tests
- [ ] Cải thiện accuracy của predictions

### Medium Priority

- [ ] Thêm database để lưu history
- [ ] Tracking accuracy của predictions
- [ ] User preferences
- [ ] Multi-language support
- [ ] Web dashboard

### Low Priority

- [ ] Telegram inline mode
- [ ] Notifications cho price alerts
- [ ] Integration với exchanges khác
- [ ] Mobile app

## Code Review Process

1. Maintainer sẽ review PR trong vòng 48h
2. Có thể yêu cầu changes
3. Sau khi approve, PR sẽ được merge
4. Changes sẽ được deploy trong release tiếp theo

## Questions?

- Tạo issue với label `question`
- Liên hệ maintainers
- Join Telegram group (nếu có)

## License

Bằng việc đóng góp, bạn đồng ý rằng contributions của bạn sẽ được license dưới MIT License.

## Code of Conduct

- Tôn trọng mọi người
- Constructive feedback
- Không spam
- Không toxic

Cảm ơn bạn đã đóng góp! 🙏

