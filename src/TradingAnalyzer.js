import axios from 'axios';
import { SMA, EMA, RSI, StochasticRSI } from 'technicalindicators';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import moment from 'moment';

dotenv.config();

/**
 * Główna klasa do analizy tradingowej z AI - wersja z Coinbase + CoinMarketCap
 */
export class TradingAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.config = {
      symbol: process.env.DEFAULT_SYMBOL || 'BTC-USD',
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
   * Pobiera dane OHLCV z Coinbase Pro API
   */
  async fetchOHLCVData(symbol, interval = '3600', limit = 300) {
    try {
      // Konwertuj interwał na sekundy dla Coinbase
      const intervalSeconds = this.convertIntervalToSeconds(interval);
      
      // Oblicz czas start/end
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (limit * intervalSeconds * 1000));
      
      const response = await axios.get(`https://api.exchange.coinbase.com/products/${symbol}/candles`, {
        params: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          granularity: intervalSeconds
        }
      });

      // Coinbase zwraca: [timestamp, low, high, open, close, volume]
      const candles = response.data.map(candle => ({
        timestamp: new Date(candle[0] * 1000).toISOString(),
        open: parseFloat(candle[3]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[1]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      })).reverse(); // Coinbase zwraca od najnowszych, więc odwracamy

      this.logger.info(`Pobrano ${candles.length} świec z Coinbase dla ${symbol}`);
      return candles;
    } catch (error) {
      this.logger.error(`Błąd pobierania danych OHLCV z Coinbase: ${error.message}`);
      
      // Fallback do CoinGecko jeśli Coinbase nie działa
      return await this.fetchOHLCVFromCoinGecko(symbol, interval, limit);
    }
  }

  /**
   * Fallback - pobiera dane z CoinGecko
   */
  async fetchOHLCVFromCoinGecko(symbol, interval, limit) {
    try {
      // Konwertuj symbol Coinbase na CoinGecko ID
      const coinId = this.coinbaseSymbolToCoinGeckoId(symbol);
      const days = Math.ceil(limit * this.convertIntervalToSeconds(interval) / 86400);
      
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/ohlc`, {
        params: {
          vs_currency: 'usd',
          days: Math.min(days, 365) // CoinGecko limit
        }
      });

      const candles = response.data.map(candle => ({
        timestamp: new Date(candle[0]).toISOString(),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: 0 // CoinGecko OHLC nie ma volume
      }));

      this.logger.info(`Pobrano ${candles.length} świec z CoinGecko jako fallback dla ${symbol}`);
      return candles.slice(-limit); // Obetnij do żądanej liczby
    } catch (error) {
      this.logger.error(`Błąd pobierania danych z CoinGecko: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pobiera dane z CoinMarketCap (główne źródło danych fundamentalnych)
   */
  async fetchCoinMarketCapData(symbol) {
    try {
      // Konwertuj symbol Coinbase na CoinMarketCap
      const cmcSymbol = this.coinbaseSymbolToCMC(symbol);
      
      const response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
        },
        params: {
          symbol: cmcSymbol
        }
      });

      const data = response.data.data[cmcSymbol][0]; // CMC v2 zwraca array
      
      return {
        market_cap: data.quote.USD.market_cap,
        volume_24h: data.quote.USD.volume_24h,
        percent_change_1h: data.quote.USD.percent_change_1h,
        percent_change_24h: data.quote.USD.percent_change_24h,
        percent_change_7d: data.quote.USD.percent_change_7d,
        percent_change_30d: data.quote.USD.percent_change_30d,
        circulating_supply: data.circulating_supply,
        total_supply: data.total_supply,
        max_supply: data.max_supply,
        market_cap_dominance: data.quote.USD.market_cap_dominance,
        fully_diluted_market_cap: data.quote.USD.fully_diluted_market_cap,
        last_updated: data.last_updated
      };
    } catch (error) {
      this.logger.warn(`Nie udało się pobrać danych z CoinMarketCap: ${error.message}`);
      
      // Fallback do CoinGecko dla podstawowych danych
      return await this.fetchCoinGeckoMarketData(symbol);
    }
  }

  /**
   * Fallback dla danych fundamentalnych z CoinGecko
   */
  async fetchCoinGeckoMarketData(symbol) {
    try {
      const coinId = this.coinbaseSymbolToCoinGeckoId(symbol);
      
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false
        }
      });

      const data = response.data.market_data;
      
      return {
        market_cap: data.market_cap.usd,
        volume_24h: data.total_volume.usd,
        percent_change_1h: data.price_change_percentage_1h_in_currency?.usd || null,
        percent_change_24h: data.price_change_percentage_24h_in_currency?.usd || null,
        percent_change_7d: data.price_change_percentage_7d_in_currency?.usd || null,
        percent_change_30d: data.price_change_percentage_30d_in_currency?.usd || null,
        circulating_supply: data.circulating_supply,
        total_supply: data.total_supply,
        max_supply: data.max_supply,
        market_cap_dominance: null,
        fully_diluted_market_cap: data.fully_diluted_valuation?.usd || null,
        last_updated: data.last_updated
      };
    } catch (error) {
      this.logger.error(`Błąd pobierania danych z CoinGecko: ${error.message}`);
      
      // Zwróć puste dane jeśli wszystko się nie udało
      return {
        market_cap: null,
        volume_24h: null,
        percent_change_1h: null,
        percent_change_24h: null,
        percent_change_7d: null,
        percent_change_30d: null,
        circulating_supply: null,
        total_supply: null,
        max_supply: null
      };
    }
  }

  /**
   * Helper functions for symbol conversion
   */
  coinbaseSymbolToCMC(symbol) {
    const mapping = {
      'BTC-USD': 'BTC',
      'ETH-USD': 'ETH',
      'ADA-USD': 'ADA',
      'DOT-USD': 'DOT',
      'SOL-USD': 'SOL',
      'MATIC-USD': 'MATIC',
      'AVAX-USD': 'AVAX',
      'ATOM-USD': 'ATOM',
      'LINK-USD': 'LINK',
      'UNI-USD': 'UNI'
    };
    
    return mapping[symbol] || symbol.split('-')[0];
  }

  coinbaseSymbolToCoinGeckoId(symbol) {
    const mapping = {
      'BTC-USD': 'bitcoin',
      'ETH-USD': 'ethereum',
      'ADA-USD': 'cardano',
      'DOT-USD': 'polkadot',
      'SOL-USD': 'solana',
      'MATIC-USD': 'polygon',
      'AVAX-USD': 'avalanche-2',
      'ATOM-USD': 'cosmos',
      'LINK-USD': 'chainlink',
      'UNI-USD': 'uniswap'
    };
    
    return mapping[symbol] || symbol.split('-')[0].toLowerCase();
  }

  convertIntervalToSeconds(interval) {
    const mapping = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400
    };
    
    return mapping[interval] || 3600; // Default 1h
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
  prepareAIDataPackage(symbol, candles, indicators, coinMarketCapData) {
    const recentSignals = this.generateRecentSignals(candles, indicators);
    
    return {
      symbol,
      interval: this.config.interval,
      leverage: this.config.leverage,
      position_size: this.config.positionSize,
      risk_tolerance: this.config.riskTolerance,
      timestamp: new Date().toISOString(),
      data_sources: {
        ohlcv: 'Coinbase Pro API',
        fundamentals: 'CoinMarketCap API',
        fallback: 'CoinGecko API'
      },
      
      ohlcv_data: {
        candles: candles.slice(-50), // Ostatnie 50 świec
        total_candles: candles.length,
        latest_price: candles[candles.length - 1].close,
        price_change_session: ((candles[candles.length - 1].close - candles[0].close) / candles[0].close * 100).toFixed(2)
      },
      
      technical_indicators: {
        fastEMA: indicators.fastEMA.slice(-20),
        slowEMA: indicators.slowEMA.slice(-20),
        rsi: indicators.rsi.slice(-20),
        stochRSI: indicators.stochRSI.slice(-20),
        currentTrend: indicators.currentTrend,
        emaCrossover: indicators.emaCrossover,
        latest_rsi: indicators.rsi[indicators.rsi.length - 1],
        latest_stoch_rsi: indicators.stochRSI[indicators.stochRSI.length - 1]
      },
      
      coinmarketcap_data: coinMarketCapData,
      
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
            content: 'Jesteś ekspertem od analizy technicznej i tradingu kryptowalut. Analizujesz dane z Coinbase i CoinMarketCap i podajesz strukturalne rekomendacje.'
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
# Analiza Trading AI - Coinbase + CoinMarketCap

## Zadanie
Przeanalizuj poniższe dane tradingowe i podaj rekomendację: **BUY**, **SELL**, lub **WAIT**.

## Kontekst
- **Symbol**: ${dataPackage.symbol} (z Coinbase)
- **Dźwignia**: ${dataPackage.leverage}x (wysokie ryzyko!)
- **Rozmiar pozycji**: $${dataPackage.position_size}
- **Tolerancja ryzyka**: ${dataPackage.risk_tolerance}
- **Źródła danych**: ${dataPackage.data_sources.ohlcv} + ${dataPackage.data_sources.fundamentals}

## Dane OHLCV (Coinbase):
**Ostatnie 5 świec:**
${JSON.stringify(dataPackage.ohlcv_data.candles.slice(-5), null, 2)}

**Podsumowanie sesji:**
- Aktualna cena: $${dataPackage.ohlcv_data.latest_price}
- Zmiana w sesji: ${dataPackage.ohlcv_data.price_change_session}%
- Liczba świec: ${dataPackage.ohlcv_data.total_candles}

## Wskaźniki techniczne:
- **Fast EMA (12)**: ${dataPackage.technical_indicators.fastEMA.slice(-3)}
- **Slow EMA (25)**: ${dataPackage.technical_indicators.slowEMA.slice(-3)}
- **RSI**: ${dataPackage.technical_indicators.rsi.slice(-3)} (ostatni: ${dataPackage.technical_indicators.latest_rsi})
- **Stochastic RSI**: ${dataPackage.technical_indicators.stochRSI.slice(-3)} (ostatni: ${dataPackage.technical_indicators.latest_stoch_rsi})
- **Trend**: ${dataPackage.technical_indicators.currentTrend}
- **EMA Crossover**: ${dataPackage.technical_indicators.emaCrossover}

## Dane CoinMarketCap:
${JSON.stringify(dataPackage.coinmarketcap_data, null, 2)}

## Ostatnie sygnały:
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
  "reasons": ["powód 1", "powód 2", "powód 3"],
  "warnings": ["ostrzeżenie 1", "ostrzeżenie 2"],
  "analysis": {
    "trend_strength": "Strong|Medium|Weak",
    "volume_confirmation": true|false,
    "support_resistance": "opis poziomów",
    "market_sentiment": "Bullish|Bearish|Neutral",
    "coinmarketcap_signals": "analiza danych z CMC"
  }
}

**WAŻNE**: 
- Weź pod uwagę dane z CoinMarketCap (zmiany 1h/24h/7d/30d, dominacja rynku, wolumen)
- Odpowiedz TYLKO kodem JSON, bez dodatkowych komentarzy!
- Uwzględnij wysoką dźwignię ${dataPackage.leverage}x w ocenie ryzyka
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
      this.logger.info(`Rozpoczynam analizę dla ${targetSymbol} (Coinbase + CoinMarketCap)`);
      
      // 1. Pobierz dane OHLCV z Coinbase
      const candles = await this.fetchOHLCVData(targetSymbol, this.config.interval);
      
      // 2. Pobierz dane z CoinMarketCap
      const coinMarketCapData = await this.fetchCoinMarketCapData(targetSymbol);
      
      // 3. Oblicz wskaźniki techniczne
      const indicators = this.calculateTechnicalIndicators(candles);
      
      // 4. Przygotuj pakiet danych
      const dataPackage = this.prepareAIDataPackage(targetSymbol, candles, indicators, coinMarketCapData);
      
      // 5. Analizuj z AI
      const analysis = await this.analyzeWithAI(dataPackage);
      
      // 6. Zwróć pełny wynik
      const result = {
        timestamp: new Date().toISOString(),
        symbol: targetSymbol,
        analysis,
        data_sources: dataPackage.data_sources,
        raw_data: {
          candles_count: candles.length,
          last_price: candles[candles.length - 1].close,
          trend: indicators.currentTrend,
          crossover: indicators.emaCrossover,
          market_cap: coinMarketCapData.market_cap,
          volume_24h: coinMarketCapData.volume_24h,
          change_24h: coinMarketCapData.percent_change_24h
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