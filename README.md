# 🚀 AI Trading Analyzer

System analizy tradingowej z AI - automatyczne decyzje BUY/SELL/WAIT na podstawie danych z **Coinbase Pro** i **CoinMarketCap**.

## 🎯 Funkcjonalności

- 📊 **Pobieranie danych OHLCV** z Coinbase Pro API
- 📈 **Dane fundamentalne** z CoinMarketCap API
- 🔄 **Fallback** do CoinGecko API
- 🔍 **Analiza techniczna** (EMA, RSI, Stochastic RSI)
- 🤖 **Analiza AI** z OpenAI GPT-4
- 📱 **API REST** z automatyczną konwersją symboli
- 🔄 **Monitoring w czasie rzeczywistym**

## 🔗 Źródła danych

### **Główne API:**
1. **Coinbase Pro API** - dane OHLCV (świece cenowe)
2. **CoinMarketCap API** - dane fundamentalne (market cap, volume, zmiany)
3. **CoinGecko API** - fallback dla obu źródeł

### **Wspierane symbole:**
- `BTC-USD`, `ETH-USD`, `ADA-USD`, `DOT-USD`, `SOL-USD`
- `MATIC-USD`, `AVAX-USD`, `ATOM-USD`, `LINK-USD`, `UNI-USD`

*System automatycznie konwertuje między formatami symboli*

## 🚀 Szybki start

```bash
# Klonowanie repozytorium
git clone https://github.com/dobroslawdab/ai-trading-analyzer.git
cd ai-trading-analyzer

# Instalacja zależności
npm install

# Konfiguracja zmiennych środowiskowych
cp .env.example .env
# Uzupełnij .env swoimi kluczami API

# Szybka analiza
npm run analyze BTC-USD

# Uruchomienie API
npm start
```

## 🔧 Konfiguracja

### **Wymagane klucze API:**
- ✅ **OpenAI API** - do analizy AI (WYMAGANE)
- ✅ **CoinMarketCap API** - do danych fundamentalnych (WYMAGANE)

### **Opcjonalne klucze API:**
- 🔄 **Coinbase Pro API** - dla lepszej wydajności (opcjonalne)

### **Zmienne środowiskowe (.env):**
```env
# WYMAGANE
OPENAI_API_KEY=sk-your-openai-key
COINMARKETCAP_API_KEY=your-coinmarketcap-key

# OPCJONALNE
# COINBASE_API_KEY=your-coinbase-key
# COINBASE_SECRET=your-coinbase-secret

# Konfiguracja
DEFAULT_SYMBOL=BTC-USD
DEFAULT_INTERVAL=1h
LEVERAGE=10
POSITION_SIZE=1000
```

## 📊 Jak to działa

1. **Pobieranie danych OHLCV** z Coinbase Pro
2. **Pobieranie danych fundamentalnych** z CoinMarketCap
3. **Obliczanie wskaźników** technicznych (EMA, RSI, Stochastic RSI)
4. **Przygotowanie pakietu** danych dla AI
5. **Analiza AI** z GPT-4
6. **Strukturalna odpowiedź** BUY/SELL/WAIT

## 🎯 Struktura danych dla AI

```json
{
  "symbol": "BTC-USD",
  "data_sources": {
    "ohlcv": "Coinbase Pro API",
    "fundamentals": "CoinMarketCap API"
  },
  "ohlcv_data": {
    "candles": [
      {
        "timestamp": "2024-06-01T00:00:00Z",
        "open": 35000,
        "high": 35500,
        "low": 34500,
        "close": 35200,
        "volume": 1234567
      }
    ]
  },
  "coinmarketcap_data": {
    "market_cap": 700000000000,
    "volume_24h": 30000000000,
    "percent_change_1h": -0.2,
    "percent_change_24h": 1.5,
    "percent_change_7d": 10,
    "percent_change_30d": 15,
    "market_cap_dominance": 52.3
  },
  "technical_indicators": {
    "fastEMA": [34500, 34600, 34700],
    "slowEMA": [34300, 34400, 34500],
    "rsi": [45, 50, 55],
    "stochRSI": [40, 45, 50],
    "currentTrend": "bullish"
  }
}
```

## 🔌 API Endpoints

### **Analiza:**
- `GET /api/analysis/BTC-USD` - Analiza Bitcoin
- `POST /api/analyze` - Ręczna analiza z parametrami
- `GET /api/signals` - Ostatnie sygnały

### **Dane rynkowe:**
- `GET /api/market-data/BTC-USD` - Dane z Coinbase + CoinMarketCap
- `GET /api/coinmarketcap/BTC-USD` - Dane tylko z CoinMarketCap
- `GET /api/supported-symbols` - Lista wspieranych symboli

### **System:**
- `GET /api/status` - Status systemu
- `GET /api/config` - Konfiguracja
- `DELETE /api/cache` - Wyczyść cache

## 📈 Przykłady użycia

### **Linia komend:**
```bash
# Bitcoin
npm run analyze BTC-USD

# Ethereum
npm run analyze ETH-USD

# Cardano
npm run analyze ADA-USD
```

