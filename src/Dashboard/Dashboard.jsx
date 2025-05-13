import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  const [socketForm, setSocketForm] = useState({
    socket_id: ''
  });

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
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon sockets niet ophalen');
        }

        const data = await response.json();
        setSockets(data.data || []);
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
      const response = await fetch(`http://127.0.0.1:8000/api/${user.id}/socket/start`, {
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
      const response = await fetch(`http://127.0.0.1:8000/api/${user.id}/socket/stop`, {
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

  const handleSocketSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const socketData = {
        socket_id: `charger_${socketForm.socket_id}`
      };
      
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
      setSockets(prevSockets => [...prevSockets, newSocket.data]);
      setShowModal(false);
      setSocketForm({ socket_id: '' });
      addToast('Socket succesvol toegevoegd', 'success');
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleSocketChange = (e) => {
    const { name, value } = e.target;
    setSocketForm(prev => ({
      ...prev,
      [name]: value
    }));
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
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
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
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div className="w-full sm:w-auto">
                              <h4 className="card-title text-base sm:text-lg break-all">
                                Socket ID: <span className="font-mono text-sm sm:text-base">{socket.socket_id}</span>
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                Aangemaakt op: {new Date(socket.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setSelectedSocket(socket);
                                  setShowSessionModal(true);
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
      <dialog className="modal" open={showModal}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Nieuwe Socket Toevoegen</h3>
          <form onSubmit={handleSocketSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-bold">Socket ID:</span>
              </label>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="socket_id"
                    value={socketForm.socket_id}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase();
                      // Remove any non-alphabetic characters
                      value = value.replace(/[^A-Z]/g, '');
                      // Limit to 6 characters
                      value = value.slice(0, 6);
                      handleSocketChange({ target: { name: 'socket_id', value } });
                    }}
                    className="input input-bordered font-mono"
                    placeholder="ABCDEF"
                    required
                  />
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-mono">De socket zal worden opgeslagen als: charger_{socketForm.socket_id}</span>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setShowModal(false)}>
                Annuleren
              </button>
              <button type="submit" className="btn btn-primary">
                Toevoegen
              </button>
            </div>
          </form>
        </div>
      </dialog>
      <dialog className="modal" open={showSessionModal}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Sessie Beheer</h3>
          <p className="py-4">Wat wilt u doen met socket <span className="font-mono">{selectedSocket?.socket_id}</span>?</p>
          <div className="modal-action">
            <button 
              className="btn" 
              onClick={() => setShowSessionModal(false)}
            >
              Annuleren
            </button>
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
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowSessionModal(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default Dashboard;