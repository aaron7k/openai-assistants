import axios from "axios";
import {
  User,
  UserResponse,
  WhatsAppInstance,
  InstanceConfig,
  OpenAICredential,
  OpenAIApiKey,
  OpenAIAssistant,
  TriggerType,
  TriggerCondition,
  AssistantSession,
  SessionAction,
  OpenAIOfficialAssistant,
  OpenAITool // Import OpenAITool
} from "./types";
import { toast } from "react-hot-toast";

const BASE_URL = `https://api.infragrowthai.com/webhook/whatsapp`;
const OPENAI_BASE_URL = `https://api.infragrowthai.com/webhook/openai`;

export const getUsers = async (locationId: string): Promise<User[]> => {
  try {
    const response = await axios.get<UserResponse>(`${BASE_URL}/get-users`, {
      params: { locationId },
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
      }));
    }

    return [];
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching users:", error.message);
    }
    return [];
  }
};

export const listInstances = async (
  locationId: string
): Promise<WhatsAppInstance[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/ver-instancias`, {
      params: { locationId },
    });
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error listing instances:", error.message);
    }
    return [];
  }
};

export const createInstance = async (
  locationId: string,
  config: InstanceConfig,
  userData?: {
    user_name?: string;
    user_email?: string;
    user_phone?: string;
  }
) => {
  try {
    const response = await axios.post(`${BASE_URL}/create-instance`, {
      locationId,
      ...config,
      n8n_webhook: config.n8n_webhook,
      active_ia: config.active_ia,
      ...(userData && {
        user_name: userData.user_name,
        user_email: userData.user_email,
        user_phone: userData.user_phone,
      }),
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating instance:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al crear la instancia de WhatsApp");
    }

    throw error;
  }
};

export const refreshQRCode = async (
  locationId: string,
  instanceName: string
) => {
  try {
    const response = await axios.post(`${BASE_URL}/get-qr`, {
      locationId,
      instanceName,
    });

    console.log("QR Code response:", response.data);

    // Don't show success toast if only state is returned without message
    // if (response.data && response.data.message) {
    //   toast.success(response.data.message);
    // }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error refreshing QR code:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    }

    return { error: "Error al obtener QR" };
  }
};

export const deleteInstance = async (
  locationId: string,
  instanceName: string
) => {
  try {
    const response = await axios.delete(`${BASE_URL}/delete-instance`, {
      data: {
        locationId,
        instanceName,
      },
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting instance:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al eliminar la instancia");
    }

    throw error;
  }
};

export const getInstanceData = async (
  locationId: string,
  instanceName: string
) => {
  try {
    const response = await axios.post(`${BASE_URL}/get-instance-data`, {
      locationId,
      instanceName,
    });

    // Verificar si hay un estado en la respuesta y si es 'close' o no existe
    if (!response.data.state || response.data.state === 'close') {
      // Intentar obtenerlo del endpoint get-qr solo si está cerrado o no hay estado
      try {
        console.log(`Instance state is ${response.data.state || 'missing'}, attempting get-qr...`);
        const qrResponse = await axios.post(`${BASE_URL}/get-qr`, {
          locationId,
          instanceName,
        });

        // Si get-qr devuelve un estado, usarlo
        if (qrResponse.data && qrResponse.data.state) {
           console.log(`Got state from get-qr: ${qrResponse.data.state}`);
          response.data.state = qrResponse.data.state;
        }
         // Si get-qr devuelve qrcode, usarlo también
        if (qrResponse.data && qrResponse.data.qrcode) {
          response.data.qrcode = qrResponse.data.qrcode;
        }
      } catch (qrError) {
        console.error("Error getting QR state/code:", qrError);
         // No sobrescribir el estado si get-qr falla
      }
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error getting instance data:", error.message);
    }
    // Return a default structure on error
    return { name: "", number: "", photo: "", state: "error" };
  }
};

export const turnOffInstance = async (
  locationId: string,
  instanceName: string
) => {
  try {
    const response = await axios.post(`${BASE_URL}/turn-off`, {
      locationId,
      instanceName,
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error turning off instance:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al desconectar la instancia");
    }

    throw error;
  }
};

export const editInstance = async (
  locationId: string,
  instanceName: string,
  config: InstanceConfig
) => {
  try {
    const response = await axios.put(`${BASE_URL}/edit-instance`, {
      locationId,
      instanceName,
      ...config,
      n8n_webhook: config.n8n_webhook,
      active_ia: config.active_ia,
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing instance:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al actualizar la configuración de la instancia");
    }

    throw error;
  }
};

export const getInstanceConfig = async (
  locationId: string,
  instanceId: string
) => {
  try {
    const response = await axios.get(`${BASE_URL}/ver-instancia`, {
      params: { locationId, instanceId },
    });

    if (!response.data.data) {
      throw new Error("No se encontró la configuración de la instancia");
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error getting instance config:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al obtener la configuración de la instancia");
    }

    throw error;
  }
};

// OpenAI API endpoints
export const getOpenAICredentials = async (instanceName: string): Promise<OpenAICredential> => {
  try {
    const response = await axios.get(`${OPENAI_BASE_URL}/creds`, {
      params: { instance_name: instanceName }
    });
    // Ensure apiKeys is always an array, even if null/undefined from API
    return { ...response.data, apiKeys: response.data?.apiKeys || [] };
  } catch (error) {
     if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Handle 404 specifically: No credentials found is not necessarily a hard error
      console.log(`No OpenAI credentials found for instance: ${instanceName}`);
      return { id: instanceName, name: 'Default', token: '', apiKeys: [] }; // Return empty structure
    }

    if (error instanceof Error) {
      console.error("Error fetching OpenAI credentials:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
       toast.error("Error al obtener las credenciales de OpenAI");
    }

    // Re-throw for calling function to handle (e.g., set loading state off)
    throw new Error("Error al obtener las credenciales de OpenAI");
  }
};

export const createOpenAICredential = async (
  instanceName: string,
  name: string,
  apiKey: string
) => {
  try {
    const response = await axios.post(`${OPENAI_BASE_URL}/creds`, {
      instance_name: instanceName,
      name,
      apikey: apiKey
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating OpenAI credential:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al crear la credencial de OpenAI");
    }

    throw error;
  }
};

export const deleteOpenAICredential = async (
  instanceName: string,
  credentialId: string
) => {
  try {
    const response = await axios.delete(`${OPENAI_BASE_URL}/creds`, {
      params: {
        instance_name: instanceName,
        id: credentialId
      }
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting OpenAI credential:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al eliminar la credencial de OpenAI");
    }

    throw error;
  }
};

// OpenAI Assistant endpoints (Custom/Instance - Renamed to WA Level Assistant)
export const getOpenAIAssistants = async (instanceName: string): Promise<OpenAIAssistant[]> => {
  try {
    const response = await axios.get(`${OPENAI_BASE_URL}/assistants`, {
      params: { instance_name: instanceName }
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((assistant: any) => ({
        id: assistant.id,
        name: assistant.description || "Sin nombre",
        instructions: "", // Not used in this type of assistant via API
        apiKeyId: assistant.openaiCredsId,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt,
        assistantId: assistant.assistantId, // This is the linked OpenAI Assistant ID
        webhookUrl: assistant.functionUrl,
        triggerType: assistant.triggerType as TriggerType,
        triggerCondition: assistant.triggerOperator as TriggerCondition,
        triggerValue: assistant.triggerValue,
        expirationMinutes: assistant.expire,
        stopKeyword: assistant.keywordFinish,
        messageDelayMs: assistant.delayMessage,
        unknownMessage: assistant.unknownMessage,
        listenToOwner: assistant.listeningFromMe,
        stopByOwner: assistant.stopBotFromMe !== undefined ? assistant.stopBotFromMe : true,
        keepSessionOpen: assistant.keepOpen !== undefined ? assistant.keepOpen : true,
        debounceSeconds: assistant.debounceTime || 6,
        separateMessages: assistant.splitMessages !== undefined ? assistant.splitMessages : true,
        secondsPerMessage: (assistant.timePerChar || 10) / 10
      }));
    }

    return [];
  } catch (error) {
     if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`No custom assistants found for instance: ${instanceName}`);
        return []; // Return empty array if none found
     }
    if (error instanceof Error) {
      console.error("Error fetching OpenAI assistants:", error.message);
    }

    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
       toast.error("Error al obtener los asistentes personalizados");
    }

    return []; // Return empty array on other errors
  }
};

export const getOpenAIAssistant = async (instanceName: string, assistantId: string): Promise<OpenAIAssistant> => {
  try {
    const response = await axios.get(`${OPENAI_BASE_URL}/agent`, {
      params: {
        instance_name: instanceName,
        id: assistantId // API uses 'id' for assistant ID here
      }
    });

    if (!response.data) {
      throw new Error("La respuesta no contiene datos");
    }

    const assistant = response.data;
    return {
      id: assistant.id || "",
      name: assistant.description || "Sin nombre",
      instructions: "",
      apiKeyId: assistant.openaiCredsId || "",
      createdAt: assistant.createdAt || new Date().toISOString(),
      updatedAt: assistant.updatedAt || new Date().toISOString(),
      assistantId: assistant.assistantId || "", // This is the linked OpenAI Assistant ID
      webhookUrl: assistant.functionUrl || "",
      triggerType: (assistant.triggerType || "all") as TriggerType,
      triggerCondition: (assistant.triggerOperator || "contains") as TriggerCondition,
      triggerValue: assistant.triggerValue || "",
      expirationMinutes: assistant.expire || 60,
      stopKeyword: assistant.keywordFinish || "#stop",
      messageDelayMs: assistant.delayMessage || 1500,
      unknownMessage: assistant.unknownMessage || "No puedo entender aún este tipo de mensajes",
      listenToOwner: assistant.listeningFromMe || false,
      stopByOwner: assistant.stopBotFromMe !== undefined ? assistant.stopBotFromMe : true,
      keepSessionOpen: assistant.keepOpen !== undefined ? assistant.keepOpen : true,
      debounceSeconds: assistant.debounceTime || 6,
      separateMessages: assistant.splitMessages !== undefined ? assistant.splitMessages : true,
      secondsPerMessage: (assistant.timePerChar || 10) / 10
    };
  } catch (error) {
    console.error("Error completo al obtener asistente:", error);
    if (error instanceof Error) {
      console.error("Error fetching OpenAI assistant:", error.message);
    }
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", error.response?.data);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      }
    } else {
      toast.error("Error al obtener el asistente de OpenAI");
    }
    throw error;
  }
};

export const createOpenAIAssistant = async (
  instanceName: string,
  name: string,
  instructions: string, // Not directly used by API, but kept for consistency
  apiKeyId: string,
  assistantId: string, // This is the linked OpenAI Assistant ID
  webhookUrl: string,
  triggerType: TriggerType,
  triggerCondition?: TriggerCondition,
  triggerValue?: string,
  expirationMinutes?: number,
  stopKeyword?: string,
  messageDelayMs?: number,
  unknownMessage?: string,
  listenToOwner?: boolean,
  stopByOwner?: boolean,
  keepSessionOpen?: boolean,
  debounceSeconds?: number,
  separateMessages?: boolean,
  secondsPerMessage?: number
) => {
  try {
    const payload: any = {
      instance_name: instanceName,
      description: name, // Use name as description for API
      openaiCredsId: apiKeyId,
      assistantId: assistantId, // Send the linked OpenAI Assistant ID
      functionUrl: webhookUrl,
      triggerType: triggerType,
      botType: "assistant" // This seems to be the type for WA Level assistants
    };

    if (triggerType === 'keyword' || triggerType === 'advanced') {
      payload.triggerOperator = triggerCondition;
      payload.triggerValue = triggerValue;
    }

    // Add optional parameters only if they have a value (or are explicitly false)
    if (expirationMinutes !== undefined) payload.expire = expirationMinutes;
    if (stopKeyword !== undefined) payload.keywordFinish = stopKeyword;
    if (messageDelayMs !== undefined) payload.delayMessage = messageDelayMs;
    if (unknownMessage !== undefined) payload.unknownMessage = unknownMessage;
    if (listenToOwner !== undefined) payload.listeningFromMe = listenToOwner;
    if (stopByOwner !== undefined) payload.stopBotFromMe = stopByOwner;
    if (keepSessionOpen !== undefined) payload.keepOpen = keepSessionOpen;
    if (debounceSeconds !== undefined) payload.debounceTime = debounceSeconds;
    if (separateMessages !== undefined) payload.splitMessages = separateMessages;
    if (secondsPerMessage !== undefined) payload.timePerChar = secondsPerMessage * 10;

    const response = await axios.post(`${OPENAI_BASE_URL}/assistants`, payload);

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error creating OpenAI assistant:", error.message);
    }
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al crear el asistente de OpenAI");
    }
    throw error;
  }
};

export const updateOpenAIAssistant = async (
  instanceName: string,
  id: string, // This is the ID of the WA Level assistant record
  name: string,
  instructions: string, // Not directly used by API
  apiKeyId: string,
  assistantId: string, // This is the linked OpenAI Assistant ID
  webhookUrl: string,
  triggerType: TriggerType,
  triggerCondition?: TriggerCondition,
  triggerValue?: string,
  expirationMinutes?: number,
  stopKeyword?: string,
  messageDelayMs?: number,
  unknownMessage?: string,
  listenToOwner?: boolean,
  stopByOwner?: boolean,
  keepSessionOpen?: boolean,
  debounceSeconds?: number,
  separateMessages?: boolean,
  secondsPerMessage?: number
) => {
  try {
    const payload: any = {
      instance_name: instanceName,
      id: id, // Send the ID of the WA Level assistant record
      description: name,
      openaiCredsId: apiKeyId,
      assistantId: assistantId, // Send the linked OpenAI Assistant ID
      functionUrl: webhookUrl,
      triggerType: triggerType,
      botType: "assistant" // This seems to be the type for WA Level assistants
    };

    if (triggerType === 'keyword' || triggerType === 'advanced') {
      payload.triggerOperator = triggerCondition;
      payload.triggerValue = triggerValue;
    }

    // Add optional parameters only if they have a value (or are explicitly false)
    if (expirationMinutes !== undefined) payload.expire = expirationMinutes;
    if (stopKeyword !== undefined) payload.keywordFinish = stopKeyword;
    if (messageDelayMs !== undefined) payload.delayMessage = messageDelayMs;
    if (unknownMessage !== undefined) payload.unknownMessage = unknownMessage;
    if (listenToOwner !== undefined) payload.listeningFromMe = listenToOwner;
    if (stopByOwner !== undefined) payload.stopBotFromMe = stopByOwner;
    if (keepSessionOpen !== undefined) payload.keepOpen = keepSessionOpen;
    if (debounceSeconds !== undefined) payload.debounceTime = debounceSeconds;
    if (separateMessages !== undefined) payload.splitMessages = separateMessages;
    if (secondsPerMessage !== undefined) payload.timePerChar = secondsPerMessage * 10;


    const response = await axios.put(`${OPENAI_BASE_URL}/assistants`, payload);

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating OpenAI assistant:", error.message);
    }
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al actualizar el asistente de OpenAI");
    }
    throw error;
  }
};

export const deleteOpenAIAssistant = async (
  instanceName: string,
  assistantId: string // This is the ID of the WA Level assistant record
) => {
  try {
    const response = await axios.delete(`${OPENAI_BASE_URL}/assistants`, {
      params: {
        instance_name: instanceName,
        id: assistantId // API expects 'id' for the WA Level assistant record ID
      }
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting OpenAI assistant:", error.message);
    }
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al eliminar el asistente de OpenAI");
    }
    throw error;
  }
};

// Assistant Session endpoints
export const getAssistantSessions = async (
  instanceName: string,
  assistantId: string // This is the ID of the WA Level assistant record
): Promise<AssistantSession[]> => {
  try {
    const response = await axios.get(`${OPENAI_BASE_URL}/sessions`, {
      params: {
        instance_name: instanceName,
        id: assistantId // API uses 'id' for WA Level assistant ID here
      }
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error) {
     if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`No sessions found for assistant ${assistantId} in instance: ${instanceName}`);
        return []; // Return empty array if none found
     }
    if (error instanceof Error) {
      console.error("Error fetching assistant sessions:", error.message);
    }
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al obtener las sesiones del asistente");
    }
    return [];
  }
};

export const updateSessionState = async (
  instanceName: string,
  assistantId: string, // This is the ID of the WA Level assistant record
  sessionId: string,
  remoteJid: string,
  action: SessionAction
) => {
  try {
    const response = await axios.post(`${OPENAI_BASE_URL}/sessions`, {
      instance_name: instanceName,
      id: assistantId, // API uses 'id' for WA Level assistant ID
      sessionId: sessionId,
      remoteJid: remoteJid,
      action: action
    });

    const actionMessages = {
      opened: "Sesión abierta correctamente",
      paused: "Sesión pausada correctamente",
      closed: "Sesión cerrada correctamente",
      delete: "Sesión eliminada correctamente"
    };

    if (response.data) {
      toast.success(response.data.message || actionMessages[action]);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error updating session state (${action}):`, error.message);
    }
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      const errorMessages = {
        opened: "Error al abrir la sesión",
        paused: "Error al pausar la sesión",
        closed: "Error al cerrar la sesión",
        delete: "Error al eliminar la sesión"
      };
      toast.error(errorMessages[action]);
    }
    throw error;
  }
};

