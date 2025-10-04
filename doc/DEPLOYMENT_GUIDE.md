# 🚀 Hướng dẫn Deploy Bot lên Server

## 📋 Tổng quan

Có 3 cách để deploy bot lên server sau khi có thay đổi:

1. **Manual Deploy** - Chạy từng lệnh (cơ bản)
2. **Script Deploy** - Sử dụng script tự động (khuyến nghị)
3. **Remote Deploy** - Deploy trực tiếp từ local (nâng cao)

---

## 🎯 Cách 1: Manual Deploy (Cơ bản)

### **Bước 1: Trên Local Machine**

```bash
# 1. Kiểm tra thay đổi
git status

# 2. Add tất cả files
git add -A

# 3. Commit với message mô tả
git commit -m "feat: your feature description"

# 4. Push lên GitHub
git push origin main
```

### **Bước 2: Trên Server**

```bash
# 1. SSH vào server
ssh root@your-server-ip

# 2. Di chuyển vào thư mục bot
cd /root/bnb-prediction-bot

# 3. Stash local changes (nếu có)
git stash

# 4. Pull code mới
git pull origin main

# 5. Install dependencies
bun install

# 6. Build project
bun run build

# 7. Restart bot
pm2 restart bnb-prediction-bot

# 8. Kiểm tra logs
pm2 logs bnb-prediction-bot --lines 20
```

### **Bước 3: Verify**

```bash
# Kiểm tra status
pm2 status

# Test bot
# Gửi /predict trong Telegram
```

---

## 🚀 Cách 2: Script Deploy (Khuyến nghị)

### **Setup lần đầu:**

```bash
# Trên local
chmod +x scripts/deploy.sh
chmod +x scripts/update-bot.sh

# Push scripts lên GitHub
git add scripts/*.sh
git commit -m "chore: add deploy scripts"
git push origin main

# Trên server: pull scripts
ssh root@your-server-ip
cd /root/bnb-prediction-bot
git pull origin main
chmod +x scripts/*.sh
```

### **Deploy thường xuyên:**

#### **Trên Local:**

```bash
# Chạy script deploy với commit message
./scripts/deploy.sh "feat: add new feature"
```

Script sẽ tự động:
- ✅ Check git status
- ✅ Run tests
- ✅ Build project
- ✅ Commit changes
- ✅ Push to GitHub

#### **Trên Server:**

```bash
# SSH vào server
ssh root@your-server-ip

# Chạy update script
cd /root/bnb-prediction-bot
./scripts/update-bot.sh
```

Script sẽ tự động:
- ✅ Backup .env
- ✅ Stash local changes
- ✅ Pull latest code
- ✅ Restore changes
- ✅ Install dependencies
- ✅ Build project
- ✅ Restart PM2
- ✅ Show status & logs

---

## 🎯 Cách 3: Remote Deploy (Nâng cao)

Deploy trực tiếp từ local machine đến server qua SSH.

### **Setup lần đầu:**

```bash
# 1. Setup SSH key (nếu chưa có)
ssh-keygen -t rsa -b 4096
ssh-copy-id root@your-server-ip

# 2. Test SSH connection
ssh root@your-server-ip "echo 'Connected'"

# 3. Chmod deploy script
chmod +x scripts/deploy-remote.sh
```

### **Deploy:**

```bash
# Chạy một lệnh duy nhất
./scripts/deploy-remote.sh your-server-ip
```

Script sẽ tự động:
- ✅ Test SSH connection
- ✅ Run update script trên server
- ✅ Show bot status
- ✅ Show recent logs

---

## 📊 So sánh các phương pháp

| Phương pháp | Độ khó | Tốc độ | Tự động | Khuyến nghị |
|-------------|--------|--------|---------|-------------|
| Manual | ⭐ | Chậm | ❌ | Người mới |
| Script Deploy | ⭐⭐ | Trung bình | ✅ | ⭐ Khuyến nghị |
| Remote Deploy | ⭐⭐⭐ | Nhanh | ✅✅ | Nâng cao |

---

## 🔄 Workflow Deploy Chuẩn

### **1. Development (Local)**

```bash
# Code your changes
# ...

# Test locally
bun run test:hybrid
bun run build

# Commit & push
git add -A
git commit -m "feat: your changes"
git push origin main
```

### **2. Deployment (Server)**

