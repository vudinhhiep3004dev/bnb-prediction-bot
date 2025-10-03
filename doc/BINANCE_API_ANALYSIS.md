# Phân tích Binance API cho các chỉ số bổ sung

## Tóm tắt
Đây là kết quả kiểm tra các endpoint Binance API có thể lấy dữ liệu cho các chỉ số tôi đề xuất để tăng độ chính xác dự đoán giá BNB trong 5 phút.

---

## ✅ CÓ SẴN - Các endpoint Binance API hỗ trợ

### 1. **Order Book Depth** ✅
**Endpoint**: `GET /api/v3/depth`

**Mô tả**: Lấy độ sâu order book (giá và khối lượng của bids/asks)

**Weight**: 
- Limit 1-100: Weight 1
- Limit 101-500: Weight 5
- Limit 501-1000: Weight 10
- Limit 1001-5000: Weight 50

**Parameters**:
- `symbol`: Trading pair (BNBUSDT)
- `limit`: Số lượng levels (5, 10, 20, 50, 100, 500, 1000, 5000)

**Response**:
```json
{
  "lastUpdateId": 1027024,
  "bids": [
    ["0.00379200", "31.26000000"]  // [price, quantity]
  ],
  "asks": [
    ["0.00380100", "32.37000000"]
  ]
}
```

**Dữ liệu có thể tính toán**:
- ✅ **Bid/Ask Spread** - Chênh lệch giá mua/bán
- ✅ **Order Book Depth** - Độ sâu thanh khoản
- ✅ **Buy/Sell Pressure** - Áp lực mua/bán từ volume
- ✅ **Support/Resistance Levels** - Mức hỗ trợ/kháng cự động

---

### 2. **Recent Trades** ✅
**Endpoint**: `GET /api/v3/trades`

**Mô tả**: Lấy các giao dịch gần đây (tối đa 1000 trades)

**Weight**: 1

**Parameters**:
- `symbol`: Trading pair (BNBUSDT)
- `limit`: Số lượng trades (max 1000)

**Response**:
```json
[
  {
    "id": 981492,
    "price": "0.00380100",
    "qty": "0.22000000",
    "quoteQty": "0.00083622",
    "time": 1637128016269,
    "isBuyerMaker": false,  // false = market buy (aggressive)
    "isBestMatch": true
  }
]
```

**Dữ liệu có thể tính toán**:
- ✅ **Recent Trade Flow** - Dòng giao dịch ngắn hạn
- ✅ **Buy/Sell Ratio** - Tỷ lệ lệnh mua/bán
- ✅ **Trade Velocity** - Tốc độ giao dịch
- ✅ **Aggressive Buy/Sell** - Phân biệt market orders vs limit orders

---

### 3. **Aggregate Trades** ✅
**Endpoint**: `GET /api/v3/aggTrades`

**Mô tả**: Lấy các giao dịch tổng hợp (trades cùng giá, cùng thời điểm được gộp lại)

**Weight**: 1

**Parameters**:
- `symbol`: Trading pair (BNBUSDT)
- `limit`: Số lượng trades (max 1000)
- `startTime`: Thời gian bắt đầu (milliseconds)
- `endTime`: Thời gian kết thúc (milliseconds)

**Response**:
```json
[
  {
    "a": 874844,           // Aggregate trade ID
    "p": "0.00379700",     // Price
    "q": "0.05000000",     // Quantity
    "f": 981493,           // First trade ID
    "l": 981493,           // Last trade ID
    "T": 1637128220041,    // Timestamp
    "m": true,             // Was buyer the maker?
    "M": true              // Was trade best price match?
  }
]
```

**Dữ liệu có thể tính toán**:
- ✅ **Large Order Detection** - Phát hiện lệnh lớn
- ✅ **Money Flow** - Dòng tiền vào/ra
- ✅ **Volume Profile** - Phân bố khối lượng theo giá

---

### 4. **24hr Ticker** ✅ (ĐÃ DÙNG)
**Endpoint**: `GET /api/v3/ticker/24hr`

**Dữ liệu bổ sung có thể dùng**:
- `bidPrice`, `bidQty` - Giá và khối lượng bid tốt nhất
- `askPrice`, `askQty` - Giá và khối lượng ask tốt nhất
- `weightedAvgPrice` - Giá trung bình có trọng số

---

### 5. **Klines/Candlestick** ✅ (ĐÃ DÙNG)
**Endpoint**: `GET /api/v3/klines`

**Dữ liệu bổ sung có thể dùng**:
- `takerBuyBaseAssetVolume` - Volume mua từ taker (aggressive buyers)
- `takerBuyQuoteAssetVolume` - Quote volume mua từ taker

**Có thể tính toán**:
- ✅ **ATR (Average True Range)** - Từ high, low, close
- ✅ **Buy/Sell Volume Ratio** - Từ taker buy volume

---

## ❌ KHÔNG CÓ - Các chỉ số cần tính toán thủ công

