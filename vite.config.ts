import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente do .env.local
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
    preview: {
      port: 5173,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'supabase': ['@supabase/supabase-js'],
            'charts': ['recharts'],
            'stripe': ['stripe', '@stripe/stripe-js'],
          },
        },
      },
    },
  }
})
