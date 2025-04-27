export interface UserData {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
}

export interface UserResponse {
  data: UserData[];
  instancias: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface WhatsAppInstance {
  id: string;
  instance_id: number;
  instance_name: string;
  instance_alias: string;
  main_device: boolean;
  fb_ads: boolean;
  n8n_webhook?: string;
  active_ia?: boolean;
  apikey: string;
  location_id: string | null;
  token: string | null;
  status?: string; // e.g., 'active', 'inactive'
  connectionStatus?: string; // e.g., 'open', 'connecting', 'close'
  qrcode?: string;
  userId?: string;
  ownerJid?: string;
  profilePicUrl?: string;
  photo?: string; // Added photo as a potential property
}

export interface InstanceConfig {
  alias: string;
  userId?: string;
  isMainDevice: boolean;
  facebookAds: boolean;
  n8n_webhook?: string;
  active_ia?: boolean;
  instance_name?: string; // Only needed for creation if not auto-generated
  // User details for creation if applicable
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}

// Represents the structure returned by /creds endpoint
export interface OpenAICredential {
  id: string; // Credential set ID (e.g., user or instance identifier)
  name: string; // Name associated with this credential set
  token: string; // Maybe an internal token, usage unclear from context
  apiKeys: OpenAIApiKey[]; // Array of actual API keys
}

// Represents a single API key within the OpenAICredential
export interface OpenAIApiKey {
  id: string; // Unique ID for this specific API key entry
  name: string; // User-defined name for the API key (e.g., "Primary Key")
  apiKey: string; // The actual OpenAI API key (masked or full, depending on API response)
}

// Represents the custom/instance assistant structure from /assistants endpoint
export interface OpenAIAssistant {
  id: string; // Unique ID of this assistant configuration
  name: string; // User-defined name/description
  instructions: string; // Kept for potential future use, not directly mapped from current API
  apiKeyId: string; // ID of the OpenAIApiKey used
  createdAt: string;
  updatedAt: string;
  assistantId?: string; // OpenAI Assistant ID (if applicable, seems relevant here)
  webhookUrl?: string; // URL for function calls/webhooks
  triggerType?: TriggerType;
  triggerCondition?: TriggerCondition;
  triggerValue?: string;
  expirationMinutes?: number; // expire field
  stopKeyword?: string; // keywordFinish field
  messageDelayMs?: number; // delayMessage field
  unknownMessage?: string;
  listenToOwner?: boolean; // listeningFromMe field
  stopByOwner?: boolean; // stopBotFromMe field
  keepSessionOpen?: boolean; // keepOpen field
  debounceSeconds?: number; // debounceTime field
  separateMessages?: boolean; // splitMessages field
  secondsPerMessage?: number; // timePerChar field / 10
}

// Structure for OpenAI Function Definition (as per OpenAI API)
export interface OpenAIFunction {
  name: string;
  description?: string;
  parameters: object; // JSON Schema object
}

// Structure for OpenAI Tool (as per OpenAI API)
export type OpenAITool =
  | { type: 'code_interpreter' }
  | { type: 'retrieval' }
  | { type: 'function'; function: OpenAIFunction };

// Represents the official OpenAI assistant structure from /official-assistants endpoint
export interface OpenAIOfficialAssistant {
  id: string; // Unique ID from your backend for this assistant record (maps from API 'id')
  name: string; // Name given to the assistant (maps from API 'name')
  instructions: string; // Instructions provided to the assistant (maps from API 'instructions')
  model: string; // OpenAI model used (e.g., "gpt-4-turbo") (maps from API 'model')
  apiKeyId: string; // ID of the OpenAIApiKey used (maps to API 'openaiCredsId')
  tools: OpenAITool[]; // Array of tools enabled (updated structure) (maps from API 'tools')
  temperature?: number; // Added temperature field (optional) (maps from API 'temperature')
  top_p?: number; // Added top_p field (optional) (maps from API 'top_p')
  createdAt: string; // Timestamp from backend (maps from API 'created_at')
  updatedAt?: string; // Timestamp from backend (optional, as per image)
  // Potentially add the actual OpenAI assistant ID if returned by backend:
  // openai_assistant_id?: string;
}

// Represents a session for a custom/instance assistant from /sessions endpoint
export interface AssistantSession {
  id: string; // Unique ID for the session record
  sessionId: string; // The actual session identifier (e.g., thread ID)
  remoteJid: string; // WhatsApp JID of the user in the session
  pushName: string | null; // User's WhatsApp name
  status: "opened" | "closed" | "paused"; // Current status of the session
  awaitUser: boolean; // Whether the bot is waiting for user input
  context: any; // Any context data stored for the session
  type: string; // Type of session/bot
  createdAt: string;
  updatedAt: string;
  instanceId: string; // ID of the WhatsApp instance
  parameters: any; // Parameters associated with the session
  botId: string; // ID of the bot/assistant managing the session
}

// Types for assistant triggers and session actions
export type TriggerType = 'keyword' | 'all' | 'none' | 'advanced';
export type TriggerCondition = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
export type SessionAction = 'opened' | 'paused' | 'closed' | 'delete';

// Props for TermsAndConditionsModal (if used elsewhere)
export interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
  textBtn?: string;
}
