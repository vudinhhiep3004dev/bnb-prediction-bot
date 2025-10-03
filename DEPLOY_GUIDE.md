# Hướng dẫn Deploy Chi Tiết - BNB Prediction Bot

## 📋 Mục lục

1. [Chuẩn bị](#chuẩn-bị)
2. [Deploy tự động](#deploy-tự-động)
3. [Deploy thủ công](#deploy-thủ-công)
4. [Cấu hình sau deploy](#cấu-hình-sau-deploy)
5. [Kiểm tra và monitoring](#kiểm-tra-và-monitoring)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Chuẩn bị

### 1. Tạo VPS trên Vultr

**Bước 1**: Đăng ký tài khoản Vultr
- Truy cập: https://www.vultr.com/
- Đăng ký tài khoản mới
- Nạp tiền (tối thiểu $10)

**Bước 2**: Deploy VPS
```
1. Click "Deploy +" → "Deploy New Server"
2. Choose Server:
   - Type: Cloud Compute - Shared CPU
   - Location: Singapore (gần VN nhất)
   - Image: Ubuntu 22.04 LTS x64
   - Plan: $6/month (1 vCPU, 1GB RAM, 25GB SSD)
3. Additional Features:
   - ✅ Enable IPv6
   - ✅ Enable Auto Backups (optional, +$1.20/month)
4. Server Hostname: bnb-prediction-bot
5. Click "Deploy Now"
```

**Bước 3**: Lấy thông tin VPS
```bash
# Sau khi deploy xong (2-3 phút), lấy:
- IP Address: 123.456.789.012
- Username: root
- Password: (xem trong email hoặc dashboard)
```

### 2. Chuẩn bị API Keys

#### 2.1. Telegram Bot Token

```bash
# Mở Telegram Desktop/Mobile
1. Tìm @BotFather
2. Gửi: /newbot
3. Tên bot:    
4. Username: your_unique_bnb_bot (phải unique)
5. Copy token: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### 2.2. Cloudflare AI Gateway

```bash
# Truy cập Cloudflare Dashboard
1. Đăng nhập: https://dash.cloudflare.com/
2. Vào: AI → AI Gateway
3. Click: "Create Gateway"
4. Gateway name: bnb-prediction
5. Click: "Create"
6. Copy:
   - Account ID: abc123def456ghi789
   - Gateway ID: bnb-prediction
```

#### 2.3. Google AI Studio API Key

```bash
# Truy cập Google AI Studio
1. Đăng nhập: https://aistudio.google.com/
2. Click: "Get API Key"
3. Click: "Create API Key"
4. Chọn project hoặc tạo mới
5. Copy key: AIzaSyABC123DEF456GHI789JKL012MNO345PQR
```

---

## 🚀 Deploy Tự Động (Khuyến nghị)

### Phương pháp 1: Script tự động hoàn toàn

```bash
# Bước 1: SSH vào VPS
ssh root@YOUR_VPS_IP

# Bước 2: Download và chạy script
curl -fsSL https://raw.githubusercontent.com/yourusername/bnb-prediction-bot/main/scripts/auto-deploy.sh | bash
```

Script sẽ tự động:
- ✅ Update system
- ✅ Cài đặt Node.js, Bun, PM2
- ✅ Clone repository
- ✅ Cài đặt dependencies
- ✅ Setup environment
- ✅ Build project
- ✅ Start bot với PM2
- ✅ Setup auto-restart
- ✅ Configure firewall

### Phương pháp 2: Script từng bước

```bash
# Bước 1: SSH vào VPS
ssh root@YOUR_VPS_IP

# Bước 2: Download repository
git clone https://github.com/yourusername/bnb-prediction-bot.git
cd bnb-prediction-bot

# Bước 3: Chạy script setup
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh

# Bước 4: Cấu hình .env
nano .env
# Điền các thông tin API keys

# Bước 5: Deploy
chmod +x scripts/deploy-bot.sh
./scripts/deploy-bot.sh
```

---

## 🔧 Deploy Thủ Công

### Bước 1: Kết nối SSH

```bash
# Từ máy local
ssh root@YOUR_VPS_IP

# Nhập password khi được hỏi
# Khuyến nghị: Setup SSH key để bảo mật hơn
```

### Bước 2: Update System

```bash
# Update package list
apt-get update

# Upgrade packages
apt-get upgrade -y

# Install essential tools
apt-get install -y curl git build-essential
```

### Bước 3: Cài đặt Node.js 20

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Bước 4: Cài đặt Bun

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add to PATH
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Add to .bashrc for persistence
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
bun --version  # Should show 1.x.x
```

### Bước 5: Cài đặt PM2

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Bước 6: Clone Repository

```bash
# Create app directory
mkdir -p /opt/bnb-prediction-bot
cd /opt/bnb-prediction-bot

# Clone repository
git clone https://github.com/yourusername/bnb-prediction-bot.git .

# Or if using SSH
# git clone git@github.com:yourusername/bnb-prediction-bot.git .
```

### Bước 7: Cài đặt Dependencies

```bash
# Install dependencies with Bun
bun install

# This will install all packages from package.json
```

### Bước 8: Cấu hình Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env
```

Điền các thông tin sau:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Cloudflare AI Gateway Configuration
CLOUDFLARE_ACCOUNT_ID=abc123def456ghi789
CLOUDFLARE_GATEWAY_ID=bnb-prediction
GOOGLE_AI_STUDIO_API_KEY=AIzaSyABC123DEF456GHI789JKL012MNO345PQR

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Prediction Settings
PREDICTION_INTERVAL_MINUTES=5
ANALYSIS_LOOKBACK_HOURS=24
```

**Lưu file**: `Ctrl + X` → `Y` → `Enter`

### Bước 9: Build Project

```bash
# Build TypeScript to JavaScript
bun run build

# Verify build
ls -la dist/
# Should see compiled .js files
```

### Bước 10: Start Bot với PM2

```bash
# Start bot
pm2 start ecosystem.config.cjs

# Check status
pm2 status

# View logs
pm2 logs bnb-prediction-bot

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup
# Copy and run the command shown
```

### Bước 11: Configure Firewall

```bash
# Install UFW if not installed
apt-get install -y ufw

# Allow SSH (IMPORTANT!)
ufw allow 22/tcp

# Allow HTTP/HTTPS (optional)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## ⚙️ Cấu hình Sau Deploy

### 1. Setup Log Rotation

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 2. Setup Monitoring

```bash
# View real-time monitoring
pm2 monit

# Setup web monitoring (optional)
pm2 plus
```

### 3. Setup Alerts (Optional)

```bash
# Install PM2 Telegram notifications
pm2 install pm2-telegram

# Configure
pm2 set pm2-telegram:token YOUR_TELEGRAM_BOT_TOKEN
pm2 set pm2-telegram:chat_id YOUR_CHAT_ID
```

### 4. Setup Backup

```bash
# Create backup script
cat > /root/backup-bot.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/bot-backup-$DATE.tar.gz /opt/bnb-prediction-bot/.env
# Keep only last 7 backups
ls -t $BACKUP_DIR/bot-backup-*.tar.gz | tail -n +8 | xargs rm -f
EOF

chmod +x /root/backup-bot.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-bot.sh") | crontab -
```

---

## 🔍 Kiểm tra và Monitoring

### 1. Kiểm tra Bot hoạt động

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs bnb-prediction-bot --lines 50

# Check if bot is responding
# Mở Telegram và gửi /start cho bot
```

### 2. Test các chức năng

```bash
# Trong Telegram, test các lệnh:
/start      # Xem welcome message
/predict    # Test prediction
/market     # Test market data
/help       # Xem help
/about      # Xem about
```

### 3. Monitor Resources

```bash
# Check CPU and Memory
pm2 monit

# Check system resources
htop

# Check disk space
df -h

# Check network
netstat -tulpn | grep node
```

### 4. Check Logs

```bash
# PM2 logs
pm2 logs bnb-prediction-bot

# Application logs
tail -f /opt/bnb-prediction-bot/logs/combined.log
tail -f /opt/bnb-prediction-bot/logs/error.log

# System logs
journalctl -u pm2-root -f
```

---

## 🐛 Troubleshooting

### Bot không start

```bash
# Check logs
pm2 logs bnb-prediction-bot --err

# Check .env file
cat /opt/bnb-prediction-bot/.env

# Verify all required env vars are set
grep -E "TELEGRAM_BOT_TOKEN|CLOUDFLARE|GOOGLE" .env

# Try manual start
cd /opt/bnb-prediction-bot
bun run build
bun start
```

### Lỗi "Missing required environment variables"

```bash
# Edit .env
nano /opt/bnb-prediction-bot/.env

# Ensure all required variables are set:
# - TELEGRAM_BOT_TOKEN
# - CLOUDFLARE_ACCOUNT_ID
# - CLOUDFLARE_GATEWAY_ID
# - GOOGLE_AI_STUDIO_API_KEY

# Restart bot
pm2 restart bnb-prediction-bot
```

### Lỗi kết nối Binance API

```bash
# Test connection
curl https://api.binance.com/api/v3/ping

# If blocked, check firewall
ufw status

# Check if VPS IP is blocked by Binance
# Try using a VPN or different VPS location
```

### Lỗi Cloudflare AI Gateway

```bash
# Test API key
curl -X POST https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/compat/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"google-ai-studio/gemini-2.5-flash-preview-09-2025","messages":[{"role":"user","content":"test"}]}'

# Check credentials in .env
# Verify Account ID and Gateway ID are correct
```

### Bot bị crash

```bash
# Check error logs
pm2 logs bnb-prediction-bot --err --lines 100

# Restart bot
pm2 restart bnb-prediction-bot

# If keeps crashing, check memory
free -h

# Increase memory limit in ecosystem.config.cjs
nano ecosystem.config.cjs
# Change: max_memory_restart: '1G'

pm2 restart bnb-prediction-bot
```

### High memory usage

```bash
# Check memory
pm2 monit

# Restart bot to clear memory
pm2 restart bnb-prediction-bot

# Add memory limit
pm2 restart bnb-prediction-bot --max-memory-restart 500M
pm2 save
```

---

## 🔄 Update Bot

### Update code

```bash
cd /opt/bnb-prediction-bot

# Pull latest changes
git pull origin main

# Install new dependencies
bun install

# Rebuild
bun run build

# Restart bot
pm2 restart bnb-prediction-bot

# Check logs
pm2 logs bnb-prediction-bot
```

### Update dependencies

```bash
cd /opt/bnb-prediction-bot

# Update all dependencies
bun update

# Rebuild
bun run build

# Restart
pm2 restart bnb-prediction-bot
```

---

## 🗑️ Uninstall

```bash
# Stop and delete bot
pm2 stop bnb-prediction-bot
pm2 delete bnb-prediction-bot
pm2 save

# Remove files
rm -rf /opt/bnb-prediction-bot

# Remove PM2 startup
pm2 unstartup

# Optional: Remove Node.js, Bun, PM2
apt-get remove -y nodejs
rm -rf ~/.bun
npm uninstall -g pm2
```

---

## 📞 Support

Nếu gặp vấn đề:

1. **Check logs**: `pm2 logs bnb-prediction-bot`
2. **Check status**: `pm2 status`
3. **Restart bot**: `pm2 restart bnb-prediction-bot`
4. **Create issue**: https://github.com/yourusername/bnb-prediction-bot/issues
5. **Contact admin**: @your_telegram

---

## 📚 Tài liệu liên quan

- [README.md](./README.md) - Tổng quan dự án
- [QUICKSTART.md](./QUICKSTART.md) - Bắt đầu nhanh
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API docs
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Đóng góp

---

**Chúc bạn deploy thành công! 🚀**

