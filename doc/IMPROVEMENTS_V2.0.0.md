# Bot BNB Prediction - Improvements v2.0.0

## 📊 Tổng quan

Phiên bản 2.0.0 tập trung vào **cải thiện độ chính xác dự đoán** từ 50% lên **60-75%** thông qua:
- Thêm 3 chỉ số kỹ thuật mới (MFI, OBV, Volume Delta)
- Cải tiến Order Book và Trade Flow analysis
- Tối ưu hóa periods cho khung 5 phút
- Nâng cấp logic phân tích với weighted metrics

---

## 🆕 Chỉ số kỹ thuật mới

### 1. Money Flow Index (MFI)
**Mô tả:** RSI có volume - tốt hơn RSI cho short-term trading

**Công thức:**
```
Typical Price = (High + Low + Close) / 3
Money Flow = Typical Price × Volume
Money Flow Ratio = Positive Flow / Negative Flow
MFI = 100 - (100 / (1 + Money Flow Ratio))
```

**Signals:**
- MFI < 20: Oversold (có thể tăng)
- MFI > 80: Overbought (có thể giảm)
- Divergence: Giá tăng nhưng MFI giảm = bearish signal

**Period:** 9 (tối ưu cho 5 phút)

---

### 2. On-Balance Volume (OBV)
**Mô tả:** Theo dõi dòng tiền tích lũy để phát hiện accumulation/distribution

**Công thức:**
```
If Close > Previous Close: OBV = OBV + Volume
If Close < Previous Close: OBV = OBV - Volume
If Close = Previous Close: OBV = OBV
```

**Signals:**
- OBV tăng: Accumulation (smart money đang mua)
- OBV giảm: Distribution (smart money đang bán)
- Divergence: Giá tăng nhưng OBV giảm = bearish signal

**Trend Detection:**
- So sánh OBV 10 candles gần nhất vs 10 candles trước đó
- Bullish: Recent OBV > Older OBV × 1.05
- Bearish: Recent OBV < Older OBV × 0.95

---

### 3. Volume Delta
**Mô tả:** Chênh lệch giữa buy volume và sell volume theo thời gian

**Công thức:**
```
Delta = Buy Volume - Sell Volume
Cumulative Delta = Σ Delta over time
```

**Signals:**
- Current Delta > 0: Áp lực mua ngắn hạn
- Cumulative Delta > 0: Xu hướng tích lũy dài hạn
- Trend: So sánh 30 trades gần nhất vs 30 trades trước đó

---

## 🔧 Cải tiến Order Book Analysis

### Enhanced Metrics

#### 1. Weighted Buy Pressure
**Mô tả:** Orders gần current price quan trọng hơn

**Công thức:**
```typescript
weight = exp(-distance × 100)
distance = |price - currentPrice| / currentPrice
weightedVolume = volume × weight
```

**Lợi ích:**
- Phát hiện áp lực thực tế tốt hơn
- Giảm ảnh hưởng của fake walls xa giá

#### 2. Order Flow Imbalance
**Mô tả:** Imbalance ratio nâng cao sử dụng weighted volumes

**Công thức:**
```typescript
orderFlowImbalance = (weightedBidVolume - weightedAskVolume) / totalWeightedVolume
```

**Signals:**
- > 0.15: Strong buy pressure
- < -0.15: Strong sell pressure

#### 3. Whale Detection
**Mô tả:** Phát hiện orders lớn (> 10x average)

**Metrics:**
- Whale Order Count: Số lượng whale orders
- Whale Volume: Tổng volume của whale orders
- Whale Side: Whales đang ở bid hay ask?

**Signals:**
- Whale Side = BID: Whales đang mua
- Whale Side = ASK: Whales đang bán

---

## 🔧 Cải tiến Trade Flow Analysis

### Enhanced Metrics

#### 1. Time-Weighted Buy Ratio
**Mô tả:** Trades gần đây được weight cao hơn

