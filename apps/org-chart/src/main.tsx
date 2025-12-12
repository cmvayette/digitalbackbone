import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GlobalErrorBoundary } from '@som/ui-components'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary appName="Org Chart">
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
