# 🔧 Hướng dẫn Fix Lỗi Update Conflict

## ❌ Lỗi gặp phải:

```bash
error: Your local changes to the following files would be overwritten by merge:
        bun.lock
        scripts/update-bot.sh
Please commit your changes or stash them before you merge.
Aborting
```

## 🎯 Nguyên nhân:

Trên server có những thay đổi local (ví dụ: `bun.lock` sau khi chạy `bun install`) chưa được commit, và khi pull code mới từ GitHub sẽ gây conflict.

---

## ✅ Giải pháp 1: Sử dụng Script Tự động (Khuyến nghị)

### Bước 1: SSH vào server
```bash
ssh root@your-server-ip
cd /root/bnb-prediction-bot
```

### Bước 2: Pull script mới nhất
```bash
# Stash local changes tạm thời
git stash

# Pull code mới
git pull origin main

# Restore changes (nếu cần)
git stash pop
```

### Bước 3: Chạy script fix
```bash
chmod +x scripts/fix-update-conflict.sh
./scripts/fix-update-conflict.sh
```

Script sẽ tự động:
- ✅ Stash local changes
- ✅ Pull latest code
- ✅ Restore changes (nếu không conflict)
- ✅ Reinstall dependencies
- ✅ Rebuild project

### Bước 4: Restart bot
```bash
pm2 restart bnb-prediction-bot
pm2 logs bnb-prediction-bot
```

---

## ✅ Giải pháp 2: Fix Thủ công

### Bước 1: SSH vào server
```bash
ssh root@your-server-ip
cd /root/bnb-prediction-bot
```

### Bước 2: Kiểm tra status
```bash
git status
```

### Bước 3: Stash local changes
```bash
# Lưu tất cả thay đổi local vào stash
git stash push -m "Backup before update $(date +%Y%m%d_%H%M%S)"

# Kiểm tra stash đã lưu
git stash list
```

### Bước 4: Pull code mới
```bash
git pull origin main
```

### Bước 5: Restore changes (nếu cần)
```bash
# Xem nội dung stash
git stash show -p stash@{0}

# Apply stash (nếu cần giữ lại thay đổi)
git stash pop

# Hoặc bỏ qua stash (nếu không cần)
git stash drop
```

### Bước 6: Reinstall dependencies
```bash
bun install
```

### Bước 7: Rebuild
```bash
bun run build
```

### Bước 8: Restart bot
```bash
pm2 restart bnb-prediction-bot
pm2 logs bnb-prediction-bot
```

---

## ✅ Giải pháp 3: Reset Hoàn toàn (Cẩn thận!)

⚠️ **Cảnh báo**: Giải pháp này sẽ XÓA TẤT CẢ thay đổi local!

### Bước 1: Backup .env
```bash
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### Bước 2: Reset hard
```bash
git fetch origin
git reset --hard origin/main
```

### Bước 3: Clean untracked files
```bash
git clean -fd
```

### Bước 4: Reinstall & Rebuild
```bash
bun install
bun run build
```

### Bước 5: Restore .env (nếu bị mất)
```bash
cp .env.backup.* .env
```

### Bước 6: Restart bot
```bash
pm2 restart bnb-prediction-bot
```

---

## 🔍 Kiểm tra sau khi fix

### 1. Kiểm tra git status
```bash
git status
# Kết quả mong đợi: "nothing to commit, working tree clean"
```

### 2. Kiểm tra bot status
```bash
pm2 status bnb-prediction-bot
# Kết quả mong đợi: status "online"
```

### 3. Kiểm tra logs
```bash
pm2 logs bnb-prediction-bot --lines 50
# Kiểm tra không có lỗi
```

### 4. Test bot
```bash
# Gửi /predict trong Telegram để test
```

---

## 🛡️ Phòng tránh lỗi trong tương lai

### 1. Không chỉnh sửa code trực tiếp trên server
- ❌ Không edit files trên server
- ✅ Edit trên local, commit, push, rồi pull trên server

### 2. Sử dụng script update đã được cải thiện
```bash
./scripts/update-bot.sh
```

Script mới đã có logic tự động stash/restore changes.

### 3. Backup thường xuyên
```bash
# Backup .env
cp .env .env.backup

# Backup database (nếu có)
# ...
```

---

## 📝 Các lệnh Git hữu ích

### Xem thay đổi local
```bash
git diff
```

### Xem files đã thay đổi
```bash
git status
```

### Xem stash list
```bash
git stash list
```

### Xem nội dung stash
```bash
git stash show -p stash@{0}
```

### Apply stash cụ thể
```bash
git stash apply stash@{0}
```

### Xóa stash
```bash
git stash drop stash@{0}
```

### Xóa tất cả stash
```bash
git stash clear
```

---

## 🆘 Nếu vẫn gặp vấn đề

### 1. Kiểm tra logs chi tiết
```bash
pm2 logs bnb-prediction-bot --lines 100
```

### 2. Kiểm tra git log
```bash
git log --oneline -10
```

### 3. Kiểm tra remote
```bash
git remote -v
git fetch origin
git status
```

### 4. Liên hệ support
- Gửi output của các lệnh trên
- Mô tả chi tiết lỗi gặp phải

---

## ✅ Checklist sau khi fix

- [ ] Git status clean
- [ ] Bot status online
- [ ] Logs không có lỗi
- [ ] Test /predict command thành công
- [ ] Hybrid price system hoạt động (Chainlink + Binance)
- [ ] Round monitoring hoạt động

---

**Cập nhật**: 2025-10-04  
**Version**: 2.1.0

