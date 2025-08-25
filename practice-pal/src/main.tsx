import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './contexts/SettingsContext.tsx'
import { MetronomeProvider } from './contexts/MetronomeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <MetronomeProvider>
        <App />
      </MetronomeProvider>
    </SettingsProvider>
  </StrictMode>,
)
