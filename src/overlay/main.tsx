import React from 'react'
import ReactDOM from 'react-dom/client'
import '../shared/tokens.css'
import './overlay.css'
import { installTauriApi } from '../shared/tauri-api'
import { App } from './App'

installTauriApi()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