export const pauseAssistantSession = async (
  instanceName: string,
  assistantId: string, // This is the ID of the WA Level assistant record
  sessionId: string,
  remoteJid: string
) => {
  return updateSessionState(instanceName, assistantId, sessionId, remoteJid, "paused");
};

export const openAssistantSession = async (
  instanceName: string,
  assistantId: string, // This is the ID of the WA Level assistant record
  sessionId: string,
  remoteJid: string
) => {
  return updateSessionState(instanceName, assistantId, sessionId, remoteJid, "opened");
};

export const closeAssistantSession = async (
  instanceName: string,
  assistantId: string, // This is the ID of the WA Level assistant record
  sessionId: string,
  remoteJid: string
) => {
  return updateSessionState(instanceName, assistantId, sessionId, remoteJid, "closed");
};

export const deleteAssistantSession = async (
  instanceName: string,
  assistantId: string, // This is the ID of the WA Level assistant record
  sessionId: string,
  remoteJid: string
) => {
  return updateSessionState(instanceName, assistantId, sessionId, remoteJid, "delete");
};

// =========== OPENAI OFFICIAL API ENDPOINTS ===========

// Modified to accept optional apiKeyId for filtering
export const getOpenAIOfficialAssistants = async (
  instanceName: string,
  apiKeyId?: string // Optional API Key ID for filtering
): Promise<OpenAIOfficialAssistant[]> => {
  try {
    const params: { instance_name: string; openaiCredsId?: string } = {
      instance_name: instanceName,
    };
    if (apiKeyId) {
      params.openaiCredsId = apiKeyId; // Add filter if provided
    }
    // console.log(`[API] Fetching official assistants for ${instanceName} with params:`, params); // Log params

    const response = await axios.get(`${OPENAI_BASE_URL}/official-assistants`, { params });

    // Check if response data and the data array are present and are arrays
    if (response.data && Array.isArray(response.data.data)) {
      // Map API response to our OpenAIOfficialAssistant type
      return response.data.data.map((assistant: any) => {
        // --- MODIFIED MAPPING LOGIC ---
        // Use the apiKeyId from the filter if the API response doesn't include it
        const assistantApiKeyId = assistant.openaiCredsId || apiKeyId || "";
        // console.log(`[API] Mapping official assistant: ID=${assistant.id}, openaiCredsId=${assistant.openaiCredsId}, Mapped apiKeyId=${assistantApiKeyId}`);
        // --- END MODIFIED MAPPING LOGIC ---
        return {
          id: assistant.id, // Use API 'id'
          name: assistant.name || "Sin nombre", // Use API 'name'
          instructions: assistant.instructions || "", // Use API 'instructions'
          model: assistant.model || "gpt-4-turbo", // Use API 'model', default if not provided
          apiKeyId: assistantApiKeyId, // Use the determined apiKeyId
          tools: assistant.tools || [], // Use API 'tools', ensure it's an array
          temperature: assistant.temperature !== undefined ? assistant.temperature : 1.0, // Use API 'temperature', default 1.0
          top_p: assistant.top_p !== undefined ? assistant.top_p : 1.0, // Use API 'top_p', default 1.0
          createdAt: assistant.created_at, // Use API 'created_at'
          updatedAt: assistant.updatedAt // Use API 'updatedAt' (optional in type)
        };
      });
    } else {
        // Log unexpected response structure
        console.error("[API] Unexpected response structure for official assistants:", response.data);
        toast.error("Error: Estructura de respuesta inesperada al obtener asistentes oficiales.");
        return []; // Return empty array on unexpected structure
    }

  } catch (error) {
     if (axios.isAxiosError(error)) {
        console.error("[API] Axios error fetching official assistants:", error.message);
        console.error("[API] Axios error details:", error.response?.data); // Log response data on error
        console.error("[API] Axios error status:", error.response?.status); // Log status on error

        if (error.response?.status === 404) {
           console.log(`No official assistants found for instance: ${instanceName} (Filter: ${apiKeyId || 'None'})`);
           // No toast for 404, handled by component showing empty state
        } else if (error.response?.data?.message) {
           toast.error(error.response.data.message);
        } else {
           toast.error("Error al obtener los asistentes oficiales de OpenAI");
        }
     } else if (error instanceof Error) {
       console.error("[API] Generic error fetching official assistants:", error.message);
       toast.error("Error al obtener los asistentes oficiales de OpenAI");
     } else {
        console.error("[API] Unknown error fetching official assistants:", error);
        toast.error("Error desconocido al obtener los asistentes oficiales de OpenAI");
     }
    return []; // Return empty array on any error
  }
};

