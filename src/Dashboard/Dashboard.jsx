import { useEffect, useState, lazy, Suspense, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

// Import the MapComponent
const MapComponent = lazy(() => import('./MapComponent'));

function AddSocketModal({ isOpen, onClose, onSubmit, onAddLocation, userId }) {
  const [socketForm, setSocketForm] = useState({ socket_id: '', location_id: '' });
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch locations for the logged-in user
  const fetchLocations = async (selectId = null, newLocation = null) => {
    if (!isOpen || !userId) return;
    try {
      setIsLoadingLocations(true);
      const data = await api.request(`/locations/user/${userId}`);
      let locationsArr = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      // If newLocation is provided and not in the list, add it
      if (newLocation && !locationsArr.some(loc => loc.id === newLocation.id)) {
        locationsArr = [...locationsArr, newLocation];
      }
      setLocations(locationsArr);
      // Optionally select the new location
      if (selectId) {
        setSocketForm(prev => ({ ...prev, location_id: selectId }));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  // Expose a refreshLocations function globally for AddLocationModal to call after creation
  useEffect(() => {
    window.refreshLocations = (newLocation) => {
      if (!newLocation) return;
      fetchLocations(newLocation.id, newLocation);
    };
    return () => { delete window.refreshLocations; };
  }, [isOpen, userId]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSocketForm({ socket_id: '', location_id: '' });
      setDropdownOpen(false);
      setLocations([]);
    }
  }, [isOpen]);

  // Only fetch locations when dropdown is opened
  const handleDropdownOpen = () => {
    setDropdownOpen(true);
    if (!isLoadingLocations) {
      fetchLocations();
    }
  };

  // Handle click outside for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSocketChange = (e) => {
    const { name, value } = e.target;
    setSocketForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDropdownSelect = (location) => {
    setSocketForm(prev => ({ ...prev, location_id: location.id }));
    setDropdownOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!socketForm.socket_id || !socketForm.location_id) {
      return;
    }
    onSubmit(socketForm);
  };

  const selectedLocation = locations.find(l => l.id === Number(socketForm.location_id));

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-4xl bg-base-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl">Nieuwe Socket Toevoegen</h3>
          <button 
            onClick={onClose} 
            className="btn btn-sm btn-circle btn-ghost"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Socket ID Section */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-2">Socket ID</h4>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50 z-10">
                      <span className="text-gray-500">charger_</span>
                    </div>
                    <input
                      type="text"
                      name="socket_id"
                      value={socketForm.socket_id}
                      onChange={(e) => {
                        let value = e.target.value.toUpperCase();
                        value = value.replace(/[^A-Z]/g, '');
                        value = value.slice(0, 6);
                        handleSocketChange({ target: { name: 'socket_id', value } });
                      }}
                      className="input input-bordered w-full font-mono pl-[90px]"
                      placeholder="ABCDEF"
                      required
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>* Voer maximaal 6 hoofdletters in voor de socket ID</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-2 text-center">Locatie</h4>
              <div className="flex flex-col gap-4 w-full">
                <div className="form-control w-full" ref={dropdownRef}>
                  <label className="label">
                    <span className="label-text">Selecteer een locatie</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="input input-bordered w-full flex justify-between items-center text-left"
                      onClick={handleDropdownOpen}
                      aria-haspopup="listbox"
                      aria-expanded={dropdownOpen}
                    >
                      {selectedLocation ? (
                        <span>
                          {selectedLocation.name}
                          <span className="block text-xs text-gray-400 font-normal">€ {Number(selectedLocation.tariff_per_kwh).toFixed(2)} per kWh</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Selecteer een locatie</span>
                      )}
                      <svg className="w-4 h-4 ml-2 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {dropdownOpen && (
                      <ul
                        tabIndex={-1}
                        className="absolute z-20 mt-1 w-full bg-base-100 border border-base-300 rounded shadow-lg max-h-60 overflow-auto"
                        role="listbox"
                      >
                        {isLoadingLocations ? (
                          <li className="px-4 py-2 flex items-center justify-center">
                            <span className="loading loading-spinner loading-md"></span>
                          </li>
                        ) : locations.length === 0 ? (
                          <li className="px-4 py-2 text-gray-400">Geen locaties beschikbaar</li>
                        ) : (
                          locations.map((location) => (
                            <li
                              key={location.id}
                              role="option"
                              aria-selected={socketForm.location_id === location.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-base-200 ${socketForm.location_id === location.id ? 'bg-base-200' : ''}`}
                              onClick={() => handleDropdownSelect(location)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{location.name}</span>
                                <span className="text-xs text-gray-400">€ {Number(location.tariff_per_kwh).toFixed(2)} per kWh</span>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-link mt-2 text-primary"
                    onClick={onAddLocation}
                  >
                    + Nieuwe Locatie
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-action mt-6 flex justify-end">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Annuleren
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!socketForm.socket_id || !socketForm.location_id}
            >
              Socket Toevoegen
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

function AddLocationModal({ isOpen, onClose, onSubmit, userId }) {
  const [form, setForm] = useState({ name: '', address: '', tariff_per_kwh: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', address: '', tariff_per_kwh: '' });
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        user_id: userId,
        name: form.name,
        address: form.address,
        tariff_per_kwh: form.tariff_per_kwh
      };
      const newLocation = await api.request('/locations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      onSubmit(newLocation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg bg-base-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl">Nieuwe Locatie Toevoegen</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Naam</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Naam van de locatie"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Adres</span>
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Adres van de locatie"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tarief per kWh</span>
            </label>
            <input
              type="number"
              name="tariff_per_kwh"
              value={form.tariff_per_kwh}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Bijv. 0.25"
              step="0.01"
              min="0"
              required
            />
          </div>
          {error && <div className="alert alert-error"><span>{error}</span></div>}
          <div className="modal-action flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Annuleren</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Locatie Toevoegen'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSockets, setIsLoadingSockets] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSocket, setSelectedSocket] = useState(null);
  const [sockets, setSockets] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalKwh: 0,
    totalUsers: 0,
    activeSockets: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [balance, setBalance] = useState(null);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const data = await api.user.get();
        setUser(data);
      } catch (error) {
        addToast(error.message);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAdminStats = async () => {
      try {
        setIsLoadingStats(true);
        const data = await api.request('/admin/stats');
        setAdminStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchSockets = async () => {
      try {
        setIsLoadingSockets(true);
        const data = await api.sockets.getAll();
        setSockets(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
      } catch (error) {
        addToast(error.message);
      } finally {
        setIsLoadingSockets(false);
      }
    };

    const fetchBalance = async () => {
      try {
        const data = await api.request('/credits/balance');
        setBalance(data?.balance ?? 0);
      } catch (error) {
        setBalance(0);
      }
    };

    fetchUserData();
    if (user?.role === 'Admin') {
      fetchAdminStats();
    }
    fetchSockets();
    fetchBalance();
  }, [navigate, user?.role]);
  
  const handleLogout = async () => {
    try {
      await api.request('/logout', {
        method: 'POST'
      });
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error bij uitloggen:', error);
    }
  };

  const handleSocketDelete = async (socketId) => {
    try {
      await api.request(`/socket/delete/${socketId}`, {
        method: 'DELETE'
      });

      setSockets(prevSockets => prevSockets.filter(socket => socket.id !== socketId));
      addToast('Socket succesvol verwijderd', 'success');
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleStartSession = async () => {
    try {
      await api.request(`/${user.id}/socket/start/${selectedSocket.socket_id}`, {
        method: 'POST'
      });

      setSockets(prevSockets => prevSockets.map(socket => 
        socket.id === selectedSocket.id 
          ? { ...socket, status: 'active' }
          : socket
      ));
      addToast('Laadsessie succesvol gestart', 'success');
      setShowSessionModal(false);
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleStopSession = async () => {
    try {
      await api.request(`/${user.id}/socket/stop/${selectedSocket.socket_id}`, {
        method: 'POST'
      });

      setSockets(prevSockets => prevSockets.map(socket => 
        socket.id === selectedSocket.id 
          ? { ...socket, status: 'inactive' }
          : socket
      ));
      addToast('Laadsessie succesvol gestopt', 'success');
      setShowSessionModal(false);
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleModalOpen = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleSocketSubmit = async (formData) => {
    try {
      const newSocket = await api.request('/socket/new', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setSockets(prevSockets => [...prevSockets, newSocket.data]);
      addToast('Socket succesvol toegevoegd', 'success');
      setShowModal(false);
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleSessionModalOpen = (socket) => {
    setSelectedSocket(socket);
    setShowSessionModal(true);
  };

  // Add location to locations list in AddSocketModal after creation
  const handleLocationCreated = (newLocation) => {
    if (!newLocation) return;
    if (typeof window !== 'undefined' && window.refreshLocations) {
      window.refreshLocations(newLocation);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="toast toast-end">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert ${toast.type === 'success' ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
            <span>{toast.message}</span>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full animate-progress ${toast.type === 'success' ? 'bg-success-content' : 'bg-error-content'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h2 className="card-title text-2xl">Dashboard</h2>
              <div className="flex gap-2">
                <button onClick={handleModalOpen} className="btn btn-primary">
                  Nieuwe Socket
                </button>
                <button onClick={handleLogout} className="btn btn-ghost">
                  Logout
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="stats shadow flex-1 min-w-[220px]">
                  <div className="stat">
                    <div className="stat-title">Email</div>
                    <div className="stat-value text-sm md:text-2xl">{user?.email}</div>
                  </div>
                </div>
                <div className="stats shadow flex-1 min-w-[220px]">
                  <div className="stat">
                    <div className="stat-title">Role</div>
                    <div className="stat-value text-sm md:text-2xl">{user?.role || 'User'}</div>
                  </div>
                </div>
                <div className="stats shadow flex-1 min-w-[220px]">
                  <div className="stat">
                    <div className="stat-title">Account aangemaakt op</div>
                    <div className="stat-value text-sm md:text-2xl">
                      {new Date(user?.created_at).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                </div>
                <div className="stats shadow flex-1 min-w-[220px]">
                  <div className="stat">
                    <div className="stat-title">Saldo</div>
                    <div className="stat-value text-success">
                      {balance !== null ? `€ ${Number(balance).toFixed(2)}` : <span className="loading loading-spinner loading-xs"></span>}
                    </div>
                    <div className="stat-desc">
                      Je huidige tegoed<br />
                      <a href="#" className="link link-primary text-xs">Tegoed toevoegen</a>
                    </div>
                  </div>
                </div>
              </div>

              {user?.role === 'Admin' && (
                <>
                  <div className="divider"></div>
                  <h3 className="text-xl font-bold">Systeem Statistieken</h3>
                  {isLoadingStats ? (
                    <div className="flex justify-center">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="stats shadow">
                        <div className="stat">
                          <div className="stat-figure text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                          </div>
                          <div className="stat-title">Totaal Geladen</div>
                          <div className="stat-value text-primary">
                            {Number(adminStats.totalKwh || 0).toFixed(2)}
                          </div>
                          <div className="stat-desc">kWh</div>
                        </div>
                      </div>
                      
                      <div className="stats shadow">
                        <div className="stat">
                          <div className="stat-figure text-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                          </div>
                          <div className="stat-title">Aantal Gebruikers</div>
                          <div className="stat-value text-secondary">{adminStats.totalUsers}</div>
                          <div className="stat-desc">Geregistreerde gebruikers</div>
                        </div>
                      </div>
                      
                      <div className="stats shadow">
                        <div className="stat">
                          <div className="stat-figure text-accent">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </div>
                          <div className="stat-title">Actieve Sockets</div>
                          <div className="stat-value text-accent">{adminStats.activeSockets}</div>
                          <div className="stat-desc">Momenteel actief</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="divider"></div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">Mijn Sockets <span className="font-mono">({sockets.length})</span></h3>
                {isLoadingSockets ? (
                  <div className="flex justify-center">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                ) : sockets.length === 0 ? (
                  <div className="alert alert-warning">
                    <div className="flex items-center gap-2 w-full">
                      <i className="fas fa-exclamation-triangle text-warning text-xl opacity-100"></i>
                      <span className="text-warning-content text-sm md:text-base">
                        Je hebt nog geen sockets toegevoegd. Klik op <span className="font-semibold">"Nieuwe Socket"</span> om er een toe te voegen.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {sockets.map(socket => (
                      <div 
                        key={socket.id} 
                        className="card bg-base-100 shadow transition-all duration-300 ease-in-out transform hover:scale-[1.02]"
                      >
                        <div className="card-body">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="w-full">
                              <h4 className="card-title text-base sm:text-lg break-all">
                                Socket ID: <span className="font-mono text-sm sm:text-base">{socket.socket_id}</span>
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                Aangemaakt op: {new Date(socket.created_at).toLocaleDateString('nl-NL')}
                              </p>
                              {(socket.latitude && socket.longitude) ? (
                                <p className="text-sm text-gray-500 mt-1">
                                  Locatie: {socket.latitude.toFixed(6)}, {socket.longitude.toFixed(6)}
                                </p>
                              ) : socket.location ? (
                                <p className="text-sm text-gray-500 mt-1">
                                  Locatie: {socket.address}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500 mt-1">
                                  Locatie: {socket.address}
                                </p>
                              )}
                            </div>
                            
                            <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedSocket(socket);
                                  handleSessionModalOpen(socket);
                                }}
                                className="btn btn-primary btn-sm w-32 sm:w-auto transition-colors duration-200 hover:bg-primary/90"
                              >
                                Sessie
                              </button>
                              <button 
                                onClick={() => document.getElementById(`delete-modal-${socket.id}`).showModal()}
                                className="btn btn-error btn-sm w-32 sm:w-auto transition-colors duration-200 hover:bg-error/90"
                              >
                                Verwijderen
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sockets.map(socket => (
                      <dialog key={`modal-${socket.id}`} id={`delete-modal-${socket.id}`} className="modal">
                        <div className="modal-box">
                          <h3 className="font-bold text-lg mb-4">Socket Verwijderen</h3>
                          <p className="py-4">Weet je zeker dat je deze socket wilt verwijderen?</p>
                          <div className="modal-action">
                            <button 
                              className="btn" 
                              onClick={() => document.getElementById(`delete-modal-${socket.id}`).close()}
                            >
                              Annuleren
                            </button>
                            <button 
                              className="btn btn-error" 
                              onClick={() => {
                                handleSocketDelete(socket.id);
                                document.getElementById(`delete-modal-${socket.id}`).close();
                              }}
                            >
                              Verwijderen
                            </button>
                          </div>
                        </div>
                        <form method="dialog" className="modal-backdrop">
                          <button>close</button>
                        </form>
                      </dialog>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AddSocketModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleSocketSubmit}
        onAddLocation={() => setShowLocationModal(true)}
        userId={user?.id}
      />

      <AddLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSubmit={handleLocationCreated}
        userId={user?.id}
      />

      <dialog className="modal" open={showSessionModal}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Remote Actions</h3>
          <div className="space-y-4">

            <div className="card bg-base-100">
              <div className="card-body">
                <h2 className="card-title">Sessie beheer voor {selectedSocket?.socket_id}</h2>
                <p>Start of stop een laadsessie voor deze socket.</p>
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-error" 
                    onClick={handleStopSession}
                  >
                    Stop Sessie
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleStartSession}
                  >
                    Start Sessie
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default Dashboard;
