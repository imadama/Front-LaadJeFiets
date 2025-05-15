import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Laadstations() {
  const navigate = useNavigate();
  const [laadstations, setLaadstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerNames, setCustomerNames] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
      return {
        username: data.username,
        email: data.email
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
        
        setLaadstations(laadstationsArray);

        // Fetch customer names for each socket
        const names = {};
        for (const station of laadstationsArray) {
          const username = await fetchCustomerName(station.socket_id);
          names[station.socket_id] = username;
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

  const handleDetailsClick = async (station) => {
    navigate(`/laadstations/${station.socket_id}`);
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Laadstations</h1>

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
        <>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Klant</th>
                  <th>Socket ID</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredLaadstations.map((station) => (
                  <tr key={station.socket_id}>
                    <td>{customerNames[station.socket_id] || 'Geen klant'}</td>
                    <td>{station.socket_id}</td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDetailsClick(station)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Laadstations;