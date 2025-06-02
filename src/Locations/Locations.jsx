import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      const token = localStorage.getItem('token');
      const payload = {
        user_id: userId,
        name: form.name,
        address: form.address,
        tariff_per_kwh: form.tariff_per_kwh
      };
      const response = await fetch('http://127.0.0.1:8000/api/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon locatie niet toevoegen');
      }
      const newLocation = await response.json();
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

function Locations() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
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

    const fetchLocations = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/locations/user/${user?.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon locaties niet ophalen');
        }

        const data = await response.json();
        setLocations(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
      } catch (error) {
        addToast(error.message);
      }
    };

    fetchUserData();
    if (user?.id) {
      fetchLocations();
    }
  }, [navigate, user?.id]);

  const handleLocationCreated = (newLocation) => {
    setLocations(prev => [...prev, newLocation]);
    addToast('Locatie succesvol toegevoegd', 'success');
    setShowModal(false);
  };

  const handleLocationDelete = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Kon locatie niet verwijderen');
      }

      setLocations(prev => prev.filter(location => location.id !== locationId));
      addToast('Locatie succesvol verwijderd', 'success');
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
              <h2 className="card-title text-2xl">Locaties</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                  Nieuwe Locatie
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {locations.length === 0 ? (
                <div className="alert alert-warning">
                  <div className="flex items-center gap-2 w-full">
                    <i className="fas fa-exclamation-triangle text-warning text-xl opacity-100"></i>
                    <span className="text-warning-content text-sm md:text-base">
                      Je hebt nog geen locaties toegevoegd. Klik op <span className="font-semibold">"Nieuwe Locatie"</span> om er een toe te voegen.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {locations.map(location => (
                    <div 
                      key={location.id} 
                      className="card bg-base-100 shadow transition-all duration-300 ease-in-out transform hover:scale-[1.02] cursor-pointer"
                      onClick={() => navigate(`/locations/${location.id}`)}
                    >
                      <div className="card-body">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="w-full">
                            <h4 className="card-title text-base sm:text-lg">
                              {location.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Adres: {location.address}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Tarief: €{Number(location.tariff_per_kwh).toFixed(2)} per kWh
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Aangemaakt op: {new Date(location.created_at).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                          
                          <div className="w-full sm:w-auto flex justify-center sm:justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => document.getElementById(`delete-modal-${location.id}`).showModal()}
                              className="btn btn-error btn-sm w-32 sm:w-auto transition-colors duration-200 hover:bg-error/90"
                            >
                              Verwijderen
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {locations.map(location => (
                    <dialog key={`modal-${location.id}`} id={`delete-modal-${location.id}`} className="modal">
                      <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Locatie Verwijderen</h3>
                        <p className="py-4">Weet je zeker dat je deze locatie wilt verwijderen?</p>
                        <div className="modal-action">
                          <button 
                            className="btn" 
                            onClick={() => document.getElementById(`delete-modal-${location.id}`).close()}
                          >
                            Annuleren
                          </button>
                          <button 
                            className="btn btn-error" 
                            onClick={() => {
                              handleLocationDelete(location.id);
                              document.getElementById(`delete-modal-${location.id}`).close();
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

      <AddLocationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleLocationCreated}
        userId={user?.id}
      />
    </div>
  );
}

export default Locations; 