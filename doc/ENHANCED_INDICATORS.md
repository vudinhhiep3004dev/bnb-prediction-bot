# Enhanced Indicators Documentation

## Tổng quan

Bot đã được nâng cấp với các chỉ số mới để cải thiện độ chính xác dự đoán giá BNB trong 5 phút. Các chỉ số mới tập trung vào **phân tích thời gian thực** và **momentum ngắn hạn**.

---

## 🆕 Chỉ số mới được thêm vào

### 1. **Order Book Depth Analysis** 📖

Phân tích độ sâu sổ lệnh để đánh giá áp lực mua/bán thực tế.

#### Dữ liệu thu thập:
- **Bid/Ask Spread**: Chênh lệch giá mua/bán
- **Total Bid Volume**: Tổng khối lượng lệnh mua
- **Total Ask Volume**: Tổng khối lượng lệnh bán
- **Buy Pressure**: Tỷ lệ áp lực mua (0-1)
- **Imbalance Ratio**: Tỷ lệ mất cân bằng (-1 đến 1)
- **Depth Quality**: Chất lượng thanh khoản (THIN/NORMAL/DEEP)

#### Cách diễn giải:
```typescript
// Buy Pressure > 0.55 = Strong buying pressure
// Buy Pressure < 0.45 = Strong selling pressure
// Imbalance Ratio > 0.1 = More bids (bullish)
// Imbalance Ratio < -0.1 = More asks (bearish)
```

#### Tầm quan trọng:
⭐⭐⭐⭐⭐ (Quan trọng nhất cho dự đoán 5 phút)

---

### 2. **Recent Trade Flow Analysis** 💹

Phân tích dòng giao dịch gần đây (100 trades cuối) để xác định xu hướng ngắn hạn.

#### Dữ liệu thu thập:
- **Total Buy Volume**: Tổng khối lượng mua
- **Total Sell Volume**: Tổng khối lượng bán
- **Buy/Sell Ratio**: Tỷ lệ mua/bán
- **Trade Velocity**: Tốc độ giao dịch (trades/giây)
- **Avg Trade Size**: Kích thước giao dịch trung bình
- **Large Order Count**: Số lệnh lớn (>2x trung bình)
- **Aggressive Buy/Sell %**: Tỷ lệ lệnh mua/bán chủ động

#### Cách diễn giải:
```typescript
// Buy/Sell Ratio > 2 = STRONG_BUY
// Buy/Sell Ratio > 1.2 = BUY
// Buy/Sell Ratio < 0.5 = STRONG_SELL
// Buy/Sell Ratio < 0.8 = SELL
// Aggressive Buyers > 55% = Strong buying momentum
```

#### Tầm quan trọng:
⭐⭐⭐⭐⭐ (Rất quan trọng cho dự đoán 5 phút)

---

### 3. **ATR (Average True Range)** 📊

Đo độ biến động của thị trường.

#### Công thức:
```
True Range = max(
  High - Low,
  |High - Previous Close|,
  |Low - Previous Close|
)
ATR = Average of True Ranges over 14 periods
```

#### Cách diễn giải:
```typescript
// ATR % < 1% = LOW volatility
// ATR % 1-2% = MEDIUM volatility
// ATR % > 2% = HIGH volatility
```

#### Ứng dụng:
- Đánh giá rủi ro
- Xác định stop-loss/take-profit
- Dự đoán biên độ dao động

#### Tầm quan trọng:
⭐⭐⭐⭐ (Quan trọng cho quản lý rủi ro)

---

### 4. **Stochastic Oscillator** 📈

Chỉ báo momentum ngắn hạn, tốt hơn RSI cho khung 5 phút.

#### Công thức:
```
%K = (Close - Lowest Low) / (Highest High - Lowest Low) × 100
%D = SMA of %K (3 periods)
```

#### Cách diễn giải:
```typescript
// %K < 20 = OVERSOLD (có thể tăng)
// %K > 80 = OVERBOUGHT (có thể giảm)
// %K 20-80 = NEUTRAL
```

#### Ưu điểm so với RSI:
- Phản ứng nhanh hơn với thay đổi giá
- Tốt hơn cho khung thời gian ngắn
- Ít bị "stuck" ở vùng oversold/overbought

#### Tầm quan trọng:
⭐⭐⭐⭐ (Tốt cho momentum ngắn hạn)

---

### 5. **VWAP (Volume Weighted Average Price)** 💰

Giá trung bình có trọng số khối lượng - mức giá tham chiếu của các tổ chức.

