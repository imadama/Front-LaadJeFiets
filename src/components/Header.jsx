import React, { useEffect, useState } from 'react';

function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://10.10.0.161:8000/api/user', {
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

  return (
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
                  <img alt="User avatar" src={`https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff`} />
                </div>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                <li>
                  <a className="justify-between">
                    <div className="text-sm">{user.username}</div>
                  </a>
                </li>
                <li><a>Settings</a></li>
                <li><a onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    if (token) {
                      await fetch('http://10.10.0.161:8000/api/logout', {
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
  );
}

export default Header;