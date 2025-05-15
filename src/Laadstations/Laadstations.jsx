import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Laadstations() {
  const navigate = useNavigate();
  const [laadstations, setLaadstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerNames, setCustomerNames] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

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

  const fetchCustomerName = async (socketId) => {
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
      return data.username;
    } catch (error) {
      console.error('Error fetching customer name:', error);
      return null;
    }
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

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Laadstations</h1>
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
            {laadstations.map((station) => (
              <tr key={station.socket_id}>
                <td>{customerNames[station.socket_id] || 'Geen klant'}</td>
                <td>{station.socket_id}</td>
                <td>
                  <button className="btn btn-primary btn-sm">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Laadstations;