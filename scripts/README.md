# Scripts Directory

Thư mục chứa các scripts hữu ích cho deployment và testing.

## 🚀 Deployment Scripts

### `auto-deploy.sh`
Deploy tự động hoàn toàn bot lên VPS Ubuntu 22.04.

```bash
# Chạy từ xa
curl -fsSL <script-url>/auto-deploy.sh | bash

# Hoặc local
./scripts/auto-deploy.sh
```

**Chức năng:**
- Update system
- Cài đặt Node.js, Bun, PM2
- Clone repository
- Install dependencies
- Setup environment
- Build project
- Start bot với PM2
- Configure firewall

---

### `setup-server.sh`
Setup môi trường server (Node.js, Bun, PM2, firewall).

```bash
sudo ./scripts/setup-server.sh
```

**Chức năng:**
- Update system packages
- Install Node.js 20
- Install Bun
- Install PM2
- Setup UFW firewall
- Create logs directory

---

### `deploy-bot.sh`
Deploy hoặc update bot (sau khi server đã setup).

```bash
./scripts/deploy-bot.sh
```

**Chức năng:**
- Validate .env configuration
- Install dependencies
- Build project
- Start/restart bot với PM2
- Setup PM2 auto-start
- Setup log rotation

---

### `update-bot.sh`
Update bot lên phiên bản mới.

```bash
./scripts/update-bot.sh
```

**Chức năng:**
- Backup .env file
- Pull latest changes
- Update dependencies
- Rebuild project
- Restart bot
- Verify bot is running

---

### `check-health.sh`
Kiểm tra tình trạng bot và hệ thống.

```bash
./scripts/check-health.sh
```

**Kiểm tra:**
- PM2 status
- System resources (CPU, Memory, Disk)
- Network connectivity (Binance, Cloudflare, Internet)
- Configuration (.env)
- Recent errors
- Uptime

---

### `backup.sh`
Backup cấu hình và dữ liệu quan trọng.

```bash
./scripts/backup.sh
```

**Backup:**
- .env file
- ecosystem.config.cjs
- package.json
- logs directory

**Location:** `~/backups/bnb-prediction-bot/`

**Retention:** Giữ 7 backups gần nhất

---

## 🧪 Test Scripts

### `test-binance.ts`
Test kết nối và chức năng Binance API.

```bash
bun run scripts/test-binance.ts
# hoặc
bun run test:binance
```

**Test:**
- Get current price
- Get 24hr ticker
- Get klines data
- Get comprehensive market data

---

### `test-ai.ts`
Test AI service và Cloudflare AI Gateway.

```bash
bun run scripts/test-ai.ts
# hoặc
bun run test:ai
```

**Test:**
- Validate configuration
- Fetch market data
- Calculate indicators
- Generate AI prediction
- Parse response

**Note:** Cần có .env file với API keys hợp lệ

---

### `test-indicators.ts`
Test tính toán các chỉ số kỹ thuật.

```bash
bun run scripts/test-indicators.ts
# hoặc
bun run test:indicators
```

**Test:**
- RSI calculation
- MACD calculation
- EMA calculation
- Bollinger Bands calculation
- Volume analysis
- Overall signal

---

## 🔧 Utility Scripts

### `make-executable.sh`
Make tất cả scripts executable.

```bash
./scripts/make-executable.sh
```

---

## 📋 Usage Examples

### First Time Deployment

```bash
# 1. SSH vào VPS
ssh root@YOUR_VPS_IP

# 2. Clone repository
git clone <repo-url>
cd bnb-prediction-bot

# 3. Setup server
sudo ./scripts/setup-server.sh

# 4. Configure .env
cp .env.example .env
nano .env

# 5. Deploy bot
./scripts/deploy-bot.sh
```

### Update Existing Bot

```bash
# SSH vào VPS
ssh root@YOUR_VPS_IP
cd /opt/bnb-prediction-bot

# Update
./scripts/update-bot.sh
```

### Regular Maintenance

```bash
# Health check
./scripts/check-health.sh

# Backup
./scripts/backup.sh

# View logs
pm2 logs bnb-prediction-bot
```

### Testing Locally

```bash
# Test all components
bun run test:binance
bun run test:indicators
bun run test:ai

# Or run all tests
bun run test:all
```

---

## ⚠️ Important Notes

### Permissions

Scripts cần quyền execute:
```bash
chmod +x scripts/*.sh
```

### Root Access

Một số scripts cần root:
- `auto-deploy.sh`
- `setup-server.sh`

Chạy với `sudo` hoặc as root user.

### Environment Variables

Test scripts cần .env file:
```bash
cp .env.example .env
# Edit .env với API keys
```

### Dependencies

Deployment scripts yêu cầu:
- Ubuntu 22.04 LTS
- Internet connection
- Git installed

---

## 🐛 Troubleshooting

### Script không chạy

```bash
# Check permissions
ls -la scripts/

# Make executable
chmod +x scripts/*.sh

# Check shebang
head -1 scripts/auto-deploy.sh
# Should be: #!/bin/bash
```

### Lỗi "command not found"

```bash
# Install missing tools
apt-get update
apt-get install -y curl git build-essential
```

### Test scripts fail

```bash
# Check .env
cat .env

# Verify API keys
grep -E "TOKEN|KEY|ID" .env

# Test network
curl https://api.binance.com/api/v3/ping
```

---

## 📚 Related Documentation

- [DEPLOY_GUIDE.md](../DEPLOY_GUIDE.md) - Hướng dẫn deploy chi tiết
- [QUICKSTART.md](../QUICKSTART.md) - Bắt đầu nhanh
- [README.md](../README.md) - Tổng quan dự án

---

**Tip:** Luôn chạy `check-health.sh` sau khi deploy hoặc update!

