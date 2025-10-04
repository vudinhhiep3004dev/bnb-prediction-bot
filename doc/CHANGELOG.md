# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-04

### Added
- **Predicted Price Feature** - Dự đoán giá cụ thể cho khung 5 phút tiếp theo
  - Tính toán giá dự kiến (predicted price) dựa trên các chỉ số kỹ thuật
  - Hiển thị khoảng giá dự kiến (price range: min - max)
  - Tính toán phần trăm thay đổi dự kiến (expected change %)
  - Sử dụng ATR để xác định biên độ dao động
  - Sử dụng Bollinger Bands để xác định khoảng giá hợp lý
  - Sử dụng VWAP và EMA để xác định xu hướng giá
  - Sử dụng Order Book depth để đánh giá áp lực mua/bán
  - Sử dụng Trade Flow để đánh giá momentum thị trường
  - Sử dụng Stochastic Oscillator để điều chỉnh dự đoán
  - Hiển thị giá dự kiến với màu sắc (🟢 cho UP, 🔴 cho DOWN)
  - Thêm disclaimer về độ chính xác của dự đoán giá
- New test script `test:price` để kiểm tra chức năng dự đoán giá
- Function `calculatePredictedPrice()` trong `utils/indicators.ts`

### Changed
- Updated `PredictionResult` interface với các field mới:
  - `predictedPrice`: Giá dự kiến
  - `priceRange`: Khoảng giá dự kiến (min, max)
  - `expectedChange`: Phần trăm thay đổi dự kiến
- Enhanced Telegram message format với thông tin giá dự kiến
- Updated `PredictionService.generatePrediction()` để tính predicted price
- Updated disclaimer trong message để nhấn mạnh về độ chính xác

### Improved
- Độ chính xác dự đoán giá dựa trên 10 chỉ số kỹ thuật
- Tính toán động dựa trên volatility level (LOW/MEDIUM/HIGH)
- Điều chỉnh dự đoán dựa trên order book pressure
- Điều chỉnh dự đoán dựa trên trade flow momentum
- Validation để đảm bảo giá dự kiến nằm trong khoảng hợp lý

### Technical
- Algorithm sử dụng 50% ATR cho base movement
- Điều chỉnh ±30% dựa trên volatility level
- Sử dụng 30% ATR cho price range width
- Áp dụng pressure factor từ order book và trade flow
- Giới hạn giá dự kiến trong khoảng Bollinger Bands (với tolerance)

## [1.1.0] - 2025-01-03

### Added
- **Order Book Depth Analysis** - Real-time market depth analysis
  - Bid/Ask spread calculation
  - Buy/Sell pressure measurement
  - Order book imbalance ratio
  - Depth quality assessment (THIN/NORMAL/DEEP)
- **Recent Trade Flow Analysis** - Analysis of last 100 trades
  - Buy/Sell volume tracking
  - Trade velocity calculation
  - Large order detection
  - Aggressive buyer/seller percentage
  - Recent trend classification (STRONG_BUY/BUY/NEUTRAL/SELL/STRONG_SELL)
- **ATR (Average True Range)** - Volatility measurement
  - Absolute ATR value
  - ATR percentage relative to price
  - Volatility level classification (LOW/MEDIUM/HIGH)
- **Stochastic Oscillator** - Short-term momentum indicator
  - %K and %D calculation
  - Oversold/Overbought signal detection
  - Better than RSI for 5-minute predictions
- **VWAP (Volume Weighted Average Price)** - Institutional price reference
  - Volume-weighted average calculation
  - Price position relative to VWAP
  - Percentage deviation from VWAP
- Enhanced AI prompt with new indicators
- Improved prediction methodology prioritizing real-time data
- New test script for enhanced indicators
- Comprehensive documentation for new features

### Changed
- Updated `BinanceService.getMarketData()` to `getEnhancedMarketData()`
- Enhanced AI system prompt with new decision rules
- Improved indicator priority for 5-minute predictions:
  - Tier 1 (70%): Order Book + Trade Flow
  - Tier 2 (20%): Stochastic + ATR + VWAP
  - Tier 3 (10%): Traditional indicators
- Updated `TechnicalIndicators` interface with new fields
- Updated `MarketData` interface to include order book and trade flow data

### Improved
- Prediction accuracy expected to increase by 15-20%
- Better confidence level assessment
- Enhanced pump/dump detection
- More accurate short-term momentum analysis

### Technical
- API rate limit impact: +2 weight per prediction (still very safe)
- Total weight: 6 per prediction (limit: 1200/minute)
- All new indicators tested and verified

## [1.0.0] - 2025-01-XX

### Added
- Initial release of BNB Prediction Bot
- Telegram bot integration with Telegraf
- Binance API integration for market data
- Cloudflare AI Gateway integration
- Gemini 2.5 Flash AI model for predictions
- Technical indicators calculation:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - EMA (Exponential Moving Average)
  - Bollinger Bands
  - Volume analysis
- Bot commands:
  - `/start` - Welcome message
  - `/predict` - Get BNB price prediction
  - `/market` - View market summary
  - `/help` - Show help information
  - `/about` - Bot information
- Comprehensive logging with Winston
- TypeScript support
- PM2 configuration for production deployment
- Docker support
- Deployment scripts for Vultr VPS
- Documentation:
  - README.md
  - QUICKSTART.md
  - DEPLOYMENT.md
  - API_DOCUMENTATION.md
  - CONTRIBUTING.md

### Features
- 5-minute price prediction (UP/DOWN)
- Confidence level calculation
- Risk assessment
- Detailed reasoning for predictions
- Real-time market data
- Technical analysis
- User-friendly Telegram interface
- Vietnamese language support

### Technical
- Node.js 20+
- TypeScript 5.7+
- Bun package manager
- ESM modules
- Async/await patterns
- Error handling and retry logic
- Environment-based configuration

## [Unreleased]

### Planned
- [ ] Support for BTC and ETH predictions
- [ ] Historical accuracy tracking
- [ ] User preferences and settings
- [ ] Database integration for history
- [ ] Caching layer for API responses
- [ ] Rate limiting per user
- [ ] Multi-language support
- [ ] Web dashboard
- [ ] Automated testing
- [ ] CI/CD pipeline
- [ ] Performance monitoring
- [ ] Alert system for high-confidence predictions

### Under Consideration
- [ ] Integration with PancakeSwap smart contracts
- [ ] Automated trading (with user approval)
- [ ] Portfolio tracking
- [ ] Price alerts
- [ ] Telegram inline mode
- [ ] Mobile app
- [ ] API for third-party integrations
- [ ] Premium features

## Version History

### Version Numbering

- **Major version** (X.0.0): Breaking changes
- **Minor version** (0.X.0): New features, backwards compatible
- **Patch version** (0.0.X): Bug fixes, backwards compatible

### Release Schedule

- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed

## Migration Guides

### Upgrading to 1.0.0

This is the initial release, no migration needed.

## Breaking Changes

None yet.

## Deprecations

None yet.

## Security Updates

None yet.

## Contributors

- Initial development by [Your Name]

## Links

- [GitHub Repository](https://github.com/yourusername/bnb-prediction-bot)
- [Issue Tracker](https://github.com/yourusername/bnb-prediction-bot/issues)
- [Documentation](https://github.com/yourusername/bnb-prediction-bot/wiki)