### 1. **Stochastic Oscillator** ❌
- Không có endpoint riêng
- ✅ **Có thể tính từ klines**: Dùng high, low, close
- Formula: `%K = (Close - Low14) / (High14 - Low14) × 100`

### 2. **VWAP (Volume Weighted Average Price)** ❌
- Không có endpoint riêng
- ✅ **Có thể tính từ klines**: Dùng (high + low + close) / 3 × volume
- Formula: `VWAP = Σ(Price × Volume) / Σ(Volume)`

### 3. **Fibonacci Retracement** ❌
- Không có endpoint riêng
- ✅ **Có thể tính từ klines**: Dùng high/low của period
- Levels: 23.6%, 38.2%, 50%, 61.8%, 78.6%

### 4. **Money Flow Index (MFI)** ❌
- Không có endpoint riêng
- ✅ **Có thể tính từ klines**: Dùng typical price × volume
- Formula: Similar to RSI but with volume

### 5. **Rate of Change (ROC)** ❌
- Không có endpoint riêng
- ✅ **Có thể tính từ klines**: Dùng close prices
- Formula: `ROC = (Close - Close_n) / Close_n × 100`

---

## 📊 KHUYẾN NGHỊ TRIỂN KHAI

### Ưu tiên cao (Dữ liệu real-time từ API)

#### 1. **Order Book Depth** - QUAN TRỌNG NHẤT cho 5 phút
```typescript
// Endpoint: GET /api/v3/depth?symbol=BNBUSDT&limit=20
interface OrderBookData {
  bidAskSpread: number;        // Chênh lệch giá
  bidDepth: number;            // Tổng volume bids
  askDepth: number;            // Tổng volume asks
  buyPressure: number;         // bidDepth / (bidDepth + askDepth)
  imbalanceRatio: number;      // (bidDepth - askDepth) / (bidDepth + askDepth)
}
```
**Lý do**: Phản ánh áp lực mua/bán THỰC TẾ ngay lúc này

#### 2. **Recent Trades Analysis** - QUAN TRỌNG cho momentum
```typescript
// Endpoint: GET /api/v3/trades?symbol=BNBUSDT&limit=100
interface TradeFlowData {
  buyVolume: number;           // Tổng volume buy orders
  sellVolume: number;          // Tổng volume sell orders
  buySellRatio: number;        // buyVolume / sellVolume
  tradeVelocity: number;       // Số trades / giây
  avgTradeSize: number;        // Kích thước giao dịch trung bình
  largeOrderCount: number;     // Số lệnh lớn (> 2x avg)
}
```
**Lý do**: Cho biết dòng tiền đang vào hay ra trong vài phút gần nhất

#### 3. **ATR (Average True Range)** - Tính từ klines
```typescript
// Tính từ klines hiện có
interface VolatilityData {
  atr: number;                 // Độ biến động trung bình
  atrPercent: number;          // ATR / currentPrice × 100
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
```
**Lý do**: Đo độ biến động, quan trọng cho stop-loss và take-profit

### Ưu tiên trung bình (Tính từ dữ liệu có sẵn)

#### 4. **Stochastic Oscillator**
```typescript
interface StochasticData {
  k: number;                   // %K line
  d: number;                   // %D line (SMA of %K)
  signal: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT';
}
```

#### 5. **VWAP**
```typescript
interface VWAPData {
  vwap: number;
  priceVsVWAP: number;         // (currentPrice - vwap) / vwap
  position: 'ABOVE' | 'BELOW';
}
```

### Ưu tiên thấp (Ít quan trọng cho 5 phút)

- Fibonacci Retracement (tốt hơn cho swing trading)
- MFI (tương tự RSI, không cần thiết nếu đã có RSI + Volume)
- ROC (có thể thay bằng price change %)

---

## 🎯 KẾT LUẬN

### Binance API CÓ ĐỦ dữ liệu cho:
✅ Order Book Depth (bid/ask spread, pressure)
✅ Recent Trade Flow (buy/sell ratio, velocity)
✅ Aggregate Trades (large orders, money flow)
✅ ATR (từ klines)
✅ Stochastic (từ klines)
✅ VWAP (từ klines)
✅ Buy/Sell Volume Ratio (từ klines taker buy volume)

### Không cần API bên ngoài!

### Tác động lên Rate Limit:
- Order Book (limit=20): Weight 1
- Recent Trades (limit=100): Weight 1
- Klines (đã dùng): Weight 2
- **Tổng thêm**: ~2 weight/prediction
- **Tổng cộng**: ~8 weight/prediction (vẫn rất an toàn, limit là 1200/phút)

### Khuyến nghị cuối cùng:
**THÊM 3 chỉ số này vào bot:**
1. **Order Book Depth Analysis** (bid/ask spread, imbalance)
2. **Recent Trade Flow Analysis** (buy/sell ratio, velocity)
3. **ATR** (volatility measurement)

Ba chỉ số này sẽ cải thiện đáng kể độ chính xác cho dự đoán 5 phút vì chúng phản ánh **áp lực thị trường thực tế** và **momentum ngắn hạn**.

