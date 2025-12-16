import { createClient } from '@supabase/supabase-js'

// Revenify Supabase credentials
const url = 'https://gyqohtqfyzzifxjkuuiz.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cW9odHFmeXp6aWZ4amt1dWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NDMxMzYsImV4cCI6MjA4MDIxOTEzNn0.gvOPxR3nbQJn1nU46ObZoMXKX9HCZINjH2Jb1Jgzvv8'

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
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10s timeout
      }).catch((err) => {
        // Silently handle network errors to avoid console spam
        if (err.name === 'AbortError' || err.name === 'TypeError') {
          console.warn('Supabase fetch warning:', err.message)
          throw err
        }
        throw err
      })
    },
  },
})
