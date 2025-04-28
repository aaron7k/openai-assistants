import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, RefreshCw, Loader2 } from "lucide-react";
import { refreshQRCode } from "../api";
import { toast } from "react-hot-toast";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode?: string;
  instanceName?: string;
  locationId?: string;
  userId?: string;
  userName?: string;
  onQRCodeUpdated?: (qrcode: string) => void; // Callback for when QR code is updated
  onConnectionSuccess?: () => void; // New callback for successful connection
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  qrCode,
  instanceName,
  locationId,
  userId,
  userName,
  onQRCodeUpdated,
  onConnectionSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrcodeState, setQrcodeState] = useState<string | undefined>(qrCode);
  const [imgError, setImgError] = useState(false);
  const [countdown, setCountdown] = useState<number>(30); // State for countdown

  // Ref for the main refresh timer
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State for connection status
  const [connectionState, setConnectionState] = useState<string | null>(null);

  // Effect to update the QR and state when the initial prop changes
  useEffect(() => {
    console.log("[QRCodeModal] Initial QR prop changed:", qrCode ? "present" : "absent");
    setQrcodeState(qrCode);
    setImgError(false);
    // Set initial state based on prop QR code presence
    if (qrCode) {
      console.log("[QRCodeModal] Initial QR present, setting state to 'qr'.");
      setConnectionState('qr'); // Assume 'qr' state if initial QR is provided
      setCountdown(30); // Reset countdown
    } else {
      console.log("[QRCodeModal] Initial QR absent, setting state to null.");
      setConnectionState(null); // No QR initially, state is unknown/loading
      setCountdown(30); // Reset countdown
    }
  }, [qrCode]);


  // Function to fetch QR code and check status - now stable w.r.t isLoading
  const fetchQRCode = useCallback(async () => {
    console.log("[QRCodeModal] fetchQRCode called.");
    if (!locationId || (!userId && !instanceName)) {
      console.error("[QRCodeModal] fetchQRCode: Missing required parameters", { locationId, userId, instanceName });
      toast.error("Faltan parámetros para obtener el QR.");
      return;
    }

    // Prevent multiple concurrent requests
    if (isLoading) {
        console.log("[QRCodeModal] fetchQRCode: Already loading, skipping.");
        return;
    }

    console.log("[QRCodeModal] fetchQRCode: Attempting to fetch QR/status...");
    setIsLoading(true);
    setImgError(false); // Reset image error on refresh attempt

    try {
      const response = await refreshQRCode(locationId, userId || instanceName || "");
      console.log("[QRCodeModal] refreshQRCode response:", response);

      // Reset countdown on successful fetch attempt, regardless of state
      if (response) {
         setCountdown(30);
         console.log("[QRCodeModal] Countdown reset after API call.");
      }

      if (response && response.state === "open") {
        console.log("[QRCodeModal] Connection successful!");
        setConnectionState("open");

        // Notify parent component of success
        if (onConnectionSuccess) {
          onConnectionSuccess();
        }

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);

        return; // Exit if connected
      }

      // If not 'open', update QR code and state if available
      if (response) {
         console.log(`[QRCodeModal] API returned state: ${response.state}, qrcode: ${response.qrcode ? 'present' : 'absent'}`);
         setConnectionState(response.state || null);

         if (response.qrcode) {
            console.log("[QRCodeModal] Received new QR code. Updating qrcodeState.");
            setQrcodeState(response.qrcode);
            setImgError(false); // Clear image error if new QR received
            if (onQRCodeUpdated) {
              onQRCodeUpdated(response.qrcode); // Notify parent if needed
            }
         } else {
            // If no QR code is returned, but state is not 'open', 'close', or 'error',
            // maybe the QR expired or is pending. Clear the QR image.
            if (response.state !== 'open' && response.state !== 'close' && response.state !== 'error') {
                 console.log("[QRCodeModal] No QR code received, clearing current QR image.");
                 setQrcodeState(undefined); // Clear QR if API didn't return one
            }
            console.log("[QRCodeModal] No new QR code received. Current state:", response.state);
         }

         // Handle specific states
         if (response.state === 'close' || response.state === 'error') {
            console.log("[QRCodeModal] Instance state is close or error. Clearing QR.");
            setQrcodeState(undefined); // Clear QR on close/error state
         }
      } else {
         // Handle case where response is null/undefined (shouldn't happen with axios error handling, but defensive)
         console.error("[QRCodeModal] API response is null/undefined.");
         setConnectionState("error");
         setQrcodeState(undefined);
      }

      if (response?.error) {
        console.error("[QRCodeModal] API returned error:", response.error);
      }

    } catch (error) {
      console.error("[QRCodeModal] Error fetching QR code:", error);
      setConnectionState("error");
      setQrcodeState(undefined); // Clear QR on fetch error
      setCountdown(30); // Reset countdown on error
      toast.error("Error al obtener el código QR.");
    } finally {
      setIsLoading(false);
      console.log("[QRCodeModal] fetchQRCode finished.");
    }
  }, [locationId, userId, instanceName, onConnectionSuccess, onQRCodeUpdated, onClose, isLoading]); // Added isLoading to dependencies


  // Effect to handle the simple 30-second refresh timer
  useEffect(() => {
    console.log(`[QRCodeModal] Timer Effect: isOpen=${isOpen}, connectionState=${connectionState}, isLoading=${isLoading}, locationId=${!!locationId}, hasInstanceParams=${!!(userId || instanceName)}`);

    // Clear timer on cleanup or if conditions are no longer met
    if (refreshTimerRef.current) {
      console.log("[QRCodeModal] Clearing existing timer.");
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Start timer only if modal is open, state is 'qr', not loading, and we have params
    if (isOpen && connectionState === 'qr' && !isLoading && locationId && (userId || instanceName)) {
      console.log("[QRCodeModal] Conditions met for starting 30s refresh timer. Starting interval...");

      // Initialize countdown when timer starts (or restarts)
      setCountdown(30);

      refreshTimerRef.current = setInterval(() => {
        setCountdown((prevCountdown) => {
          console.log(`[QRCodeModal] Timer tick. Current countdown: ${prevCountdown}`);
          if (prevCountdown <= 1) {
            console.log("[QRCodeModal] Countdown reached 0. Triggering fetchQRCode.");
            fetchQRCode(); // Call fetchQRCode
            return 30; // Reset countdown immediately for the next cycle
          }
          return prevCountdown - 1;
        });
      }, 1000); // Run every 1 second

    } else {
       console.log("[QRCodeModal] Conditions not met for timer. Clearing timer (if any) and resetting countdown.");
       // Ensure countdown is reset if timer stops for reasons other than reaching 0
       // This handles cases like modal closing, state changing away from 'qr', or loading starts
       setCountdown(30);
    }

    // Cleanup function to clear the timer when the effect re-runs or component unmounts
    return () => {
      console.log("[QRCodeModal] Cleaning up refresh timer on effect cleanup.");
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isOpen, connectionState, isLoading, locationId, userId, instanceName, fetchQRCode]); // Dependencies: state and props that control timer start/stop, and the fetch function


  // Function to render the QR code correctly
  const renderQRCode = () => {
    if (!qrcodeState) return null;

    // Verificar si el string ya comienza con "data:"
    if (qrcodeState.startsWith('data:')) {
      return qrcodeState;
    }

    // Verificar si es un string base64 válido
    try {
      // Intentar decodificar para verificar si es base64 válido
      atob(qrcodeState);
      return `data:image/png;base64,${qrcodeState}`;
    } catch (e) {
      console.error("Invalid base64 string:", e);
      return null;
    }
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  // Determine current status text for display
  const displayStatusText = () => {
     if (isLoading) return "Obteniendo código QR...";
     if (connectionState === 'open') return "¡Conectado correctamente!";
     if (connectionState === 'connecting') return "Conectando...";
     if (connectionState === 'qr') return "Esperando escaneo del código QR";
     if (connectionState === 'close') return "Instancia desconectada";
     if (connectionState === 'error') return "Error de conexión";
     if (qrcodeState) return "Escanea el código QR"; // Default if QR is present but state is unknown/null
     return "Cargando estado..."; // Default fallback
  };


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Código QR de {userName || instanceName || "WhatsApp"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {/* Loading or Connected State */}
          {isLoading || connectionState === "open" ? (
            <div className="flex flex-col items-center justify-center p-8">
              {isLoading && connectionState !== "open" && (
                 <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              )}
              {connectionState === "open" && (
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 </div>
              )}
              <p className={`text-lg font-medium text-center ${connectionState === 'open' ? 'text-green-600' : 'text-gray-600'}`}>
                {displayStatusText()}
              </p>
              {connectionState === "open" && (
                 <p className="text-sm text-gray-500 text-center mt-2">
                   Cerrando ventana...
                 </p>
              )}
            </div>
          ) : qrcodeState && connectionState !== 'close' && connectionState !== 'error' ? (
            <>
              <div className="relative p-6">
                {/* Animación de neón morado */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-lg"></div>
                  <div className="absolute inset-0 animate-spin-slow">
                    <div className="absolute top-0 left-1/2 w-1 h-1 bg-purple-600 rounded-full shadow-[0_0_10px_3px_rgba(147,51,234,0.7),0_0_20px_6px_rgba(147,51,234,0.5)]"></div>
                    <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-purple-600 rounded-full shadow-[0_0_10px_3px_rgba(147,51,234,0.7),0_0_20px_6px_rgba(147,51,234,0.5)]"></div>
                    <div className="absolute top-1/2 left-0 w-1 h-1 bg-purple-600 rounded-full shadow-[0_0_10px_3px_rgba(147,51,234,0.7),0_0_20px_6px_rgba(147,51,234,0.5)]"></div>
                    <div className="absolute top-1/2 right-0 w-1 h-1 bg-purple-600 rounded-full shadow-[0_0_10px_3px_rgba(147,51,234,0.7),0_0_20px_6px_rgba(147,51,234,0.5)]"></div>
                  </div>
                  <div className="absolute inset-0 animate-pulse-slow opacity-70">
                    <div className="absolute inset-0 border-2 border-purple-500 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.5),inset_0_0_15px_rgba(147,51,234,0.5)]"></div>
                  </div>
                </div>

                {/* Contenedor del QR */}
                <div className="w-64 h-64 flex items-center justify-center bg-white border border-gray-200 rounded-md overflow-hidden z-10 relative">
                  {imgError ? (
                    <div className="text-center p-4">
                      <p className="text-red-500 font-medium">Error al cargar el QR</p>
                      <p className="text-sm text-gray-500 mt-2">Intenta actualizar el código</p>
                    </div>
                  ) : (
                    <>
                      {qrcodeState ? ( // Check qrcodeState here
                        <img
                          src={renderQRCode()}
                          alt="Código QR de WhatsApp"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error("Error loading QR code image");
                            setImgError(true);
                          }}
                        />
                      ) : (
                         // Show loading or placeholder if qrcodeState is undefined but not in error/close state
                         <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                            <p className="text-sm text-gray-500">Cargando QR...</p>
                         </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  {displayStatusText()}
                </p>
                {/* Show countdown only if state is 'qr' AND there is a QR code */}
                {connectionState === 'qr' && qrcodeState && (
                   <p className="text-xs text-gray-500">
                     Actualización automática en {countdown} segundos
                   </p>
                )}
              </div>
              {locationId && (userId || instanceName) && (
                <button
                  onClick={fetchQRCode} // Use fetchQRCode to also check state
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                     <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                     <RefreshCw className="w-4 h-4" />
                   )}
                  <span>Actualizar QR / Estado</span>
                </button>
              )}
            </>
          ) : (
            // State is close, error, or no QR received initially and not in 'qr' state
            <div className="text-center p-8">
              <p className="text-gray-600">{displayStatusText()}</p>
               {/* Show refresh button if not loading and not connected */}
              {!isLoading && connectionState !== 'open' && locationId && (userId || instanceName) && (
                 <button
                   onClick={fetchQRCode} // Use fetchQRCode to attempt getting QR/state
                   className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                   disabled={isLoading}
                 >
                   {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                   ) : (
                      <RefreshCw className="w-4 h-4" />
                   )}
                   <span>Intentar obtener QR / Estado</span>
                 </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { QRCodeModal };
export default QRCodeModal;
