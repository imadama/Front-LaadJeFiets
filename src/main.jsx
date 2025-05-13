import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Header from './components/Header'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <App />
      </main>
    </div>
  </StrictMode>,
)
