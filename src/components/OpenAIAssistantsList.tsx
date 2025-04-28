import React, { useState } from "react";
import { PlusCircle, Bot, Loader2, Trash2, Copy, Edit, Check, Link, MessageSquare, Users, Info } from "lucide-react"; // Added Info import
import { toast } from "react-hot-toast";
import { OpenAIAssistant } from "../types";
import { DeleteAssistantConfirmationModal } from "./DeleteAssistantConfirmationModal";
// Removed OpenAIAssistantModal import as it's handled in the parent now
import AssistantSessionsModal from "./AssistantSessionsModal";
import { getOpenAIAssistant } from "../api"; // Keep this if needed for sessions or other details

interface OpenAIAssistantsListProps {
  assistants: OpenAIAssistant[];
  onAddAssistant: () => void; // Trigger parent to open modal
  onDeleteAssistant: (id: string) => void;
  onEditAssistant: (assistant: OpenAIAssistant) => void; // Trigger parent to open modal with data
  isLoading: boolean; // Loading state for the assistants list itself
  isLoadingCredentials?: boolean; // Loading state for credentials (used for button disabling) - Added
  instanceName: string;
  apiKeys: { id: string; name: string }[];
}

const OpenAIAssistantsList: React.FC<OpenAIAssistantsListProps> = ({
  assistants,
  onAddAssistant,
  onDeleteAssistant,
  onEditAssistant,
  isLoading,
  isLoadingCredentials, // Added prop
  instanceName,
  apiKeys, // Keep apiKeys if needed for display purposes within the list
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<OpenAIAssistant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Removed edit modal state as it's handled by parent
  // const [editModalOpen, setEditModalOpen] = useState(false);
  // const [assistantToEdit, setAssistantToEdit] = useState<OpenAIAssistant | null>(null);
  const [isLoadingAssistantDetails, setIsLoadingAssistantDetails] = useState(false); // Renamed for clarity
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<OpenAIAssistant | null>(null);

  const handleDeleteClick = (assistant: OpenAIAssistant) => {
    setAssistantToDelete(assistant);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assistantToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteAssistant(assistantToDelete.id);
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

  // Modified handleEditClick to fetch full data and then call parent's handler
  const handleEditClick = async (assistant: OpenAIAssistant) => {
    setIsLoadingAssistantDetails(true);
    try {
      if (!instanceName) {
        console.error("instanceName es undefined en OpenAIAssistantsList");
        toast.error("Error: No se pudo identificar la instancia");
        return;
      }
      
      console.log("Obteniendo asistente con instanceName:", instanceName, "y assistantId:", assistant.id);
      
      // Fetch full assistant data before opening the modal via parent
      const fullAssistantData = await getOpenAIAssistant(instanceName, assistant.id);
      console.log("Datos completos del asistente recibidos:", fullAssistantData);
      onEditAssistant(fullAssistantData); // Call parent handler with full data
      
    } catch (error) {
      console.error("Error al obtener datos del asistente para editar:", error);
      toast.error("Error al cargar los detalles del asistente para editar.");
    } finally {
      setIsLoadingAssistantDetails(false);
    }
  };

  // Removed handleSaveEdit as saving is now handled by the parent modal

  const handleCopyAssistantId = (id: string) => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }
  };

  const handleViewSessions = (assistant: OpenAIAssistant) => {
    setSelectedAssistant(assistant);
    setSessionsModalOpen(true);
  };

  // Función para obtener el texto del disparador según el tipo
  const getTriggerText = (assistant: OpenAIAssistant) => {
    switch (assistant.triggerType) {
      case 'all':
        return 'Todos los mensajes';
      case 'none':
        return 'Manual';
      case 'keyword':
        return assistant.triggerValue || 'Palabra clave';
      case 'advanced':
        const condition = assistant.triggerCondition ? 
          `${assistant.triggerCondition === 'contains' ? 'contiene' : 
            assistant.triggerCondition === 'equals' ? 'igual a' :
            assistant.triggerCondition === 'startsWith' ? 'empieza con' :
            assistant.triggerCondition === 'endsWith' ? 'termina con' :
            'regex'} ` : '';
        return `${condition}${assistant.triggerValue || ''}`;
      default:
        return 'No definido';
    }
  };

  // Filter out assistants that are effectively empty (no name and no assistantId)
  const meaningfulAssistants = assistants.filter(assistant => assistant.name || assistant.assistantId);


  // The outer div with bg-white and shadow is now handled by the parent (InstanceDetailPage)
  // This component will only render the header and the list/empty state
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden"> {/* Keep this wrapper for the component's internal structure */}
      <div className="p-4 border-b border-gray-200 bg-blue-50"> {/* Changed background to blue-50 as per screenshot */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-blue-900"> {/* Changed text color to blue-900 */}
            Asistentes Wa Level
          </h3>
          <button
            onClick={onAddAssistant} // Call parent handler to open modal
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800" // Changed text color
            disabled={isLoadingCredentials || apiKeys.length === 0} // Use the passed prop
          >
            <PlusCircle className="w-5 h-5" />
            <span>Añadir</span>
             {apiKeys.length === 0 && !isLoadingCredentials && ( // Use the passed prop
               <span className="text-xs opacity-80 ml-1">(Requiere Credencial)</span>
             )}
          </button>
        </div>
         {apiKeys.length === 0 && !isLoadingCredentials && (
            <p className="text-xs text-yellow-700 mt-2 bg-yellow-100 p-2 rounded border border-yellow-200">
              <Info size={14} className="inline mr-1" />
              Necesita añadir al menos una Credencial de OpenAI para poder crear asistentes.
            </p>
          )}
      </div>

      {isLoading ? (
        <div className="p-6 flex justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> {/* Changed text color */}
        </div>
      ) : meaningfulAssistants.length === 0 ? ( // Check the filtered array length
        <div className="p-6 text-center">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay asistentes Wa Level configurados</p>
          <button
            onClick={onAddAssistant} // Call parent handler
            className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors" // Changed colors
            disabled={isLoadingCredentials || apiKeys.length === 0} // Use the passed prop
          >
            Crear asistente Wa Level
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {meaningfulAssistants.map((assistant) => ( // Map over the filtered array
            <li key={assistant.id} className="p-4 hover:bg-gray-50">
              <div className="flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{assistant.name}</p>
                    
                    {/* Mostrar el ID del asistente con botón para copiar */}
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded truncate max-w-xs">
                        {assistant.assistantId || "Sin ID"}
                      </p>
                      <button
                        onClick={() => handleCopyAssistantId(assistant.assistantId || '')}
                        className="ml-2 text-gray-400 hover:text-blue-600" // Changed hover color
                        title="Copiar ID del asistente"
                        disabled={!assistant.assistantId}
                      >
                        {copiedId === assistant.assistantId ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewSessions(assistant)}
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Ver sesiones"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    
                    {onEditAssistant && (
                      <button
                        onClick={() => handleEditClick(assistant)} // Calls parent handler
                        className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title="Editar asistente"
                        disabled={isLoadingAssistantDetails} // Use renamed state
                      >
                        {isLoadingAssistantDetails ? ( // Use renamed state
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Edit className="w-5 h-5" />
                        )}
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
                
                {/* Información adicional */}
                <div className="mt-2">
                  {/* Mostrar webhook de funciones */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Link className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {assistant.webhookUrl ? 
                        assistant.webhookUrl : 
                        <span className="text-gray-400">Sin webhook</span>
                      }
                    </span>
                  </div>
                  
                  {/* Mostrar tipo de disparador */}
                  <div className="flex items-center text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span>
                      Disparador: <span className="font-medium">{getTriggerText(assistant)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DeleteAssistantConfirmationModal
        isOpen={deleteModalOpen}
        assistantName={assistantToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      {/* Removed Edit Modal instance - handled by parent */}

      {selectedAssistant && (
        <AssistantSessionsModal
          isOpen={sessionsModalOpen}
          onClose={() => {
            setSessionsModalOpen(false);
            setSelectedAssistant(null);
          }}
          instanceName={instanceName}
          assistantId={selectedAssistant.id}
          assistantName={selectedAssistant.name}
        />
      )}
    </div>
  );
};

export default OpenAIAssistantsList;
