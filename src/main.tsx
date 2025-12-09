import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Migration: Reset locale to use browser detection (v2.0)
// This runs once to ensure users get the correct default language
const LOCALE_MIGRATION_KEY = 'revenify:locale_migrated_v2'
if (!localStorage.getItem(LOCALE_MIGRATION_KEY)) {
  localStorage.removeItem('revenify:locale')
  localStorage.setItem(LOCALE_MIGRATION_KEY, 'true')
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
