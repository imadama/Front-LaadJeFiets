import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './Auth/Register'
import Login from './Auth/Login'
import Dashboard from './Dashboard/Dashboard'
import Status from './Status/Status'
import Laadstations from './Laadstations/Laadstations'
import LaadstationDetail from './Laadstations/LaadstationDetail'
import Header from './components/Header'
import Instellingen from './pages/Instellingen'
import Locations from './Locations/Locations'
import LocationDetail from './Locations/LocationDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4">Welkom op de homepage</div>} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/status" element={<Status />} />
        <Route path="/laadstations" element={<Laadstations />} />
        <Route path="/laadstations/:socketId" element={<LaadstationDetail />} />
        <Route path="/instellingen" element={<Instellingen />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/locations/:locationId" element={<LocationDetail />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
