import React, { useState } from 'react';

function SettingsModal({ isOpen, onClose, user, theme, onThemeChange }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteAllSockets = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/sockets/delete-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not delete sockets');
      }

      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      setError(error.message);
      console.error('Error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Could not delete account');
      }

      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      setError(error.message);
      console.error('Error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal" open={isOpen}>
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4 text-center">Account Settings</h3>
        
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        
        <div className="flex items-center gap-4 mb-6">
          <div className="avatar">
            <div className="w-16 rounded-full">
              <div className="w-16 h-16 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
                <span className="text-2xl">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <h4 className="text-xl font-semibold">{user?.username}</h4>
        </div>

        {/* Account Settings Form */}
        <div className="space-y-6 w-3/4 mx-auto">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full" 
              value={user?.username || ''}
              readOnly
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input 
              type="email" 
              className="input input-bordered w-full" 
              value={user?.email || ''}
              readOnly
            />
          </div>
        </div>

        <div className="divider my-6">Theme Settings</div>

        {/* Theme Settings */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-bold">Theme:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['light', 'dark', 'dracula', 'retro', 'lofi'].map((themeOption) => (
              <div key={themeOption} className={`border rounded-lg p-2 ${theme === themeOption ? 'border-primary' : ''}`}>
                <button
                  className="btn btn-sm btn-block btn-ghost justify-start transition-colors duration-300"
                  onClick={() => {
                    onThemeChange({ target: { value: themeOption } });
                  }}
                  onMouseEnter={() => {
                    document.documentElement.style.transition = 'all 0.3s ease-in-out';
                    document.documentElement.setAttribute('data-theme', themeOption);
                  }}
                  onMouseLeave={() => {
                    document.documentElement.style.transition = 'all 0.3s ease-in-out';
                    document.documentElement.setAttribute('data-theme', theme);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span>{themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}</span>
                    {theme === themeOption && (
                      <i className="fas fa-check-circle text-primary text-lg ml-auto"></i>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="divider my-6">Danger Zone</div>

        {/* Danger Zone */}
        <div className="space-y-4 w-3/4 mx-auto">
          <div className="alert alert-error">
            <div className="flex flex-col gap-2">
              <h3 className="font-bold">Delete All Sockets</h3>
              <p>This will permanently delete all your sockets. This action cannot be undone.</p>
              <button 
                className="btn btn-error btn-sm w-full"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete All Sockets
              </button>
            </div>
          </div>

          <div className="alert alert-error">
            <div className="flex flex-col gap-2">
              <h3 className="font-bold">Delete Account</h3>
              <p>This will permanently delete your account and all associated data. This action cannot be undone.</p>
              <button 
                className="btn btn-error btn-sm w-full"
                onClick={() => setShowAccountDeleteConfirm(true)}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Delete All Sockets Confirmation Modal */}
      <dialog className="modal" open={showDeleteConfirm}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete All Sockets</h3>
          <p className="py-4">Are you sure you want to delete all your sockets? This action cannot be undone.</p>
          <div className="modal-action">
            <button className="btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button 
              className="btn btn-error" 
              onClick={handleDeleteAllSockets}
            >
              Delete All
            </button>
          </div>
        </div>
      </dialog>

      {/* Delete Account Confirmation Modal */}
      <dialog className="modal" open={showAccountDeleteConfirm}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete Account</h3>
          <p className="py-4">Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.</p>
          <div className="modal-action">
            <button className="btn" onClick={() => setShowAccountDeleteConfirm(false)}>Cancel</button>
            <button 
              className="btn btn-error" 
              onClick={handleDeleteAccount}
              disabled={showAccountDeleteConfirm}
              ref={buttonRef => {
                if (buttonRef && showAccountDeleteConfirm) {
                  buttonRef.disabled = true;
                  setTimeout(() => {
                    buttonRef.disabled = false;
                  }, 5000);
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </dialog>
    </dialog>
  );
}

export default SettingsModal;