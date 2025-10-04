# ⚡ Quick Fix - Update Conflict trên Server

## 🚀 Cách nhanh nhất (Copy & Paste)

SSH vào server và chạy các lệnh sau:

```bash
# 1. Di chuyển vào thư mục bot
cd /root/bnb-prediction-bot

# 2. Stash local changes
git stash push -m "Backup $(date +%Y%m%d_%H%M%S)"

# 3. Pull code mới
git pull origin main

# 4. Reinstall dependencies
bun install

# 5. Rebuild
bun run build

# 6. Restart bot
pm2 restart bnb-prediction-bot

# 7. Kiểm tra logs
pm2 logs bnb-prediction-bot --lines 20
```

## ✅ Kiểm tra thành công

Sau khi chạy xong, kiểm tra:

1. **Bot status**: `pm2 status` → Phải thấy "online"
2. **Logs**: `pm2 logs bnb-prediction-bot` → Không có lỗi
3. **Test**: Gửi `/predict` trong Telegram

## 🎯 Kết quả mong đợi

Khi chạy `/predict`, bạn sẽ thấy:

```
🎯 DỰ ĐOÁN GIÁ BNB - 5 PHÚT TỚI

🎯 Dự đoán: 📈 TĂNG (UP)
💯 Độ tin cậy: 75.5%
⚠️ Mức độ rủi ro: Trung bình

💰 Giá hiện tại: $1173.18
🔗 Nguồn giá: Chainlink Oracle (100%)  ← MỚI!
🎯 Giá dự kiến: 🟢 $1174.50
🟢 Thay đổi dự kiến: +0.11%

🎲 Vòng hiện tại: #418319  ← MỚI!
⏱️ Thời gian còn lại: 0:51  ← MỚI!
```

## 🆘 Nếu vẫn lỗi

Chạy lệnh này để reset hoàn toàn (⚠️ Cẩn thận!):

```bash
cd /root/bnb-prediction-bot
cp .env .env.backup
git fetch origin
git reset --hard origin/main
git clean -fd
bun install
bun run build
pm2 restart bnb-prediction-bot
```

---

**Xem chi tiết**: [FIX_UPDATE_CONFLICT.md](./FIX_UPDATE_CONFLICT.md)

