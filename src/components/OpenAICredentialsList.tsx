import React, { useState } from "react";
import { PlusCircle, Key, Trash2, Loader2 } from "lucide-react";
import { OpenAIApiKey } from "../types";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

interface OpenAICredentialsListProps {
  apiKeys: OpenAIApiKey[];
  onAddCredential: () => void;
  onDeleteCredential?: (id: string) => void;
  isLoading: boolean;
}

const OpenAICredentialsList: React.FC<OpenAICredentialsListProps> = ({
  apiKeys,
  onAddCredential,
  onDeleteCredential,
  isLoading,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [selectedKeyName, setSelectedKeyName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string, name: string) => {
    setSelectedKeyId(id);
    setSelectedKeyName(name);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedKeyId || !onDeleteCredential) return;
    
    setIsDeleting(true);
    try {
      await onDeleteCredential(selectedKeyId);
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
      setSelectedKeyId(null);
      setSelectedKeyName("");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-purple-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-purple-900">
              Credenciales de OpenAI
            </h3>
          </div>
        </div>
        <div className="p-6 flex justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-purple-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-purple-900">
            Credenciales de OpenAI
          </h3>
          <button
            onClick={onAddCredential}
            className="flex items-center space-x-1 text-purple-600 hover:text-purple-800"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {apiKeys.length === 0 ? (
        <div className="p-6 text-center">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay credenciales configuradas</p>
          <button
            onClick={onAddCredential}
            className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
          >
            Añadir credencial
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {apiKeys.map((key) => (
            <li key={key.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{key.name}</p>
                  <p className="text-sm text-gray-500">
                    {key.apiKey && key.apiKey.startsWith("sk-")
                      ? `${key.apiKey.substring(0, 7)}...${key.apiKey.substring(
                          key.apiKey.length - 4
                        )}`
                      : "sk-..."}
                  </p>
                </div>
                {onDeleteCredential && (
                  <button
                    onClick={() => handleDeleteClick(key.id, key.name)}
                    className="text-red-500 hover:text-red-700"
                    title="Eliminar credencial"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        instanceName={`credencial "${selectedKeyName}"`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export { OpenAICredentialsList };
export default OpenAICredentialsList;
