import React, { useState, useEffect } from "react";
import { X, Loader2, Clock, User, MessageSquare, Play, Pause, XCircle, Trash2 } from "lucide-react";
import { AssistantSession, SessionAction } from "../types";
import api from "../api";
import { toast } from "react-hot-toast";

interface AssistantSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  assistantId: string;
  assistantName: string;
}

const AssistantSessionsModal: React.FC<AssistantSessionsModalProps> = ({
  isOpen,
  onClose,
  instanceName,
  assistantId,
  assistantName,
}) => {
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen, instanceName, assistantId]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const sessionsData = await api.getAssistantSessions(instanceName, assistantId);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Error al obtener las sesiones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionAction = async (
    sessionId: string,
    remoteJid: string,
    action: SessionAction
  ) => {
    const actionKey = `${sessionId}-${action}`;
    setActionInProgress(actionKey);
    
    try {
      await api.updateSessionState(instanceName, assistantId, sessionId, remoteJid, action);
      // Actualizar la lista de sesiones después de la acción
      await fetchSessions();
    } catch (error) {
      console.error(`Error performing ${action} action:`, error);
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'opened':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'opened':
        return 'Abierta';
      case 'paused':
        return 'Pausada';
      case 'closed':
        return 'Cerrada';
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-purple-900">
            Sesiones de {assistantName}
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
            <p className="text-gray-600 text-center">Cargando sesiones...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay sesiones activas para este asistente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creada
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actualizada
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {session.pushName || 'Usuario sin nombre'}
                        </div>
                        <div className="ml-2 text-xs text-gray-500 font-mono">
                          {session.remoteJid.split('@')[0]}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="flex-shrink-0 h-4 w-4 text-gray-400 mr-1" />
                        {formatDate(session.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="flex-shrink-0 h-4 w-4 text-gray-400 mr-1" />
                        {formatDate(session.updatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {session.status === 'paused' && (
                          <button
                            onClick={() => handleSessionAction(session.sessionId, session.remoteJid, 'opened')}
                            disabled={actionInProgress === `${session.sessionId}-opened`}
                            className="text-green-600 hover:text-green-900"
                            title="Reanudar sesión"
                          >
                            {actionInProgress === `${session.sessionId}-opened` ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        
                        {session.status === 'opened' && (
                          <button
                            onClick={() => handleSessionAction(session.sessionId, session.remoteJid, 'paused')}
                            disabled={actionInProgress === `${session.sessionId}-paused`}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Pausar sesión"
                          >
                            {actionInProgress === `${session.sessionId}-paused` ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Pause className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        
                        {(session.status === 'opened' || session.status === 'paused') && (
                          <button
                            onClick={() => handleSessionAction(session.sessionId, session.remoteJid, 'closed')}
                            disabled={actionInProgress === `${session.sessionId}-closed`}
                            className="text-red-600 hover:text-red-900"
                            title="Cerrar sesión"
                          >
                            {actionInProgress === `${session.sessionId}-closed` ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <XCircle className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleSessionAction(session.sessionId, session.remoteJid, 'delete')}
                          disabled={actionInProgress === `${session.sessionId}-delete`}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar sesión"
                        >
                          {actionInProgress === `${session.sessionId}-delete` ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantSessionsModal;
