import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const MapComponent = lazy(() => import('../Dashboard/MapComponent'));

function LaadstationDetail() {
  const { socketId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [sessionHistory, setSessionHistory] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('transacties');
  const [userId, setUserId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [socketLocation, setSocketLocation] = useState(null);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleStartSession = async () => {
    try {
      await api.request(`/${userId}/socket/start/${socketId}`, {
        method: 'POST'
      });

      addToast('Sessie succesvol gestart', 'success');
      
      // Herlaad sessiegeschiedenis na het starten
      const sessionInfo = await fetchSessionInfo(socketId);
      if (sessionInfo) {
        setSessionHistory(sessionInfo.data);
      }
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleStopSession = async () => {
    try {
      await api.request(`/${userId}/socket/stop/${socketId}`, {
        method: 'POST'
      });

      addToast('Sessie succesvol gestopt', 'success');
      
      // Herlaad sessiegeschiedenis na het stoppen
      const sessionInfo = await fetchSessionInfo(socketId);
      if (sessionInfo) {
        setSessionHistory(sessionInfo.data);
      }
    } catch (error) {
      addToast(error.message);
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const userData = await api.user.get();
        setUserId(userData.id);
        
        const adminData = await api.request(`/isuseradmin/${userData.id}`, {
          method: 'POST'
        });
        
        if (adminData.role !== 'Admin') {
          navigate('/dashboard');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/dashboard');
        return false;
      }
    };

    const fetchCustomerDetails = async (socketId) => {
      try {
        const data = await api.request(`/socketbelongsto/${socketId}`);
        return {
          username: data.user ? data.user.username : null,
          email: data.user ? data.user.email : null,
          address: data.address
        };
      } catch (error) {
        console.error('Error fetching customer details:', error);
        return null;
      }
    };

    const fetchSessionInfo = async (socketId) => {
      try {
        const data = await api.request(`/getsessioninfo/${socketId}`);
        return data;
      } catch (error) {
        console.error('Error fetching session info:', error);
        return null;
      }
    };

    const fetchSocketLocation = async (socketId) => {
      try {
        const data = await api.request(`/socketinfo/${socketId}`);
        // Accept latitude/longitude or location string
        if (data.latitude && data.longitude) {
          setSocketLocation([parseFloat(data.latitude), parseFloat(data.longitude)]);
        } else if (data.location && typeof data.location === 'string') {
          const [lat, lng] = data.location.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lng)) setSocketLocation([lat, lng]);
        }
      } catch (error) {
        setSocketLocation(null);
      }
    };

    const loadData = async () => {
      const isUserAdmin = await checkAdminStatus();
      if (!isUserAdmin) return;
      
      setIsAdmin(true);
      setLoading(true);
      
      try {
        const [details, sessionInfo] = await Promise.all([
          fetchCustomerDetails(socketId),
          fetchSessionInfo(socketId)
        ]);
        setCustomerDetails(details);
        if (sessionInfo) {
          setSessionHistory(sessionInfo.data);
        }
        await fetchSocketLocation(socketId);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    loadData();
  }, [socketId, navigate]);

  const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatEnergy = (value) => {
    return parseFloat(value).toFixed(3);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <span className="loading loading-spinner loading-lg"></span>
            <div className="animate-[fadeUp_1s_ease-out]">
              <p className="text-base-900 font-mono mt-2 font-bold italic">Laadstation details laden...</p>
            </div>
            <style jsx>{`
              @keyframes fadeUp {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
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
      
      <div className="flex items-center mb-6">
        <button 
          className="btn btn-ghost btn-sm mr-2"
          onClick={() => navigate('/laadstations')}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 className="text-2xl font-bold">Socket Details: {socketId}</h1>
      </div>

      {customerDetails && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Socket Informatie</h2>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Socket ID</span>
                  </label>
                  <div className="px-4 py-2 bg-base-200 rounded-lg text-base-content/70">
                    {socketId}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Klant</span>
                  </label>
                  <div className="px-4 py-2 bg-base-200 rounded-lg text-base-content/70">
                    {customerDetails.username || 'Geen klant'}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <div className="px-4 py-2 bg-base-200 rounded-lg text-base-content/70">
                    {customerDetails.email || 'Geen email'}
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Adres</span>
                  </label>
                  <div className="px-4 py-2 bg-base-200 rounded-lg text-base-content/70">
                    {customerDetails.address || 'Geen adres bekend'}
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center justify-center">
                <h2 className="card-title mb-4">Sessie Statistieken</h2>
                <div className="stats stats-vertical shadow">
                  <div className="stat">
                    <div className="stat-title">Totaal aantal sessies</div>
                    <div className="stat-value text-primary text-center">{sessionHistory ? sessionHistory.length : 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabbed content (session table, remote actions, location) */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div role="tablist" className="tabs tabs-lift mb-2">
            <a 
              role="tab" 
              className={`tab ${activeTab === 'transacties' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('transacties')}
            >
              Transacties
            </a>
            <a 
              role="tab" 
              className={`tab ${activeTab === 'remote-acties' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('remote-acties')}
            >
              Remote Acties
            </a>
            <a 
              role="tab" 
              className={`tab ${activeTab === 'locatie' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('locatie')}
            >
              Locatie
            </a>
          </div>
          <div className="py-4">
            {activeTab === 'transacties' && (
              <>
                {sessionHistory && sessionHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Start Tijd</th>
                          <th>Stop Tijd</th>
                          <th>Begin Energie (kWh)</th>
                          <th>Eind Energie (kWh)</th>
                          <th>Verbruikt (kWh)</th>
                          <th>Aangemaakt</th>
                          <th>Bijgewerkt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionHistory.map((session) => (
                          <tr key={session.id} className="hover">
                            <td className="font-mono">{session.id}</td>
                            <td>{formatDateTime(session.start_time)}</td>
                            <td>{formatDateTime(session.stop_time)}</td>
                            <td className="font-mono">{formatEnergy(session.total_energy_begin)}</td>
                            <td className="font-mono">{formatEnergy(session.total_energy_end)}</td>
                            <td className="font-mono font-semibold">{formatEnergy(session.final_energy)}</td>
                            <td className="text-sm opacity-70">{formatDateTime(session.created_at)}</td>
                            <td className="text-sm opacity-70">{formatDateTime(session.updated_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <span>Geen sessie historie beschikbaar</span>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'remote-acties' && (
              <div className="space-y-6">
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Hier kun je de laadsessie voor deze socket op afstand beheren</span>
                </div>
                
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title">Sessie beheer voor {socketId}</h2>
                    <p className="text-sm">Start of stop een laadsessie voor deze socket.</p>
                    
                    <div className="flex flex-col md:flex-row gap-4 justify-end mt-4">
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
            )}
            {activeTab === 'locatie' && (
              socketLocation ? (
                <div className="w-full">
                  <h2 className="card-title mb-4">Socket Locatie</h2>
                  <div className="h-[350px] w-full rounded-lg overflow-hidden border border-base-300">
                    <Suspense fallback={<div className="w-full h-full bg-base-200 flex items-center justify-center">Kaart laden...</div>}>
                      <MapComponent 
                        initialPosition={socketLocation}
                        allMarkers={[{ position: socketLocation, id: socketId, isSelected: true }]}
                        isViewOnly={true}
                      />
                    </Suspense>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Coördinaten: {socketLocation[0].toFixed(6)}, {socketLocation[1].toFixed(6)}
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">Geen locatiegegevens beschikbaar voor deze socket.</div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaadstationDetail; 