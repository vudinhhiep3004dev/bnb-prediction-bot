# 🔗 Hybrid Price System - Phương án 3

## 📋 Tổng quan

Hệ thống **Hybrid Price** kết hợp giá từ **Chainlink Oracle** (nguồn chính thức của PancakeSwap) và **Binance** (fallback) để giải quyết vấn đề dự đoán Locked Price trong game PancakeSwap Prediction.

## 🎯 Vấn đề cần giải quyết

### Vấn đề gốc:
1. PancakeSwap Prediction sử dụng **Chainlink Oracle** để xác định Locked Price
2. Locked Price chỉ được set **SAU KHI** vòng mới bắt đầu (cập nhật mỗi ~20 giây)
3. Bot phải dự đoán **TRƯỚC KHI** vòng bắt đầu
4. Sử dụng giá Binance có thể sai lệch với Locked Price thực tế

### Giải pháp:
✅ Sử dụng **cùng nguồn giá** với PancakeSwap (Chainlink Oracle)  
✅ Fallback sang Binance nếu Chainlink không khả dụng  
✅ Điều chỉnh confidence dựa trên độ chênh lệch giá  
✅ Monitor timing của vòng để predict đúng thời điểm  

---

## 🏗️ Kiến trúc hệ thống

### 1. **ChainlinkService** (`src/services/chainlink.ts`)
- Kết nối với Chainlink BNB/USD Price Feed trên BSC
- Contract: `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE`
- Hỗ trợ multiple RPC endpoints với fallback
- Kiểm tra độ fresh của giá (< 60s)

**Chức năng chính:**
```typescript
getLatestPrice(): Promise<ChainlinkPriceData>
getPriceWithRetry(maxRetries): Promise<ChainlinkPriceData | null>
isPriceFresh(maxAgeSeconds): Promise<boolean>
```

### 2. **RoundMonitorService** (`src/services/round-monitor.ts`)
- Monitor vòng hiện tại của PancakeSwap Prediction
- Contract: `0x18b2a687610328590bc8f2e5fedde3b582a49cda`
- Theo dõi timing: start, lock, close timestamps
- Xác định thời điểm tối ưu để predict (30s trước vòng mới)

**Chức năng chính:**
```typescript
getCurrentEpoch(): Promise<bigint>
getCurrentRound(): Promise<PredictionRound>
getRoundTiming(): Promise<RoundTiming>
waitForOptimalPredictionTime(): Promise<void>
isInBettingPhase(): Promise<boolean>
getTimeUntilLock(): Promise<number>
```

### 3. **HybridPriceService** (`src/services/hybrid-price.ts`)
- Kết hợp Chainlink và Binance prices
- Logic chọn nguồn giá tối ưu
- Điều chỉnh confidence dựa trên độ chênh lệch

**Chức năng chính:**
```typescript
getHybridPrice(symbol): Promise<HybridPriceData>
getPriceData(symbol): Promise<PriceData>
isChainlinkHealthy(): Promise<boolean>
getPriceComparison(symbol): Promise<ComparisonData>
```

### 4. **PredictionService** (Updated)
- Tích hợp Hybrid Price vào prediction flow
- Áp dụng confidence adjustment
- Thêm thông tin round timing vào kết quả

---

## 🔄 Luồng hoạt động

```
┌─────────────────────────────────────────────────────────────┐
│                    PREDICTION FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Fetch Hybrid Price
   ├─ Try Chainlink Oracle (primary)
   │  ├─ Success → Use Chainlink price
   │  └─ Fail → Fallback to Binance
   └─ Calculate price difference & confidence adjustment

2. Get Round Timing
   ├─ Current epoch
   ├─ Time until lock
   └─ Optimal prediction time

3. Fetch Market Data (Binance)
   ├─ Klines (candlesticks)
   ├─ Order book
   └─ Recent trades

4. Calculate Technical Indicators
   ├─ RSI, MACD, EMA, Bollinger Bands
   ├─ ATR, Stochastic, VWAP
   └─ MFI, OBV, Volume Delta

5. AI Prediction (Gemini 2.5 Flash)
   └─ Analyze all data → UP/DOWN + confidence

6. Apply Confidence Adjustment
   └─ Adjust based on price source quality

7. Calculate Predicted Price
   └─ Using weighted scoring system

8. Return Result
   ├─ Prediction (UP/DOWN)
   ├─ Adjusted confidence
   ├─ Price source info
   └─ Round timing info
```

---

## 📊 Logic chọn nguồn giá

### Confidence Adjustment Rules:

| Tình huống | Nguồn giá | Confidence Adjustment |
|-----------|-----------|----------------------|
| Chainlink không khả dụng | Binance | 95% (penalty 5%) |
| Chênh lệch < 0.1% | Chainlink | 100% (full confidence) |
| Chênh lệch 0.1-0.3% | Chainlink | 98% (penalty 2%) |
| Chênh lệch 0.3-0.5% | Chainlink | 95% (penalty 5%) |
| Chênh lệch > 0.5% | Average | 90% (penalty 10%) |

