import { TradingAnalyzer } from '../src/TradingAnalyzer.js';

/**
 * Przykładowy test systemu analizy tradingowej
 */
describe('TradingAnalyzer', () => {
  let analyzer;
  
  beforeEach(() => {
    analyzer = new TradingAnalyzer();
  });

  test('should initialize with default config', () => {
    expect(analyzer.config).toBeDefined();
    expect(analyzer.config.symbol).toBe('BTCUSDT');
    expect(analyzer.config.leverage).toBe(10);
  });

  test('should detect EMA crossover', () => {
    const fastEMA = [100, 101, 102, 103];
    const slowEMA = [102, 101, 100, 99];
    
    const crossover = analyzer.detectEMACrossover(fastEMA, slowEMA);
    expect(crossover).toBe('bullish_crossover');
  });

  test('should calculate technical indicators', () => {
    const mockCandles = [
      { close: 100, high: 105, low: 95, volume: 1000 },
      { close: 102, high: 106, low: 96, volume: 1200 },
      { close: 104, high: 108, low: 98, volume: 1100 },
      { close: 103, high: 107, low: 97, volume: 1300 }
    ];
    
    const indicators = analyzer.calculateTechnicalIndicators(mockCandles);
    
    expect(indicators.fastEMA).toBeDefined();
    expect(indicators.slowEMA).toBeDefined();
    expect(indicators.rsi).toBeDefined();
    expect(indicators.currentTrend).toBeDefined();
  });

  test('should prepare AI data package', () => {
    const mockCandles = [
      { 
        timestamp: '2024-01-01T00:00:00Z',
        open: 100, 
        close: 102, 
        high: 105, 
        low: 95, 
        volume: 1000 
      }
    ];
    
    const mockIndicators = {
      fastEMA: [100, 101, 102],
      slowEMA: [99, 100, 101],
      rsi: [50, 55, 60],
      stochRSI: [40, 45, 50],
      currentTrend: 'bullish',
      emaCrossover: 'bullish_crossover'
    };
    
    const mockMarketData = {
      volume_24h: 1000000,
      percent_change_24h: 2.5
    };
    
    const package = analyzer.prepareAIDataPackage(
      'BTCUSDT',
      mockCandles,
      mockIndicators,
      mockMarketData
    );
    
    expect(package.symbol).toBe('BTCUSDT');
    expect(package.ohlcv_data.candles).toBeDefined();
    expect(package.technical_indicators).toBeDefined();
    expect(package.market_context).toBeDefined();
  });

  test('should parse AI response correctly', () => {
    const mockResponse = `
    {
      "decision": "BUY",
      "confidence": "High",
      "entry_price": 35200,
      "stop_loss": 34800,
      "take_profit": 36000,
      "reasons": ["Strong bullish trend", "Volume confirmation"]
    }
    `;
    
    const parsed = analyzer.parseAIResponse(mockResponse);
    
    expect(parsed.decision).toBe('BUY');
    expect(parsed.confidence).toBe('High');
    expect(parsed.entry_price).toBe(35200);
    expect(parsed.reasons).toContain('Strong bullish trend');
  });

  test('should handle API errors gracefully', async () => {
    // Mock failed API call
    jest.spyOn(analyzer, 'fetchOHLCVData').mockRejectedValue(new Error('API Error'));
    
    await expect(analyzer.analyze('INVALID')).rejects.toThrow('API Error');
  });
});

/**
 * Testy integracyjne (wymagają prawdziwych kluczy API)
 */
describe('Integration Tests', () => {
  let analyzer;
  
  beforeEach(() => {
    analyzer = new TradingAnalyzer();
  });

  // Pomiń te testy jeśli nie ma kluczy API
  const hasAPIKeys = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key';
  
  (hasAPIKeys ? test : test.skip)('should perform full analysis', async () => {
    const result = await analyzer.analyze('BTCUSDT');
    
    expect(result).toBeDefined();
    expect(result.symbol).toBe('BTCUSDT');
    expect(result.analysis).toBeDefined();
    expect(result.analysis.decision).toMatch(/BUY|SELL|WAIT/);
    expect(result.analysis.confidence).toMatch(/High|Medium|Low/);
  }, 30000); // 30 sekund timeout
  
  (hasAPIKeys ? test : test.skip)('should fetch market data', async () => {
    const ohlcv = await analyzer.fetchOHLCVData('BTCUSDT', '1h', 10);
    
    expect(Array.isArray(ohlcv)).toBe(true);
    expect(ohlcv.length).toBe(10);
    expect(ohlcv[0]).toHaveProperty('timestamp');
    expect(ohlcv[0]).toHaveProperty('open');
    expect(ohlcv[0]).toHaveProperty('close');
    expect(ohlcv[0]).toHaveProperty('high');
    expect(ohlcv[0]).toHaveProperty('low');
    expect(ohlcv[0]).toHaveProperty('volume');
  }, 10000);
});