**Công thức:**
```typescript
age = (now - trade.time) / 1000 // seconds
timeWeight = exp(-age / 60) // decay over 60 seconds
weightedVolume = volume × timeWeight
```

**Lợi ích:**
- Phản ánh momentum hiện tại chính xác hơn
- Giảm ảnh hưởng của trades cũ

#### 2. Trade Acceleration
**Mô tả:** Tốc độ thay đổi của trade velocity

**Công thức:**
```typescript
firstHalfVelocity = trades in first half / time
secondHalfVelocity = trades in second half / time
acceleration = (secondHalfVelocity - firstHalfVelocity) / firstHalfVelocity
```

**Signals:**
- Acceleration > 0.2: Momentum tăng tốc
- Acceleration < -0.2: Momentum chậm lại

#### 3. Whale Trade Detection
**Mô tả:** Phát hiện trades lớn (> 5x average)

**Lợi ích:**
- Phát hiện institutional activity
- Xác định smart money flow

#### 4. Volume-Weighted Aggressive Buy
**Mô tả:** Aggressive buy % có tính đến trade size

**Công thức:**
```typescript
volumeWeightedAggressiveBuy = aggressiveBuyVolume / totalAggressiveVolume × 100
```

**Lợi ích:**
- Chính xác hơn simple count percentage
- Phản ánh áp lực thực tế

---

## ⚙️ Tối ưu hóa Periods

### Periods cũ vs mới (cho 5 phút)

| Indicator | Period cũ | Period mới | Lý do |
|-----------|-----------|------------|-------|
| RSI | 14 | 9 | Phản ứng nhanh hơn |
| Stochastic | 14 | 9 | Tốt hơn cho short-term |
| Bollinger Bands | 20 | 12 | Giảm lag |
| ATR | 14 | 10 | Phản ánh volatility hiện tại |
| EMA | 9, 21, 50 | 5, 13, 21 | Phù hợp 5 phút |
| MFI | - | 9 | Optimal cho 5 phút |

### Bollinger Bands Enhancements

**Thêm 2 metrics:**
1. **%B (Percent B):**
   ```
   %B = (Price - Lower Band) / (Upper Band - Lower Band)
   ```
   - %B > 1: Giá trên upper band (overbought)
   - %B < 0: Giá dưới lower band (oversold)

2. **Bandwidth:**
   ```
   Bandwidth = (Upper Band - Lower Band) / Middle Band
   ```
   - Bandwidth cao: High volatility
   - Bandwidth thấp: Low volatility (squeeze)

### VWAP Enhancements

**Thêm VWAP Bands:**
```
Upper Band = VWAP + 1 × StdDev
Lower Band = VWAP - 1 × StdDev
```

**Signals:**
- Price > Upper Band: Significantly above VWAP
- Price < Lower Band: Significantly below VWAP

### ATR Enhancements

**Thêm ATR Trend:**
- Compare recent ATR (20 candles) vs older ATR (20 candles trước)
- INCREASING: Recent ATR > Older ATR × 1.1
- DECREASING: Recent ATR < Older ATR × 0.9
- STABLE: Còn lại

**Lợi ích:**
- Biết volatility đang tăng hay giảm
- Adjust risk management accordingly

---

## 📊 Cấu trúc dữ liệu mới

### TechnicalIndicators Interface

```typescript
interface TechnicalIndicators {
  // Existing indicators (updated)
  ema: {
    ema5: number;   // Changed from ema9
    ema13: number;  // New
    ema21: number;  // Kept
  };
  
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;  // NEW
    percentB: number;   // NEW
  };
  
  atr: {
    value: number;
    percent: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    trend: 'INCREASING' | 'STABLE' | 'DECREASING';  // NEW
  };
  
  vwap: {
    value: number;
    priceVsVWAP: number;
    position: 'ABOVE' | 'BELOW';
    upperBand: number;  // NEW
    lowerBand: number;  // NEW
  };
  
  // NEW INDICATORS
  mfi: {
    value: number;
    signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
    divergence: boolean;
  };
  
  obv: {
    value: number;
    trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
    divergence: boolean;
  };
  
  volumeDelta: {
    current: number;
    cumulative: number;
    trend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  };
}
```

