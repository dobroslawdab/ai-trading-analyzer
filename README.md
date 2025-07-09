# 🚀 AI Trading Analyzer

System analizy tradingowej z AI - automatyczne decyzje BUY/SELL/WAIT na podstawie danych OHLCV i wskaźników technicznych.

## 🎯 Funkcjonalności

- 📊 **Pobieranie danych OHLCV** z Binance API
- 🔍 **Analiza techniczna** (EMA, RSI, Stochastic RSI)
- 🤖 **Analiza AI** z OpenAI GPT-4
- 📈 **Automatyczne sygnały** BUY/SELL/WAIT
- 📱 **API REST** do integracji
- 🔄 **Monitoring w czasie rzeczywistym**
- 📊 **Wizualizacja danych**

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

# Uruchomienie
npm start
```

## 🔧 Konfiguracja

### Wymagane klucze API:
- **OpenAI API** - do analizy AI (WYMAGANE)
- **Binance API** - do pobierania danych OHLCV (opcjonalne)
- **CoinMarketCap API** - do danych fundamentalnych (opcjonalne)

### Zmienne środowiskowe (.env):
```env
# WYMAGANE
OPENAI_API_KEY=sk-your-openai-key

# OPCJONALNE (bez nich system będzie działał z ograniczeniami)
BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret  
COINMARKETCAP_API_KEY=your_cmc_key

# Konfiguracja tradingu
DEFAULT_SYMBOL=BTCUSDT
DEFAULT_INTERVAL=1h
LEVERAGE=10
POSITION_SIZE=1000
RISK_TOLERANCE=medium
```

## 📊 Jak to działa

1. **Pobieranie danych** - System pobiera dane OHLCV z Binance
2. **Obliczanie wskaźników** - Kalkuluje EMA, RSI, Stochastic RSI
3. **Przygotowanie pakietu** - Tworzy strukturę danych dla AI
4. **Analiza AI** - Wysyła dane do GPT-4 z promptem
5. **Decyzja** - Otrzymuje strukturalną odpowiedź BUY/SELL/WAIT
6. **Logowanie** - Zapisuje wszystkie decyzje i sygnały

## 🎯 Struktura danych dla AI

System przygotowuje kompletny pakiet danych:

```json
{
  "symbol": "BTCUSDT",
  "interval": "1h",
  "leverage": 10,
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
  "technical_indicators": {
    "fastEMA": [34500, 34600, 34700],
    "slowEMA": [34300, 34400, 34500],
    "rsi": [45, 50, 55],
    "stochRSI": [40, 45, 50],
    "currentTrend": "bullish",
    "emaCrossover": "bullish_crossover"
  },
  "market_context": {
    "volume_24h": 30000000000,
    "percent_change_24h": 1.5,
    "market_cap": 700000000000
  }
}
```

## 🔌 API Endpoints

- `GET /api/status` - Status systemu
- `GET /api/analysis/:symbol` - Analiza dla symbolu
- `POST /api/analyze` - Ręczna analiza z parametrami
- `GET /api/signals` - Ostatnie sygnały
- `GET /api/market-data/:symbol` - Dane rynkowe
- `DELETE /api/cache` - Wyczyść cache
- `GET /api/config` - Aktualna konfiguracja
- `PUT /api/config` - Aktualizuj konfigurację

## 📈 Przykład użycia

### Linia komend:
```bash
# Szybka analiza BTCUSDT
npm run analyze BTCUSDT

# Analiza innej krypto
npm run analyze ETHUSDT
```

### API:
```bash
# Status systemu
curl http://localhost:3000/api/status

# Analiza BTC
curl http://localhost:3000/api/analysis/BTCUSDT

# Ostatnie sygnały
curl http://localhost:3000/api/signals
```

### Programowo:
```javascript
import { TradingAnalyzer } from './src/TradingAnalyzer.js';

const analyzer = new TradingAnalyzer();
const result = await analyzer.analyze('BTCUSDT');

console.log(result);
// {
//   decision: 'BUY',
//   confidence: 'High',
//   entry_price: 35200,
//   stop_loss: 34800,
//   take_profit: 36000
// }
```

## 🧠 Logika AI

System używa zaawansowanego prompta dla AI:

```
# Analiza Trading AI

## Zadanie
Przeanalizuj dane tradingowe i podaj rekomendację: BUY, SELL, lub WAIT.

## Kontekst
- Dźwignia: 10x (wysokie ryzyko!)
- Rozmiar pozycji: $1000
- Tolerancja ryzyka: medium

