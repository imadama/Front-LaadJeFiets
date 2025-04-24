import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './Auth/Register'
import Login from './Auth/Login'
import Dashboard from './Dashboard/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4">Welkom op de homepage</div>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