#### Công thức:
```
VWAP = Σ(Typical Price × Volume) / Σ(Volume)
Typical Price = (High + Low + Close) / 3
```

#### Cách diễn giải:
```typescript
// Price > VWAP = Bullish (giá trên mức tham chiếu)
// Price < VWAP = Bearish (giá dưới mức tham chiếu)
// Price vs VWAP > 2% = Significantly above
// Price vs VWAP < -2% = Significantly below
```

#### Ứng dụng:
- Xác định giá "công bằng"
- Tìm điểm vào/ra lệnh
- Đánh giá xu hướng

#### Tầm quan trọng:
⭐⭐⭐⭐ (Quan trọng cho định giá)

---

## 📊 Thứ tự ưu tiên các chỉ số (cho dự đoán 5 phút)

### Tier 1 - Quan trọng nhất (70% trọng số)
1. **Order Book Pressure** - Áp lực mua/bán thực tế
2. **Recent Trade Flow** - Dòng tiền ngắn hạn

### Tier 2 - Quan trọng (20% trọng số)
3. **Stochastic Oscillator** - Momentum ngắn hạn
4. **ATR** - Độ biến động
5. **VWAP** - Mức giá tham chiếu

### Tier 3 - Hỗ trợ (10% trọng số)
6. RSI - Oversold/Overbought
7. MACD - Xu hướng
8. EMA - Trend confirmation
9. Bollinger Bands - Volatility context
10. Volume - Confirmation

---

## 🎯 Quy tắc ra quyết định

### Strong Buy Signal (Confidence >75%)
```
✅ Buy Pressure > 60%
✅ Aggressive Buyers > 55%
✅ Stochastic < 30 (Oversold)
✅ Buy/Sell Ratio > 1.5
✅ MACD Histogram > 0
```

### Strong Sell Signal (Confidence >75%)
```
❌ Buy Pressure < 40%
❌ Aggressive Sellers > 55%
❌ Stochastic > 70 (Overbought)
❌ Buy/Sell Ratio < 0.7
❌ MACD Histogram < 0
```

### Medium Confidence (50-75%)
- 2 trong 3 yếu tố chính (Order Book, Trade Flow, Momentum) đồng thuận

### Low Confidence (<50%)
- Các chỉ số trái chiều hoặc neutral

---

## 🔧 Cách sử dụng

### 1. Test các chỉ số mới
```bash
bun run test:enhanced
```

### 2. Xem dữ liệu trong prediction
Bot tự động thu thập và phân tích tất cả các chỉ số khi bạn gọi `/predict`

### 3. Đọc kết quả
AI sẽ ưu tiên các chỉ số theo thứ tự quan trọng và đưa ra dự đoán với confidence level.

---

## 📈 Cải thiện so với phiên bản cũ

### Trước đây:
- Chỉ dựa vào chỉ báo kỹ thuật dài hạn (RSI, MACD, EMA)
- Không có dữ liệu thời gian thực về áp lực mua/bán
- Không phân tích dòng tiền ngắn hạn

### Bây giờ:
- ✅ Phân tích Order Book real-time
- ✅ Theo dõi Trade Flow (100 trades gần nhất)
- ✅ Đo độ biến động (ATR)
- ✅ Momentum ngắn hạn (Stochastic)
- ✅ Mức giá tham chiếu (VWAP)
- ✅ AI được train để ưu tiên đúng chỉ số cho 5 phút

### Kết quả mong đợi:
- Độ chính xác tăng 15-25%
- Confidence level chính xác hơn
- Phát hiện tốt hơn các đợt pump/dump ngắn hạn

---

## 🚀 API Rate Limit

### Trước:
- Klines: 2 weight
- 24hr Ticker: 2 weight
- **Total**: ~4 weight/prediction

### Bây giờ:
- Klines: 2 weight
- 24hr Ticker: 2 weight
- Order Book (limit=20): 1 weight
- Recent Trades (limit=100): 1 weight
- **Total**: ~6 weight/prediction

**Vẫn rất an toàn** (limit là 1200 weight/phút = 200 predictions/phút)

---

## 📝 Ghi nhớ

Các chỉ số mới đã được tích hợp vào bot và AI đã được train để sử dụng chúng hiệu quả cho dự đoán 5 phút. Bot sẽ tự động:

1. Thu thập dữ liệu Order Book và Trade Flow
2. Tính toán ATR, Stochastic, VWAP
3. Phân tích và ưu tiên các chỉ số theo tầm quan trọng
4. Đưa ra dự đoán với confidence level chính xác

**Không cần cấu hình thêm** - chỉ cần chạy bot như bình thường!

