# 🎯 Przykłady użycia AI Trading Analyzer

## 1. Szybka analiza z linii komend

```bash
# Podstawowa analiza BTCUSDT
npm run analyze BTCUSDT

# Analiza innych kryptowalut
npm run analyze ETHUSDT
npm run analyze ADAUSDT
npm run analyze DOTUSDT
```

### Przykładowy wynik:
```
📊 WYNIK ANALIZY
================
Symbol: BTCUSDT
Czas analizy: 2341ms
Ostatnia cena: $35,247.82
Trend: bullish
Crossover: bullish_crossover

🤖 DECYZJA AI
==============
Decyzja: BUY
Pewność: High
Cena wejścia: $35,247.82
Stop Loss: $34,800.00
Take Profit: $36,200.00
Risk/Reward: 2.1

✅ POWODY:
1. Fast EMA crossed above Slow EMA with strong momentum
2. RSI shows healthy bullish momentum (58.2)
3. Volume confirmation supports the breakout
4. Market sentiment is positive with 24h change +2.4%

⚠️ OSTRZEŻENIA:
1. High leverage (10x) amplifies both profits and losses
2. Monitor for potential resistance at $36,000 level
```

## 2. Użycie API

### Sprawdzenie statusu
```bash
curl http://localhost:3000/api/status
```

```json
{
  "status": "running",
  "timestamp": "2024-06-01T10:30:00Z",
  "version": "1.0.0",
  "cache_size": 4
}
```

### Analiza konkretnego symbolu
```bash
curl http://localhost:3000/api/analysis/BTCUSDT
```

```json
{
  "timestamp": "2024-06-01T10:30:00Z",
  "symbol": "BTCUSDT",
  "analysis": {
    "decision": "BUY",
    "confidence": "High",
    "entry_price": 35247.82,
    "stop_loss": 34800.00,
    "take_profit": 36200.00,
    "risk_reward_ratio": 2.1,
    "position_size": 1000,
    "reasons": [
      "Fast EMA crossed above Slow EMA with strong momentum",
      "RSI shows healthy bullish momentum (58.2)",
      "Volume confirmation supports the breakout"
    ],
    "warnings": [
      "High leverage (10x) amplifies both profits and losses",
      "Monitor for potential resistance at $36,000 level"
    ],
    "analysis": {
      "trend_strength": "Strong",
      "volume_confirmation": true,
      "support_resistance": "Support at $34,800, resistance at $36,000",
      "market_sentiment": "Bullish"
    }
  },
  "raw_data": {
    "candles_count": 100,
    "last_price": 35247.82,
    "trend": "bullish",
    "crossover": "bullish_crossover"
  },
  "cached": false
}
```

### Ręczna analiza z parametrami
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "ETHUSDT",
    "interval": "4h",
    "leverage": 5,
    "position_size": 2000
  }'
```

### Ostatnie sygnały
```bash
curl http://localhost:3000/api/signals
```

```json
{
  "signals": [
    {
      "symbol": "BTCUSDT",
      "decision": "BUY",
      "confidence": "High",
      "timestamp": "2024-06-01T10:30:00Z",
      "entry_price": 35247.82,
      "reasons": ["Fast EMA crossed above Slow EMA"]
    },
    {
      "symbol": "ETHUSDT",
      "decision": "WAIT",
      "confidence": "Medium",
      "timestamp": "2024-06-01T10:15:00Z",
      "entry_price": 2450.30,
      "reasons": ["Sideways movement, unclear trend"]
    }
  ],
  "count": 2,
  "generated_at": "2024-06-01T10:30:00Z"
}
```

## 3. Użycie programowe

### Podstawowe użycie
```javascript
import { TradingAnalyzer } from './src/TradingAnalyzer.js';

const analyzer = new TradingAnalyzer();

