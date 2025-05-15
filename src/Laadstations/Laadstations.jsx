import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

// Lazy load the map component
const MapComponent = lazy(() => import('../Dashboard/MapComponent'));

function Laadstations() {
  const navigate = useNavigate();
  const [laadstations, setLaadstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerNames, setCustomerNames] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('sockets');
  const [mapKey, setMapKey] = useState(Date.now());
  const [selectedStationId, setSelectedStationId] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // Prevent default browser behavior
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      // Handle the new response format
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

  const fetchCustomerName = async (socketId) => {
    const details = await fetchCustomerDetails(socketId);
    return details?.username || null;
  };

  const processLocationData = (stations) => {
    return stations.map(station => {
      // Convert location string to latitude and longitude if needed
      if (station.location && typeof station.location === 'string' && !station.latitude) {
        const [lat, lng] = station.location.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            ...station,
            latitude: lat,
            longitude: lng
          };
        }
      }
      return station;
    });
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const adminStatus = await checkAdminStatus();
      if (!adminStatus) return;
      
      setIsAdmin(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Niet ingelogd');
          setLoading(false);
          return;
        }

        const response = await fetch('http://127.0.0.1:8000/api/allsockets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Server response:', errorData);
          throw new Error(`Kon laadstations niet ophalen: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Ontvangen data:', data);
        
        // Zorg ervoor dat we altijd met een array werken
        const laadstationsArray = Array.isArray(data) ? data : 
                                data.data ? data.data : 
                                data.sockets ? data.sockets : 
                                [];
        
        // Process location data
        const processedStations = processLocationData(laadstationsArray);
        setLaadstations(processedStations);

        // Fetch customer names for each socket
        const names = {};
        for (const station of processedStations) {
          const details = await fetchCustomerDetails(station.socket_id);
          names[station.socket_id] = details?.username || null;
          
          // Add the address to the station object if available
          if (details?.address) {
            station.address = details.address;
          }
        }
        setCustomerNames(names);
        
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeComponent();
  }, [navigate]);

  // Reset map key when switching to locations tab to ensure proper initialization
  useEffect(() => {
    if (activeTab === 'locations') {
      setMapKey(Date.now());
    }
  }, [activeTab]);

  const handleDetailsClick = async (station) => {
    navigate(`/laadstations/${station.socket_id}`);
  };

  const handleStationSelect = (socketId) => {
    setSelectedStationId(socketId);
    // Find the station with this socket_id
    const station = laadstations.find(s => s.socket_id === socketId);
    // Center map on this station if it has coordinates
    if (station && station.latitude && station.longitude) {
      // Implementation depends on your map component
      console.log(`Selected station: ${socketId} at [${station.latitude}, ${station.longitude}]`);
    }
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
              <p className="text-base-900 font-mono mt-2 font-bold italic">Getting all sockets...</p>
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

  // Extra check voor lege array
  if (!laadstations || laadstations.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Laadstations</h1>
        <div className="alert alert-info">
          <span>Geen laadstations gevonden</span>
        </div>
      </div>
    );
  }

  const filteredLaadstations = laadstations.filter(station => 
    station.socket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customerNames[station.socket_id] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count stations with location data
  const stationsWithLocation = laadstations.filter(station => 
    (station.latitude && station.longitude) || 
    (station.location && typeof station.location === 'string')
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Laadstations</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div role="tablist" className="tabs tabs-lift mb-2">
            <a 
              role="tab" 
              className={`tab ${activeTab === 'sockets' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('sockets')}
            >
              Sockets
            </a>
            <a 
              role="tab" 
              className={`tab ${activeTab === 'locations' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('locations')}
            >
              Locations {stationsWithLocation.length > 0 && `(${stationsWithLocation.length})`}
            </a>
          </div>

          {activeTab === 'sockets' && (
            <>
              <label className="input input-bordered flex items-center gap-2 mb-4">
                <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </g>
                </svg>
                <input 
                  ref={searchInputRef}
                  type="search" 
                  className="grow" 
                  placeholder="Search" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <kbd className="kbd kbd-sm">⌘</kbd>
                <kbd className="kbd kbd-sm">K</kbd>
              </label>

              {filteredLaadstations.length === 0 ? (
                <div className="alert alert-error flex justify-between">
                  <span>Geen resultaten gevonden voor "{searchTerm}"</span>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Klant</th>
                        <th>Socket ID</th>
                        <th>Adres</th>
                        <th>Acties</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLaadstations.map((station) => (
                        <tr key={station.socket_id}>
                          <td>{customerNames[station.socket_id] || 'Geen klant'}</td>
                          <td>{station.socket_id}</td>
                          <td>
                            {station.address ? (
                              <span className="text-sm">{station.address}</span>
                            ) : (
                              <span className="text-sm text-gray-500">Onbekend</span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleDetailsClick(station)}
                              >
                                Details
                              </button>
                              {(station.latitude && station.longitude) && (
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setActiveTab('locations');
                                    setTimeout(() => handleStationSelect(station.socket_id), 100);
                                  }}
                                >
                                  Op kaart
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'locations' && (
            <div className="w-full">
              <h2 className="card-title mb-4">Socket Locaties</h2>
              {stationsWithLocation.length === 0 ? (
                <div className="alert alert-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>Geen laadstations met locatiegegevens gevonden.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="col-span-1 bg-base-200 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Beschikbare Sockets</h3>
                    <div className="overflow-y-auto max-h-[400px]">
                      <ul className="menu bg-base-200 rounded-box">
                        {stationsWithLocation.map((station) => (
                          <li key={station.socket_id}>
                            <a 
                              className={selectedStationId === station.socket_id ? "active" : ""}
                              onClick={() => handleStationSelect(station.socket_id)}
                            >
                              <div className="flex flex-col">
                                <span className="font-mono text-sm">{station.socket_id}</span>
                                <span className="text-xs">{customerNames[station.socket_id] || 'Geen klant'}</span>
                                {station.address && (
                                  <span className="text-xs text-gray-500 truncate max-w-[200px]">{station.address}</span>
                                )}
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 h-[500px] rounded-lg overflow-hidden border border-base-300">
                    <Suspense fallback={<div className="w-full h-full bg-base-200 flex items-center justify-center">Kaart laden...</div>}>
                      <div className="w-full h-full">
                        <MapViewAllSockets
                          key={mapKey}
                          stations={stationsWithLocation}
                          selectedSocketId={selectedStationId}
                          onSocketSelect={handleStationSelect}
                        />
                      </div>
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to show all sockets on the map
function MapViewAllSockets({ stations, selectedSocketId, onSocketSelect }) {
  // Find center point for map (average of all station locations)
  const calculateMapCenter = () => {
    if (!stations || stations.length === 0) return [52.0907, 5.1214]; // Default: Utrecht, NL
    
    let validStations = 0;
    const sum = stations.reduce((acc, station) => {
      if (station.latitude && station.longitude) {
        validStations++;
        return [acc[0] + station.latitude, acc[1] + station.longitude];
      }
      return acc;
    }, [0, 0]);
    
    return validStations ? [sum[0] / validStations, sum[1] / validStations] : [52.0907, 5.1214];
  };

  const mapCenter = calculateMapCenter();

  // Find the selected station for centering if needed
  const selectedStation = stations.find(s => s.socket_id === selectedSocketId);
  const initialPosition = selectedStation ? [selectedStation.latitude, selectedStation.longitude] : null;

  return (
    <MapComponent 
      initialPosition={initialPosition || mapCenter}
      allMarkers={stations.map(station => ({
        position: [station.latitude, station.longitude],
        id: station.socket_id,
        isSelected: station.socket_id === selectedSocketId
      }))}
      onMarkerSelect={onSocketSelect}
      isViewOnly={true}
    />
  );
}

export default Laadstations;