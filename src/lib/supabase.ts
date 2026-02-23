import { createClient } from '@supabase/supabase-js'

// Supabase credentials from environment variables
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
      // Fail fast when offline — prevents Supabase auth retry loops from
      // flooding the console with 100+ ERR_INTERNET_DISCONNECTED errors
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return Promise.reject(new TypeError('Network request failed: device is offline'))
      }
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10s timeout
      })
    },
  },
})
