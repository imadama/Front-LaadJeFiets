import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './Auth/Register'
import Login from './Auth/Login'
import Dashboard from './Dashboard/Dashboard'
import Status from './Status/Status'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4">Welkom op de homepage</div>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/status" element={<Status />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