## Wymagany format odpowiedzi (JSON):
{
  "decision": "BUY|SELL|WAIT",
  "confidence": "High|Medium|Low",
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "risk_reward_ratio": number,
  "reasons": ["powód 1", "powód 2"],
  "warnings": ["ostrzeżenie 1", "ostrzeżenie 2"]
}
```

## 🔍 Wskaźniki techniczne

### Implementowane wskaźniki:
- **EMA (Exponential Moving Average)**: Fast EMA (12) vs Slow EMA (25)
- **RSI (Relative Strength Index)**: 14-period RSI
- **Stochastic RSI**: K=3, D=3 smoothing
- **Volume Analysis**: Potwierdzenie sygnałów wolumenem
- **Trend Detection**: Analiza kierunku trendu

### Logika sygnałów:
```javascript
// Buy Signal
if (fastEMA > slowEMA && !previousBuySignal) {
  generateBuySignal();
}

// Sell Signal  
if (fastEMA < slowEMA && previousBuySignal) {
  generateSellSignal();
}

// Signal Strength
if (RSI < 30 && StochRSI < 20) strength = "Strong";
else if (RSI < 40 && StochRSI < 30) strength = "Medium";
else strength = "Weak";
```

## 🔄 Automatyzacja

### Cron Jobs:
- **Co 15 minut**: Automatyczne analizy dla BTCUSDT, ETHUSDT, ADAUSDT, DOTUSDT
- **Co godzinę**: Czyszczenie przestarzałego cache

### Cache System:
- Przechowuje analizy przez 5 minut
- Automatyczne odświeżanie dla popularnych symboli
- Możliwość ręcznego czyszczenia

## 📋 Logi

System loguje wszystkie operacje:

```
2024-06-01T10:30:00Z [info]: Rozpoczynam analizę dla BTCUSDT
2024-06-01T10:30:02Z [info]: Pobrano 100 świec dla BTCUSDT
2024-06-01T10:30:03Z [info]: Obliczono wskaźniki techniczne
2024-06-01T10:30:05Z [info]: Otrzymano analizę AI: BUY (High)
2024-06-01T10:30:05Z [info]: Analiza zakończona: BUY (High)
```

## 🛡️ Bezpieczeństwo

- Klucze API przechowywane w zmiennych środowiskowych
- Walidacja wszystkich wejść
- Rate limiting dla API
- Logowanie wszystkich operacji
- Timeout dla zapytań zewnętrznych

## 🧪 Testowanie

```bash
# Uruchom testy
npm test

# Test konkretnej funkcji
npm run analyze BTCUSDT

# Test API
curl http://localhost:3000/api/status
```

## 📊 Monitoring

### Metryki systemu:
- Liczba przeprowadzonych analiz
- Czas odpowiedzi API
- Sukcesowość połączeń z zewnętrznymi API
- Rozmiar cache

### Health Check:
```bash
curl http://localhost:3000/api/status

# Odpowiedź:
{
  "status": "running",
  "timestamp": "2024-06-01T10:30:00Z",
  "version": "1.0.0",
  "cache_size": 4
}
```

## 🛠 Technologie

- **Node.js** - Runtime
- **Express** - Web framework
- **OpenAI GPT-4** - Analiza AI
- **Technical Indicators** - Wskaźniki techniczne
- **Binance API** - Dane rynkowe
- **Winston** - Logowanie
- **Node-cron** - Zadania cykliczne

## 🚨 Ważne ostrzeżenia

⚠️ **To narzędzie służy celom edukacyjnym i badawczym**

- Nie stanowi porady inwestycyjnej
- Trading kryptowalut niesie wysokie ryzyko
- Dźwignia zwiększa zarówno zyski jak i straty
- Zawsze przeprowadzaj własne badania (DYOR)
- Nie inwestuj więcej niż możesz stracić

## 🤝 Wsparcie

- 📧 Issues: [GitHub Issues](https://github.com/dobroslawdab/ai-trading-analyzer/issues)
- 📚 Wiki: [GitHub Wiki](https://github.com/dobroslawdab/ai-trading-analyzer/wiki)
- 💬 Dyskusje: [GitHub Discussions](https://github.com/dobroslawdab/ai-trading-analyzer/discussions)

## 📄 Licencja

MIT License - zobacz [LICENSE](LICENSE) dla szczegółów.

---

**Pamiętaj**: AI może mylić się tak samo jak ludzie. Używaj tego narzędzia jako wsparcia, ale ostateczne decyzje podejmuj sam na podstawie kompleksowej analizy!

## 🎯 Roadmap

- [ ] Dodanie więcej wskaźników technicznych (MACD, Bollinger Bands)
- [ ] Integracja z więcej giełd kryptowalut
- [ ] Dashboard webowy z wizualizacjami
- [ ] Backtesting strategies
- [ ] Telegram/Discord boty
- [ ] Paper trading simulator
- [ ] Machine learning models
- [ ] Portfolio management