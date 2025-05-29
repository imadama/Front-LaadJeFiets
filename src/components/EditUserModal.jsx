import React, { useState, useEffect } from 'react';

function EditUserModal({ isOpen, onClose, user, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'User'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: '',
        email: '',
        role: user.role || 'User',
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Only send changed fields, fallback to original if empty
      const dataToSend = {
        username: formData.username || user.username,
        email: formData.email || user.email,
        role: formData.role || user.role || 'User',
      };
      await onSave(user.id, dataToSend);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(user.id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md p-8 rounded-lg shadow-lg bg-white">
        <h3 className="font-bold text-2xl mb-6 text-gray-800">Gebruiker Bewerken</h3>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-control">
            <label className="label mb-1">
              <span className="label-text text-base font-semibold">Gebruikersnaam</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder={user?.username || 'Gebruikersnaam'}
              className="input input-bordered w-full"
              autoComplete="off"
            />
          </div>

          <div className="form-control">
            <label className="label mb-1">
              <span className="label-text text-base font-semibold">Email</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={user?.email || 'Email'}
              className="input input-bordered w-full"
              autoComplete="off"
            />
          </div>

          <div className="form-control">
            <label className="label mb-1">
              <span className="label-text text-base font-semibold">Rol</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="select select-bordered w-full"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
              <option value="Reseller">Reseller</option>
            </select>
          </div>

          <div className="flex flex-row justify-between items-center pt-6 gap-2">
            <button type="button" className="btn btn-error flex-1" onClick={() => setShowDeleteConfirm(true)}>
              Verwijderen
            </button>
            <button type="button" className="btn flex-1" onClick={onClose}>
              Annuleren
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Opslaan
            </button>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="modal modal-open">
            <div className="modal-box max-w-sm p-6 rounded-lg shadow-lg bg-white">
              <h3 className="font-bold text-lg mb-4">Gebruiker Verwijderen</h3>
              <p className="mb-4">Weet je zeker dat je deze gebruiker wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.</p>
              <div className="flex flex-row justify-end gap-2">
                <button className="btn" onClick={() => setShowDeleteConfirm(false)}>
                  Annuleren
                </button>
                <button className="btn btn-error" onClick={handleDelete}>
                  Verwijderen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditUserModal; 