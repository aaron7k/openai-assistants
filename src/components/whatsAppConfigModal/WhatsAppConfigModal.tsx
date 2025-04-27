import React, { useState, useEffect } from "react";
import { X, Loader2, HelpCircle } from "lucide-react";

import { toast } from "react-hot-toast";
import { User } from "../../types";
import { Switch } from "../Switch";
import TermsAndConditionsModal from "../termsAndConditionsModal/TermsAndConditionsModal";

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    config: {
      alias: string;
      userId?: string;
      isMainDevice: boolean;
      facebookAds: boolean;
      n8n_webhook?: string;
      active_ia?: boolean;
    },
    userData?: User
  ) => void;
  users: User[];
  loading?: boolean;
  initialConfig?: {
    alias?: string;
    userId?: string;
    isMainDevice?: boolean;
    facebookAds?: boolean;
    n8n_webhook?: string;
    active_ia?: boolean;
  };
  existingMainDevice?: boolean;
  isEditing?: boolean;
}

export const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  users,
  loading,
  initialConfig,
  existingMainDevice,
  isEditing,
}) => {
  const [alias, setAlias] = useState(initialConfig?.alias || "");
  const [userId, setUserId] = useState(initialConfig?.userId || "");
  const [isMainDevice, setIsMainDevice] = useState(
    initialConfig?.isMainDevice || false
  );
  const [facebookAds, setFacebookAds] = useState(
    initialConfig?.facebookAds || false
  );
  const [webhookN8n, setWebhookN8n] = useState(
    initialConfig?.n8n_webhook || ""
  );
  const [aiEnabled, setAiEnabled] = useState(initialConfig?.active_ia || false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showWebhookHelp, setShowWebhookHelp] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  useEffect(() => {
    if (initialConfig) {
      setAlias(initialConfig.alias || "");
      setUserId(initialConfig.userId || "");
      setIsMainDevice(initialConfig.isMainDevice || false);
      setFacebookAds(initialConfig.facebookAds || false);
      setWebhookN8n(initialConfig.n8n_webhook || "");
      setAiEnabled(initialConfig.active_ia || false);
    } else {
      setAlias("");
      setUserId("");
      setIsMainDevice(false);
      setFacebookAds(false);
      setWebhookN8n("");
      setAiEnabled(false);
    }
  }, [initialConfig, isOpen]);
  useEffect(() => {
    if (isOpen) {
      setAcceptedTerms(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userId) {
      const user = users.find((u) => u.id === userId);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [userId, users]);

  const handleMainDeviceChange = (checked: boolean) => {
    if (checked && existingMainDevice && !initialConfig?.isMainDevice) {
      toast.error("Ya existe un dispositivo principal");
      return;
    }

    setIsMainDevice(checked);
    if (checked) {
      setUserId("");
      setSelectedUser(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!alias.trim()) {
      toast.error("El alias es requerido");
      return;
    }

    if (!isMainDevice && !userId) {
      toast.error("Debe seleccionar un usuario");
      return;
    }

    if (isMainDevice && existingMainDevice && !initialConfig?.isMainDevice) {
      toast.error("Ya existe un dispositivo principal");
      return;
    }

    if (webhookN8n && !webhookN8n.startsWith("http")) {
      toast.error("El webhook debe ser una URL válida");
      return;
    }

    onSave(
      {
        alias,
        userId: isMainDevice ? undefined : userId,
        isMainDevice,
        facebookAds,
        n8n_webhook: webhookN8n.trim(),
        active_ia: aiEnabled,
      },
      selectedUser || undefined
    );
  };
  const [showTermsModal, setShowTermsModal] = useState(false);

  if (!isOpen) return null;

  const isMainDeviceDisabled =
    existingMainDevice && !initialConfig?.isMainDevice;
  const canSubmit = acceptedTerms || isEditing; // Allow submission if editing or terms are accepted
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onAccept={() => setShowTermsModal(false)}
        onClose={() => setShowTermsModal(false)}
        textBtn="Entendido"
      />
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-purple-900">
            {isEditing ? "Editar WhatsApp" : "Crear WhatsApp"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-gray-600 text-center">Cargando usuarios...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alias de WhatsApp
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ingrese un alias"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario Asignado
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={isMainDevice}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                >
                  <option value="">Seleccione un usuario</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook n8n
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
                    Ingrese la URL del webhook de n8n para procesar los mensajes
                    entrantes. Debe comenzar con http:// o https://
                  </div>
                )}
                <input
                  type="url"
                  value={webhookN8n}
                  onChange={(e) => setWebhookN8n(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://tu-webhook-n8n.com"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700 block">
                    Dispositivo Principal
                  </span>
                  {isMainDeviceDisabled && (
                    <span className="text-xs text-gray-500">
                      Ya existe un dispositivo principal
                    </span>
                  )}
                </div>
                <Switch
                  checked={isMainDevice}
                  onChange={handleMainDeviceChange}
                  disabled={isMainDeviceDisabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Facebook ADS
                </span>
                <Switch checked={facebookAds} onChange={setFacebookAds} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {aiEnabled ? "Desactivar IA" : "Activar IA"}
                </span>
                <Switch checked={aiEnabled} onChange={setAiEnabled} />
              </div>
            </div>
            {/* Añadir antes de los botones de acción */}
            {!isEditing && (
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                  He leído y acepto los{" "}
                  <span
                    className="text-purple-600 underline cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Aquí puedes abrir un modal o redireccionar
                      setShowTermsModal(true); // Si quieres abrir el modal de términos
                      // O window.open('/terms', '_blank'); // Si quieres abrir en nueva pestaña
                    }}
                  >
                    términos y condiciones
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`px-4 py-2 text-white rounded-md ${
                  canSubmit
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-purple-300 cursor-not-allowed"
                }`}
              >
                {isEditing ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConfigModal;
