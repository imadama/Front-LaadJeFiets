import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function Saldo() {
  const [balance, setBalance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await api.request('/credits/balance');
        setBalance(data?.balance ?? 0);
      } catch (error) {
        setBalance(0);
      }
    };
    fetchBalance();
  }, []);

  const handleAddCredit = async () => {
    setLoading(true);
    try {
      await api.request(`/credits/balance/add?amount=${selectedAmount}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: selectedAmount }),
      });
      // Herlaad saldo na toevoegen
      const data = await api.request('/credits/balance');
      setBalance(data?.balance ?? 0);
      setShowModal(false);
    } catch {
      // Foutafhandeling indien gewenst
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-base-100 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Saldo</h1>
      <div className="text-lg mb-4">
        Je huidige saldo is:&nbsp;
        <span className="font-mono text-success">
          {balance !== null ? `€ ${Number(balance).toFixed(2)}` : 'Laden...'}
        </span>
      </div>
      <button className="btn btn-primary" onClick={() => setShowModal(true)}>
        Saldo toevoegen
      </button>

      {/* Modal */}
      <dialog open={showModal} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Saldo toevoegen</h3>
          <p className="mb-4">Kies een bedrag om toe te voegen aan je saldo:</p>
          <div className="flex gap-2 mb-4">
            {[5, 10, 15, 20].map(amount => (
              <button
                key={amount}
                className={`btn ${selectedAmount === amount ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedAmount(amount)}
                type="button"
              >
                € {amount}
              </button>
            ))}
          </div>
          <div className="mb-4">
            Nieuw saldo: <span className="font-mono text-success">€ {balance !== null ? (Number(balance) + selectedAmount).toFixed(2) : '...'}</span>
          </div>
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => setShowModal(false)}
              type="button"
              disabled={loading}
            >
              Annuleren
            </button>
            <button
              className="btn btn-success"
              onClick={handleAddCredit}
              disabled={loading}
              type="button"
            >
              {loading ? 'Toevoegen...' : 'Toevoegen'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowModal(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default Saldo;