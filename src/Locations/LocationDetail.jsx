import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function LocationDetail() {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [sockets, setSockets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Haal locatie details op
        const locationResponse = await fetch(`http://127.0.0.1:8000/api/locations/${locationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!locationResponse.ok) {
          throw new Error('Kon locatie niet ophalen');
        }

        const locationData = await locationResponse.json();
        setLocation(locationData);

        // Haal sockets op voor deze locatie
        const socketsResponse = await fetch(`http://127.0.0.1:8000/api/locations/${locationId}/sockets`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!socketsResponse.ok) {
          throw new Error('Kon sockets niet ophalen');
        }

        const socketsData = await socketsResponse.json();
        setSockets(Array.isArray(socketsData) ? socketsData : (Array.isArray(socketsData.data) ? socketsData.data : []));
      } catch (error) {
        setError(error.message);
        addToast(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocationData();
  }, [locationId, navigate]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
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
              <h2 className="card-title text-2xl">{location?.name}</h2>
              <button onClick={() => navigate('/locations')} className="btn btn-ghost">
                Terug naar Locaties
              </button>
            </div>

            <div className="space-y-6">
              {/* Locatie Details */}
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">Adres</div>
                  <div className="stat-value text-lg">{location?.address}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Tarief per kWh</div>
                  <div className="stat-value text-lg">€{Number(location?.tariff_per_kwh).toFixed(2)}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Aangemaakt op</div>
                  <div className="stat-value text-lg">
                    {new Date(location?.created_at).toLocaleDateString('nl-NL')}
                  </div>
                </div>
              </div>

              {/* Sockets Lijst */}
              <div className="divider"></div>
              <h3 className="text-xl font-bold">Sockets op deze locatie</h3>
              
              {sockets.length === 0 ? (
                <div className="alert alert-warning">
                  <div className="flex items-center gap-2 w-full">
                    <i className="fas fa-exclamation-triangle text-warning text-xl opacity-100"></i>
                    <span className="text-warning-content text-sm md:text-base">
                      Er zijn nog geen sockets toegevoegd aan deze locatie.
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
                            <h4 className="card-title text-base sm:text-lg">
                              Socket ID: <span className="font-mono">{socket.socket_id}</span>
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Aangemaakt op: {new Date(socket.created_at).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                          
                          <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2">
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
  );
}

export default LocationDetail; 