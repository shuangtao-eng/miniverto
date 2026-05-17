import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App'

const savedTheme = localStorage.getItem('miniverto-theme')
if (savedTheme === 'cool') {
  document.documentElement.setAttribute('data-theme', 'cool')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
