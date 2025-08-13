import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

// Simple QR Code generator using a free API service
const generateQRCodeURL = (text, size = 200) => {
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}`;
};

function QRCodes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQRs, setIsLoadingQRs] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [selectedQR, setSelectedQR] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const data = await api.user.get();
        setUser(data);
        
        // Check if user is admin
        if (data.role !== 'Admin') {
          addToast('Je hebt geen toegang tot deze pagina');
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        addToast(error.message);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchQRCodes = async () => {
      try {
        setIsLoadingQRs(true);
        const data = await api.request('/admin/qr-codes');
        console.log('QR Codes API Response:', data);
        
        // Extract QR codes from the response structure
        let qrCodesArray = [];
        if (data.qr_codes && Array.isArray(data.qr_codes)) {
          qrCodesArray = data.qr_codes;
        } else if (Array.isArray(data)) {
          qrCodesArray = data;
        } else if (Array.isArray(data.data)) {
          qrCodesArray = data.data;
        }
        
        console.log('Processed QR Codes:', qrCodesArray);
        if (qrCodesArray.length > 0) {
          console.log('First QR Code structure:', qrCodesArray[0]);
          console.log('Available keys:', Object.keys(qrCodesArray[0]));
        }
        setQrCodes(qrCodesArray);
      } catch (error) {
        addToast(error.message);
        setQrCodes([]);
      } finally {
        setIsLoadingQRs(false);
      }
    };

    // Make fetchQRCodes available for reuse
    window.fetchQRCodes = fetchQRCodes;

    fetchUserData().then(() => {
      // Only fetch QR codes after user verification
      if (user?.role === 'Admin') {
        fetchQRCodes();
      }
    });
  }, [navigate, user?.role]);

  const handleGenerateQR = async () => {
    try {
      setIsGenerating(true);
      const response = await api.request('/admin/generate-qr', {
        method: 'POST'
      });
      
      console.log('Generate QR Response:', response);
      
      // Handle the response structure - it might return a single QR or multiple
      if (response.qr_codes && Array.isArray(response.qr_codes)) {
        // If it returns multiple QR codes, add them all
        setQrCodes(prev => [...response.qr_codes, ...prev]);
        addToast(`${response.qr_codes.length} nieuwe QR code(s) gegenereerd`, 'success');
      } else if (response.qr_code || response.id) {
        // If it returns a single QR code
        const newQR = response.qr_code || response;
        setQrCodes(prev => [newQR, ...prev]);
        addToast('Nieuwe QR code gegenereerd', 'success');
      } else {
        // Fallback - add the whole response
        setQrCodes(prev => [response, ...prev]);
        addToast('Nieuwe QR code gegenereerd', 'success');
      }
      
      // Refresh the entire list to make sure we have the latest data
      setTimeout(() => {
        if (window.fetchQRCodes) {
          window.fetchQRCodes();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      addToast(error.message || 'Fout bij het genereren van QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQR = async (qrId) => {
    try {
      await api.request(`/admin/qr-codes/${qrId}`, {
        method: 'DELETE'
      });
      
      setQrCodes(prev => prev.filter(qr => qr.id !== qrId));
      addToast('QR code verwijderd', 'success');
    } catch (error) {
      addToast(error.message);
    }
  };

  const handleViewQR = (qrCode) => {
    setSelectedQR(qrCode);
    setShowQRModal(true);
  };

  const downloadQR = (qrCode) => {
    // Create download link for QR code
    const link = document.createElement('a');
    
    // Determine the image source - prioritize qr_data field
    let imageSrc = '';
    if (qrCode.qr_data?.startsWith('data:')) {
      imageSrc = qrCode.qr_data;
    } else if (qrCode.qr_data) {
      imageSrc = `data:image/png;base64,${qrCode.qr_data}`;
    } else if (qrCode.qr_code?.startsWith('data:')) {
      imageSrc = qrCode.qr_code;
    } else if (qrCode.qr_image?.startsWith('data:')) {
      imageSrc = qrCode.qr_image;
    } else if (qrCode.image_data?.startsWith('data:')) {
      imageSrc = qrCode.image_data;
    } else if (qrCode.qr_code) {
      imageSrc = `data:image/png;base64,${qrCode.qr_code}`;
    } else if (qrCode.qr_image) {
      imageSrc = `data:image/png;base64,${qrCode.qr_image}`;
    } else if (qrCode.image_data) {
      imageSrc = `data:image/png;base64,${qrCode.image_data}`;
    } else {
      imageSrc = qrCode.qr_image_url || qrCode.image_url;
    }
    
    link.href = imageSrc;
    link.download = `qr-code-${qrCode.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      {/* Toast notifications */}
      <div className="toast toast-end">
        {toasts.map(toast => (
          <div key={toast.id} className={`alert ${toast.type === 'success' ? 'bg-success text-success-content' : 'bg-error text-error-content'}`}>
            <span>{toast.message}</span>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full animate-progress ${toast.type === 'success' ? 'bg-success-content' : 'bg-error-content'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="card-title text-2xl">QR Codes Beheer</h2>
                <p className="text-gray-500 mt-1">Beheer backend-gegenereerde QR codes</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleGenerateQR} 
                  className="btn btn-primary"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Genereren...
                    </>
                  ) : (
                    'Nieuwe QR Genereren'
                  )}
                </button>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="btn btn-ghost"
                >
                  Terug naar Dashboard
                </button>
              </div>
            </div>

            {/* QR Codes Grid */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">
                Beschikbare QR Codes <span className="font-mono">({qrCodes.length})</span>
              </h3>
              
              {isLoadingQRs ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : qrCodes.length === 0 ? (
                <div className="alert alert-info">
                  <div className="flex items-center gap-2 w-full">
                    <i className="fas fa-info-circle text-info text-xl"></i>
                    <span className="text-info-content">
                      Geen QR codes beschikbaar. Klik op <span className="font-semibold">"Nieuwe QR Genereren"</span> om er een aan te maken.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {qrCodes.map(qrCode => (
                    <div key={qrCode.id} className="card bg-base-100 shadow transition-all duration-300 hover:shadow-lg">
                      <div className="card-body p-4">
                        {/* QR Code Preview */}
                        <div className="flex justify-center mb-4">
                          <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                            <img 
                              src={
                                // Try backend provided image first - prioritize qr_data field
                                qrCode.qr_data?.startsWith('data:') ? qrCode.qr_data :
                                qrCode.qr_data ? `data:image/png;base64,${qrCode.qr_data}` :
                                qrCode.qr_code?.startsWith('data:') ? qrCode.qr_code :
                                qrCode.qr_image?.startsWith('data:') ? qrCode.qr_image :
                                qrCode.image_data?.startsWith('data:') ? qrCode.image_data :
                                qrCode.qr_code ? `data:image/png;base64,${qrCode.qr_code}` :
                                qrCode.qr_image ? `data:image/png;base64,${qrCode.qr_image}` :
                                qrCode.image_data ? `data:image/png;base64,${qrCode.image_data}` :
                                qrCode.qr_image_url || qrCode.image_url ||
                                // Fallback: generate QR code from available data
                                generateQRCodeURL(qrCode.code || qrCode.socket_id || qrCode.id || 'No Data', 128)
                              }
                              alt={`QR Code ${qrCode.id}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.log('QR Image failed to load, trying fallback:', qrCode);
                                // If the image fails to load, try generating a QR code
                                e.target.src = generateQRCodeURL(qrCode.code || qrCode.socket_id || qrCode.id || 'Error', 128);
                              }}
                            />
                          </div>
                        </div>

                        {/* Debug Info - Temporary */}
                        <div className="mb-2 p-2 bg-yellow-100 rounded text-xs">
                          <div><strong>Debug Data:</strong></div>
                          <div>Keys: {Object.keys(qrCode).join(', ')}</div>
                          <div className="break-all">Raw: {JSON.stringify(qrCode).substring(0, 100)}...</div>
                        </div>

                        {/* QR Code Info */}
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">ID:</span>
                            <span className="ml-2 font-mono">{qrCode.id}</span>
                          </div>
                          {qrCode.code && (
                            <div>
                              <span className="font-medium">Code:</span>
                              <span className="ml-2 font-mono text-xs">{qrCode.code}</span>
                            </div>
                          )}
                          {qrCode.socket_id && (
                            <div>
                              <span className="font-medium">Socket:</span>
                              <span className="ml-2">{qrCode.socket_id}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Aangemaakt:</span>
                            <span className="ml-2">{new Date(qrCode.created_at).toLocaleDateString('nl-NL')}</span>
                          </div>
                          {qrCode.expires_at && (
                            <div>
                              <span className="font-medium">Verloopt:</span>
                              <span className="ml-2">{new Date(qrCode.expires_at).toLocaleDateString('nl-NL')}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="card-actions justify-end mt-4 gap-2">
                          <button 
                            onClick={() => handleViewQR(qrCode)}
                            className="btn btn-sm btn-primary"
                          >
                            Bekijken
                          </button>
                          {(qrCode.qr_data || qrCode.qr_code || qrCode.qr_image || qrCode.image_data || qrCode.qr_image_url || qrCode.image_url) && (
                            <button 
                              onClick={() => downloadQR(qrCode)}
                              className="btn btn-sm btn-secondary"
                            >
                              Download
                            </button>
                          )}
                          <button 
                            onClick={() => document.getElementById(`delete-qr-modal-${qrCode.id}`).showModal()}
                            className="btn btn-sm btn-error"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modals */}
      {qrCodes.map(qrCode => (
        <dialog key={`modal-${qrCode.id}`} id={`delete-qr-modal-${qrCode.id}`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">QR Code Verwijderen</h3>
            <p className="py-4">Weet je zeker dat je deze QR code wilt verwijderen?</p>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => document.getElementById(`delete-qr-modal-${qrCode.id}`).close()}
              >
                Annuleren
              </button>
              <button 
                className="btn btn-error" 
                onClick={() => {
                  handleDeleteQR(qrCode.id);
                  document.getElementById(`delete-qr-modal-${qrCode.id}`).close();
                }}
              >
                Verwijderen
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      ))}

      {/* QR View Modal */}
      <dialog className="modal" open={showQRModal}>
        <div className="modal-box max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">QR Code Details</h3>
            <button 
              onClick={() => setShowQRModal(false)} 
              className="btn btn-sm btn-circle btn-ghost"
            >
              ✕
            </button>
          </div>
          
          {selectedQR && (
            <div className="space-y-4">
              {/* Large QR Code Display */}
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  <img 
                    src={
                      // Try backend provided image first - prioritize qr_data field
                      selectedQR.qr_data?.startsWith('data:') ? selectedQR.qr_data :
                      selectedQR.qr_data ? `data:image/png;base64,${selectedQR.qr_data}` :
                      selectedQR.qr_code?.startsWith('data:') ? selectedQR.qr_code :
                      selectedQR.qr_image?.startsWith('data:') ? selectedQR.qr_image :
                      selectedQR.image_data?.startsWith('data:') ? selectedQR.image_data :
                      selectedQR.qr_code ? `data:image/png;base64,${selectedQR.qr_code}` :
                      selectedQR.qr_image ? `data:image/png;base64,${selectedQR.qr_image}` :
                      selectedQR.image_data ? `data:image/png;base64,${selectedQR.image_data}` :
                      selectedQR.qr_image_url || selectedQR.image_url ||
                      // Fallback: generate QR code from available data
                      generateQRCodeURL(selectedQR.code || selectedQR.socket_id || selectedQR.id || 'No Data', 256)
                    }
                    alt={`QR Code ${selectedQR.id}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.log('Large QR Image failed to load, trying fallback:', selectedQR);
                      // If the image fails to load, try generating a QR code
                      e.target.src = generateQRCodeURL(selectedQR.code || selectedQR.socket_id || selectedQR.id || 'Error', 256);
                    }}
                  />
                </div>
              </div>

              {/* QR Code Information */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span className="font-mono">{selectedQR.id}</span>
                </div>
                {selectedQR.code && (
                  <div className="flex justify-between">
                    <span className="font-medium">Code:</span>
                    <span className="font-mono text-sm">{selectedQR.code}</span>
                  </div>
                )}
                {selectedQR.socket_id && (
                  <div className="flex justify-between">
                    <span className="font-medium">Socket ID:</span>
                    <span>{selectedQR.socket_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Aangemaakt:</span>
                  <span>{new Date(selectedQR.created_at).toLocaleString('nl-NL')}</span>
                </div>
                {selectedQR.expires_at && (
                  <div className="flex justify-between">
                    <span className="font-medium">Verloopt:</span>
                    <span>{new Date(selectedQR.expires_at).toLocaleString('nl-NL')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                {(selectedQR.qr_data || selectedQR.qr_code || selectedQR.qr_image || selectedQR.image_data || selectedQR.qr_image_url || selectedQR.image_url) && (
                  <button 
                    onClick={() => downloadQR(selectedQR)}
                    className="btn btn-secondary"
                  >
                    Download QR
                  </button>
                )}
                <button 
                  onClick={() => setShowQRModal(false)}
                  className="btn btn-ghost"
                >
                  Sluiten
                </button>
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={() => setShowQRModal(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default QRCodes;