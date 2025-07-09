import { TradingAnalyzer } from './TradingAnalyzer.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Skrypt do szybkiej analizy konkretnego symbolu
 * Użycie: node src/analyze.js BTCUSDT
 */

async function main() {
  const symbol = process.argv[2] || 'BTCUSDT';
  
  console.log(`🔍 Rozpoczynam analizę dla ${symbol}...`);
  console.log('⏱️  To może potrwać kilka sekund...\n');
  
  const analyzer = new TradingAnalyzer();
  
  try {
    const startTime = Date.now();
    const result = await analyzer.analyze(symbol);
    const duration = Date.now() - startTime;
    
    console.log('📊 WYNIK ANALIZY');
    console.log('================');
    console.log(`Symbol: ${result.symbol}`);
    console.log(`Czas analizy: ${duration}ms`);
    console.log(`Ostatnia cena: $${result.raw_data.last_price}`);
    console.log(`Trend: ${result.raw_data.trend}`);
    console.log(`Crossover: ${result.raw_data.crossover || 'brak'}`);
    console.log('');
    
    console.log('🤖 DECYZJA AI');
    console.log('==============');
    console.log(`Decyzja: ${result.analysis.decision}`);
    console.log(`Pewność: ${result.analysis.confidence}`);
    
    if (result.analysis.entry_price) {
      console.log(`Cena wejścia: $${result.analysis.entry_price}`);
    }
    
    if (result.analysis.stop_loss) {
      console.log(`Stop Loss: $${result.analysis.stop_loss}`);
    }
    
    if (result.analysis.take_profit) {
      console.log(`Take Profit: $${result.analysis.take_profit}`);
    }
    
    if (result.analysis.risk_reward_ratio) {
      console.log(`Risk/Reward: ${result.analysis.risk_reward_ratio}`);
    }
    
    console.log('');
    
    if (result.analysis.reasons && result.analysis.reasons.length > 0) {
      console.log('✅ POWODY:');
      result.analysis.reasons.forEach((reason, index) => {
        console.log(`${index + 1}. ${reason}`);
      });
      console.log('');
    }
    
    if (result.analysis.warnings && result.analysis.warnings.length > 0) {
      console.log('⚠️  OSTRZEŻENIA:');
      result.analysis.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
      console.log('');
    }
    
    // Analiza szczegółowa jeśli dostępna
    if (result.analysis.analysis) {
      console.log('🔍 SZCZEGÓŁOWA ANALIZA');
      console.log('======================');
      console.log(`Siła trendu: ${result.analysis.analysis.trend_strength || 'N/A'}`);
      console.log(`Potwierdzenie wolumenem: ${result.analysis.analysis.volume_confirmation ? 'Tak' : 'Nie'}`);
      console.log(`Sentiment rynkowy: ${result.analysis.analysis.market_sentiment || 'N/A'}`);
      
      if (result.analysis.analysis.support_resistance) {
        console.log(`Wsparcie/Opór: ${result.analysis.analysis.support_resistance}`);
      }
      
      console.log('');
    }
    
    // Kolorowy output dla decyzji
    const decisionColor = {
      'BUY': '\x1b[32m',   // Zielony
      'SELL': '\x1b[31m',  // Czerwony
      'WAIT': '\x1b[33m'   // Żółty
    };
    
    const reset = '\x1b[0m';
    const color = decisionColor[result.analysis.decision] || '';
    
    console.log(`${color}🎯 REKOMENDACJA: ${result.analysis.decision}${reset}`);
    console.log(`${color}📊 PEWNOŚĆ: ${result.analysis.confidence}${reset}`);
    
    if (result.analysis.decision !== 'WAIT') {
      console.log(`${color}💰 ROZMIAR POZYCJI: $${result.analysis.position_size}${reset}`);
    }
    
    console.log('');
    console.log('⚠️  PRZYPOMNIENIE: To narzędzie służy celom edukacyjnym.');
    console.log('    Zawsze przeprowadzaj własne badania przed podjęciem decyzji tradingowej.');
    
  } catch (error) {
    console.error('❌ Błąd analizy:', error.message);
    
    if (error.message.includes('OPENAI_API_KEY')) {
      console.error('💡 Sprawdź czy masz ustawiony klucz OpenAI API w pliku .env');
    }
    
    if (error.message.includes('rate limit')) {
      console.error('💡 Przekroczono limit API. Spróbuj ponownie za chwilę.');
    }
    
    process.exit(1);
  }
}

// Uruchom analizę
main();