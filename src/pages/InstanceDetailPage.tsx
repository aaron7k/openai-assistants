import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Removed useLocation
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Settings,
  PowerOff,
  QrCode,
  UserPlus,
  Key,
  Bot,
  Cpu,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  PlusCircle
} from "lucide-react";
import api from "../api";
import {
  WhatsAppInstance,
  User,
  OpenAICredential,
  OpenAIApiKey,
  OpenAIAssistant,
  OpenAIOfficialAssistant,
} from "../types";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { WhatsAppConfigModal } from "../components/whatsAppConfigModal/WhatsAppConfigModal";
import { QRCodeModal } from "../components/QRCodeModal";
import { UserModal } from "../components/UserModal";
import { OpenAICredentialModal } from "../components/OpenAICredentialModal";
import { OpenAICredentialsList } from "../components/OpenAICredentialsList";
import OpenAIAssistantModal from "../components/OpenAIAssistantModal"; // Custom Assistant Modal
import OpenAIAssistantsList from "../components/OpenAIAssistantsList"; // Custom Assistant List
import OpenAIOfficialAssistantModal from "../components/OpenAIOfficialAssistantModal"; // Official Assistant Modal
import OpenAIOfficialAssistantsList from "../components/OpenAIOfficialAssistantsList"; // Official Assistant List
import { LoadingOverlay } from "../components/LoadingOverlay";

