import { useEffect, useState } from 'react';

function Status() {
  const [services, setServices] = useState({
    backend: { status: 'checking', name: 'Backend' },
    mysql: { status: 'checking', name: 'MySQL' },
    amafamily: { status: 'checking', name: 'Server Imad' },
    broncofanclub: { status: 'checking', name: 'Server Matthijs' }
  });
  const [lastChecked, setLastChecked] = useState({});
  const [isChecking, setIsChecking] = useState({});
  const [showBackendOfflineModal, setShowBackendOfflineModal] = useState(false);

  const checkStatus = async (endpoint) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/health/${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'online' ? 'online' : 'offline';
      }
      return 'offline';
    } catch (error) {
      return 'offline';
    }
  };

  const checkServiceStatus = async (key) => {
    setIsChecking(prev => ({ ...prev, [key]: true }));
    const status = await checkStatus(key);
    setServices(prev => ({
      ...prev,
      [key]: { ...prev[key], status }
    }));
    setLastChecked(prev => ({ ...prev, [key]: new Date() }));
    setIsChecking(prev => ({ ...prev, [key]: false }));

    // Show modal if backend is offline and it's the first check
    if (key === 'backend') {
      if (status !== 'online' && !lastChecked['backend']) {
        setShowBackendOfflineModal(true);
      } else if (status === 'online') {
        setShowBackendOfflineModal(false);
      }
    }
  };

  const checkAllServices = async () => {
    // Check backend first
    await checkServiceStatus('backend');
    
    // Check other services regardless of backend status
    const otherServices = Object.keys(services).filter(key => key !== 'backend');
    for (let i = 0; i < otherServices.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100 * i));
      checkServiceStatus(otherServices[i]);
    }
  };

  useEffect(() => {
    // Initial check
    checkAllServices();

    // Set up interval to check all services
    const interval = setInterval(checkAllServices, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={`min-h-screen bg-base-200 p-8 ${showBackendOfflineModal ? 'blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">System Status</h2>
              
              <div className="stats shadow">
                {Object.entries(services).map(([key, service]) => (
                  <div key={key} className="stat">
                    <div className="stat-title">{service.name} Status</div>
                    <div className="stat-value flex items-center gap-2">
                      {service.status === 'online' ? (
                        <i className="fas fa-check-circle text-success text-2xl"></i>
                      ) : (
                        <i className="fas fa-times-circle text-error text-2xl"></i>
                      )}
                      <span className={service.status === 'online' ? 'text-success' : 'text-error'}>
                        {service.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    {isChecking[key] && (
                      <div className="mt-2">
                        <progress className="progress progress-primary w-full"></progress>
                      </div>
                    )}
                    <div className="stat-desc">
                      Last checked: {lastChecked[key] ? lastChecked[key].toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Offline Modal */}
      {showBackendOfflineModal && (
        <dialog className="modal" open>
          <div className="modal-box border-2 border-error">
            <div className="flex justify-center mb-4">
              <i className="fas fa-exclamation-triangle text-error text-6xl"></i>
            </div>
            <h3 className="font-bold font-mono text-lg mb-4 text-center">Backend Offline</h3>
            <p className="py-4">
              De backend server is momenteel offline. Dit betekent dat we geen verbinding kunnen maken met de server.
              De status van andere services kan niet worden gecontroleerd totdat de backend weer online is.
            </p>
          </div>
        </dialog>
      )}
    </>
  );
}

export default Status;