```bash
# SSH to server
ssh root@your-server-ip

# Update bot
cd /root/bnb-prediction-bot
./scripts/update-bot.sh

# Verify
pm2 status
pm2 logs bnb-prediction-bot
```

### **3. Testing (Telegram)**

```
/predict  # Test prediction
/start    # Test bot response
```

---

## 🛡️ Best Practices

### **1. Luôn test trước khi deploy**

```bash
# Trên local
bun run test:hybrid
bun run build
```

### **2. Commit message rõ ràng**

```bash
# ✅ Good
git commit -m "feat: add Chainlink price integration"
git commit -m "fix: resolve BigInt conversion error"
git commit -m "docs: update deployment guide"

# ❌ Bad
git commit -m "update"
git commit -m "fix bug"
```

### **3. Backup trước khi deploy**

```bash
# Trên server
cd /root/bnb-prediction-bot
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### **4. Kiểm tra logs sau deploy**

```bash
pm2 logs bnb-prediction-bot --lines 50
```

### **5. Monitor bot status**

```bash
pm2 monit
# Hoặc
pm2 status
```

---

## 🆘 Troubleshooting

### **Lỗi: Git conflict**

```bash
# Xem hướng dẫn chi tiết
cat doc/FIX_UPDATE_CONFLICT.md

# Hoặc quick fix
git stash
git pull origin main
bun install
bun run build
pm2 restart bnb-prediction-bot
```

### **Lỗi: Build failed**

```bash
# Xóa node_modules và rebuild
rm -rf node_modules
bun install
bun run build
```

### **Lỗi: PM2 not responding**

```bash
# Restart PM2
pm2 restart bnb-prediction-bot

# Hoặc reload
pm2 reload bnb-prediction-bot

# Hoặc stop & start
pm2 stop bnb-prediction-bot
pm2 start bnb-prediction-bot
```

### **Lỗi: Bot không response**

```bash
# Kiểm tra logs
pm2 logs bnb-prediction-bot --lines 100

# Kiểm tra .env
cat .env

# Restart bot
pm2 restart bnb-prediction-bot
```

---

## 📝 Checklist Deploy

Trước khi deploy:
- [ ] Code đã test trên local
- [ ] Build thành công
- [ ] Tests pass
- [ ] Commit message rõ ràng
- [ ] Push lên GitHub thành công

Sau khi deploy:
- [ ] Bot status "online"
- [ ] Logs không có lỗi
- [ ] Test /predict command
- [ ] Hybrid price system hoạt động
- [ ] Round monitoring hoạt động

---

## 🔧 Scripts Reference

### **deploy.sh**
```bash
./scripts/deploy.sh "commit message"
```
- Commit & push changes từ local
- Run tests
- Build project
- Show deploy instructions

### **update-bot.sh**
```bash
./scripts/update-bot.sh
```
- Pull latest code
- Install dependencies
- Build project
- Restart PM2

### **deploy-remote.sh**
```bash
./scripts/deploy-remote.sh your-server-ip
```
- Deploy trực tiếp từ local đến server
- Test SSH connection
- Run update script
- Show status & logs

### **fix-update-conflict.sh**
```bash
./scripts/fix-update-conflict.sh
```
- Fix git conflicts
- Stash & restore changes
- Reinstall dependencies
- Rebuild project

---

## 📚 Related Documentation

- [FIX_UPDATE_CONFLICT.md](./FIX_UPDATE_CONFLICT.md) - Fix git conflicts
- [QUICK_FIX_SERVER.md](./QUICK_FIX_SERVER.md) - Quick fix guide
- [HYBRID_PRICE_SYSTEM.md](./HYBRID_PRICE_SYSTEM.md) - Hybrid price system

---

## 💡 Tips

### **1. Alias cho deploy nhanh**

Thêm vào `~/.bashrc` hoặc `~/.zshrc`:

```bash
alias deploy-bot='./scripts/deploy.sh'
alias update-bot='ssh root@your-server-ip "cd /root/bnb-prediction-bot && ./scripts/update-bot.sh"'
```

Sau đó:
```bash
deploy-bot "feat: new feature"
update-bot
```

### **2. Watch logs real-time**

```bash
pm2 logs bnb-prediction-bot --lines 100 --raw
```

### **3. Monitor bot performance**

```bash
pm2 monit
```

---

**Cập nhật**: 2025-10-04  
**Version**: 2.1.0

