import { useEffect, useState } from 'react';

function Status() {
  const [services, setServices] = useState({
    backend: { status: 'loading', name: 'Backend' },
    mysql: { status: 'loading', name: 'MySQL' },
    amafamily: { status: 'loading', name: 'Server Imad' },
    broncofanclub: { status: 'loading', name: 'Server Matthijs' }
  });
  const [lastChecked, setLastChecked] = useState({});
  const [isChecking, setIsChecking] = useState({});
  const [showBackendOfflineModal, setShowBackendOfflineModal] = useState(false);
  const [iconAnimations, setIconAnimations] = useState({});
  const [shakeAnimations, setShakeAnimations] = useState({});

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
    setServices(prev => ({
      ...prev,
      [key]: { ...prev[key], status: 'loading' }
    }));
    const status = await checkStatus(key);
    setServices(prev => ({
      ...prev,
      [key]: { ...prev[key], status }
    }));
    setLastChecked(prev => ({ ...prev, [key]: new Date() }));
    setIsChecking(prev => ({ ...prev, [key]: false }));

    // Trigger animations when status changes
    setIconAnimations(prev => ({ ...prev, [key]: true }));
    if (status === 'offline') {
      setShakeAnimations(prev => ({ ...prev, [key]: true }));
    }
    
    setTimeout(() => {
      setIconAnimations(prev => ({ ...prev, [key]: false }));
      setShakeAnimations(prev => ({ ...prev, [key]: false }));
    }, 500);
  };

  const checkAllServices = async () => {
    await checkServiceStatus('backend');
    
    const otherServices = Object.keys(services).filter(key => key !== 'backend');
    for (let i = 0; i < otherServices.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100 * i));
      checkServiceStatus(otherServices[i]);
    }
  };

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={`min-h-screen bg-base-200 p-8 ${showBackendOfflineModal ? 'blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body border-2 border-primary rounded-lg">
              <h2 className="card-title text-2xl mb-4 font-mono">System Status</h2>
              
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="font-mono"></th>
                      <th className="font-mono">Service</th>
                      <th className="font-mono">Status</th>
                      <th className="font-mono">Last Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(services).map(([key, service]) => (
                      <tr key={key} className={`${service.status === 'offline' ? 'bg-error/10' : ''}`}>
                        <td className="w-8">
                          <div className={`transform transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${iconAnimations[key] ? 'scale-125' : 'scale-100'}`}>
                            {service.status === 'online' ? (
                              <i className="fas fa-check-circle text-success text-xl"></i>
                            ) : service.status === 'loading' ? (
                              <i className="fas fa-clock text-warning text-xl"></i>
                            ) : (
                              <i className={`fas fa-exclamation-circle text-error text-xl ${shakeAnimations[key] ? 'animate-shake' : ''}`}></i>
                            )}
                          </div>
                        </td>
                        <td className="font-mono">{service.name}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <span className={`font-mono transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${service.status === 'online' ? 'text-success' : service.status === 'loading' ? 'text-warning' : 'text-error'}`}>
                                {service.status === 'online' ? 'Online' : service.status === 'loading' ? 'Loading...' : 'Offline'}
                              </span>
                            </div>
                            {isChecking[key] && (
                              <div className="relative">
                                <progress className="progress progress-primary w-16 transition-all duration-800 ease-[cubic-bezier(0.4, 0, 0.2, 1)]"></progress>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="font-mono transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]">
                            {lastChecked[key] ? lastChecked[key].toLocaleTimeString() : 'Never'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBackendOfflineModal && (
        <dialog className="modal" open>
          <div className="modal-box border-2 border-error">
            <div className="flex justify-center mb-4">
              <i className="fas fa-exclamation-triangle text-error text-6xl transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]"></i>
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