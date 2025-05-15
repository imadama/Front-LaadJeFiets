import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleStartSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/${userId}/socket/start/${socketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socket_id: socketId })
      });

      if (!response.ok) {
        throw new Error('Kon sessie niet starten: ' + response.statusText);
      }

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
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/${userId}/socket/stop/${socketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socket_id: socketId })
      });

      if (!response.ok) {
        throw new Error('Kon sessie niet stoppen');
      }

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
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon gebruiker niet ophalen');
        }

        const userData = await response.json();
        setUserId(userData.id);
        
        const adminCheckResponse = await fetch(`http://127.0.0.1:8000/api/isuseradmin/${userData.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!adminCheckResponse.ok) {
          throw new Error('Kon admin status niet controleren');
        }

        const adminData = await adminCheckResponse.json();
        
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
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/socketbelongsto/${socketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return {
          username: data.username,
          email: data.email
        };
      } catch (error) {
        console.error('Error fetching customer details:', error);
        return null;
      }
    };

    const fetchSessionInfo = async (socketId) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/getsessioninfo/${socketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon sessie informatie niet ophalen');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching session info:', error);
        return null;
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
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div role="tablist" className="tabs tabs-lift">
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
          </div>
          
          <div className="py-4">
            {/* Inhoud van de Transacties tab */}
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
            
            {/* Inhoud van de Remote Acties tab */}
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
                
                {sessionHistory && sessionHistory.length > 0 && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title">Huidige/Laatste sessie</h2>
                      <div className="overflow-x-auto">
                        <table className="table table-zebra">
                          <thead>
                            <tr>
                              <th>Start Tijd</th>
                              <th>Stop Tijd</th>
                              <th>Energie Verbruikt</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{formatDateTime(sessionHistory[0].start_time)}</td>
                              <td>{sessionHistory[0].stop_time ? formatDateTime(sessionHistory[0].stop_time) : 'Nog actief'}</td>
                              <td>{formatEnergy(sessionHistory[0].final_energy)} kWh</td>
                              <td>
                                {!sessionHistory[0].stop_time ? (
                                  <span className="badge badge-success">Actief</span>
                                ) : (
                                  <span className="badge">Beëindigd</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LaadstationDetail; 