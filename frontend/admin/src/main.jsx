import React , {StrictMode} from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SocketProvider from './contexts/SocketContext.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <App />
    </SocketProvider>
  </StrictMode>,
)
