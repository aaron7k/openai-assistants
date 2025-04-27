import React, { useState } from "react";
import {
  Smartphone,
  MessageSquare,
  Trash2,
  Power,
  Settings,
  Cog,
} from "lucide-react";
import type { WhatsAppInstance } from "../types";
import api from "../api";
import { toast } from "react-hot-toast";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onViewInstance: (instance: WhatsAppInstance) => void;
  locationId: string;
  onInstanceDeleted?: () => void;
  onInstanceUpdated?: () => void;
  onEditConfig: (instance: WhatsAppInstance) => void;
}

export const InstanceCard: React.FC<InstanceCardProps> = ({
  instance,
  onViewInstance,
  locationId,
  onInstanceDeleted,
  onInstanceUpdated,
  onEditConfig,
}) => {
  // Añadir console.log para ver el objeto instance completo
  console.log("Instance data:", instance);
  // Añadir console.log para ver específicamente las propiedades de la foto
  console.log("Photo properties:", {
    profilePicUrl: instance.profilePicUrl,
    photo: instance.photo,
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.deleteInstance(locationId, instance.instance_name);
      toast.success("Instancia eliminada correctamente");
      onInstanceDeleted?.();
    } catch (error) {
      console.error("Error deleting instance:", error);
      toast.error("Error al eliminar la instancia");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (connectionStatus: string | undefined) => {
    if (!connectionStatus) return "bg-yellow-500";

    // CORREGIDO: Considerar "open" como conectado
    if (connectionStatus.toLowerCase() === "open") return "bg-green-500";

    switch (connectionStatus.toLowerCase()) {
      case "connected":
      case "open":
        return "bg-green-500";
      case "disconnected":
      case "closed":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (connectionStatus: string | undefined) => {
    if (!connectionStatus) return "Pendiente";

    // CORREGIDO: Considerar "open" como conectado
    if (connectionStatus.toLowerCase() === "open") return "Conectado";

    switch (connectionStatus.toLowerCase()) {
      case "connected":
      case "open":
        return "Conectado";
      case "disconnected":
      case "closed":
        return "Desconectado";
      default:
        return "Pendiente";
    }
  };

  // CORREGIDO: Verificar si está conectado incluyendo el estado "open"
  const isConnected =
    instance.connectionStatus?.toLowerCase() === "connected" ||
    instance.connectionStatus?.toLowerCase() === "open";

  const getPhoneNumber = (ownerJid?: string) => {
    if (!ownerJid) return "";
    return ownerJid.split("@")[0];
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-rows-[auto_minmax(80px,auto)_auto] h-full">
        {/* Encabezado con información principal - altura fija */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Use profilePicUrl if available, otherwise fallback to photo */}
              {instance.profilePicUrl ? (
                <img
                  src={instance.profilePicUrl}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              ) : instance.photo ? ( // Fallback to instance.photo if profilePicUrl is not available
                <img
                  src={instance.photo}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <Smartphone className="w-6 h-6 text-gray-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {instance.instance_alias}
                </h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-block w-3 h-3 rounded-full ${getStatusColor(
                  instance.connectionStatus
                )}`}
              ></span>
              <span className="text-sm text-gray-600">
                {getStatusText(instance.connectionStatus)}
              </span>
            </div>
          </div>

          {/* Área fija para badges con altura máxima y scroll si es necesario */}
          <div className="flex flex-wrap gap-2 mt-2 max-h-16 overflow-y-auto pb-1">
            {instance.main_device && (
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full whitespace-nowrap">
                Dispositivo Principal
              </span>
            )}
            {instance.fb_ads && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                Facebook ADS
              </span>
            )}
            {instance.active_ia && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full whitespace-nowrap">
                IA Activada
              </span>
            )}
            {instance.n8n_webhook ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full whitespace-nowrap">
                Webhook Configurado
              </span>
            ) : (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full whitespace-nowrap">
                Sin Webhook
              </span>
            )}
          </div>
        </div>

        {/* Sección de contenido - puede crecer pero tiene altura mínima */}
        <div className="min-h-[80px] max-h-[120px] overflow-y-auto">
          <div className="space-y-1">
            {instance.ownerJid && (
              <p className="text-sm text-gray-500">
                Número: {getPhoneNumber(instance.ownerJid)}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Nombre: {instance.instance_name}
            </p>
            {!instance.main_device && instance.userId && (
              <p className="text-sm text-gray-500">
                Usuario asignado: {instance.userId}
              </p>
            )}
            {instance.n8n_webhook && (
              <p
                className="text-sm text-gray-500 truncate"
                title={instance.n8n_webhook}
              >
                Webhook: {instance.n8n_webhook}
              </p>
            )}
          </div>
        </div>

        {/* Botones siempre alineados al final - altura fija */}
        <div className="flex justify-end items-center space-x-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onEditConfig(instance)}
            className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
            title="Editar configuración"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewInstance(instance)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            <Cog className="w-4 h-4" />
            <span>Gestionar</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300"
            title="Eliminar instancia"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        instanceName={instance.instance_alias}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default InstanceCard;