const InstanceDetailPage: React.FC = () => {
  const { instanceName } = useParams<{ instanceName: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [instanceData, setInstanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTurningOff, setIsTurningOff] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false); // For Custom Assistants
  const [isOfficialAssistantModalOpen, setIsOfficialAssistantModalOpen] = useState(false); // For Official Assistants
  const [editingAssistant, setEditingAssistant] = useState<OpenAIAssistant | null>(null); // For Custom Assistants
  const [editingOfficialAssistant, setEditingOfficialAssistant] = useState<OpenAIOfficialAssistant | null>(null); // For Official Assistants
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<OpenAICredential | null>(null);
  const [apiKeys, setApiKeys] = useState<OpenAIApiKey[]>([]); // State to hold just the keys
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [customAssistants, setCustomAssistants] = useState<OpenAIAssistant[]>([]); // State for Custom Assistants
  const [isLoadingCustomAssistants, setIsLoadingCustomAssistants] = useState(true); // Loading for Custom Assistants

  // State specifically for Official Assistants and their API-driven filtering
  const [officialAssistants, setOfficialAssistants] = useState<OpenAIOfficialAssistant[]>([]); // Holds the list fetched based on filter
  const [isLoadingOfficialAssistants, setIsLoadingOfficialAssistants] = useState(true); // Loading for the filtered list
  const [selectedOfficialApiKeyId, setSelectedOfficialApiKeyId] = useState<string>(""); // Currently selected filter key

  // --- Retrieve locationId ONLY from localStorage ---
  const locationId = localStorage.getItem("locationId");

  // Log the value read from localStorage
  useEffect(() => {
    console.log("[InstanceDetail] Reading locationId from localStorage:", locationId);
    if (!locationId) {
        console.error("[InstanceDetail] locationId is null or undefined from localStorage.");
    }
  }, [locationId]); // Log whenever locationId changes (should be once on mount)


  // --- Data Fetching ---

  const fetchData = useCallback(async () => {
    // Check if locationId is available BEFORE fetching
    if (!instanceName || !locationId) {
      console.error("[InstanceDetail] Cannot fetch data: instanceName or locationId missing.", { instanceName, locationId });
      setIsLoading(false);
      setIsLoadingCredentials(false);
      setIsLoadingCustomAssistants(false);
      setIsLoadingOfficialAssistants(false);
      // The render logic below will show the "No se proporcionó..." message
      return;
    }

    setIsLoading(true);
    setIsLoadingCredentials(true);
    setIsLoadingCustomAssistants(true);
    // setIsLoadingOfficialAssistants(true); // Initial loading handled by useEffect below

    try {
      // Fetch instance details, credentials, and custom assistants concurrently
      const [instanceRes, credsRes, customAssistantsRes] = await Promise.allSettled([
        api.getInstanceData(locationId, instanceName),
        api.getOpenAICredentials(instanceName),
        api.getOpenAIAssistants(instanceName), // Fetch custom assistants
      ]);

      if (instanceRes.status === "fulfilled") {
        setInstanceData(instanceRes.value);
        // Attempt to find matching instance from list if needed (e.g., for alias)
        // This might be redundant if getInstanceData returns all needed info
        // Only fetch instances list if instance data didn't provide enough info or failed
        if (!instanceRes.value || !instanceRes.value.instance_alias) {
             try {
                const instancesList = await api.listInstances(locationId);
                const foundInstance = instancesList.find(
                  (inst) => inst.instance_name === instanceName
                );
                setInstance(foundInstance || null);
             } catch (listError) {
                console.error("Error fetching instances list for alias:", listError);
                setInstance(null); // Ensure instance is null on error
             }
        } else {
            // If instanceData has alias, use it
            setInstance({
                ...instanceRes.value, // Spread existing data
                instance_alias: instanceRes.value.instance_alias, // Ensure alias is set
                instance_id: instanceRes.value.instance_id, // Ensure ID is set
                main_device: instanceRes.value.main_device, // Ensure main_device is set
                fb_ads: instanceRes.value.fb_ads, // Ensure fb_ads is set
                n8n_webhook: instanceRes.value.n8n_webhook, // Ensure n8n_webhook is set
                active_ia: instanceRes.value.active_ia, // Ensure active_ia is set
                userId: instanceRes.value.user_id // Ensure userId is set
            });
        }

      } else {
        console.error("Error fetching instance data:", instanceRes.reason);
        toast.error("Error al cargar los datos de la instancia.");
        setInstanceData({ state: "error" }); // Indicate error state
        setInstance(null); // Ensure instance is null on error
      }

      if (credsRes.status === "fulfilled") {
        setCredentials(credsRes.value);
        const keys = credsRes.value?.apiKeys || [];
        setApiKeys(keys);
        // If keys exist and no filter is selected yet, select the first one
        if (keys.length > 0 && !selectedOfficialApiKeyId) {
          console.log("[InstanceDetail] Setting initial API key filter:", keys[0].id);
          setSelectedOfficialApiKeyId(keys[0].id);
          // The useEffect below will trigger the fetch for official assistants
        } else if (keys.length === 0) {
           // If no keys, ensure official assistants list is empty and not loading
           setOfficialAssistants([]);
           setIsLoadingOfficialAssistants(false);
        }
      } else {
        console.error("Error fetching credentials:", credsRes.reason);
        // Don't show toast here, api function handles it
        setApiKeys([]); // Ensure apiKeys is empty on error
        setOfficialAssistants([]); // Ensure official assistants list is empty
        setIsLoadingOfficialAssistants(false); // Stop loading if creds fail
      }

      if (customAssistantsRes.status === "fulfilled") {
        setCustomAssistants(customAssistantsRes.value);
      } else {
         console.error("Error fetching custom assistants:", customAssistantsRes.reason);
         // Toast likely handled in API layer
         setCustomAssistants([]);
      }

    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Error general al cargar datos.");
      // Ensure loading states are false on general error
      setInstanceData({ state: "error" });
      setInstance(null);
      setApiKeys([]);
      setCustomAssistants([]);
      setOfficialAssistants([]);
      setIsLoadingOfficialAssistants(false);
    } finally {
      setIsLoading(false); // Overall page loading
      setIsLoadingCredentials(false); // Credential specific loading
      setIsLoadingCustomAssistants(false); // Custom assistant specific loading
      // Official assistant loading is handled by the useEffect hook below
    }
  }, [instanceName, locationId, selectedOfficialApiKeyId]); // Added locationId dependency

  // Effect to fetch Official Assistants when the selected API key changes
  useEffect(() => {
    const fetchOfficialAssistantsForKey = async () => {
      if (!instanceName || !selectedOfficialApiKeyId || !locationId) { // Also check locationId
         // If no key is selected (e.g., no keys exist), don't fetch
         setOfficialAssistants([]);
         setIsLoadingOfficialAssistants(false);
         console.log("[InstanceDetail] Skipping official assistant fetch: Missing instanceName, selectedOfficialApiKeyId, or locationId.");
         return;
      }

      console.log(`[InstanceDetail] Fetching official assistants for key: ${selectedOfficialApiKeyId}`);
      setIsLoadingOfficialAssistants(true);
      try {
        const fetchedAssistants = await api.getOpenAIOfficialAssistants(instanceName, selectedOfficialApiKeyId);
        setOfficialAssistants(fetchedAssistants);
        console.log("[InstanceDetail] Fetched official assistants:", fetchedAssistants);
      } catch (error) {
        console.error(`Error fetching official assistants for key ${selectedOfficialApiKeyId}:`, error);
        toast.error("Error al cargar asistentes oficiales para la clave seleccionada.");
        setOfficialAssistants([]); // Clear list on error
      } finally {
        setIsLoadingOfficialAssistants(false);
      }
    };

    // Only fetch if locationId is available
    if (locationId) {
      fetchOfficialAssistantsForKey();
    } else {
       // If locationId is missing, ensure official assistants list is empty and not loading
       setOfficialAssistants([]);
       setIsLoadingOfficialAssistants(false);
    }
  }, [instanceName, selectedOfficialApiKeyId, locationId]); // Depend on instanceName, the selected key ID, and locationId

  // Initial data fetch on component mount
  useEffect(() => {
    // Only fetch data if locationId is available
    if (locationId) {
      fetchData();
    } else {
       // If locationId is not available initially, stop loading and show error message
       setIsLoading(false);
       setIsLoadingCredentials(false);
       setIsLoadingCustomAssistants(false);
       setIsLoadingOfficialAssistants(false);
       // The render logic below will show the "No se proporcionó..." message
    }
  }, [fetchData, locationId]); // Depend on fetchData and locationId


  // Fetch users (can be done separately or as part of initial load if needed)
  useEffect(() => {
    if (locationId) { // Only fetch users if locationId is available
      api
        .getUsers(locationId) // Use locationId here
        .then(setUsers)
        .catch((err) => console.error("Error fetching users:", err));
    } else {
       setUsers([]); // Clear users if locationId is missing
    }
  }, [locationId]); // Depend on locationId

  // --- Action Handlers ---

  const handleRefreshQR = async () => {
    if (!instanceName || !locationId) {
      console.error("[InstanceDetail] handleRefreshQR: Missing instanceName or locationId.");
      toast.error("Faltan parámetros para actualizar el QR.");
      return; // Check locationId
    }
    setIsRefreshingQR(true);
    try {
      const data = await api.refreshQRCode(locationId, instanceName); // Use locationId here
      console.log("[InstanceDetail] refreshQRCode response:", data); // Log response
      if (data) {
        // Always update instanceData with the latest state and qrcode from the response
        setInstanceData((prev: any) => ({
          ...prev,
          qrcode: data.qrcode || prev?.qrcode, // Update qrcode if present
          state: data.state || prev?.state, // Update state if present
          number: data.number || prev?.number, // Update number if present
          profilePicUrl: data.profilePicUrl || prev?.profilePicUrl // Update profile pic if present
        }));

        if (data.state === 'open') {
           toast.success("La instancia ya está conectada.");
           setIsQRModalOpen(false); // Close QR modal if already open
        } else if (data.qrcode) {
           setIsQRModalOpen(true); // Open modal with new QR if QR is received
           toast.success("Código QR actualizado. Escanéalo con tu WhatsApp.");
        } else if (data.state === 'connecting') {
           // If state is connecting but no QR, maybe it's still trying to connect
           toast.info("Instancia en estado de conexión. Esperando...");
           setIsQRModalOpen(false); // Close QR modal if no QR to show
        } else if (data.state === 'close') {
           toast.info("Instancia desconectada. Genere un nuevo QR.");
           setIsQRModalOpen(false); // Close QR modal if no QR to show
        } else if (data.error) {
           toast.error(data.error);
           setIsQRModalOpen(false); // Close QR modal on error
        } else {
           // Handle other states or unexpected responses
           toast.info(`Estado de la instancia: ${data.state || 'desconocido'}`);
           setIsQRModalOpen(false); // Close QR modal if no QR to show
        }
      } else {
         toast.error("Respuesta inesperada al actualizar QR.");
         setIsQRModalOpen(false);
      }
    } catch (error) {
      // Error toast handled by API function
      console.error("Error refreshing QR code:", error);
      setIsQRModalOpen(false); // Close modal on error
    } finally {
      setIsRefreshingQR(false);
    }
  };

  // Callback function to be passed to QRCodeModal to update state when it detects connection
  const handleQRCodeModalConnectionSuccess = useCallback(() => {
    console.log("[InstanceDetail] QRCodeModal reported successful connection. Refetching data...");
    // Refetch all data to get the latest state, number, profile pic, etc.
    fetchData();
    setIsQRModalOpen(false); // Ensure modal is closed
  }, [fetchData]);


  const handleDeleteInstance = async () => {
    if (!instanceName || !locationId) return; // Check locationId
    setIsDeleting(true);
    try {
      await api.deleteInstance(locationId, instanceName); // Use locationId here
      toast.success("Instancia eliminada correctamente.");
      navigate("/"); // Redirect to home after deletion
    } catch (error) {
      // Error toast handled by API function
      console.error("Error deleting instance:", error);
      setIsDeleteModalOpen(false); // Close modal on error
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTurnOffInstance = async () => {
    if (!instanceName || !locationId) return; // Check locationId
    setIsTurningOff(true);
    try {
      await api.turnOffInstance(locationId, instanceName); // Use locationId here
      // Update state locally immediately, then refetch for confirmation
      setInstanceData((prev: any) => ({ ...prev, state: "close" }));
      toast.success("Instancia desconectada.");
      // Optional: Refetch data after a short delay to confirm state
      // setTimeout(fetchData, 2000);
    } catch (error) {
      // Error toast handled by API function
      console.error("Error turning off instance:", error);
    } finally {
      setIsTurningOff(false);
    }
  };

  const handleSaveConfig = async (config: any) => {
    if (!instanceName || !locationId) return false; // Check locationId
    try {
      await api.editInstance(locationId, instanceName, config); // Use locationId here
      // Update local state optimistically or refetch
      setInstance((prev) => prev ? { ...prev, ...config } : null);
      toast.success("Configuración actualizada.");
      setIsConfigModalOpen(false);
      fetchData(); // Refetch data to ensure consistency
      return true;
    } catch (error) {
      console.error("Error saving config:", error);
      // Error toast handled by API function
      return false;
    }
  };

  const handleSaveUser = (user: User) => {
    // Logic to save/update user (potentially call API)
    console.log("Saving user:", user);
    setUsers((prev) => {
      const index = prev.findIndex((u) => u.id === user.id);
      if (index > -1) {
        const updatedUsers = [...prev];
        updatedUsers[index] = user;
        return updatedUsers;
      }
      return [...prev, user]; // Add if new (assuming ID generation happens elsewhere)
    });
    setIsUserModalOpen(false);
    toast.success("Usuario guardado (simulado).");
  };

  // --- Credential Handlers ---
  const handleAddCredential = () => {
    setIsCredentialModalOpen(true);
  };

  const handleSaveCredential = async (name: string, apiKey: string) => {
    if (!instanceName) return false;
    try {
      await api.createOpenAICredential(instanceName, name, apiKey);
      toast.success("Credencial de OpenAI añadida.");
      setIsCredentialModalOpen(false);
      // Refetch credentials
      const updatedCreds = await api.getOpenAICredentials(instanceName);
      setCredentials(updatedCreds);
      const currentKeys = updatedCreds?.apiKeys || [];
      setApiKeys(currentKeys);
       // If this is the first key added, select it for the official assistant filter
      if (apiKeys.length === 0 && updatedCreds?.apiKeys?.length > 0) {
        setSelectedOfficialApiKeyId(updatedCreds.apiKeys[0].id);
      }
      return true;
    } catch (error) {
      console.error("Error saving credential:", error);
      // Error toast handled by API
      return false;
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!instanceName) return;
    try {
      await api.deleteOpenAICredential(instanceName, credentialId);
      toast.success("Credencial eliminada.");
      // Refetch credentials
      const updatedCreds = await api.getOpenAICredentials(instanceName);
      setCredentials(updatedCreds);
      const currentKeys = updatedCreds?.apiKeys || [];
      setApiKeys(currentKeys);
      // If the deleted key was the selected filter, reset the filter
      if (selectedOfficialApiKeyId === credentialId) {
         setSelectedOfficialApiKeyId(currentKeys.length > 0 ? currentKeys[0].id : "");
      }
    } catch (error) {
      console.error("Error deleting credential:", error);
      // Error toast handled by API
    }
  };

  // --- Custom Assistant Handlers ---
  const handleAddAssistant = () => {
    setEditingAssistant(null); // Ensure we are creating, not editing
    setIsAssistantModalOpen(true);
  };

  const handleEditAssistant = (assistant: OpenAIAssistant) => {
    setEditingAssistant(assistant);
    setIsAssistantModalOpen(true);
  };

  const handleSaveAssistant = async (assistantData: any) => {
    if (!instanceName) return false;
    try {
      if (editingAssistant) {
        // Update existing assistant
        await api.updateOpenAIAssistant(
          instanceName,
          editingAssistant.id,
          assistantData.name,
          assistantData.instructions, // Pass instructions even if not used by API
          assistantData.apiKeyId,
          assistantData.assistantId,
          assistantData.webhookUrl,
          assistantData.triggerType,
          assistantData.triggerCondition,
          assistantData.triggerValue,
          assistantData.expirationMinutes,
          assistantData.stopKeyword,
          assistantData.messageDelayMs,
          assistantData.unknownMessage,
          assistantData.listenToOwner,
          assistantData.stopByOwner,
          assistantData.keepSessionOpen,
          assistantData.debounceSeconds,
          assistantData.separateMessages,
          assistantData.secondsPerMessage
        );
        toast.success("Asistente Wa Level actualizado.");
      } else {
        // Create new assistant
        await api.createOpenAIAssistant(
          instanceName,
          assistantData.name,
          assistantData.instructions, // Pass instructions even if not used by API
          assistantData.apiKeyId,
          assistantData.assistantId,
          assistantData.webhookUrl,
          assistantData.triggerType,
          assistantData.triggerCondition,
          assistantData.triggerValue,
          assistantData.expirationMinutes,
          assistantData.stopKeyword,
          assistantData.messageDelayMs,
          assistantData.unknownMessage,
          assistantData.listenToOwner,
          assistantData.stopByOwner,
          assistantData.keepSessionOpen,
          assistantData.debounceSeconds,
          assistantData.separateMessages,
          assistantData.secondsPerMessage
        );
        toast.success("Asistente Wa Level creado.");
      }
      setIsAssistantModalOpen(false);
      setEditingAssistant(null);
      // Refetch custom assistants
      setIsLoadingCustomAssistants(true);
      const updatedAssistants = await api.getOpenAIAssistants(instanceName);
      setCustomAssistants(updatedAssistants);
      setIsLoadingCustomAssistants(false);
      return true;
    } catch (error) {
      console.error("Error saving custom assistant:", error);
      // Error toast handled by API
      return false;
    }
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    if (!instanceName) return;
    try {
      await api.deleteOpenAIAssistant(instanceName, assistantId);
      toast.success("Asistente Wa Level eliminado.");
      // Refetch custom assistants
      setIsLoadingCustomAssistants(true);
      const updatedAssistants = await api.getOpenAIAssistants(instanceName);
      setCustomAssistants(updatedAssistants);
      setIsLoadingCustomAssistants(false);
    } catch (error) {
      console.error("Error deleting custom assistant:", error);
      // Error toast handled by API
    }
  };

  // --- Official Assistant Handlers ---
  const handleAddOfficialAssistant = () => {
    setEditingOfficialAssistant(null); // Ensure we are creating
    setIsOfficialAssistantModalOpen(true);
  };

  const handleEditOfficialAssistant = (assistant: OpenAIOfficialAssistant) => {
    console.log("[InstanceDetail] Editing official assistant:", assistant);
    setEditingOfficialAssistant(assistant);
    setIsOfficialAssistantModalOpen(true);
  };

  const handleSaveOfficialAssistant = async (assistantData: Omit<OpenAIOfficialAssistant, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!instanceName) return false;
    try {
      if (editingOfficialAssistant) {
        // Update existing official assistant
        await api.updateOpenAIOfficialAssistant(instanceName, { ...assistantData, id: editingOfficialAssistant.id });
        toast.success("Asistente oficial actualizado.");
      } else {
        // Create new official assistant
        await api.createOpenAIOfficialAssistant(instanceName, assistantData);
        toast.success("Asistente oficial creado.");
      }
      setIsOfficialAssistantModalOpen(false);
      setEditingOfficialAssistant(null);
      // Refetch official assistants for the currently selected key
      if (selectedOfficialApiKeyId) {
        setIsLoadingOfficialAssistants(true);
        const updatedAssistants = await api.getOpenAIOfficialAssistants(instanceName, selectedOfficialApiKeyId);
        setOfficialAssistants(updatedAssistants);
        setIsLoadingOfficialAssistants(false);
      }
      return true;
    } catch (error) {
      console.error("Error saving official assistant:", error);
      // Error toast handled by API
      return false;
    }
  };

  // MODIFIED: Updated signature to accept apiKeyId
  const handleDeleteOfficialAssistant = async (assistantId: string, apiKeyId: string) => {
    if (!instanceName) return;
    try {
      // MODIFIED: Pass apiKeyId to the API function
      await api.deleteOpenAIOfficialAssistant(instanceName, assistantId, apiKeyId);
      toast.success("Asistente oficial eliminado.");
      // Refetch official assistants for the currently selected key
      if (selectedOfficialApiKeyId) {
        setIsLoadingOfficialAssistants(true);
        // NOTE: This was calling getOpenAIAssistants instead of getOpenAIOfficialAssistants
        // Correcting to call the function for official assistants
        const updatedAssistants = await api.getOpenAIOfficialAssistants(instanceName, selectedOfficialApiKeyId);
        setOfficialAssistants(updatedAssistants);
        setIsLoadingOfficialAssistants(false);
      }
    } catch (error) {
      console.error("Error deleting official assistant:", error);
      // Error toast handled by API
    }
  };

  // Handler for the filter dropdown change in OpenAIOfficialAssistantsList
  const handleOfficialApiKeyFilterChange = (newApiKeyId: string) => {
    console.log("[InstanceDetail] API key filter changed to:", newApiKeyId);
    setSelectedOfficialApiKeyId(newApiKeyId);
    // The useEffect hook depending on selectedOfficialApiKeyId will handle the refetch
  };


  // --- Render Logic ---

  const renderStatusIcon = () => {
    if (isLoading || !instanceData) return <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />;
    switch (instanceData.state) {
      case "open":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "connecting":
      case "qr": // Treat 'qr' state similar to connecting as it requires action
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case "close":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "error":
         return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (isLoading || !instanceData) return "Cargando...";
    switch (instanceData.state) {
      case "open": return "Conectado";
      case "connecting": return "Conectando...";
      case "qr": return "Esperando QR";
      case "close": return "Desconectado";
      case "error": return "Error";
      default: return "Desconocido";
    }
  };

  const apiKeyOptions = apiKeys.map(key => ({ id: key.id, name: key.name }));

  // Show error message if locationId is missing
  if (!locationId) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-red-600">
          No se proporcionó un ID de ubicación válido
        </div>
      </div>
    );
  }

  // Show full page loader only during the very initial load when locationId IS available
  if (isLoading && !instanceData) {
    return <LoadingOverlay text="Cargando detalles de la instancia..." />;
  }


  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Instancias
      </button>

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center mb-3 sm:mb-0">
            {instanceData?.profilePicUrl ? (
              <img
                src={instanceData.profilePicUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full mr-4"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <Bot className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {instance?.instance_alias || instanceName || "Cargando..."}
              </h1>
              {/* Use instanceData?.number first, fallback to parsing ownerJid */}
              <p className="text-sm text-gray-500">
                {instanceData?.number || (instanceData?.ownerJid ? instanceData.ownerJid.split("@")[0] : "Número no disponible")}
              </p>
              <div className="flex items-center mt-1">
                {renderStatusIcon()}
                <span className="ml-1.5 text-sm text-gray-600">{getStatusText()}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 justify-start sm:justify-end w-full sm:w-auto">
            {/* Action Buttons */}
            {(instanceData?.state === "close" || instanceData?.state === "qr" || instanceData?.state === "connecting") && (
              <button
                onClick={handleRefreshQR}
                disabled={isRefreshingQR}
                className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm disabled:opacity-50"
              >
                {isRefreshingQR ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-1" />
                )}
                {instanceData?.state === "open" ? "Ver QR" : "Conectar / QR"}
              </button>
            )}
             {instanceData?.state === "open" && (
              <button
                onClick={handleTurnOffInstance}
                disabled={isTurningOff}
                className="flex items-center px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm disabled:opacity-50"
              >
                {isTurningOff ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <PowerOff className="w-4 h-4 mr-1" />
                )}
                Desconectar
              </button>
            )}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              <Settings className="w-4 h-4 mr-1" />
              Configurar
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </button>
            {/* <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-sm"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Asignar Usuario
            </button> */}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Credentials & Custom Assistants) */}
        <div className="lg:col-span-1 space-y-6">
          {/* OpenAI Credentials */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
             <OpenAICredentialsList
                apiKeys={apiKeys}
                onAddCredential={handleAddCredential}
                onDeleteCredential={handleDeleteCredential}
                isLoading={isLoadingCredentials}
             />
          </div>

          {/* Asistentes Wa Level Section */}
          {/* Removed the redundant header/container around OpenAIAssistantsList */}
          <OpenAIAssistantsList
            assistants={customAssistants}
            onAddAssistant={handleAddAssistant}
            onDeleteAssistant={handleDeleteAssistant}
            onEditAssistant={handleEditAssistant}
            isLoading={isLoadingCustomAssistants}
            instanceName={instanceName || ""}
            apiKeys={apiKeyOptions}
            isLoadingCredentials={isLoadingCredentials} // Pass loading state for credentials
          />
        </div>

        {/* Right Column (Official Assistants) */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-emerald-50">
              <h3 className="text-lg font-medium text-emerald-900 mb-1">
                Asistentes Oficiales OpenAI
              </h3>
              <p className="text-sm text-gray-600">Gestiona asistentes creados directamente con la API de OpenAI.</p>
              {apiKeys.length === 0 && !isLoadingCredentials && (
                <p className="text-xs text-yellow-700 mt-2 bg-yellow-100 p-2 rounded border border-yellow-200">
                  <Info size={14} className="inline mr-1" />
                  Necesita añadir al menos una Credencial de OpenAI para poder crear o ver asistentes oficiales.
                </p>
              )}
            </div>
            <div className="p-4">
              {/* Pass the fetched official assistants, loading state, selected filter, and handler */}
              <OpenAIOfficialAssistantsList
                assistants={officialAssistants} // Pass the API-filtered list
                onAddAssistant={handleAddOfficialAssistant}
                onDeleteAssistant={handleDeleteOfficialAssistant} // Pass the updated handler
                onEditAssistant={handleEditOfficialAssistant}
                isLoading={isLoadingOfficialAssistants} // Use the specific loading state
                instanceName={instanceName || ""}
                apiKeys={apiKeyOptions} // Pass all available keys for the dropdown
                selectedApiKeyFilter={selectedOfficialApiKeyId} // Pass the selected key ID
                onApiKeyFilterChange={handleOfficialApiKeyFilterChange} // Pass the handler
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {instance && (
        <WhatsAppConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onSave={handleSaveConfig}
          initialConfig={{
            alias: instance.instance_alias,
            userId: instance.userId || "", // Assuming userId is part of instance detail
            isMainDevice: instance.main_device,
            facebookAds: instance.fb_ads,
            n8n_webhook: instance.n8n_webhook,
            active_ia: instance.active_ia,
          }}
          users={users}
        />
      )}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        instanceName={instance?.instance_alias || instanceName || ""}
        onConfirm={handleDeleteInstance}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDeleting={isDeleting}
      />
      {/* Pass locationId correctly to QRCodeModal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        qrCode={instanceData?.qrcode || ""}
        instanceName={instanceName || ""} // Use instanceName from params
        locationId={locationId || undefined} // Pass locationId from state/localStorage
        userId={instanceData?.userId || undefined} // Pass userId from instanceData if available
        userName={instance?.instance_alias || instanceName || ""} // Use alias or name for display
        onRefresh={handleRefreshQR} // Allow refresh from QR modal
        isRefreshing={isRefreshingQR}
        onQRCodeUpdated={(qrcode) => setInstanceData((prev: any) => ({ ...prev, qrcode }))} // Update QR in state if modal gets a new one
        // Pass the callback to update state when connection is detected in modal
        onConnectionSuccess={handleQRCodeModalConnectionSuccess}
      />
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        users={users} // Pass existing users for selection/editing
      />
      <OpenAICredentialModal
        isOpen={isCredentialModalOpen}
        onClose={() => setIsCredentialModalOpen(false)}
        onSave={handleSaveCredential}
      />
      {/* Custom Assistant Modal */}
      <OpenAIAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => {
          setIsAssistantModalOpen(false);
          setEditingAssistant(null); // Clear editing state on close
        }}
        onSave={handleSaveAssistant}
        apiKeys={apiKeyOptions} // Pass API keys for selection
        instanceName={instanceName || ""}
        existingAssistant={editingAssistant} // Pass assistant being edited
      />
      {/* Official Assistant Modal */}
      <OpenAIOfficialAssistantModal
        isOpen={isOfficialAssistantModalOpen}
        onClose={() => {
          setIsOfficialAssistantModalOpen(false);
          setEditingOfficialAssistant(null); // Clear editing state on close
        }}
        onSave={handleSaveOfficialAssistant}
        apiKeys={apiKeyOptions} // Pass API keys for selection
        instanceName={instanceName || ""}
        existingAssistant={editingOfficialAssistant} // Pass assistant being edited
      />
    </div>
  );
};

export default InstanceDetailPage;
