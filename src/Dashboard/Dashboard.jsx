import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'

// Import the MapComponent
const MapComponent = lazy(() => import('./MapComponent'));

function AddSocketModal({ isOpen, onClose, onSubmit }) {
  const [socketForm, setSocketForm] = useState({ socket_id: '', street: '', number: '', postcode: '', city: '' });
  const [position, setPosition] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now());
  const [customLocation, setCustomLocation] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);

  // Reset everything when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setShowMap(false);
      setPosition(null);
      setSocketForm({ socket_id: '', street: '', number: '', postcode: '', city: '' });
      setMapKey(Date.now());
      setCustomLocation(false);
      setGeocodeError(null);
    } else {
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Geocode address when not in custom mode and address fields are filled
  useEffect(() => {
    const { street, number, postcode, city } = socketForm;
    if (!customLocation && street && number && postcode && city) {
      setGeocodeLoading(true);
      setGeocodeError(null);
      const address = `${street} ${number}, ${city}, ${postcode}`;
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(res => res.json())
        .then(data => {
          console.log('Nominatim response:', data);
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            if (!isNaN(lat) && !isNaN(lon)) {
              setPosition([lat, lon]);
              setGeocodeError(null);
              // Force map reload when new coordinates are found
              setMapKey(Date.now());
            } else {
              setPosition(null);
              setGeocodeError('Ongeldige coördinaten ontvangen van de geocoding service.');
            }
          } else {
            setPosition(null);
            setGeocodeError('Adres niet gevonden op de kaart.');
          }
        })
        .catch((error) => {
          console.error('Geocoding error:', error);
          setPosition(null);
          setGeocodeError('Fout bij het zoeken van het adres.');
        })
        .finally(() => setGeocodeLoading(false));
    }
  }, [socketForm.street, socketForm.number, socketForm.postcode, socketForm.city, customLocation]);

  const handleSocketChange = (e) => {
    const { name, value } = e.target;
    setSocketForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!position || (!customLocation && (!socketForm.street || !socketForm.number || !socketForm.postcode || !socketForm.city))) {
      return;
    }
    const address = customLocation ? 'CUSTOM_LOCATION' : `${socketForm.street} ${socketForm.number}, ${socketForm.city}, ${socketForm.postcode}`;
    onSubmit({ ...socketForm, address }, position);
  };

  const handlePositionSelected = (newPosition) => {
    if (customLocation) setPosition(newPosition);
  };

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

          {/* Address Section */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-2 text-center">Adresgegevens</h4>
              <div className="flex flex-col gap-4 w-full">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Straatnaam</span>
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={socketForm.street}
                    onChange={handleSocketChange}
                    className="input input-bordered w-full"
                    placeholder="Straatnaam"
                    required
                    readOnly={customLocation}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Huisnummer</span>
                  </label>
                  <input
                    type="text"
                    name="number"
                    value={socketForm.number}
                    onChange={handleSocketChange}
                    className="input input-bordered w-full"
                    placeholder="Huisnummer"
                    required
                    readOnly={customLocation}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Postcode</span>
                  </label>
                  <input
                    type="text"
                    name="postcode"
                    value={socketForm.postcode}
                    onChange={handleSocketChange}
                    className="input input-bordered w-full"
                    placeholder="Postcode"
                    required
                    readOnly={customLocation}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Plaatsnaam</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={socketForm.city}
                    onChange={handleSocketChange}
                    className="input input-bordered w-full"
                    placeholder="Plaatsnaam"
                    required
                    readOnly={customLocation}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="card-title text-base">Locatie</h4>
                <div className="form-control">
                  <label className="label cursor-pointer flex gap-2">
                    <span className="label-text">Handmatige locatie</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary toggle-sm"
                      checked={customLocation}
                      onChange={() => setCustomLocation(v => !v)}
                    />
                  </label>
                </div>
              </div>
              
              <div className="h-[350px] w-full rounded-lg overflow-hidden border border-base-300">
                {showMap ? (
                  <Suspense fallback={<div className="w-full h-full bg-base-200 flex items-center justify-center">Kaart laden...</div>}>
                    <div className="w-full h-full">
                      {geocodeLoading ? (
                        <div className="w-full h-full bg-base-200 flex items-center justify-center">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      ) : (
                        <MapComponent 
                          key={mapKey}
                          onPositionSelected={handlePositionSelected} 
                          initialPosition={position}
                          isViewOnly={!customLocation}
                        />
                      )}
                    </div>
                  </Suspense>
                ) : (
                  <div className="w-full h-full bg-base-200 flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                )}
              </div>
              
              {position && (
                <div className="mt-2 badge badge-success gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="text-xs">Locatie gevonden: {position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
                </div>
              )}
              
              {!position && !geocodeLoading && (
                <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>{customLocation ? "Sleep de pin op de kaart" : "Vul het adres in om te zoeken"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="modal-action mt-6 flex justify-end">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Annuleren
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!position || !socketForm.street || !socketForm.number || !socketForm.postcode || !socketForm.city}
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
        const response = await fetch('http://127.0.0.1:8000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon gebruikersgegevens niet ophalen');
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        addToast(error.message);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSockets = async () => {
      try {
        setIsLoadingSockets(true);
        const response = await fetch('http://127.0.0.1:8000/api/sockets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon sockets niet ophalen');
        }

        const data = await response.json();
        console.log('Fetched sockets:', data); // Debug log
        
        // Process sockets to ensure location data is properly formatted
        const processedSockets = (data.data || []).map(socket => {
          // Handle location string format (latitude,longitude)
          if (socket.location && typeof socket.location === 'string' && !socket.latitude) {
            const [lat, lng] = socket.location.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              return {
                ...socket,
                latitude: lat,
                longitude: lng
              };
            }
          }
          return socket;
        });
        
        setSockets(processedSockets);
      } catch (error) {
        addToast(error.message);
      } finally {
        setIsLoadingSockets(false);
      }
    };

    fetchUserData();
    fetchSockets();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://127.0.0.1:8000/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        addToast('Succesvol uitgelogd', 'success');
      }
    } catch (error) {
      addToast('Error bij uitloggen');
    } finally {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleSocketDelete = async (socketId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/socket/delete/${socketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Kon socket niet verwijderen');
      }

      setSockets(prevSockets => prevSockets.filter(socket => socket.id !== socketId));
      addToast('Socket succesvol verwijderd', 'success');
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleStartSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/${user.id}/socket/start/${selectedSocket.socket_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socket_id: selectedSocket.socket_id })
      });

      if (!response.ok) {
        throw new Error('Kon sessie niet starten: ' + response.statusText);
      }

      addToast('Sessie succesvol gestart', 'success');
      setShowSessionModal(false);
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleStopSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/${user.id}/socket/stop/${selectedSocket.socket_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socket_id: selectedSocket.socket_id })
      });

      if (!response.ok) {
        throw new Error('Kon sessie niet stoppen');
      }

      addToast('Sessie succesvol gestopt', 'success');
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

  const handleSocketSubmit = async (formData, position) => {
    if (!position || !formData.address) {
      addToast('Selecteer eerst een locatie en vul het adres in');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const socketData = {
        socket_id: `charger_${formData.socket_id}`,
        address: formData.address,
        latitude: position[0],
        longitude: position[1],
        location: `${position[0]},${position[1]}`
      };
      
      console.log('Sending socket data:', socketData);
      
      const response = await fetch('http://127.0.0.1:8000/api/socket/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(socketData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Kon socket niet toevoegen: ${errorData.message || 'Onbekende fout'}`);
      }

      const newSocket = await response.json();
      console.log('Received new socket:', newSocket);
      
      const socketWithLocation = {
        ...newSocket.data,
        address: formData.address,
        latitude: position[0],
        longitude: position[1]
      };
      
      setSockets(prevSockets => [...prevSockets, socketWithLocation]);
      handleModalClose();
      addToast('Socket succesvol toegevoegd', 'success');
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleSessionModalOpen = (socket) => {
    setSelectedSocket(socket);
    setShowSessionModal(true);
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
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Email</div>
                  <div className="stat-value text-sm md:text-2xl">{user?.email}</div>
                </div>
              </div>
              
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Role</div>
                  <div className="stat-value text-sm md:text-2xl">{user?.role || 'User'}</div>
                </div>
              </div>
              
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Account aangemaakt op</div>
                  <div className="stat-value text-sm md:text-2xl">
                    {new Date(user?.created_at).toLocaleDateString('nl-NL')}
                  </div>
                </div>
              </div>

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
                                  Locatie: {socket.location}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500 mt-1">
                                  Locatie: Onbekend
                                </p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">
                                Adres: {socket.address || <span className="text-gray-400 italic">Onbekend</span>}
                              </p>
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