import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bootstrap 5 primero (importa bootstrap/dist/css/bootstrap.min.css dentro de @layer bootstrap)
// y después los tokens globales de Cafeto × iRiS, que siempre tienen la última palabra.
import './styles/bootstrap.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
