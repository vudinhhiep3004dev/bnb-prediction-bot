# 🚀 Quick Deploy Guide

## 📦 Mỗi lần có thay đổi, deploy như sau:

### **Cách 1: Manual (Đơn giản nhất)**

#### Trên Local:
```bash
git add -A
git commit -m "feat: your changes"
git push origin main
```

#### Trên Server:
```bash
ssh root@your-server-ip
cd /root/bnb-prediction-bot
./scripts/update-bot.sh
```

---

### **Cách 2: Sử dụng Script (Khuyến nghị) ⭐**

#### Trên Local:
```bash
./scripts/deploy.sh "feat: your changes"
```

#### Trên Server:
```bash
ssh root@your-server-ip
cd /root/bnb-prediction-bot
./scripts/update-bot.sh
```

---

### **Cách 3: One Command (Nâng cao)**

Setup SSH key một lần:
```bash
ssh-keygen -t rsa
ssh-copy-id root@your-server-ip
```

Sau đó mỗi lần deploy:
```bash
./scripts/deploy-remote.sh your-server-ip
```

---

## 🆘 Nếu gặp lỗi Git Conflict

```bash
# Trên server
cd /root/bnb-prediction-bot
git stash
git pull origin main
bun install
bun run build
pm2 restart bnb-prediction-bot
```

---

## ✅ Verify Deploy thành công

```bash
# Kiểm tra status
pm2 status

# Xem logs
pm2 logs bnb-prediction-bot --lines 20

# Test bot
# Gửi /predict trong Telegram
```

---

## 📚 Chi tiết

Xem hướng dẫn đầy đủ tại: [doc/DEPLOYMENT_GUIDE.md](./doc/DEPLOYMENT_GUIDE.md)

---

**Quick Links:**
- [Deployment Guide](./doc/DEPLOYMENT_GUIDE.md) - Hướng dẫn deploy đầy đủ
- [Fix Update Conflict](./doc/FIX_UPDATE_CONFLICT.md) - Fix lỗi git conflict
- [Quick Fix Server](./doc/QUICK_FIX_SERVER.md) - Quick fix guide
- [Hybrid Price System](./doc/HYBRID_PRICE_SYSTEM.md) - Chi tiết hệ thống v2.1.0

