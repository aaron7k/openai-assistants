import React, { useEffect, useState, useRef } from "react";
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
  onQRCodeUpdated?: (qrcode: string) => void;
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
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrcodeState, setQrcodeState] = useState<string | undefined>(qrCode);
  const [imgError, setImgError] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectionCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionState, setConnectionState] = useState<string | null>(null);

  // Efecto para actualizar el QR cuando cambia el prop
  useEffect(() => {
    setQrcodeState(qrCode);
    setImgError(false);
    if (qrCode) {
      setLastRefreshTime(Date.now());
    }
  }, [qrCode]);

  // Efecto para manejar la actualización automática del QR cada 30 segundos
  useEffect(() => {
    if (isOpen && locationId && (userId || instanceName)) {
      // Limpiar cualquier temporizador existente
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Configurar el intervalo de actualización
      refreshTimerRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastRefreshTime;
        
        // Si han pasado más de 30 segundos desde la última actualización
        if (elapsedTime >= 30000) {
          fetchQRCode();
        }
      }, 1000); // Verificar cada segundo si necesitamos actualizar

      // Configurar verificación de estado de conexión cada 5 segundos
      if (connectionCheckTimerRef.current) {
        clearInterval(connectionCheckTimerRef.current);
      }

      connectionCheckTimerRef.current = setInterval(() => {
        checkConnectionStatus();
      }, 5000);
    }
    
    // Limpiar los temporizadores cuando el componente se desmonta o el modal se cierra
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (connectionCheckTimerRef.current) {
        clearInterval(connectionCheckTimerRef.current);
        connectionCheckTimerRef.current = null;
      }
    };
  }, [isOpen, locationId, userId, instanceName, lastRefreshTime]);

  // Verificar el estado de conexión
  const checkConnectionStatus = async () => {
    if (!locationId || (!userId && !instanceName)) {
      return;
    }

    try {
      const response = await refreshQRCode(locationId, userId || instanceName || "");
      console.log("Verificando estado de conexión:", response);
      
      // Si el estado es "open", significa que ya está conectado
      if (response.state === "open") {
        console.log("¡Conexión exitosa! Cerrando modal...");
        setConnectionState("open");
        
        // Cerrar el modal y notificar
        toast.success("¡WhatsApp conectado correctamente!");
        
        // Limpiar temporizadores
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        if (connectionCheckTimerRef.current) {
          clearInterval(connectionCheckTimerRef.current);
          connectionCheckTimerRef.current = null;
        }
        
        // Cerrar el modal después de un breve retraso
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setConnectionState(response.state || null);
      }
      
      // Si no hay código QR pero tampoco está conectado, podría ser un error
      if (!response.qrcode && response.state !== "open") {
        console.log("No se recibió QR pero no está conectado. Estado:", response.state);
      }
    } catch (error) {
      console.error("Error verificando estado de conexión:", error);
    }
  };

  const fetchQRCode = async () => {
    if (!locationId || (!userId && !instanceName)) {
      console.error("Missing required parameters", { locationId, userId, instanceName });
      return;
    }
    
    setIsLoading(true);
    setImgError(false);
    try {
      const response = await refreshQRCode(locationId, userId || instanceName || "");
      console.log("Respuesta de refreshQRCode:", response);
      
      // Si el estado es "open", significa que ya está conectado
      if (response.state === "open") {
        console.log("¡Conexión exitosa! Cerrando modal...");
        setConnectionState("open");
        
        // Cerrar el modal y notificar
        toast.success("¡WhatsApp conectado correctamente!");
        
        // Limpiar temporizadores
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
        if (connectionCheckTimerRef.current) {
          clearInterval(connectionCheckTimerRef.current);
          connectionCheckTimerRef.current = null;
        }
        
        // Cerrar el modal después de un breve retraso
        setTimeout(() => {
          onClose();
        }, 1500);
        
        return;
      }
      
      if (response && response.qrcode) {
        setQrcodeState(response.qrcode);
        setLastRefreshTime(Date.now());
        if (onQRCodeUpdated) {
          onQRCodeUpdated(response.qrcode);
        }
      } else if (response.error) {
        console.error("Error en respuesta:", response.error);
        toast.error(response.error);
      } else {
        console.error("No QR code received in response:", response);
        // No mostrar error si el estado es "open" (ya conectado)
        if (response.state !== "open") {
          toast.error("No se pudo obtener el código QR.");
        }
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      toast.error("Error al obtener el código QR.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para renderizar el QR code correctamente
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

  // Calcular tiempo restante para la próxima actualización
  const getTimeUntilNextRefresh = () => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - lastRefreshTime;
    const remainingTime = Math.max(0, 30000 - elapsedTime);
    return Math.ceil(remainingTime / 1000);
  };

  // Si el modal no está abierto o si ya está conectado, no mostrar nada
  if (!isOpen) return null;

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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600 text-center">
                Obteniendo código QR...
              </p>
            </div>
          ) : connectionState === "open" ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-green-600 text-center">
                ¡Conectado correctamente!
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Cerrando ventana...
              </p>
            </div>
          ) : qrcodeState ? (
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
                      {qrcodeState && (
                        <img
                          src={renderQRCode()}
                          alt="Código QR de WhatsApp"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error("Error loading QR code image");
                            setImgError(true);
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Escanea este código con tu teléfono para conectar WhatsApp
                </p>
                <p className="text-xs text-gray-500">
                  Actualización automática en {getTimeUntilNextRefresh()} segundos
                </p>
              </div>
              {locationId && (userId || instanceName) && (
                <button
                  onClick={fetchQRCode}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Actualizar QR</span>
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-600">Esperando código QR...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { QRCodeModal };
export default QRCodeModal;