// Updated to accept the structured data from the modal, including temperature and top_p
export const createOpenAIOfficialAssistant = async (
  instanceName: string,
  assistantData: Omit<OpenAIOfficialAssistant, 'id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    const payload = {
      instance_name: instanceName,
      name: assistantData.name,
      instructions: assistantData.instructions,
      model: assistantData.model,
      openaiCredsId: assistantData.apiKeyId, // Match API field name
      tools: assistantData.tools, // Send the structured tools array
      temperature: assistantData.temperature, // Include temperature
      top_p: assistantData.top_p // Include top_p
    };
    console.log("Creating official assistant with payload:", payload); // Log payload

    const response = await axios.post(`${OPENAI_BASE_URL}/official-assistants`, payload);

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    console.error("Error creating OpenAI official assistant:", error); // Log full error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    if (axios.isAxiosError(error)) {
       console.error("Axios error response:", error.response?.data);
       toast.error(error.response?.data?.message || "Error al crear el asistente oficial de OpenAI");
    } else {
      toast.error("Error al crear el asistente oficial de OpenAI");
    }
    throw error;
  }
};

// Updated to accept the structured data from the modal, including temperature and top_p
export const updateOpenAIOfficialAssistant = async (
  instanceName: string,
  assistantData: Omit<OpenAIOfficialAssistant, 'createdAt' | 'updatedAt'> & { id: string } // Require id for update
) => {
  try {
     const payload = {
      instance_name: instanceName,
      id: assistantData.id, // API expects 'id' in the payload
      name: assistantData.name,
      instructions: assistantData.instructions,
      model: assistantData.model,
      openaiCredsId: assistantData.apiKeyId, // Match API field name
      tools: assistantData.tools, // Send the structured tools array
      temperature: assistantData.temperature, // Include temperature
      top_p: assistantData.top_p // Include top_p
    };
    console.log("Updating official assistant with payload:", payload); // Log payload

    const response = await axios.put(`${OPENAI_BASE_URL}/official-assistants`, payload);

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    console.error("Error updating OpenAI official assistant:", error); // Log full error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
     if (axios.isAxiosError(error)) {
       console.error("Axios error response:", error.response?.data);
       toast.error(error.response?.data?.message || "Error al actualizar el asistente oficial de OpenAI");
    } else {
      toast.error("Error al actualizar el asistente oficial de OpenAI");
    }
    throw error; // Re-throw error for handling in the component
  }
};

