import React, { useEffect, useState } from 'react';
import SettingsModal from './SettingsModal';

function Header() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showSettings, setShowSettings] = useState(false);

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

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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
    </>
  );
}

export default Header;