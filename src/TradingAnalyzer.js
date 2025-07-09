import axios from 'axios';
import { SMA, EMA, RSI, StochasticRSI } from 'technicalindicators';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import moment from 'moment';

dotenv.config();

/**
 * Główna klasa do analizy tradingowej z AI
 */
export class TradingAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.config = {
      symbol: process.env.DEFAULT_SYMBOL || 'BTCUSDT',
      interval: process.env.DEFAULT_INTERVAL || '1h',
      leverage: parseInt(process.env.LEVERAGE) || 10,
      positionSize: parseInt(process.env.POSITION_SIZE) || 1000,
      riskTolerance: process.env.RISK_TOLERANCE || 'medium'
    };

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: process.env.LOG_FILE || './logs/trading.log' })
      ]
    });
  }

  /**
   * Pobiera dane OHLCV z Binance
   */
  async fetchOHLCVData(symbol, interval, limit = 100) {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/klines', {
        params: {
          symbol,
          interval,
          limit
        }
      });

      const candles = response.data.map(kline => ({
        timestamp: new Date(kline[0]).toISOString(),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));

      this.logger.info(`Pobrano ${candles.length} świec dla ${symbol}`);
      return candles;
    } catch (error) {
      this.logger.error(`Błąd pobierania danych OHLCV: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pobiera dane fundamentalne z CoinMarketCap
   */
  async fetchMarketData(symbol) {
    try {
      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
        },
        params: {
          symbol: symbol.replace('USDT', '')
        }
      });

      const data = response.data.data[symbol.replace('USDT', '')];
      
      return {
        market_cap: data.quote.USD.market_cap,
        volume_24h: data.quote.USD.volume_24h,
        percent_change_1h: data.quote.USD.percent_change_1h,
        percent_change_24h: data.quote.USD.percent_change_24h,
        percent_change_7d: data.quote.USD.percent_change_7d,
        circulating_supply: data.circulating_supply,
        total_supply: data.total_supply
      };
    } catch (error) {
      this.logger.warn(`Nie udało się pobrać danych z CoinMarketCap: ${error.message}`);
      return {
        market_cap: null,
        volume_24h: null,
        percent_change_1h: null,
        percent_change_24h: null,
        percent_change_7d: null
      };
    }
  }

  /**
   * Oblicza wskaźniki techniczne
   */
  calculateTechnicalIndicators(candles) {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    // EMA
    const fastEMA = EMA.calculate({ period: 12, values: closes });
    const slowEMA = EMA.calculate({ period: 25, values: closes });
    
    // RSI
    const rsi = RSI.calculate({ period: 14, values: closes });
    
    // Stochastic RSI
    const stochRSI = StochasticRSI.calculate({
      rsi: rsi,
      kPeriod: 3,
      dPeriod: 3,
      stochasticPeriod: 14
    });

    // Określenie trendu
    const lastFastEMA = fastEMA[fastEMA.length - 1];
    const lastSlowEMA = slowEMA[slowEMA.length - 1];
    const currentTrend = lastFastEMA > lastSlowEMA ? 'bullish' : 'bearish';

    // Sygnały EMA crossover
    const emaCrossover = this.detectEMACrossover(fastEMA, slowEMA);

    this.logger.info(`Obliczono wskaźniki techniczne: EMA(${fastEMA.length}), RSI(${rsi.length}), StochRSI(${stochRSI.length})`);

    return {
      fastEMA,
      slowEMA,
      rsi,
      stochRSI,
      currentTrend,
      emaCrossover,
      volumes
    };
  }

  /**
   * Wykrywa przecięcia EMA
   */
  detectEMACrossover(fastEMA, slowEMA) {
    if (fastEMA.length < 2 || slowEMA.length < 2) return null;

    const current = fastEMA[fastEMA.length - 1] > slowEMA[slowEMA.length - 1];
    const previous = fastEMA[fastEMA.length - 2] > slowEMA[slowEMA.length - 2];

    if (current && !previous) return 'bullish_crossover';
    if (!current && previous) return 'bearish_crossover';
    return null;
  }

  /**
   * Przygotowuje pakiet danych dla AI
   */
  prepareAIDataPackage(symbol, candles, indicators, marketData) {
    const recentSignals = this.generateRecentSignals(candles, indicators);
    
    return {
      symbol,
      interval: this.config.interval,
      leverage: this.config.leverage,
      position_size: this.config.positionSize,
      risk_tolerance: this.config.riskTolerance,
      timestamp: new Date().toISOString(),
      
      ohlcv_data: {
        candles: candles.slice(-50), // Ostatnie 50 świec
        total_candles: candles.length
      },
      
      technical_indicators: {
        fastEMA: indicators.fastEMA.slice(-20),
        slowEMA: indicators.slowEMA.slice(-20),
        rsi: indicators.rsi.slice(-20),
        stochRSI: indicators.stochRSI.slice(-20),
        currentTrend: indicators.currentTrend,
        emaCrossover: indicators.emaCrossover
      },
      
      market_context: marketData,
      
      recent_signals: recentSignals,
      
      portfolio_context: {
        current_position: 'none',
        available_balance: 10000,
        max_risk_per_trade: this.config.positionSize * 0.1,
        leverage_multiplier: this.config.leverage
      }
    };
  }

  /**
   * Generuje ostatnie sygnały
   */
  generateRecentSignals(candles, indicators) {
    const signals = [];
    
    if (indicators.emaCrossover === 'bullish_crossover') {
      signals.push({
        timestamp: candles[candles.length - 1].timestamp,
        type: 'BUY',
        price: candles[candles.length - 1].close,
        strength: 'Medium',
        reason: 'Fast EMA crosses above Slow EMA'
      });
    }
    
    if (indicators.emaCrossover === 'bearish_crossover') {
      signals.push({
        timestamp: candles[candles.length - 1].timestamp,
        type: 'SELL',
        price: candles[candles.length - 1].close,
        strength: 'Medium',
        reason: 'Fast EMA crosses below Slow EMA'
      });
    }
    
    return signals;
  }

  /**
   * Wysyła dane do AI i otrzymuje analizę
   */
  async analyzeWithAI(dataPackage) {
    const prompt = this.createTradingPrompt(dataPackage);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem od analizy technicznej i tradingu kryptowalut. Analizujesz dane i podajesz strukturalne rekomendacje.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
        max_tokens: parseInt(process.env.MAX_TOKENS) || 1000
      });

      const aiResponse = response.choices[0].message.content;
      const analysis = this.parseAIResponse(aiResponse);
      
      this.logger.info(`Otrzymano analizę AI: ${analysis.decision} (${analysis.confidence})`);
      
      return analysis;
    } catch (error) {
      this.logger.error(`Błąd analizy AI: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tworzy prompt dla AI
   */
  createTradingPrompt(dataPackage) {
    return `
# Analiza Trading AI

## Zadanie
Przeanalizuj poniższe dane tradingowe i podaj rekomendację: **BUY**, **SELL**, lub **WAIT**.

## Kontekst
- **Symbol**: ${dataPackage.symbol}
- **Dźwignia**: ${dataPackage.leverage}x (wysokie ryzyko!)
- **Rozmiar pozycji**: $${dataPackage.position_size}
- **Tolerancja ryzyka**: ${dataPackage.risk_tolerance}

## Dane do analizy

### Ostatnie świece OHLCV:
${JSON.stringify(dataPackage.ohlcv_data.candles.slice(-5), null, 2)}

### Wskaźniki techniczne:
- **Fast EMA (12)**: ${dataPackage.technical_indicators.fastEMA.slice(-3)}
- **Slow EMA (25)**: ${dataPackage.technical_indicators.slowEMA.slice(-3)}
- **RSI**: ${dataPackage.technical_indicators.rsi.slice(-3)}
- **Stochastic RSI**: ${dataPackage.technical_indicators.stochRSI.slice(-3)}
- **Trend**: ${dataPackage.technical_indicators.currentTrend}
- **EMA Crossover**: ${dataPackage.technical_indicators.emaCrossover}

### Kontekst rynkowy:
${JSON.stringify(dataPackage.market_context, null, 2)}

### Ostatnie sygnały:
${JSON.stringify(dataPackage.recent_signals, null, 2)}

## Wymagany format odpowiedzi (JSON):
{
  "decision": "BUY|SELL|WAIT",
  "confidence": "High|Medium|Low",
  "entry_price": number,
  "stop_loss": number,
  "take_profit": number,
  "risk_reward_ratio": number,
  "position_size": ${dataPackage.position_size},
  "reasons": ["powód 1", "powód 2"],
  "warnings": ["ostrzeżenie 1", "ostrzeżenie 2"],
  "analysis": {
    "trend_strength": "Strong|Medium|Weak",
    "volume_confirmation": true|false,
    "support_resistance": "opis poziomów",
    "market_sentiment": "Bullish|Bearish|Neutral"
  }
}

**WAŻNE**: Odpowiedz TYLKO kodem JSON, bez dodatkowych komentarzy!
`;
  }

  /**
   * Parsuje odpowiedź AI
   */
  parseAIResponse(response) {
    try {
      // Próba wyciągnięcia JSON z odpowiedzi
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Nie znaleziono JSON w odpowiedzi AI');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error(`Błąd parsowania odpowiedzi AI: ${error.message}`);
      
      // Fallback response
      return {
        decision: 'WAIT',
        confidence: 'Low',
        entry_price: null,
        stop_loss: null,
        take_profit: null,
        risk_reward_ratio: null,
        position_size: this.config.positionSize,
        reasons: ['Błąd parsowania odpowiedzi AI'],
        warnings: ['Zalecane ponowne uruchomienie analizy']
      };
    }
  }

  /**
   * Główna metoda analizy
   */
  async analyze(symbol = null) {
    const targetSymbol = symbol || this.config.symbol;
    
    try {
      this.logger.info(`Rozpoczynam analizę dla ${targetSymbol}`);
      
      // 1. Pobierz dane OHLCV
      const candles = await this.fetchOHLCVData(targetSymbol, this.config.interval);
      
      // 2. Pobierz dane fundamentalne
      const marketData = await this.fetchMarketData(targetSymbol);
      
      // 3. Oblicz wskaźniki techniczne
      const indicators = this.calculateTechnicalIndicators(candles);
      
      // 4. Przygotuj pakiet danych
      const dataPackage = this.prepareAIDataPackage(targetSymbol, candles, indicators, marketData);
      
      // 5. Analizuj z AI
      const analysis = await this.analyzeWithAI(dataPackage);
      
      // 6. Zwróć pełny wynik
      const result = {
        timestamp: new Date().toISOString(),
        symbol: targetSymbol,
        analysis,
        raw_data: {
          candles_count: candles.length,
          last_price: candles[candles.length - 1].close,
          trend: indicators.currentTrend,
          crossover: indicators.emaCrossover
        }
      };
      
      this.logger.info(`Analiza zakończona: ${analysis.decision} (${analysis.confidence})`);
      
      return result;
      
    } catch (error) {
      this.logger.error(`Błąd analizy: ${error.message}`);
      throw error;
    }
  }
}