export const deleteOpenAIOfficialAssistant = async (
  instanceName: string,
  assistantId: string, // This is the ID of the WA Level assistant record
  apiKeyId: string // Add apiKeyId parameter
) => {
  try {
    const response = await axios.delete(`${OPENAI_BASE_URL}/official-assistants`, {
      params: {
        instance_name: instanceName,
        id: assistantId, // API expects 'id' as a query parameter
        openaiCredsId: apiKeyId // Add openaiCredsId to params
      }
    });

    if (response.data && response.data.message) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting OpenAI official assistant:", error.message);
    }
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Error al eliminar el asistente oficial de OpenAI");
    }
    throw error;
  }
};

// Export all API functions
const api = {
  getUsers,
  listInstances,
  createInstance,
  refreshQRCode,
  deleteInstance,
  getInstanceData,
  turnOffInstance,
  editInstance,
  getInstanceConfig,
  // Credentials
  getOpenAICredentials,
  createOpenAICredential,
  deleteOpenAICredential,
  // Custom Assistants (WA Level)
  getOpenAIAssistants,
  getOpenAIAssistant,
  createOpenAIAssistant,
  updateOpenAIAssistant,
  deleteOpenAIAssistant,
  // Sessions
  getAssistantSessions,
  updateSessionState,
  pauseAssistantSession,
  openAssistantSession,
  closeAssistantSession,
  deleteAssistantSession,
  // Official Assistants
  getOpenAIOfficialAssistants,
  createOpenAIOfficialAssistant,
  updateOpenAIOfficialAssistant,
  deleteOpenAIOfficialAssistant
};

export default api;
