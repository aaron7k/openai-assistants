import React, { useState } from "react";
import { PlusCircle, Bot, Loader2, Trash2, Edit, Key, Cpu, Info, Wrench, FileText, Code, FunctionSquare, Copy } from "lucide-react"; // Added Copy icon
import { OpenAIOfficialAssistant, OpenAITool } from "../types"; // Import OpenAITool
import { DeleteAssistantConfirmationModal } from "./DeleteAssistantConfirmationModal";
import { toast } from "react-hot-toast"; // Import toast for feedback

interface ApiKeyOption {
  id: string;
  name: string;
}

interface OpenAIOfficialAssistantsListProps {
  assistants: OpenAIOfficialAssistant[]; // Now receives the already filtered list
  onAddAssistant: () => void;
  onDeleteAssistant: (id: string, apiKeyId: string) => void; // Updated signature to include apiKeyId
  onEditAssistant?: (assistant: OpenAIOfficialAssistant) => void;
  isLoading: boolean; // Represents loading state for the API call triggered by filter change
  instanceName: string; // Keep instanceName if needed elsewhere
  apiKeys: ApiKeyOption[]; // List of all available API keys for the dropdown
  selectedApiKeyFilter: string; // The currently selected API key ID (controlled by parent)
  onApiKeyFilterChange: (apiKeyId: string) => void; // Handler to notify parent of filter change
}

// Helper function to get display text and icon for a tool
const getToolDisplay = (tool: OpenAITool): { text: string; icon: React.ReactNode; color: string } => {
  switch (tool.type) {
    case 'retrieval':
      return { text: 'Recuperación', icon: <FileText className="w-3 h-3 mr-1" />, color: 'blue' };
    case 'code_interpreter':
      return { text: 'Intérprete Código', icon: <Code className="w-3 h-3 mr-1" />, color: 'purple' };
    case 'function':
      // Use function name, fallback to generic 'Función' if name is missing
      const functionName = tool.function?.name || 'Función';
      return { text: functionName, icon: <FunctionSquare className="w-3 h-3 mr-1" />, color: 'indigo' };
    default:
      return { text: 'Herramienta Desconocida', icon: <Wrench className="w-3 h-3 mr-1" />, color: 'gray' };
  }
};

// Helper function to get Tailwind CSS classes based on color name
const getChipColorClasses = (color: string): string => {
  switch (color) {
    case 'blue': return 'bg-blue-100 text-blue-800';
    case 'purple': return 'bg-purple-100 text-purple-800';
    case 'indigo': return 'bg-indigo-100 text-indigo-800';
    case 'emerald': return 'bg-emerald-100 text-emerald-800'; // For model
    case 'orange': return 'bg-orange-100 text-orange-800'; // For temperature
    case 'pink': return 'bg-pink-100 text-pink-800'; // For top_p (changed from purple)
    case 'gray': return 'bg-gray-100 text-gray-800'; // For API Key
    default: return 'bg-gray-100 text-gray-800';
  }
};


