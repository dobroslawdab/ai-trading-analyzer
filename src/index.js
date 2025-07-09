import { TradingAnalyzer } from './TradingAnalyzer.js';
import './api.js';

// Główny punkt wejścia aplikacji
console.log('🚀 AI Trading Analyzer - Uruchamianie...');

// Sprawdź zmienne środowiskowe
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Brakuje wymaganych zmiennych środowiskowych:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('');
  console.error('💡 Skopiuj .env.example do .env i wypełnij wymagane klucze API');
  process.exit(1);
}

// Opcjonalne zmienne
const optionalVars = ['BINANCE_API_KEY', 'COINMARKETCAP_API_KEY'];
const missingOptional = optionalVars.filter(varName => !process.env[varName]);

if (missingOptional.length > 0) {
  console.warn('⚠️  Brakuje opcjonalnych zmiennych środowiskowych:');
  missingOptional.forEach(varName => {
    console.warn(`   - ${varName}`);
  });
  console.warn('   Niektóre funkcje mogą być ograniczone');
}

console.log('✅ Konfiguracja OK');
console.log('🔄 API server uruchomiony w src/api.js');
console.log('📊 Automatyczne analizy co 15 minut');
console.log('🌐 Dostępne endpointy:');
console.log('   http://localhost:3000/api/status');
console.log('   http://localhost:3000/api/analysis/BTCUSDT');
console.log('   http://localhost:3000/api/signals');
console.log('');
console.log('🎯 Uruchom: npm run analyze -- BTCUSDT dla szybkiej analizy');
