import React, { useEffect, useState } from 'react';

function Laadstations() {
  const [laadstations, setLaadstations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLaadstations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Niet ingelogd');
          setLoading(false);
          return;
        }

        const response = await fetch('http://127.0.0.1:8000/api/sockets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
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
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchLaadstations();
  }, []);

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
              <th>ID</th>
              <th>Naam</th>
              <th>Locatie</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {laadstations.map((station) => (
              <tr key={station.socket_id}>
                <th>{station.socket_id}</th>
                <td>{station.name || `Laadstation ${station.socket_id}`}</td>
                <td>{station.customer_name || (
                  <button 
                    className="btn btn-ghost btn-xs"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/socketbelongsto/${station.socket_id}`);
                        const data = await response.json();
                        // TODO: Update customer name in state
                      } catch (error) {
                        console.error('Fout bij ophalen klantnaam:', error);
                      }
                    }}
                  >
                    Klant ophalen
                  </button>
                )}</td>
                <td>{station.location || 'Onbekend'}</td>
                <td>{station.status || 'Onbekend'}</td>
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