// Analiza BTCUSDT
const result = await analyzer.analyze('BTCUSDT');
console.log(`Decyzja: ${result.analysis.decision}`);
console.log(`Pewność: ${result.analysis.confidence}`);
console.log(`Cena wejścia: $${result.analysis.entry_price}`);
```

### Konfiguracja niestandardowa
```javascript
const analyzer = new TradingAnalyzer();

// Zmień konfigurację
analyzer.config.leverage = 5;
analyzer.config.positionSize = 2000;
analyzer.config.riskTolerance = 'conservative';

// Wykonaj analizę
const result = await analyzer.analyze('ETHUSDT');
```

### Analiza wielu symboli
```javascript
const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT'];
const results = [];

for (const symbol of symbols) {
  try {
    const result = await analyzer.analyze(symbol);
    results.push({
      symbol,
      decision: result.analysis.decision,
      confidence: result.analysis.confidence,
      entry_price: result.analysis.entry_price
    });
  } catch (error) {
    console.error(`Błąd analizy ${symbol}:`, error.message);
  }
}

console.table(results);
```

## 4. Uruchomienie z Docker

### Podstawowe uruchomienie
```bash
# Zbuduj obraz
docker build -t ai-trading-analyzer .

# Uruchom kontener
docker run -p 3000:3000 --env-file .env ai-trading-analyzer
```

### Użycie docker-compose
```bash
# Uruchom wszystkie usługi
docker-compose up -d

# Sprawdź logi
docker-compose logs -f ai-trading-analyzer

# Zatrzymaj
docker-compose down
```

### Skalowanie
```bash
# Uruchom więcej instancji
docker-compose up -d --scale ai-trading-analyzer=3
```

## 5. Monitorowanie i debugging

### Sprawdzanie logów
```bash
# Logi z pliku
tail -f logs/trading.log

# Logi API
tail -f logs/api.log

# Logi w Docker
docker-compose logs -f ai-trading-analyzer
```

### Debugging problemu
```bash
# Sprawdź status
curl http://localhost:3000/api/status

# Sprawdź konfigurację
curl http://localhost:3000/api/config

# Wyczyść cache
curl -X DELETE http://localhost:3000/api/cache

# Test konkretnego symbolu
curl http://localhost:3000/api/market-data/BTCUSDT
```

## 6. Integracja z innymi systemami

### Webhook dla alertów
```javascript
// Przykład integracji z Telegram Bot
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true });
const analyzer = new TradingAnalyzer();

setInterval(async () => {
  const result = await analyzer.analyze('BTCUSDT');
  
  if (result.analysis.decision !== 'WAIT' && 
      result.analysis.confidence === 'High') {
    
    const message = `
🚨 TRADING ALERT 🚨
Symbol: ${result.symbol}
Decision: ${result.analysis.decision}
Confidence: ${result.analysis.confidence}
Entry: $${result.analysis.entry_price}
Stop Loss: $${result.analysis.stop_loss}
Take Profit: $${result.analysis.take_profit}
    `;
    
    bot.sendMessage(CHAT_ID, message);
  }
}, 15 * 60 * 1000); // Co 15 minut
```

### Zapis do bazy danych
```javascript
// Przykład zapisu do MongoDB
import mongoose from 'mongoose';

const TradingSignalSchema = new mongoose.Schema({
  symbol: String,
  decision: String,
  confidence: String,
  entry_price: Number,
  stop_loss: Number,
  take_profit: Number,
  timestamp: Date,
  reasons: [String],
  raw_data: Object
});

const TradingSignal = mongoose.model('TradingSignal', TradingSignalSchema);

// Zapisz sygnał
const result = await analyzer.analyze('BTCUSDT');
const signal = new TradingSignal({
  ...result.analysis,
  symbol: result.symbol,
  timestamp: new Date(result.timestamp),
  raw_data: result.raw_data
});

await signal.save();
```

## 7. Automatyzacja z cron

### Systemowy cron (Linux/macOS)
```bash
# Edytuj crontab
crontab -e

