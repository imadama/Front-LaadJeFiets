import React from 'react';
import api from '../utils/api';

/* Commented out NotificationsModal component
function NotificationsModal({ isOpen, onClose, notifications, userId, onClear }) {
  if (!isOpen) return null;

  const handleClearNotifications = async () => {
    try {
      await api.notifications.clear(userId);
      onClear();
      onClose();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <dialog className="modal" open={isOpen}>
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Notifications</h3>
          {notifications.length > 0 && (
            <button 
              className="btn btn-sm btn-ghost"
              onClick={handleClearNotifications}
            >
              Clear All
            </button>
          )}
        </div>
        <div className="menu menu-sm">
          {notifications.length === 0 ? (
            <li className="text-center py-2">No notifications</li>
          ) : (
            notifications.map((notification, index) => (
              <li key={index} className="py-2">
                <div className="flex flex-col font-mono">
                  <span className="font-semibold text-error">{notification.title}</span>
                  <span className="text-sm text-error/70">{notification.message}</span>
                  <span className="text-xs text-error/50">{new Date(notification.created_at).toLocaleString()}</span>
                </div>
              </li>
            ))
          )}
        </div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

export default NotificationsModal;
*/

// Placeholder component to maintain imports
function NotificationsModal() {
  return null;
}

export default NotificationsModal;