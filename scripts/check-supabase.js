#!/usr/bin/env node

/**
 * Script de diagnóstico Supabase
 * Verifica se as configurações estão corretas
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuração do Supabase...\n');

// Verificar .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env.local não encontrado');
  console.log('💡 Execute: cp .env.example .env.local');
  console.log('💡 Depois preencha as variáveis no arquivo .env.local\n');
  process.exit(1);
}

// Ler .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

lines.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1]?.trim();
  }
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1]?.trim();
  }
});

// Validar URL
if (!supabaseUrl || supabaseUrl === 'https://jjeudthfiqvvauuqnezs.supabase.co') {
  console.log('✅ VITE_SUPABASE_URL: OK');
} else if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ VITE_SUPABASE_URL: URL inválida');
  console.log('   Deve conter "supabase.co"\n');
  process.exit(1);
} else {
  console.log('⚠️  VITE_SUPABASE_URL: Diferente do padrão');
  console.log(`   URL: ${supabaseUrl}\n`);
}

// Validar ANON KEY
if (!supabaseKey || supabaseKey === 'sua_chave_anon_aqui') {
  console.error('❌ VITE_SUPABASE_ANON_KEY: não preenchida');
  console.log('💡 Vá em: https://supabase.com/dashboard/project/jjeudthfiqvvauuqnezs/settings/api');
  console.log('💡 Copie a chave "anon" "public" e cole no .env.local\n');
  process.exit(1);
} else if (supabaseKey.length < 100) {
  console.error('❌ VITE_SUPABASE_ANON_KEY: chave muito curta (inválida)');
  console.log('   Chaves Supabase têm 100+ caracteres\n');
  process.exit(1);
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY: OK');
  console.log(`   Tamanho: ${supabaseKey.length} caracteres\n`);
}

// Testar conexão
console.log('🌐 Testando conexão com Supabase...');

const https = require('https');
const urlToTest = `${supabaseUrl}/auth/v1/health`;

https.get(urlToTest, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Conexão OK - Supabase está respondendo\n');
      console.log('🎉 Configuração correta! Reinicie o dev server:\n');
      console.log('   npm run dev');
      console.log('   # ou');
      console.log('   yarn dev\n');
      process.exit(0);
    } else {
      console.error(`❌ Supabase retornou status ${res.statusCode}`);
      console.log(`   Resposta: ${data}\n`);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('❌ Erro de conexão:', err.message);
  console.log('\n💡 Possíveis causas:');
  console.log('   - Projeto Supabase pausado');
  console.log('   - Bloqueador de anúncios ativo');
  console.log('   - Firewall/proxy bloqueando');
  console.log('   - Sem internet\n');
  console.log('📖 Veja SUPABASE_SETUP.md para mais detalhes\n');
  process.exit(1);
});