# Dodaj wpis dla analizy co 15 minut
*/15 * * * * cd /path/to/ai-trading-analyzer && npm run analyze BTCUSDT >> /var/log/trading.log 2>&1
```

### PM2 dla produkcji
```bash
# Zainstaluj PM2
npm install -g pm2

# Uruchom aplikację
pm2 start src/index.js --name "ai-trading-analyzer"

# Monitoring
pm2 monit

# Autorestart
pm2 startup
pm2 save
```

## 8. Backtesting i analiza historyczna

### Analiza historyczna
```javascript
// Przykład analizy historycznej
import { TradingAnalyzer } from './src/TradingAnalyzer.js';

const analyzer = new TradingAnalyzer();

// Pobierz historyczne dane
const historicalData = await analyzer.fetchOHLCVData('BTCUSDT', '1h', 1000);

// Symuluj handel
let balance = 10000;
let position = null;
let trades = [];

for (let i = 100; i < historicalData.length; i++) {
  const currentData = historicalData.slice(i - 100, i);
  const indicators = analyzer.calculateTechnicalIndicators(currentData);
  
  // Sprawdź sygnały
  if (indicators.emaCrossover === 'bullish_crossover' && !position) {
    position = {
      type: 'long',
      entry_price: currentData[currentData.length - 1].close,
      timestamp: currentData[currentData.length - 1].timestamp
    };
  }
  
  if (indicators.emaCrossover === 'bearish_crossover' && position) {
    const exitPrice = currentData[currentData.length - 1].close;
    const pnl = (exitPrice - position.entry_price) / position.entry_price * balance;
    
    balance += pnl;
    trades.push({
      ...position,
      exit_price: exitPrice,
      pnl: pnl,
      exit_timestamp: currentData[currentData.length - 1].timestamp
    });
    
    position = null;
  }
}

console.log(`Końcowy balans: $${balance.toFixed(2)}`);
console.log(`Liczba transakcji: ${trades.length}`);
console.log(`Średni P&L: $${(trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length).toFixed(2)}`);
```

## 9. Konfiguracja dla różnych strategii

### Scalping (interwały krótkie)
```javascript
const scalping = new TradingAnalyzer();
scalping.config.interval = '5m';
scalping.config.leverage = 20;
scalping.config.positionSize = 500;
scalping.config.riskTolerance = 'aggressive';
```

### Swing Trading (interwały długie)
```javascript
const swing = new TradingAnalyzer();
swing.config.interval = '4h';
swing.config.leverage = 3;
swing.config.positionSize = 2000;
swing.config.riskTolerance = 'conservative';
```

### DCA (Dollar Cost Averaging)
```javascript
const dca = new TradingAnalyzer();
dca.config.interval = '1d';
dca.config.leverage = 1;
dca.config.positionSize = 1000;
dca.config.riskTolerance = 'conservative';
```

## 10. Troubleshooting

### Częste problemy i rozwiązania

#### Problem: "OpenAI API rate limit exceeded"
```bash
# Sprawdź limity w .env
echo $OPENAI_API_KEY

# Zmniejsz częstotliwość zapytań
# Dodaj opóźnienie między analizami
```

#### Problem: "Binance API connection failed"
```bash
# Sprawdź połączenie
curl https://api.binance.com/api/v3/time

# Sprawdź klucze API
curl -H "X-MBX-APIKEY: $BINANCE_API_KEY" https://api.binance.com/api/v3/account
```

#### Problem: "Insufficient data for analysis"
```javascript
// Zwiększ liczbę świec
const candles = await analyzer.fetchOHLCVData('BTCUSDT', '1h', 200);
```

### Logi diagnostyczne
```bash
# Włącz debug logi
LOG_LEVEL=debug npm start

# Analiza konkretnego problemu
npm run analyze BTCUSDT 2>&1 | grep ERROR
```

---

**Pamiętaj**: To tylko przykłady użycia. Zawsze testuj na małych kwotach przed wdrożeniem na produkcji i pamiętaj o zarządzaniu ryzykiem!