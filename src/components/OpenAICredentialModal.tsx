import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface OpenAICredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, apiKey: string) => Promise<void>;
  instanceName: string;
  isLoading?: boolean;
}

const OpenAICredentialModal: React.FC<OpenAICredentialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  instanceName,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    
    if (!apiKey.trim()) {
      toast.error("La clave API es requerida");
      return;
    }
    
    if (!apiKey.startsWith("sk-")) {
      toast.error("La clave API debe comenzar con 'sk-'");
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(name, apiKey);
      setName("");
      setApiKey("");
      onClose();
      // Removed toast notification here as it will be handled by the API response
    } catch (error) {
      console.error("Error saving OpenAI credential:", error);
      // Removed toast notification here as it will be handled by the API response
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-purple-900">
            Añadir Credencial de OpenAI
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-600 text-center">Cargando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instancia
              </label>
              <input
                type="text"
                value={instanceName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nombre para identificar esta clave"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clave API de OpenAI
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Debe comenzar con "sk-". Esta clave se utilizará para el asistente de IA.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export { OpenAICredentialModal };
export default OpenAICredentialModal;
