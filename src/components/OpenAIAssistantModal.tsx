import React, { useState, useEffect } from "react";
import { X, Loader2, HelpCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { OpenAIApiKey, OpenAIAssistant } from "../types";
import { Switch } from "./Switch"; // Assuming Switch component exists

interface OpenAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assistantData: any) => Promise<boolean>; // Return boolean indicating success
  apiKeys: { id: string; name: string }[];
  instanceName: string;
  existingAssistant?: OpenAIAssistant | null; // Assistant data if editing
}

const OpenAIAssistantModal: React.FC<OpenAIAssistantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  apiKeys,
  instanceName,
  existingAssistant,
}) => {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState(""); // Instructions field (optional based on API)
  const [apiKeyId, setApiKeyId] = useState("");
  const [assistantId, setAssistantId] = useState(""); // OpenAI Assistant ID
  const [webhookUrl, setWebhookUrl] = useState("");
  const [triggerType, setTriggerType] = useState("always"); // e.g., 'always', 'keyword', 'condition'
  const [triggerCondition, setTriggerCondition] = useState(""); // e.g., 'contains', 'starts_with', 'equals'
  const [triggerValue, setTriggerValue] = useState(""); // The keyword or value for the trigger
  const [expirationMinutes, setExpirationMinutes] = useState(0); // Session expiration
  const [stopKeyword, setStopKeyword] = useState(""); // Keyword to stop the session
  const [messageDelayMs, setMessageDelayMs] = useState(0); // Delay between messages
  const [unknownMessage, setUnknownMessage] = useState(""); // Message for unknown commands/triggers
  const [listenToOwner, setListenToOwner] = useState(false); // Boolean
  const [stopByOwner, setStopByOwner] = useState(false); // Boolean
  const [keepSessionOpen, setKeepSessionOpen] = useState(false); // Boolean
  const [debounceSeconds, setDebounceSeconds] = useState(0); // Debounce time
  const [separateMessages, setSeparateMessages] = useState(false); // Boolean
  const [secondsPerMessage, setSecondsPerMessage] = useState(0); // Delay per message part
  const [isSaving, setIsSaving] = useState(false);
  const [showWebhookHelp, setShowWebhookHelp] = useState(false);
  const [showTriggerHelp, setShowTriggerHelp] = useState(false);
  const [showExpirationHelp, setShowExpirationHelp] = useState(false);
  const [showStopKeywordHelp, setShowStopKeywordHelp] = useState(false);
  const [showDelayHelp, setShowDelayHelp] = useState(false);
  const [showUnknownMessageHelp, setShowUnknownMessageHelp] = useState(false);
  const [showDebounceHelp, setShowDebounceHelp] = useState(false);
  const [showSeparateMessagesHelp, setShowSeparateMessagesHelp] = useState(false);
  const [showSecondsPerMessageHelp, setShowSecondsPerMessageHelp] = useState(false);

  // State for tabs
  const [activeTab, setActiveTab] = useState("basic"); // 'basic' or 'advanced'

  useEffect(() => {
    if (isOpen) {
      if (existingAssistant) {
        // Populate form for editing
        setName(existingAssistant.name || "");
        setInstructions(existingAssistant.instructions || "");
        setApiKeyId(existingAssistant.apiKeyId || "");
        setAssistantId(existingAssistant.assistantId || "");
        setWebhookUrl(existingAssistant.webhookUrl || "");
        setTriggerType(existingAssistant.triggerType || "always");
        setTriggerCondition(existingAssistant.triggerCondition || "");
        setTriggerValue(existingAssistant.triggerValue || "");
        setExpirationMinutes(existingAssistant.expirationMinutes || 0);
        setStopKeyword(existingAssistant.stopKeyword || "");
        setMessageDelayMs(existingAssistant.messageDelayMs || 0);
        setUnknownMessage(existingAssistant.unknownMessage || "");
        setListenToOwner(existingAssistant.listenToOwner || false);
        setStopByOwner(existingAssistant.stopByOwner || false);
        setKeepSessionOpen(existingAssistant.keepSessionOpen || false);
        setDebounceSeconds(existingAssistant.debounceSeconds || 0);
        setSeparateMessages(existingAssistant.separateMessages || false);
        setSecondsPerMessage(existingAssistant.secondsPerMessage || 0);
      } else {
        // Reset form for creating
        setName("");
        setInstructions("");
        setApiKeyId("");
        setAssistantId("");
        setWebhookUrl("");
        setTriggerType("always");
        setTriggerCondition("");
        setTriggerValue("");
        setExpirationMinutes(0);
        setStopKeyword("");
        setMessageDelayMs(0);
        setUnknownMessage("");
        setListenToOwner(false);
        setStopByOwner(false);
        setKeepSessionOpen(false);
        setDebounceSeconds(0);
        setSeparateMessages(false);
        setSecondsPerMessage(0);
      }
      setActiveTab("basic"); // Always start on the basic tab
    }
  }, [isOpen, existingAssistant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre del asistente es requerido.");
      return;
    }
    if (!apiKeyId) {
      toast.error("Debe seleccionar una credencial de OpenAI.");
      return;
    }
    if (!assistantId.trim()) {
      toast.error("El ID del asistente de OpenAI es requerido.");
      return;
    }

    if (webhookUrl && !webhookUrl.startsWith("http")) {
      toast.error("El Webhook URL debe ser una URL válida.");
      return;
    }

    if (triggerType !== 'always' && !triggerValue.trim()) {
         toast.error(`Debe especificar un valor para el tipo de trigger "${triggerType}".`);
         return;
    }

    setIsSaving(true);
    const success = await onSave({
      name: name.trim(),
      instructions: instructions.trim(), // Include instructions
      apiKeyId,
      assistantId: assistantId.trim(),
      webhookUrl: webhookUrl.trim(),
      triggerType,
      triggerCondition,
      triggerValue: triggerValue.trim(),
      expirationMinutes: Number(expirationMinutes),
      stopKeyword: stopKeyword.trim(),
      messageDelayMs: Number(messageDelayMs),
      unknownMessage: unknownMessage.trim(),
      listenToOwner,
      stopByOwner,
      keepSessionOpen,
      debounceSeconds: Number(debounceSeconds),
      separateMessages,
      secondsPerMessage: Number(secondsPerMessage),
    });
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isEditing = !!existingAssistant;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-purple-900">
            {isEditing ? "Editar Asistente Wa Level" : "Crear Asistente Wa Level"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "basic"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Configuración Básica
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("advanced")}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "advanced"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-700"
                }`}
              >
                Configuración Avanzada
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === "basic" && (
              <>
                {/* Basic Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Asistente
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Asistente de Ventas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credencial OpenAI
                  </label>
                  <select
                    value={apiKeyId}
                    onChange={(e) => setApiKeyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                    required
                  >
                    <option value="">Seleccione una credencial</option>
                    {apiKeys.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID del Asistente OpenAI
                  </label>
                  <input
                    type="text"
                    value={assistantId}
                    onChange={(e) => setAssistantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: asst_abc123..."
                    required
                  />
                </div>

                 <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Webhook URL (Opcional)
                       <button
                         type="button"
                         className="ml-2 text-gray-400 hover:text-gray-600"
                         onClick={() => setShowWebhookHelp(!showWebhookHelp)}
                       >
                         <HelpCircle className="w-4 h-4 inline" />
                       </button>
                    </label>
                     {showWebhookHelp && (
                       <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                         URL a la que se enviarán los mensajes entrantes para procesamiento externo antes de la IA.
                       </div>
                     )}
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://tu-webhook.com"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Trigger
                       <button
                         type="button"
                         className="ml-2 text-gray-400 hover:text-gray-600"
                         onClick={() => setShowTriggerHelp(!showTriggerHelp)}
                       >
                         <HelpCircle className="w-4 h-4 inline" />
                       </button>
                    </label>
                     {showTriggerHelp && (
                       <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                         Define cuándo se activará el asistente. 'always' responde a todos los mensajes. Otros tipos requieren una condición y valor.
                       </div>
                     )}
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="always">Siempre</option>
                      <option value="keyword">Por Palabra Clave</option>
                      {/* Add other trigger types as needed */}
                    </select>
                  </div>

                  {triggerType !== 'always' && (
                     <>
                       <div className="relative">
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                           Condición del Trigger
                         </label>
                         <select
                           value={triggerCondition}
                           onChange={(e) => setTriggerCondition(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                         >
                           <option value="">Seleccione una condición</option>
                           <option value="contains">Contiene</option>
                           <option value="starts_with">Empieza con</option>
                           <option value="equals">Es exactamente</option>
                           {/* Add other conditions */}
                         </select>
                       </div>
                       <div className="relative">
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                           Valor del Trigger
                         </label>
                         <input
                           type="text"
                           value={triggerValue}
                           onChange={(e) => setTriggerValue(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                           placeholder="Ej: 'hola' o 'menú'"
                         />
                       </div>
                     </>
                  )}

                   <div className="relative">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Mensaje para Desconocidos (Opcional)
                        <button
                          type="button"
                          className="ml-2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowUnknownMessageHelp(!showUnknownMessageHelp)}
                        >
                          <HelpCircle className="w-4 h-4 inline" />
                        </button>
                     </label>
                      {showUnknownMessageHelp && (
                        <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                          Mensaje enviado si el asistente no puede procesar la solicitud del usuario.
                        </div>
                      )}
                     <textarea
                       value={unknownMessage}
                       onChange={(e) => setUnknownMessage(e.target.value)}
                       rows={3}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                       placeholder="Ej: Lo siento, no entendí tu solicitud. ¿En qué más puedo ayudarte?"
                     />
                   </div>

              </>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-4"> {/* Added spacing here */}
                {/* Advanced Fields */}
                 <div className="relative">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Expiración de Sesión (Minutos)
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowExpirationHelp(!showExpirationHelp)}
                      >
                        <HelpCircle className="w-4 h-4 inline" />
                      </button>
                   </label>
                    {showExpirationHelp && (
                      <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                        Tiempo en minutos después del último mensaje del usuario para que la sesión con el asistente expire. 0 para no expirar.
                      </div>
                    )}
                   <input
                     type="number"
                     value={expirationMinutes}
                     onChange={(e) => setExpirationMinutes(Number(e.target.value))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                     placeholder="Ej: 15"
                     min="0"
                   />
                 </div>

                 <div className="relative">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Palabra Clave para Detener (Opcional)
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowStopKeywordHelp(!showStopKeywordHelp)}
                      >
                        <HelpCircle className="w-4 h-4 inline" />
                      </button>
                   </label>
                    {showStopKeywordHelp && (
                      <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                        Si el usuario envía este texto exacto, la sesión con el asistente se detendrá.
                      </div>
                    )}
                   <input
                     type="text"
                     value={stopKeyword}
                     onChange={(e) => setStopKeyword(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                     placeholder="Ej: 'stop' o 'salir'"
                   />
                 </div>

                 <div className="relative">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Retraso entre Mensajes (ms)
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowDelayHelp(!showDelayHelp)}
                      >
                        <HelpCircle className="w-4 h-4 inline" />
                      </button>
                   </label>
                    {showDelayHelp && (
                      <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                        Retraso en milisegundos antes de enviar la respuesta del asistente. Útil para simular escritura.
                      </div>
                    )}
                   <input
                     type="number"
                     value={messageDelayMs}
                     onChange={(e) => setMessageDelayMs(Number(e.target.value))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                     placeholder="Ej: 500"
                     min="0"
                   />
                 </div>

                 <div className="relative">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Debounce (Segundos)
                      <button
                        type="button"
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowDebounceHelp(!showDebounceHelp)}
                      >
                        <HelpCircle className="w-4 h-4 inline" />
                      </button>
                   </label>
                    {showDebounceHelp && (
                      <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                        Tiempo en segundos para esperar mensajes adicionales del usuario antes de enviar la respuesta de la IA. 0 para responder inmediatamente.
                      </div>
                    )}
                   <input
                     type="number"
                     value={debounceSeconds}
                     onChange={(e) => setDebounceSeconds(Number(e.target.value))}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                     placeholder="Ej: 2"
                     min="0"
                   />
                 </div>

                 {/* Boolean Switches with spacing */}
                 <div className="flex items-center justify-between pt-2"> {/* Added padding-top */}
                   <label className="text-sm font-medium text-gray-700">
                     Escuchar al Propietario de la Instancia
                   </label>
                   <Switch checked={listenToOwner} onChange={setListenToOwner} />
                 </div>

                 <div className="flex items-center justify-between pt-2"> {/* Added padding-top */}
                   <label className="text-sm font-medium text-gray-700">
                     Permitir al Propietario Detener el Bot
                   </label>
                   <Switch checked={stopByOwner} onChange={setStopByOwner} />
                 </div>

                 <div className="flex items-center justify-between pt-2"> {/* Added padding-top */}
                   <label className="text-sm font-medium text-gray-700">
                     Mantener Sesión Abierta por Defecto
                   </label>
                   <Switch checked={keepSessionOpen} onChange={setKeepSessionOpen} />
                 </div>

                 {/* Separar Mensajes Largos switch with help text */}
                 <div className="pt-2"> {/* Container for label/help and switch */}
                   <div className="flex items-center justify-between"> {/* Flex container for label/help and switch */}
                     <label className="text-sm font-medium text-gray-700">
                       Separar Mensajes Largos
                       <button
                         type="button"
                         className="ml-2 text-gray-400 hover:text-gray-600"
                         onClick={() => setShowSeparateMessagesHelp(!showSeparateMessagesHelp)}
                       >
                         <HelpCircle className="w-4 h-4 inline" />
                       </button>
                     </label>
                     <Switch checked={separateMessages} onChange={setSeparateMessages} />
                   </div>
                   {showSeparateMessagesHelp && (
                     <div className="text-xs text-gray-500 mt-1 bg-purple-50 p-2 rounded"> {/* Added mt-1 for spacing */}
                       Divide respuestas largas en múltiples mensajes para evitar límites de caracteres de WhatsApp.
                     </div>
                   )}
                 </div>


                 {separateMessages && (
                    <div className="relative pt-2"> {/* Added padding-top */}
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Segundos por Mensaje Separado
                         <button
                           type="button"
                           className="ml-2 text-gray-400 hover:text-gray-600"
                           onClick={() => setShowSecondsPerMessageHelp(!showSecondsPerMessageHelp)}
                         >
                           <HelpCircle className="w-4 h-4 inline" />
                         </button>
                      </label>
                       {showSecondsPerMessageHelp && (
                         <div className="text-xs text-gray-500 mb-2 bg-purple-50 p-2 rounded">
                           Retraso en segundos entre el envío de cada parte de un mensaje largo separado.
                         </div>
                       )}
                      <input
                        type="number"
                        value={secondsPerMessage}
                        onChange={(e) => setSecondsPerMessage(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej: 1"
                        min="0"
                      />
                    </div>
                 )}

              </div>
            )}
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEditing ? (
                "Actualizar Asistente"
              ) : (
                "Crear Asistente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenAIAssistantModal;
