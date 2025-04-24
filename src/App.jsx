import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './Auth/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4">Welkom op de homepage</div>} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