### **API:**
```bash
# Status systemu
curl http://localhost:3000/api/status

# Analiza Bitcoin
curl http://localhost:3000/api/analysis/BTC-USD

# Dane z CoinMarketCap
curl http://localhost:3000/api/coinmarketcap/BTC-USD

# Wspierane symbole
curl http://localhost:3000/api/supported-symbols
```

### **Programowo:**
```javascript
import { TradingAnalyzer } from './src/TradingAnalyzer.js';

const analyzer = new TradingAnalyzer();

// Analiza Bitcoin
const result = await analyzer.analyze('BTC-USD');
console.log(`Decyzja: ${result.analysis.decision}`);
console.log(`Źródła: ${result.data_sources.ohlcv} + ${result.data_sources.fundamentals}`);
```

## 🔄 Automatyzacja

- ⏰ **Automatyczne analizy** co 15 minut
- 🗂️ **Cache system** (5 minut)
- 📊 **Monitoring** symboli: BTC-USD, ETH-USD, ADA-USD, DOT-USD, SOL-USD
- 🔄 **Auto-refresh** danych z Coinbase + CoinMarketCap

## 🛡️ Redundancja danych

### **Strategia fallback:**
1. **Coinbase Pro API** (primary) - dane OHLCV
2. **CoinGecko API** (fallback) - dane OHLCV jeśli Coinbase nie działa

### **Dane fundamentalne:**
1. **CoinMarketCap API** (primary) - pełne dane fundamentalne
2. **CoinGecko API** (fallback) - podstawowe dane rynkowe

## 📊 Przykład wyniku

```bash
npm run analyze BTC-USD
```

```
📊 WYNIK ANALIZY
================
Symbol: BTC-USD
Źródła: Coinbase Pro API + CoinMarketCap API
Ostatnia cena: $35,247.82
Trend: bullish

🤖 DECYZJA AI
==============
Decyzja: BUY
Pewność: High
Cena wejścia: $35,247.82
Stop Loss: $34,800.00
Take Profit: $36,200.00

✅ POWODY:
1. Fast EMA crossed above Slow EMA with strong momentum
2. CoinMarketCap shows positive 24h change (+2.4%)
3. Volume confirmation from both sources
4. Market cap dominance stable at 52.3%

📊 COINMARKETCAP ANALIZA:
- Market Cap: $700B
- Volume 24h: $30B
- Dominance: 52.3%
- Zmiana 7d: +10%
```

## 🧠 Logika AI

### **Zaawansowany prompt:**
```
# Analiza Trading AI - Coinbase + CoinMarketCap

## Dane OHLCV (Coinbase Pro):
[świece cenowe z volume]

## Dane CoinMarketCap:
[market cap, volume, zmiany %, dominance]

## Wskaźniki techniczne:
[EMA, RSI, Stochastic RSI]

Wymagany format JSON:
{
  "decision": "BUY|SELL|WAIT",
  "confidence": "High|Medium|Low",
  "reasons": ["powód z analizy technicznej", "powód z CoinMarketCap"],
  "coinmarketcap_signals": "analiza danych z CMC"
}
```

## 🔍 Konwersja symboli

System automatycznie konwertuje między formatami:

```javascript
// Akceptowane formaty wejściowe:
'BTC' → 'BTC-USD'
'BTCUSD' → 'BTC-USD'
'BTCUSDT' → 'BTC-USD'
'BTC-USD' → 'BTC-USD' (bez zmian)

// Mapowanie na CoinMarketCap:
'BTC-USD' → 'BTC'
'ETH-USD' → 'ETH'

// Mapowanie na CoinGecko:
'BTC-USD' → 'bitcoin'
'ETH-USD' → 'ethereum'
```

## 🐳 Docker

```bash
# Uruchomienie z Docker Compose
docker-compose up -d

# Sprawdzenie logów
docker-compose logs -f ai-trading-analyzer
```

## 📚 Dokumentacja

- **README.md** - Główna dokumentacja
- **EXAMPLES.md** - Szczegółowe przykłady
- **PROJECT_SUMMARY.md** - Podsumowanie projektu

## ⚠️ Ważne ostrzeżenia

🚨 **To narzędzie służy celom edukacyjnym**
- Nie stanowi porady inwestycyjnej
- Trading kryptowalut niesie wysokie ryzyko
- Zawsze przeprowadzaj własne badania (DYOR)
- Dane z CoinMarketCap mogą mieć opóźnienia

## 🔗 Linki do API

- [Coinbase Pro API](https://docs.pro.coinbase.com/)
- [CoinMarketCap API](https://coinmarketcap.com/api/)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [OpenAI API](https://platform.openai.com/docs)

## 🤝 Wsparcie

- 🐛 **Issues**: [GitHub Issues](https://github.com/dobroslawdab/ai-trading-analyzer/issues)
- 📖 **Wiki**: [GitHub Wiki](https://github.com/dobroslawdab/ai-trading-analyzer/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/dobroslawdab/ai-trading-analyzer/discussions)

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

---

**System zoptymalizowany dla Coinbase Pro + CoinMarketCap! 🚀**