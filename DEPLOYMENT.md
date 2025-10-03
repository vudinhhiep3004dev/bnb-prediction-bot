# Hướng dẫn Deploy lên Vultr VPS

## Yêu cầu

- VPS Ubuntu 22.04 LTS
- Tối thiểu 1GB RAM
- 10GB disk space
- Root access

## Bước 1: Tạo VPS trên Vultr

1. Đăng nhập vào [Vultr](https://www.vultr.com/)
2. Click "Deploy New Server"
3. Chọn:
   - **Server Type**: Cloud Compute
   - **Location**: Gần bạn nhất (Singapore cho VN)
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: $6/month (1GB RAM)
4. Thêm SSH key (khuyến nghị) hoặc dùng password
5. Deploy server

## Bước 2: Kết nối SSH

```bash
ssh root@your-server-ip
```

## Bước 3: Chuẩn bị môi trường

### Tự động (Khuyến nghị)

```bash
# Download và chạy script deploy
curl -fsSL https://raw.githubusercontent.com/yourusername/bnb-prediction-bot/main/deploy.sh -o deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

### Thủ công

#### 3.1. Update system

```bash
apt-get update
apt-get upgrade -y
```

#### 3.2. Cài đặt Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

#### 3.3. Cài đặt Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### 3.4. Cài đặt PM2

```bash
npm install -g pm2
```

## Bước 4: Clone và Setup Project

```bash
# Tạo thư mục
mkdir -p /opt/bnb-prediction-bot
cd /opt/bnb-prediction-bot

# Clone repository
git clone https://github.com/yourusername/bnb-prediction-bot.git .

# Cài đặt dependencies
bun install

# Tạo file .env
cp .env.example .env
nano .env
```

## Bước 5: Cấu hình Environment Variables

Chỉnh sửa file `.env`:

```env
# Telegram Bot Token từ @BotFather
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Cloudflare AI Gateway
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_GATEWAY_ID=your_gateway_id
GOOGLE_AI_STUDIO_API_KEY=your_api_key

# Application
NODE_ENV=production
LOG_LEVEL=info
```

### Lấy Telegram Bot Token

1. Mở Telegram, tìm [@BotFather](https://t.me/botfather)
2. Gửi `/newbot`
3. Đặt tên bot
4. Đặt username (phải kết thúc bằng `bot`)
5. Copy token

### Lấy Cloudflare AI Gateway credentials

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vào **AI** > **AI Gateway**
3. Click **Create Gateway**
4. Đặt tên gateway
5. Copy **Account ID** và **Gateway ID**

### Lấy Google AI Studio API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API Key**
3. Tạo API key mới
4. Copy key

## Bước 6: Build và Deploy

```bash
# Build project
bun run build

# Start với PM2
pm2 start ecosystem.config.cjs

# Lưu cấu hình PM2
pm2 save

# Tự động khởi động khi reboot
pm2 startup
# Copy và chạy lệnh được hiển thị
```

## Bước 7: Kiểm tra

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs bnb-prediction-bot

# Monitor
pm2 monit
```

## Bước 8: Test Bot

1. Mở Telegram
2. Tìm bot của bạn
3. Gửi `/start`
4. Thử `/predict`

## Quản lý Bot

### Xem logs

```bash
pm2 logs bnb-prediction-bot
pm2 logs bnb-prediction-bot --lines 100
```

### Restart bot

```bash
pm2 restart bnb-prediction-bot
```

### Stop bot

```bash
pm2 stop bnb-prediction-bot
```

### Delete bot

```bash
pm2 delete bnb-prediction-bot
```

### Update code

```bash
cd /opt/bnb-prediction-bot
git pull
bun install
bun run build
pm2 restart bnb-prediction-bot
```

## Bảo mật

### Firewall

```bash
# Cài đặt UFW
apt-get install ufw

# Cho phép SSH
ufw allow 22/tcp

# Cho phép HTTP/HTTPS (nếu cần)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Tạo user riêng (khuyến nghị)

```bash
# Tạo user
adduser botuser

# Thêm vào sudo group
usermod -aG sudo botuser

# Chuyển ownership
chown -R botuser:botuser /opt/bnb-prediction-bot

# Switch user
su - botuser
```

## Monitoring

### Setup log rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Setup alerts (optional)

```bash
# Cài đặt pm2-slack hoặc pm2-telegram
pm2 install pm2-telegram
pm2 set pm2-telegram:token YOUR_TELEGRAM_BOT_TOKEN
pm2 set pm2-telegram:chat_id YOUR_CHAT_ID
```

## Troubleshooting

### Bot không start

```bash
# Kiểm tra logs
pm2 logs bnb-prediction-bot --err

# Kiểm tra .env
cat .env

# Test build
bun run build
```

### Lỗi kết nối API

```bash
# Test Binance API
curl https://api.binance.com/api/v3/ping

# Test Cloudflare
curl https://gateway.ai.cloudflare.com/
```

### Memory issues

```bash
# Tăng memory limit trong ecosystem.config.cjs
max_memory_restart: '1G'

# Restart
pm2 restart bnb-prediction-bot
```

## Backup

### Backup configuration

```bash
# Backup .env
cp .env .env.backup

# Backup toàn bộ
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/bnb-prediction-bot
```

## Chi phí ước tính

- **VPS Vultr**: $6/month (1GB RAM)
- **Cloudflare AI Gateway**: Free tier (có giới hạn)
- **Google AI Studio**: Free tier (có giới hạn)
- **Binance API**: Free

**Tổng**: ~$6/month

## Support

Nếu gặp vấn đề:

1. Kiểm tra logs: `pm2 logs`
2. Kiểm tra status: `pm2 status`
3. Xem issues trên GitHub
4. Liên hệ admin

## Cập nhật

Để cập nhật bot lên phiên bản mới:

```bash
cd /opt/bnb-prediction-bot
git pull
bun install
bun run build
pm2 restart bnb-prediction-bot
```

