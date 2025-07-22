import React, { useEffect, useState, useRef } from 'react';
import EditUserModal from '../components/EditUserModal';
import api from '../utils/api';

// Credit Management Modal Component
function CreditManagementModal({ isOpen, onClose, user, onCreditUpdate }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) < 0) {
      setError('Voer een geldig bedrag in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.request(`/credits/admin/set/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ amount: Number(amount) })
      });
      
      onCreditUpdate();
      onClose();
      setAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">
          Saldo Instellen - {user?.username}
        </h3>
        
        <div className="mb-4 p-3 bg-base-200 rounded-lg">
          <span className="text-sm text-base-content/70">Huidig saldo: </span>
          <span className="font-mono text-success font-semibold">
            € {Number(user?.balance || 0).toFixed(2)}
          </span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nieuw saldo (€)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input input-bordered w-full"
              placeholder={Number(user?.balance || 0).toFixed(2)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div className="modal-action">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={handleClose}
              disabled={loading}
            >
              Annuleren
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Saldo Instellen'
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}

function Instellingen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditUser, setCreditUser] = useState(null);
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const responseData = await api.users.getAll();

      if (responseData.status === 'success' && Array.isArray(responseData.data)) {
        // Fetch credit balance for each user
        const usersWithCredits = await Promise.all(
          responseData.data.map(async (user) => {
            try {
              const creditData = await api.request(`/credits/balance/${user.id}`);
              return { ...user, balance: creditData?.balance ?? 0 };
            } catch (err) {
              console.error(`Error fetching credits for user ${user.id}:`, err);
              return { ...user, balance: 0 };
            }
          })
        );
        setUsers(usersWithCredits);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Er is een fout opgetreden bij het ophalen van de gebruikers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = async (userId, userData) => {
    try {
      await api.request(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.request(`/users/${userId}`, {
        method: 'DELETE'
      });

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <span className="loading loading-spinner loading-lg"></span>
            <div className="animate-[fadeUp_1s_ease-out]">
              <p className="text-base-900 font-mono mt-2 font-bold italic">Gebruikers ophalen...</p>
            </div>
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
      <h1 className="text-2xl font-bold mb-4">Gebruikers Instellingen</h1>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
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
              placeholder="Gebruiker zoeken" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <kbd className="kbd kbd-sm">⌘</kbd>
            <kbd className="kbd kbd-sm">K</kbd>
          </label>

          {filteredUsers.length === 0 ? (
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
                    <th>Gebruikersnaam</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Saldo</th>
                    <th>Geregistreerd</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <div className={`badge ${
                          user.role === 'Admin' ? 'badge-primary' : 
                          user.role === 'Reseller' ? 'badge-warning' : 
                          'badge-secondary'
                        }`}>
                          {user.role}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-success">
                          € {Number(user.balance || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                          >
                            Bewerken
                          </button>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setCreditUser(user);
                              setShowCreditModal(true);
                            }}
                          >
                            Credits
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleEditUser}
        onDelete={handleDeleteUser}
      />

      <CreditManagementModal
        isOpen={showCreditModal}
        onClose={() => {
          setShowCreditModal(false);
          setCreditUser(null);
        }}
        user={creditUser}
        onCreditUpdate={fetchUsers}
      />
    </div>
  );
}

export default Instellingen; 