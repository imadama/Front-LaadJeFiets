import { useEffect, useState } from 'react';
import api from '../utils/api';

function Status() {
  const [services, setServices] = useState({
    backend: { status: 'loading', name: 'Backend server' },
    mysql: { status: 'loading', name: 'MySQL database' },
    amafamily: { status: 'loading', name: 'Server Imad (Debian)' },
    broncofanclub: { status: 'loading', name: 'Server Matthijs (Ubuntu)' }
  });
  const [isChecking, setIsChecking] = useState({});
  const [showBackendOfflineModal, setShowBackendOfflineModal] = useState(false);
  const [iconAnimations, setIconAnimations] = useState({});
  const [shakeAnimations, setShakeAnimations] = useState({});

  const checkStatus = async (endpoint) => {
    try {
      const data = await api.status.check(endpoint);
      return data.status === 'online' ? 'online' : 'offline';
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
    setIsChecking(prev => ({ ...prev, [key]: false }));

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
    const backendStatus = await checkStatus('backend');
    setServices(prev => ({
      ...prev,
      backend: { ...prev.backend, status: backendStatus }
    }));
    
    if (backendStatus === 'offline') {
      setShowBackendOfflineModal(true);
    } else {
      setShowBackendOfflineModal(false);
    }
    
    const otherServices = Object.keys(services).filter(key => key !== 'backend');
    for (let i = 0; i < otherServices.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100 * i));
      checkServiceStatus(otherServices[i]);
    }
  };

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 60000);
    return () => clearInterval(interval);
  }, []);

  const allServicesOnline = Object.values(services).every(service => service.status === 'online');
  const getServiceTips = () => {
    const tips = [];
    if (services.mysql.status === 'offline') {
      tips.push(
        <div key="mysql-timeline" className="mb-4">
          <h3 className="text-lg font-bold mb-2">Status Overzicht</h3>
          <ul className="timeline">
            <li>
              <div className="timeline-start timeline-box bg-success text-success-content">Backend Server</div>
              <div className="timeline-middle">
                <i className="fas fa-check-circle text-success text-xl" title="Online"></i>
              </div>
              <hr className="bg-success" />
            </li>
            <li>
              <hr className="bg-success" />
              <div className="timeline-middle">
                <i className="fas fa-times-circle text-error text-xl" title="Offline"></i>
              </div>
              <div className="timeline-end timeline-box bg-error text-error-content">MySQL Server</div>
              <hr className="bg-error" />
            </li>
            <li>
              <hr className="bg-error" />
              <div className="timeline-start timeline-box bg-error text-error-content">Database Verbinding</div>
              <div className="timeline-middle">
                <i className="fas fa-times-circle text-error text-xl" title="Offline"></i>
              </div>
            </li>
          </ul>
          <p className="text-sm text-base-content/70 mt-2">
            De backend server is online, maar er is een probleem met de MySQL server en database verbinding.
          </p>
        </div>
      );
      tips.push(
        <div key="mysql" className="alert alert-base-100 border-2 border-warning">
          <div>
            <i className="fas fa-database text-warning text-xl"></i>
            <div className="divider divider-base-200 w-full my-2"></div>
            <span className="font-mono">Er is een probleem met de MySQL service. Probeer deze stappen:</span>
            <ul className="list-disc ml-6 mt-2">
              <li>
                <span>Controleer of MySQL service draait: </span>
                <code className="bg-base-200 px-1">sudo systemctl status mysql</code>
              </li>
              <li>
                <span>Start MySQL service: </span>
                <code className="bg-base-200 px-1">sudo systemctl start mysql</code>
              </li>
              <li>
                <span>Controleer MySQL logs: </span>
                <code className="bg-base-200 px-1">sudo journalctl -u mysql</code>
              </li>
              <li>
                <span>Controleer MySQL configuratie: </span>
                <code className="bg-base-200 px-1">sudo cat /etc/mysql/mysql.conf.d/mysqld.cnf</code>
              </li>
              <li>
                <span>Controleer Laravel configuratie: </span>
                <code className="bg-base-200 px-1">php artisan config:cache</code>
              </li>
              <li>
                <span>Verifieer Laravel omgeving: </span>
                <code className="bg-base-200 px-1">php artisan env</code>
              </li>
              <li>
                <span>Controleer Laravel logs: </span>
                <code className="bg-base-200 px-1">tail -f storage/logs/laravel.log</code>
              </li>
              <li>
                <span>Laravel cache leegmaken: </span>
                <code className="bg-base-200 px-1">php artisan cache:clear</code>
              </li>
              <li>
                <span>Controleer Laravel database verbinding: </span>
                <code className="bg-base-200 px-1">php artisan db:monitor</code>
              </li>
            </ul>
          </div>
        </div>
      );
    }
    if (services.broncofanclub.status === 'offline') {
      tips.push(
        <div key="broncofanclub-timeline" className="mb-4">
          <h3 className="text-lg font-bold mb-2">Status Overzicht</h3>
          <ul className="timeline">
            <li>
              <div className="timeline-start timeline-box bg-success text-success-content">Backend Server</div>
              <div className="timeline-middle">
                <i className="fas fa-check-circle text-success text-xl" title="Online"></i>
              </div>
              <hr className="bg-success" />
            </li>
            <li>
              <hr className="bg-success" />
              <div className="timeline-middle">
                <i className="fas fa-times-circle text-error text-xl" title="Offline"></i>
              </div>
              <div className="timeline-end timeline-box bg-error text-error-content">SSH Verbinding</div>
              <hr className="bg-error" />
            </li>
            <li>
              <hr className="bg-error" />
              <div className="timeline-start timeline-box bg-error text-error-content">Ubuntu Server</div>
              <div className="timeline-middle">
                <i className="fas fa-times-circle text-error text-xl" title="Offline"></i>
              </div>
            </li>
          </ul>
          <p className="text-sm text-base-content/70 mt-2">
            De backend server is online, maar er is een probleem met de SSH verbinding naar de Ubuntu server.
          </p>
        </div>
      );
      tips.push(
        <div key="broncofanclub" className="alert alert-base-100 border-2 border-warning">
          <div>
            <i className="fab fa-ubuntu text-warning text-xl"></i>
            <div className="divider divider-base-200 w-full my-2"></div>
            <span className="font-mono">Er is een probleem met de Ubuntu server. Probeer deze stappen:</span>
            <ul className="list-disc ml-6 mt-2">
              <li>
                <span>Controleer of SSH service draait: </span>
                <code className="bg-base-200 px-1">sudo systemctl status ssh</code>
              </li>
              <li>
                <span>Start SSH service: </span>
                <code className="bg-base-200 px-1">sudo systemctl start ssh</code>
              </li>
              <li>
                <span>Controleer SSH logs: </span>
                <code className="bg-base-200 px-1">sudo journalctl -u ssh</code>
              </li>
              <li>
                <span>Controleer SSH configuratie: </span>
                <code className="bg-base-200 px-1">sudo cat /etc/ssh/sshd_config</code>
              </li>
              <li>
                <span>Controleer firewall instellingen: </span>
                <code className="bg-base-200 px-1">sudo ufw status</code>
              </li>
              <li>
                <span>Controleer netwerk verbinding: </span>
                <code className="bg-base-200 px-1">ping server-ip</code>
              </li>
              <li>
                <span>Test SSH verbinding: </span>
                <code className="bg-base-200 px-1">ssh -v user@server</code>
              </li>
              <li>
                <span>Controleer systeem logs: </span>
                <code className="bg-base-200 px-1">sudo journalctl -xe</code>
              </li>
            </ul>
          </div>
        </div>
      );
    }
    if (services.amafamily.status === 'offline') {
      tips.push(
        <div key="amafamily-timeline" className="mb-4">
          <h3 className="text-lg font-bold mb-2">Status Overzicht</h3>
          <ul className="timeline">
            <li>
              <div className="timeline-start timeline-box bg-success text-success-content">Backend Server</div>
              <div className="timeline-middle">
                <i className="fas fa-check-circle text-success text-xl" title="Online"></i>
              </div>
              <hr className="bg-success" />
            </li>
            <li>
              <hr className="bg-success" />
              <div className="timeline-middle">
                <i className="fas fa-times-circle text-error text-xl" title="Offline"></i>
              </div>
              <div className="timeline-end timeline-box bg-error text-error-content">SSH Connection</div>
              <hr className="bg-error" />
            </li>
            <li>
              <hr className="bg-error" />
              <div className="timeline-start timeline-box bg-error text-error-content">Debian Server</div>
              <div className="timeline-middle">
                <i className="fas fa-times-circle text-error text-xl" title="Offline"></i>
              </div>
            </li>
          </ul>
          <p className="text-sm text-base-content/70 mt-2">
            De backend server is online, maar er is een probleem met de SSH verbinding naar de Debian server.
          </p>
        </div>
      );
      tips.push(
        <div key="amafamily" className="alert alert-base-100 border-2 border-warning">
          <div>
            <i className="fab fa-debian text-warning text-xl"></i>
            <div className="divider divider-base-200 w-full my-2"></div>
            <span className="font-mono">Er is een probleem met de Debian server. Probeer deze stappen:</span>
            <ul className="list-disc ml-6 mt-2">
              <li>
                <span>Controleer of SSH service draait: </span>
                <code className="bg-base-200 px-1">sudo systemctl status ssh</code>
              </li>
              <li>
                <span>Start SSH service: </span>
                <code className="bg-base-200 px-1">sudo systemctl start ssh</code>
              </li>
              <li>
                <span>Controleer SSH logs: </span>
                <code className="bg-base-200 px-1">sudo journalctl -u ssh</code>
              </li>
              <li>
                <span>Controleer SSH configuratie: </span>
                <code className="bg-base-200 px-1">sudo cat /etc/ssh/sshd_config</code>
              </li>
              <li>
                <span>Controleer firewall instellingen: </span>
                <code className="bg-base-200 px-1">sudo ufw status</code>
              </li>
              <li>
                <span>Controleer netwerk verbinding: </span>
                <code className="bg-base-200 px-1">ping server-ip</code>
              </li>
              <li>
                <span>Test SSH verbinding: </span>
                <code className="bg-base-200 px-1">ssh -v user@server</code>
              </li>
              <li>
                <span>Controleer systeem logs: </span>
                <code className="bg-base-200 px-1">sudo journalctl -xe</code>
              </li>
            </ul>
          </div>
        </div>
      );
    }
    return tips;
  };

  const getServiceSummary = () => {
    const onlineCount = Object.values(services).filter(service => service.status === 'online').length;
    const totalCount = Object.keys(services).length;
    const offlineCount = totalCount - onlineCount;
    
    return (
      <div className="stats shadow mt-6">
        <div className="stat">
          <div className="stat-figure text-success">
            <i className="fas fa-check-circle text-3xl"></i>
          </div>
          <div className="stat-title font-mono">Online Services</div>
          <div className="stat-value text-success">{onlineCount}</div>
          <div className="stat-desc font-mono">out of {totalCount} services</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-error">
            <i className="fas fa-exclamation-circle text-3xl"></i>
          </div>
          <div className="stat-title font-mono">Offline Services</div>
          <div className="stat-value text-error">{offlineCount}</div>
          <div className="stat-desc font-mono">needs attention</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`min-h-screen bg-base-200 p-8 ${showBackendOfflineModal ? 'blur-sm' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body border-2 border-primary rounded-lg">
              <h2 className="card-title text-2xl mb-4 font-mono">Status</h2>
              
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="font-mono"></th>
                      <th className="font-mono">Service</th>
                      <th className="font-mono">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(services).map(([key, service]) => (
                      <tr key={key} className={`${service.status === 'offline' ? 'bg-error/10' : ''}`}>
                        <td className="w-8">
                          <div className={`transform transition-all duration-250 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${iconAnimations[key] ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'}`}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                {allServicesOnline ? (
                  <div className="alert alert-base-100">
                    <div className="flex items-center gap-4">
                        <i className="fas fa-check-circle text-success text-xl"></i>
                      <span className="font-mono text-md">Geen problemen gevonden.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getServiceTips()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBackendOfflineModal && (
        <div className="modal modal-open">
          <div className="modal-box border-2 border-error">
            <div className="flex justify-center mb-4">
              <i className="fas fa-exclamation-triangle text-error text-6xl transition-all duration-300 ease-[cubic-bezier(0.4, 0, 0.2, 1)]"></i>
            </div>
            <h3 className="font-bold font-mono text-lg mb-4 text-center">Backend Offline</h3>
            <p className="py-4 font-mono">
              De backend server is momenteel offline. Dit betekent dat we geen verbinding kunnen maken met de server.
              De status van andere services kan niet worden gecontroleerd totdat de backend weer online is.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default Status;