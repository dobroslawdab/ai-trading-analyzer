import express from 'express';
import cors from 'cors';
import { TradingAnalyzer } from './TradingAnalyzer.js';
import { createLogger, format, transports } from 'winston';
import cron from 'node-cron';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: './logs/api.log' })
  ]
});

// Initialize Trading Analyzer
const analyzer = new TradingAnalyzer();

// Cache for storing recent analyses
const analysisCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minut

// API Routes

/**
 * GET /api/status - Status systemu
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    cache_size: analysisCache.size
  });
});

/**
 * GET /api/analysis/:symbol - Analiza dla konkretnego symbolu
 */
app.get('/api/analysis/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const cacheKey = symbol.toUpperCase();
  
  try {
    // Sprawdź cache
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      logger.info(`Zwracam analizę z cache dla ${symbol}`);
      return res.json({
        ...cached.data,
        cached: true,
        cache_age: Date.now() - cached.timestamp
      });
    }
    
    // Przeprowadź nową analizę
    logger.info(`Rozpoczynam analizę dla ${symbol}`);
    const analysis = await analyzer.analyze(symbol);
    
    // Zapisz w cache
    analysisCache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });
    
    res.json({
      ...analysis,
      cached: false
    });
    
  } catch (error) {
    logger.error(`Błąd analizy dla ${symbol}: ${error.message}`);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      symbol
    });
  }
});

/**
 * POST /api/analyze - Ręczna analiza z parametrami
 */
app.post('/api/analyze', async (req, res) => {
  const { symbol, interval, leverage, position_size } = req.body;
  
  try {
    // Tymczasowo zmień konfigurację
    const originalConfig = { ...analyzer.config };
    
    if (symbol) analyzer.config.symbol = symbol;
    if (interval) analyzer.config.interval = interval;
    if (leverage) analyzer.config.leverage = leverage;
    if (position_size) analyzer.config.positionSize = position_size;
    
    const analysis = await analyzer.analyze();
    
    // Przywróć oryginalną konfigurację
    analyzer.config = originalConfig;
    
    res.json(analysis);
    
  } catch (error) {
    logger.error(`Błąd ręcznej analizy: ${error.message}`);
    res.status(500).json({
      error: 'Manual analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/signals - Lista ostatnich sygnałów
 */
app.get('/api/signals', async (req, res) => {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT'];
  const signals = [];
  
  try {
    for (const symbol of symbols) {
      const cached = analysisCache.get(symbol);
      if (cached && cached.data.analysis) {
        signals.push({
          symbol,
          decision: cached.data.analysis.decision,
          confidence: cached.data.analysis.confidence,
          timestamp: cached.data.timestamp,
          entry_price: cached.data.analysis.entry_price,
          reasons: cached.data.analysis.reasons
        });
      }
    }
    
    res.json({
      signals: signals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      count: signals.length,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Błąd pobierania sygnałów: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch signals',
      message: error.message
    });
  }
});

/**
 * GET /api/market-data/:symbol - Dane rynkowe
 */
app.get('/api/market-data/:symbol', async (req, res) => {
  const { symbol } = req.params;
  
  try {
    const [ohlcv, marketData] = await Promise.all([
      analyzer.fetchOHLCVData(symbol, '1h', 50),
      analyzer.fetchMarketData(symbol)
    ]);
    
    const indicators = analyzer.calculateTechnicalIndicators(ohlcv);
    
    res.json({
      symbol,
      timestamp: new Date().toISOString(),
      ohlcv: ohlcv.slice(-20), // Ostatnie 20 świec
      indicators: {
        trend: indicators.currentTrend,
        crossover: indicators.emaCrossover,
        rsi: indicators.rsi.slice(-5),
        fastEMA: indicators.fastEMA.slice(-5),
        slowEMA: indicators.slowEMA.slice(-5)
      },
      market_data: marketData
    });
    
  } catch (error) {
    logger.error(`Błąd pobierania danych rynkowych dla ${symbol}: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: error.message
    });
  }
});

/**
 * DELETE /api/cache - Wyczyść cache
 */
app.delete('/api/cache', (req, res) => {
  const cacheSize = analysisCache.size;
  analysisCache.clear();
  
  logger.info(`Wyczyszczono cache (${cacheSize} elementów)`);
  
  res.json({
    message: 'Cache cleared',
    cleared_items: cacheSize,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/config - Aktualna konfiguracja
 */
app.get('/api/config', (req, res) => {
  res.json({
    config: analyzer.config,
    timestamp: new Date().toISOString()
  });
});

/**
 * PUT /api/config - Aktualizuj konfigurację
 */
app.put('/api/config', (req, res) => {
  const { symbol, interval, leverage, position_size, risk_tolerance } = req.body;
  
  if (symbol) analyzer.config.symbol = symbol;
  if (interval) analyzer.config.interval = interval;
  if (leverage) analyzer.config.leverage = leverage;
  if (position_size) analyzer.config.positionSize = position_size;
  if (risk_tolerance) analyzer.config.riskTolerance = risk_tolerance;
  
  logger.info('Zaktualizowano konfigurację:', analyzer.config);
  
  res.json({
    message: 'Configuration updated',
    config: analyzer.config,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error(`API Error: ${error.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /api/status',
      'GET /api/analysis/:symbol',
      'POST /api/analyze',
      'GET /api/signals',
      'GET /api/market-data/:symbol',
      'DELETE /api/cache',
      'GET /api/config',
      'PUT /api/config'
    ]
  });
});

// Automatyczne analizy co 15 minut
cron.schedule('*/15 * * * *', async () => {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT'];
  
  logger.info('Rozpoczynam automatyczne analizy...');
  
  for (const symbol of symbols) {
    try {
      const analysis = await analyzer.analyze(symbol);
      analysisCache.set(symbol, {
        data: analysis,
        timestamp: Date.now()
      });
      
      logger.info(`Automatyczna analiza ${symbol}: ${analysis.analysis.decision}`);
    } catch (error) {
      logger.error(`Błąd automatycznej analizy ${symbol}: ${error.message}`);
    }
  }
});

// Czyszczenie cache co godzinę
cron.schedule('0 * * * *', () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      analysisCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.info(`Wyczyszczono ${cleaned} przestarzałych elementów cache`);
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AI Trading Analyzer API uruchomiony na porcie ${PORT}`);
  logger.info(`📊 Dostępne endpointy:`);
  logger.info(`   GET  /api/status`);
  logger.info(`   GET  /api/analysis/:symbol`);
  logger.info(`   POST /api/analyze`);
  logger.info(`   GET  /api/signals`);
  logger.info(`   GET  /api/market-data/:symbol`);
  logger.info(`   DELETE /api/cache`);
  logger.info(`   GET  /api/config`);
  logger.info(`   PUT  /api/config`);
});

export default app;