### OrderBookData Interface

```typescript
interface OrderBookData {
  // Existing metrics
  buyPressure: number;
  imbalanceRatio: number;
  
  // NEW ENHANCED METRICS
  weightedBuyPressure: number;
  orderFlowImbalance: number;
  whaleActivity: {
    whaleOrderCount: number;
    whaleVolume: number;
    whaleSide: 'BID' | 'ASK' | 'BALANCED';
  };
}
```

### TradeFlowData Interface

```typescript
interface TradeFlowData {
  // Existing metrics
  buySellRatio: number;
  tradeVelocity: number;
  
  // NEW ENHANCED METRICS
  timeWeightedBuyRatio: number;
  tradeAcceleration: number;
  whaleTradeCount: number;
  volumeWeightedAggressiveBuy: number;
}
```

---

## 🎯 Kết quả mong đợi

### Độ chính xác dự kiến

| Phase | Cải tiến | Accuracy dự kiến |
|-------|----------|------------------|
| Hiện tại | - | 50% |
| Phase 1 | Chỉ số mới + Periods | 60-65% |
| Phase 2 | Enhanced metrics | 65-72% |
| Phase 3 | AI prompt + Weights | 70-75%+ |

### Metrics để đo lường

1. **Win Rate:** % predictions đúng
2. **Confidence Accuracy:** Accuracy theo confidence level
3. **Profit Factor:** Total profit / Total loss
4. **Sharpe Ratio:** Risk-adjusted returns

---

## 📝 Breaking Changes

### API Changes

1. **calculateIndicators():**
   ```typescript
   // Old
   calculateIndicators(klines: BinanceKline[])
   
   // New
   calculateIndicators(klines: BinanceKline[], recentTrades?: BinanceTrade[])
   ```

2. **analyzeOrderBook():**
   ```typescript
   // Old
   analyzeOrderBook(orderBook: BinanceOrderBook)
   
   // New
   analyzeOrderBook(orderBook: BinanceOrderBook, currentPrice?: number)
   ```

### Type Changes

1. **TechnicalIndicators.ema:**
   - Removed: `ema9`, `ema50`
   - Added: `ema5`, `ema13`
   - Kept: `ema21`

2. **New fields added to:**
   - `TechnicalIndicators`: `mfi`, `obv`, `volumeDelta`
   - `OrderBookData`: `weightedBuyPressure`, `orderFlowImbalance`, `whaleActivity`
   - `TradeFlowData`: `timeWeightedBuyRatio`, `tradeAcceleration`, `whaleTradeCount`, `volumeWeightedAggressiveBuy`

---

## 🚀 Next Steps (Phase 2 & 3)

### Phase 2: AI Prompt & Weighted Scoring
- [ ] Implement weighted scoring system (thay vì multiplicative)
- [ ] Cải tiến AI prompt với decision rules chi tiết
- [ ] Thêm confidence scoring dựa trên signal alignment

### Phase 3: Backtesting & Optimization
- [ ] Tạo backtesting framework
- [ ] Test với historical data
- [ ] Dynamic weights dựa trên market condition
- [ ] Adaptive periods dựa trên volatility

---

## 📚 Tài liệu tham khảo

- [Money Flow Index (MFI)](https://www.investopedia.com/terms/m/mfi.asp)
- [On-Balance Volume (OBV)](https://www.investopedia.com/terms/o/onbalancevolume.asp)
- [Order Flow Trading](https://www.tradingview.com/support/solutions/43000481029-order-flow/)
- [Volume Delta Analysis](https://www.sierrachart.com/index.php?page=doc/StudiesReference.php&ID=121)

---

**Version:** 2.0.0  
**Date:** 2025-01-04  
**Author:** Augment Agent

