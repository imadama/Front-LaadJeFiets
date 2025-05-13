import React, { useEffect, useState } from 'react';
import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';

function Header() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Apply theme on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://127.0.0.1:8000/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Kon gebruikersgegevens niet ophalen');
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    // Initial fetch
    fetchUserData();

    // Set up interval to fetch every second
    const intervalId = setInterval(fetchUserData, 2000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/${user.id}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Could not fetch notifications');
        }

        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 2000);
    return () => clearInterval(intervalId);
  }, [user?.id]);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  return (
    <>
      <nav className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Laadjefiets</a>
        </div>
        <div className="flex-none gap-4">
          {user ? (
            <>
              <button 
                className="btn btn-ghost btn-circle"
                onClick={() => setShowNotifications(true)}
              >
                <div className="indicator">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="badge badge-xs badge-primary indicator-item">
                      {notifications.length}
                    </span>
                  )}
                </div>
              </button>

              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                  <div className="w-10 rounded-full">
                    <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
                      <span className="text-xl">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[999] mt-3 w-52 p-2 shadow">
                  <li className="pointer-events-none">
                    <a className="justify-between">
                      <div className="text-sm">{user.username}</div>
                    </a>
                  </li>
                  <div className="divider m-0" />
                  <li><a className="cursor-pointer" onClick={() => setShowSettings(true)}>Settings</a></li>
                  <li><a className="cursor-pointer" onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      if (token) {
                        await fetch('http://127.0.0.1:8000/api/logout', {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                          },
                        });
                      }
                      localStorage.removeItem('token');
                      window.location.href = '/login';
                    } catch (error) {
                      console.error('Error bij uitloggen:', error);
                    }
                  }}>Logout</a></li>
                </ul>
              </div>
            </>
          ) : (
            <a href="/login" className="btn btn-ghost">Login</a>
          )}
        </div>
      </nav>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        userId={user?.id}
        onClear={handleClearNotifications}
      />
    </>
  );
}

export default Header;