### Ví dụ:
```
Chainlink: $1173.18
Binance:   $1172.85
Difference: $0.33 (0.028%)

→ Selected: Chainlink
→ Confidence Adjustment: 100%
→ Recommendation: "Use Chainlink (prices match)"
```

---

## 🧪 Testing

### Chạy test:
```bash
bun run test:hybrid
```

### Kết quả test mẫu:
```
✅ Chainlink Price: $1173.18 (Fresh: 37s ago)
✅ Binance Price: $1172.85
✅ Hybrid Price: $1173.18 (Source: CHAINLINK)
✅ Price Difference: $0.33 (0.028%)
✅ Confidence Adjustment: 100%
✅ Chainlink Status: Healthy
✅ Round #418319 (Time until lock: 0:51)
```

---

## 📈 Cải thiện so với phiên bản cũ

| Aspect | Trước | Sau (Hybrid) |
|--------|-------|--------------|
| **Nguồn giá** | Chỉ Binance | Chainlink + Binance |
| **Độ chính xác** | ~70% | ~75-80% (dự kiến) |
| **Locked Price** | Không match | Match với PancakeSwap |
| **Confidence** | Fixed | Dynamic adjustment |
| **Round timing** | Không có | Có monitor |
| **Fallback** | Không | Có (Binance) |

---

## 🔧 Configuration

### Environment Variables:
Không cần thêm biến môi trường mới. Hệ thống sử dụng:
- BSC RPC endpoints (public, không cần API key)
- Binance API (đã có sẵn)

### RPC Endpoints (fallback list):
1. `https://bsc-dataseed.binance.org/`
2. `https://bsc-dataseed1.defibit.io/`
3. `https://bsc-dataseed1.ninicoin.io/`
4. `https://bsc.publicnode.com`

---

## 📱 Bot Command Updates

### Thông tin mới trong `/predict`:
```
💰 Giá hiện tại: $1173.18
🔗 Nguồn giá: Chainlink Oracle (100%)
🎯 Giá dự kiến: 🟢 $1174.50
🟢 Thay đổi dự kiến: +0.11%

🎲 Vòng hiện tại: #418319
⏱️ Thời gian còn lại: 0:51

⚠️ Lưu ý:
• Dự đoán sử dụng Chainlink Oracle - cùng nguồn với PancakeSwap
• Giá dự kiến dựa trên phân tích kỹ thuật và có thể sai lệch
...
```

---

## 🚀 Deployment

### Build:
```bash
bun run build
```

### Start:
```bash
bun start
```

### Test toàn bộ:
```bash
bun run test:all
```

---

## 📝 Technical Details

### Chainlink Price Feed:
- **Decimals**: 8
- **Update Frequency**: ~20 seconds
- **Freshness Check**: < 60 seconds

### PancakeSwap Prediction:
- **Round Duration**: 5 minutes (300s)
- **Buffer Time**: 30 seconds
- **Optimal Prediction Time**: 30s before next round

### Price Conversion:
```typescript
// Chainlink returns price as BigInt with 8 decimals
const answerNumber = Number(answer.toString());
const decimalsNumber = Number(this.decimals);
const price = answerNumber / 10 ** decimalsNumber;
```

---

## 🐛 Troubleshooting

### Chainlink không kết nối được:
- ✅ Hệ thống tự động fallback sang Binance
- ✅ Confidence giảm 5% (95%)
- ✅ Vẫn có thể predict bình thường

### Giá chênh lệch lớn (> 0.5%):
- ⚠️ Sử dụng giá trung bình
- ⚠️ Confidence giảm 10% (90%)
- ⚠️ Log warning để review

### Round timing không chính xác:
- ℹ️ Không ảnh hưởng đến prediction
- ℹ️ Chỉ ảnh hưởng đến thông tin hiển thị
- ℹ️ Bot vẫn hoạt động bình thường

---

## 📚 References

- [PancakeSwap Prediction Docs](https://docs.pancakeswap.finance/play/prediction)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [BSC Network](https://docs.bnbchain.org/)

---

## ✅ Checklist triển khai

- [x] Cài đặt ethers.js
- [x] Tạo ChainlinkService
- [x] Tạo RoundMonitorService
- [x] Tạo HybridPriceService
- [x] Update PredictionService
- [x] Update Bot Commands
- [x] Tạo test script
- [x] Fix BigInt conversion issues
- [x] Test thành công
- [x] Tạo documentation

---

**Version**: 2.1.0  
**Date**: 2025-10-04  
**Author**: Vu Dinh Hiep  
**Status**: ✅ Production Ready