const OpenAIOfficialAssistantsList: React.FC<OpenAIOfficialAssistantsListProps> = ({
  assistants, // This list is now pre-filtered by the parent via API call
  onAddAssistant,
  onDeleteAssistant,
  onEditAssistant,
  isLoading,
  // instanceName, // Removed if not used
  apiKeys = [],
  selectedApiKeyFilter, // Controlled by parent
  onApiKeyFilterChange, // Controlled by parent
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<OpenAIOfficialAssistant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Log props on render for debugging
  // console.log("[OpenAIOfficialAssistantsList] Rendering with props:", { assistants, isLoading, apiKeys, selectedApiKeyFilter });

  // Function to get API key name from its ID (remains the same)
  const getApiKeyName = (keyId: string): string => {
    const key = apiKeys.find(k => k.id === keyId);
    return key ? key.name : "Clave Desconocida";
  };

  const handleDeleteClick = (assistant: OpenAIOfficialAssistant) => {
    // console.log("[OpenAIOfficialAssistantsList] Delete clicked for assistant:", assistant);
    setAssistantToDelete(assistant);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assistantToDelete) return;
    setIsDeleting(true);
    try {
      // console.log("[OpenAIOfficialAssistantsList] Confirming delete for assistant:", assistantToDelete);
      // console.log("[OpenAIOfficialAssistantsList] Using apiKeyId:", assistantToDelete.apiKeyId);

      // Call parent's delete handler, passing both ID and apiKeyId
      await onDeleteAssistant(assistantToDelete.id, assistantToDelete.apiKeyId);
    } catch (error) {
       console.error("[OpenAIOfficialAssistantsList] Error during delete confirmation:", error);
       // Toast likely handled in parent/API layer
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setAssistantToDelete(null);
    }
  };

  // Edit click handler remains the same, calls parent's handler
  const handleEditClick = (assistant: OpenAIOfficialAssistant) => {
     // console.log("[OpenAIOfficialAssistantsList] Edit clicked for:", assistant);
     if (onEditAssistant) {
       onEditAssistant(assistant);
     } else {
       console.warn("[OpenAIOfficialAssistantsList] onEditAssistant prop is not provided.");
     }
  };

  // Handle Copy ID Click
  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("ID copiado al portapapeles!");
    } catch (err) {
      console.error("Failed to copy ID: ", err);
      toast.error("Error al copiar el ID.");
    }
  };


  // Determine if the filter dropdown should be shown
  const showFilter = apiKeys.length > 0;

  return (
    <div>
      {/* Header with Filter and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* Filter Dropdown */}
        {showFilter ? (
          <div className="w-full sm:w-auto">
            <label htmlFor="apiKeyFilter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por API Key</label>
            <select
              id="apiKeyFilter"
              value={selectedApiKeyFilter} // Bind value to parent's state
              onChange={(e) => {
                // console.log("[OpenAIOfficialAssistantsList] Filter changed via dropdown to:", e.target.value);
                onApiKeyFilterChange(e.target.value); // Call parent's handler on change
              }}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none text-sm"
              disabled={apiKeys.length === 0 || isLoading} // Disable if no keys or while loading new list
            >
              {/* No default "Select..." option needed if parent ensures a key is always selected */}
              {apiKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          // Placeholder or message when no API keys exist
           <div className="w-full sm:w-auto h-[58px] flex items-center">
             {/* Adjusted height to roughly match label + select */}
             {!isLoading && ( // Only show message if not in initial loading state
               <p className="text-sm text-gray-500 italic">Añada una credencial para empezar.</p>
             )}
           </div>
        )}

        {/* Add Button - Always visible in the header */}
        <button
          onClick={onAddAssistant}
          className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 whitespace-nowrap ${apiKeys.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={apiKeys.length === 0} // Disable button if no API keys
          title={apiKeys.length === 0 ? "Añada una credencial de OpenAI primero" : "Crear asistente oficial"}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Crear asistente oficial
        </button>
      </div>

      {/* Assistants List or Empty/Loading State */}
      {isLoading ? (
         // Loading state specifically for when the list is being fetched/refetched
         <div className="flex flex-col items-center justify-center py-8">
           <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
           <p className="text-gray-600 text-center">Cargando asistentes para la clave seleccionada...</p>
         </div>
      ) : apiKeys.length === 0 ? (
         // State when no API keys are configured at all
         <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
           <Key className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-gray-900 mb-2">No hay Credenciales OpenAI</h3>
           <p className="text-gray-500 mb-6">
             Añada una credencial de OpenAI en la sección de credenciales para poder crear y ver asistentes oficiales.
           </p>
         </div>
      ) : assistants.length === 0 && selectedApiKeyFilter ? (
         // State when API keys exist, a filter is selected, but the API returned no assistants for that key
         <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
           <Cpu className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asistentes para esta API Key</h3>
           <p className="text-gray-500 mb-6">
             No se encontraron asistentes oficiales asociados a la API Key seleccionada <span className="font-medium">"{getApiKeyName(selectedApiKeyFilter)}"</span>.
           </p>
           <button
             onClick={onAddAssistant}
             className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
           >
             <PlusCircle className="w-5 h-5 mr-2" />
             Crear asistente para esta Key
           </button>
         </div>
      ) : (
        // Assistants List - Render the assistants passed via props
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="bg-emerald-100 p-2 rounded-full flex-shrink-0">
                      <Bot className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Assistant Name and Copyable ID */}
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 truncate mr-2">{assistant.name}</h3>
                        {/* Copy Button for ID */}
                        <button
                          onClick={() => handleCopyId(assistant.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                          title={`Copiar ID: ${assistant.id}`}
                          aria-label={`Copiar ID del asistente ${assistant.name}`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {assistant.instructions || "Sin instrucciones"}
                      </p>
                      {/* --- CHIPS DISPLAY AREA --- */}
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {/* Model Chip */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChipColorClasses('emerald')}`}>
                          {assistant.model}
                        </span>

                        {/* API Key Name Chip (Optional - can be removed if redundant) */}
                        {/*
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChipColorClasses('gray')}`}
                          title={`API Key ID: ${assistant.apiKeyId}`}
                        >
                          <Key className="w-3 h-3 mr-1" />
                          {getApiKeyName(assistant.apiKeyId)}
                        </span>
                        */}

                        {/* Tools Chips - Updated Logic */}
                        {assistant.tools.map((tool, index) => {
                          const { text, icon, color } = getToolDisplay(tool);
                          return (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChipColorClasses(color)}`}
                              title={tool.type === 'function' ? tool.function?.description || text : text} // Add description on hover for functions
                            >
                              {icon}
                              {text}
                            </span>
                          );
                        })}

                         {/* Temperature Chip (if not default) */}
                         {assistant.temperature !== undefined && assistant.temperature !== 1.0 && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChipColorClasses('orange')}`}
                              title="Temperature"
                            >
                              T: {assistant.temperature.toFixed(1)}
                            </span>
                          )}

                          {/* Top P Chip (if not default) */}
                          {assistant.top_p !== undefined && assistant.top_p !== 1.0 && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChipColorClasses('pink')}`}
                              title="Top P"
                            >
                              P: {assistant.top_p.toFixed(1)}
                            </span>
                          )}
                      </div>
                      {/* --- END CHIPS DISPLAY AREA --- */}
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex space-x-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditClick(assistant)}
                      className="p-1 text-gray-500 hover:text-emerald-600 rounded-full hover:bg-gray-100"
                      title="Editar"
                      disabled={!onEditAssistant}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(assistant)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteAssistantConfirmationModal
        isOpen={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        assistantName={assistantToDelete?.name || ""}
      />

    </div>
  );
};

export default OpenAIOfficialAssistantsList;
