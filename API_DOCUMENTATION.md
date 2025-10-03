# API Documentation

## Binance API Endpoints Used

### 1. Klines/Candlestick Data

**Endpoint**: `GET /api/v3/klines`

**Parameters**:
- `symbol`: Trading pair (e.g., BNBUSDT)
- `interval`: Time interval (5m, 15m, 1h, etc.)
- `limit`: Number of candles (max 1000)

**Response**:
```json
[
  [
    1499040000000,      // Open time
    "0.01634790",       // Open
    "0.80000000",       // High
    "0.01575800",       // Low
    "0.01577100",       // Close
    "148976.11427815",  // Volume
    1499644799999,      // Close time
    "2434.19055334",    // Quote asset volume
    308,                // Number of trades
    "1756.87402397",    // Taker buy base asset volume
    "28.46694368",      // Taker buy quote asset volume
    "0"                 // Unused field
  ]
]
```

### 2. 24hr Ticker

**Endpoint**: `GET /api/v3/ticker/24hr`

**Parameters**:
- `symbol`: Trading pair

**Response**:
```json
{
  "symbol": "BNBUSDT",
  "priceChange": "-94.99999800",
  "priceChangePercent": "-95.960",
  "weightedAvgPrice": "0.29628482",
  "prevClosePrice": "0.10002000",
  "lastPrice": "4.00000200",
  "lastQty": "200.00000000",
  "bidPrice": "4.00000000",
  "bidQty": "100.00000000",
  "askPrice": "4.00000200",
  "askQty": "100.00000000",
  "openPrice": "99.00000000",
  "highPrice": "100.00000000",
  "lowPrice": "0.10000000",
  "volume": "8913.30000000",
  "quoteVolume": "15.30000000",
  "openTime": 1499783499040,
  "closeTime": 1499869899040,
  "firstId": 28385,
  "lastId": 28460,
  "count": 76
}
```

### 3. Current Price

**Endpoint**: `GET /api/v3/ticker/price`

**Parameters**:
- `symbol`: Trading pair

**Response**:
```json
{
  "symbol": "BNBUSDT",
  "price": "4.00000200"
}
```

## Cloudflare AI Gateway

### Endpoint

```
POST https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/compat/chat/completions
```

### Headers

```
Content-Type: application/json
Authorization: Bearer {GOOGLE_AI_STUDIO_API_KEY}
```

### Request Body

```json
{
  "model": "google-ai-studio/gemini-2.5-flash-preview-09-2025",
  "messages": [
    {
      "role": "system",
      "content": "System prompt..."
    },
    {
      "role": "user",
      "content": "User prompt with market data..."
    }
  ],
  "temperature": 0.3,
  "max_tokens": 1000
}
```

### Response

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{\"prediction\":\"UP\",\"confidence\":75,...}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 500,
    "completion_tokens": 200,
    "total_tokens": 700
  }
}
```

## Technical Indicators

### RSI (Relative Strength Index)

**Formula**:
```
RSI = 100 - (100 / (1 + RS))
RS = Average Gain / Average Loss
```

**Interpretation**:
- RSI > 70: Overbought
- RSI < 30: Oversold
- RSI 30-70: Neutral

### MACD (Moving Average Convergence Divergence)

**Formula**:
```
MACD = EMA(12) - EMA(26)
Signal = EMA(9) of MACD
Histogram = MACD - Signal
```

**Interpretation**:
- MACD > Signal: Bullish
- MACD < Signal: Bearish
- Histogram > 0: Bullish momentum
- Histogram < 0: Bearish momentum

### EMA (Exponential Moving Average)

**Formula**:
```
EMA = (Close - EMA_prev) × Multiplier + EMA_prev
Multiplier = 2 / (Period + 1)
```

**Common Periods**:
- EMA(9): Short-term trend
- EMA(21): Medium-term trend
- EMA(50): Long-term trend

### Bollinger Bands

**Formula**:
```
Middle Band = SMA(20)
Upper Band = Middle + (2 × StdDev)
Lower Band = Middle - (2 × StdDev)
```

**Interpretation**:
- Price near upper band: Overbought
- Price near lower band: Oversold
- Bands squeeze: Low volatility
- Bands expand: High volatility

## Rate Limits

### Binance API

- **Weight**: Each endpoint has a weight
- **Limit**: 1200 weight per minute
- **IP Limit**: 6000 weight per minute per IP

**Our Usage**:
- Klines: 2 weight
- 24hr Ticker: 2 weight
- Price: 2 weight
- **Total per prediction**: ~6 weight

**Max predictions per minute**: ~200

### Cloudflare AI Gateway

- **Free Tier**: Limited requests per day
- **Paid Tier**: Higher limits
- Check dashboard for current usage

### Google AI Studio

- **Free Tier**: 60 requests per minute
- **Paid Tier**: Higher limits
- Rate limit errors: 429 status code

## Error Handling

### Binance API Errors

```json
{
  "code": -1121,
  "msg": "Invalid symbol."
}
```

**Common Codes**:
- `-1121`: Invalid symbol
- `-1100`: Illegal characters
- `-1003`: Too many requests

### Cloudflare/AI Errors

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

## Data Flow

```
1. User sends /predict command
   ↓
2. Bot fetches market data from Binance
   - Klines (100 candles, 5m interval)
   - 24hr ticker
   ↓
3. Calculate technical indicators
   - RSI, MACD, EMA, Bollinger Bands
   ↓
4. Build analysis prompt
   - Format market data
   - Include indicators
   - Add recent price action
   ↓
5. Send to Cloudflare AI Gateway
   - Route to Gemini 2.5 Flash
   - Get prediction response
   ↓
6. Parse AI response
   - Extract prediction (UP/DOWN)
   - Get confidence level
   - Parse reasoning
   ↓
7. Format and send to user
   - Prediction with emoji
   - Confidence percentage
   - Technical indicators
   - Reasoning
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache market data for 30 seconds
const CACHE_TTL = 30000;
const cache = new Map();

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

### Batch Requests

```typescript
// Fetch multiple data points in parallel
const [klines, ticker] = await Promise.all([
  binanceService.getKlines(),
  binanceService.get24hrTicker(),
]);
```

### Error Retry

```typescript
async function retryRequest(fn: Function, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
}
```

## Security Best Practices

1. **Never commit API keys**
   - Use environment variables
   - Add .env to .gitignore

2. **Validate user input**
   - Sanitize commands
   - Rate limit per user

3. **Secure API calls**
   - Use HTTPS only
   - Verify SSL certificates

4. **Monitor usage**
   - Track API calls
   - Set up alerts for unusual activity

5. **Rotate keys regularly**
   - Change API keys periodically
   - Use key management service

