import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [rawData, setRawData] = useState(null);
  const [viewMode, setViewMode] = useState('raw');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/hello')
      .then(res => res.text())
      .then(text => {
        setRawData(text);
        setLoading(false);
      })
      .catch(() => {
        setError('API Server seems down :/');
        setRawData('');
        setLoading(false);
      });
  }, []);

  const formatKeyValue = (obj) =>
    Object.entries(obj)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

  const getDisplayData = () => {
    if (error) return error;
    if (viewMode === 'pretty') {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed && typeof parsed === 'object') {
          return formatKeyValue(parsed);
        }
        return String(parsed);
      } catch {
        return rawData;
      }
    }
    return rawData;
  };

  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <div
            style={{
              border: '8px solid #f3f3f3',
              borderTop: '8px solid #3498db',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <>
            <div style={{ marginBottom: '1em' }}>
              <button
                onClick={() =>
                  setViewMode(prev => (prev === 'raw' ? 'pretty' : 'raw'))
                }
              >
                {viewMode === 'raw' ? 'Show Pretty Print' : 'Show Raw Data'}
              </button>
            </div>
            <pre style={{ textAlign: 'left' }}>{getDisplayData()}</pre>
          </>
        )}
      </header>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
