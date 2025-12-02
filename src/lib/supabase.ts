import { createClient } from '@supabase/supabase-js'

// Credenciais hardcoded para Vercel (variáveis de ambiente não funcionam)
const url = 'https://jjeudthfiqvvauuqnezs.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXVkdGhmaXF2dmF1dXFuZXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzIyMTEsImV4cCI6MjA3NjkwODIxMX0.EDznlxVY-xiuAGAdVKP9cj9Fh_MBM6GhddO3RjD3qx8'

if (!url) {
  throw new Error('VITE_SUPABASE_URL não está definido. Configure no arquivo .env.local')
}

if (!anonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY não está definido. Configure no arquivo .env.local')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
