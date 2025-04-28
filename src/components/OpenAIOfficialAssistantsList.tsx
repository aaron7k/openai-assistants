import React, { useState } from "react";
import { PlusCircle, Bot, Loader2, Trash2, Copy, Edit, Check, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { OpenAIOfficialAssistant, OpenAITool } from "../types"; // Import OpenAITool
import { DeleteAssistantConfirmationModal } from "./DeleteAssistantConfirmationModal"; // Reusing the same modal component
import { getOpenAIOfficialAssistants } from "../api"; // Import the API function

interface OpenAIOfficialAssistantsListProps {
  assistants: OpenAIOfficialAssistant[]; // This prop now receives the filtered list from the parent
  onAddAssistant: () => void;
  onDeleteAssistant: (id: string, apiKeyId: string) => void; // Updated signature
  onEditAssistant: (assistant: OpenAIOfficialAssistant) => void;
  isLoading: boolean;
  instanceName: string;
  apiKeys: { id: string; name: string }[]; // List of available API keys for the filter
  selectedApiKeyFilter: string; // The currently selected API key ID for filtering
  onApiKeyFilterChange: (apiKeyId: string) => void; // Handler for filter change
}

const OpenAIOfficialAssistantsList: React.FC<OpenAIOfficialAssistantsListProps> = ({
  assistants,
  onAddAssistant,
  onDeleteAssistant,
  onEditAssistant,
  isLoading,
  instanceName,
  apiKeys,
  selectedApiKeyFilter,
  onApiKeyFilterChange,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<OpenAIOfficialAssistant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleDeleteClick = (assistant: OpenAIOfficialAssistant) => {
    setAssistantToDelete(assistant);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assistantToDelete) return;
    
    setIsDeleting(true);
    try {
      // Pass both assistant ID and apiKeyId to the parent handler
      await onDeleteAssistant(assistantToDelete.id, assistantToDelete.apiKeyId);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setAssistantToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setAssistantToDelete(null);
  };

  const handleCopyAssistantId = (id: string) => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }
  };

  // Filter out assistants that are effectively empty (contain placeholder strings or are falsy for key fields)
  // Keep the assistant if ANY of the key fields (name, id, instructions) are NOT the placeholder/falsy value.
  const meaningfulAssistants = assistants.filter(assistant => {
    const isPlaceholderName = !assistant.name || assistant.name === "Sin nombre";
    const isPlaceholderId = !assistant.id || assistant.id === "Sin ID";
    const isPlaceholderInstructions = !assistant.instructions || assistant.instructions === "Sin instrucciones";
    
    // Keep if NOT all three are placeholders
    return !(isPlaceholderName && isPlaceholderId && isPlaceholderInstructions);
  });

  // Function to extract function names from tools
  const getFunctionNames = (tools: OpenAITool[] | undefined): string[] => {
    if (!tools) return [];
    return tools
      .filter((tool): tool is { type: 'function'; function: { name: string } } => 
         tool.type === 'function' && typeof (tool as any).function?.name === 'string'
      )
      .map(tool => tool.function.name);
  };


  return (
    <div> {/* Removed the outer div with bg-white/shadow as it's in the parent */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        {/* API Key Filter Dropdown */}
        <div className="flex items-center w-full sm:w-auto">
          <label htmlFor="apiKeyFilter" className="text-sm font-medium text-gray-700 mr-2 flex-shrink-0">
            Filtrar por Credencial:
          </label>
          <select
            id="apiKeyFilter"
            value={selectedApiKeyFilter}
            onChange={(e) => onApiKeyFilterChange(e.target.value)}
            className="mt-1 block w-full sm:mt-0 sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
            disabled={apiKeys.length === 0 || isLoading} // Disable if no keys or loading
          >
            {apiKeys.length === 0 ? (
              <option value="">No hay credenciales</option>
            ) : (
              <>
                {/* <option value="">Todas las claves</option> */} {/* Option to show all keys? API doesn't support this filter */}
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={onAddAssistant}
          className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm disabled:opacity-50 w-full sm:w-auto justify-center"
          disabled={apiKeys.length === 0 || isLoading} // Disable if no keys or loading
        >
          <PlusCircle className="w-5 h-5" />
          <span>Crear asistente oficial</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 flex justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : apiKeys.length === 0 ? (
         <div className="p-6 text-center">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Añada una credencial de OpenAI para ver y crear asistentes oficiales.</p>
         </div>
      ) : meaningfulAssistants.length === 0 ? ( // Check the filtered array length
        <div className="p-6 text-center">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay asistentes oficiales configurados para esta credencial.</p>
          {/* Optional: Add button to create one if a key is selected */}
           {selectedApiKeyFilter && (
             <button
               onClick={onAddAssistant}
               className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
             >
               Crear asistente oficial
             </button>
           )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {meaningfulAssistants.map((assistant) => { // Map over the filtered array
            const functionNames = getFunctionNames(assistant.tools);
            return (
              <li key={assistant.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{assistant.name || "Sin nombre"}</p>
                      <p className="text-sm text-gray-600 mt-1">{assistant.instructions ? assistant.instructions.substring(0, 100) + (assistant.instructions.length > 100 ? '...' : '') : "Sin instrucciones"}</p>
                      
                      {/* Model and ID */}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                         <span className="bg-gray-100 px-2 py-1 rounded mr-2">{assistant.model || 'Modelo no especificado'}</span>
                         <span className="font-mono bg-gray-100 px-2 py-1 rounded truncate max-w-xs">
                           ID: {assistant.id || "Sin ID"}
                         </span>
                         <button
                           onClick={() => handleCopyAssistantId(assistant.id || '')}
                           className="ml-2 text-gray-400 hover:text-emerald-600"
                           title="Copiar ID del asistente"
                           disabled={!assistant.id}
                         >
                           {copiedId === assistant.id ? (
                             <Check className="w-4 h-4 text-green-500" />
                           ) : (
                             <Copy className="w-4 h-4" />
                           )}
                         </button>
                      </div>

                      {/* Function Tags */}
                      {functionNames.length > 0 && (
                        <div className="flex flex-wrap items-center mt-2 text-xs text-gray-500 gap-1">
                          <span className="font-medium text-gray-700 mr-1">Funciones:</span>
                          {functionNames.map((funcName, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {funcName}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {onEditAssistant && (
                        <button
                          onClick={() => onEditAssistant(assistant)}
                          className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          title="Editar asistente"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(assistant)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Eliminar asistente"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DeleteAssistantConfirmationModal
        isOpen={deleteModalOpen}
        assistantName={assistantToDelete?.name || assistantToDelete?.id || "este asistente"} // Use ID as fallback name
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default OpenAIOfficialAssistantsList;
