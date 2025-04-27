import React, { useState, useEffect } from 'react';
import { OpenAIOfficialAssistant, OpenAIApiKey, OpenAITool } from '../types';
import { X, Plus, Trash2, Info, Loader2 } from 'lucide-react'; // Added Loader2
import { Switch } from './Switch'; // Assuming Switch component exists

interface OpenAIOfficialAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assistantData: Omit<OpenAIOfficialAssistant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  apiKeys: { id: string; name: string }[];
  instanceName: string; // Not directly used in modal logic, but good context
  existingAssistant: OpenAIOfficialAssistant | null;
}

// List of OpenAI models provided by the user
const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-audio-preview-2024-12-17',
  'gpt-4o-audio-preview-2024-10-01',
  'gpt-4.1-nano',
  'gpt-4.1-nano-2025-04-14',
  'gpt-4o-realtime-preview-2024-10-01',
  'gpt-4o-realtime-preview',
  'gpt-4',
  'gpt-4o-mini-audio-preview',
  'gpt-4o-audio-preview',
  'o1-preview-2024-09-12',
  'gpt-4o-mini-realtime-preview',
  'gpt-4.1-mini',
  'gpt-4o-mini-realtime-preview-2024-12-17',
  'gpt-4o-mini-search-preview',
  'gpt-4.1-mini-2025-04-14',
  'gpt-3.5-turbo-1106',
  'gpt-4o-search-preview',
  'gpt-4-turbo',
  'gpt-4o-realtime-preview-2024-12-17',
  'gpt-3.5-turbo',
  'gpt-4-turbo-preview',
  'gpt-4o-mini-search-preview-2025-03-11',
  'gpt-4-0125-preview',
  'gpt-4o-2024-11-20',
  'gpt-4o-2024-05-13',
  'gpt-4-turbo-2024-04-09',
  'gpt-3.5-turbo-16k',
  'gpt-image-1',
  'o1-preview',
  'gpt-4-0613',
  'gpt-4.5-preview',
  'gpt-4.5-preview-2025-02-27',
  'gpt-4o-search-preview-2025-03-11',
  'o3-mini',
  'o3-mini-2025-01-31',
  'gpt-4o-mini',
  'gpt-4o-2024-08-06',
  'gpt-4.1',
  'gpt-4o-transcribe',
  'gpt-4.1-2025-04-14',
  'gpt-4o-mini-2024-07-18',
  'gpt-4o-mini-transcribe',
  'o1-mini',
  'gpt-4o-mini-audio-preview-2024-12-17',
  'gpt-3.5-turbo-0125',
  'o1-mini-2024-09-12',
  'gpt-4-1106-preview',
  'gpt-4o-mini-tts',
  'o1',
  'o1-2024-12-17',
  'o1-pro',
  'o1-pro-2025-03-19',
];


const OpenAIOfficialAssistantModal: React.FC<OpenAIOfficialAssistantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  apiKeys,
  existingAssistant,
}) => {
  const [formData, setFormData] = useState<Omit<OpenAIOfficialAssistant, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    instructions: '',
    model: 'gpt-4-turbo', // Default model
    apiKeyId: '',
    tools: [],
    temperature: 1.0, // Default temperature
    top_p: 1.0, // Default top_p
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showToolInput, setShowToolInput] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDescription, setNewToolDescription] = useState('');
  const [newToolParameters, setNewToolParameters] = useState(''); // JSON string

  // Effect to load existing assistant data when the modal opens or existingAssistant changes
  useEffect(() => {
    if (isOpen) {
      if (existingAssistant) {
        setFormData({
          name: existingAssistant.name,
          instructions: existingAssistant.instructions,
          model: existingAssistant.model,
          apiKeyId: existingAssistant.apiKeyId || (apiKeys.length > 0 ? apiKeys[0].id : ''), // Use existing or first available
          tools: existingAssistant.tools || [], // Uses existingAssistant.tools, with fallback to []
          temperature: existingAssistant.temperature !== undefined ? existingAssistant.temperature : 1.0,
          top_p: existingAssistant.top_p !== undefined ? existingAssistant.top_p : 1.0,
        });
      } else {
        // Reset form for creating a new assistant
        setFormData({
          name: '',
          instructions: '',
          model: 'gpt-4-turbo',
          apiKeyId: apiKeys.length > 0 ? apiKeys[0].id : '', // Select first API key by default
          tools: [], // Initialized as [] here
          temperature: 1.0,
          top_p: 1.0,
        });
      }
       // Reset tool input fields
       setShowToolInput(false);
       setNewToolName('');
       setNewToolDescription('');
       setNewToolParameters('');
    }
  }, [isOpen, existingAssistant, apiKeys]); // Depend on isOpen, existingAssistant, and apiKeys

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // FIX: Spread 'prev' instead of 'prev.formData'
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = parseFloat(value);
    if (!isNaN(numberValue)) {
      setFormData((prev) => ({ ...prev, [name]: numberValue }));
    } else if (value === '') {
       setFormData((prev) => ({ ...prev, [name]: undefined })); // Allow clearing number fields
    }
  };

  const handleAddTool = () => {
    if (!newToolName || !newToolParameters) {
      alert('El nombre y los parámetros (en formato JSON) de la herramienta son obligatorios.');
      return;
    }
    try {
      const parameters = JSON.parse(newToolParameters);
      const newTool: OpenAITool = {
        type: 'function',
        function: {
          name: newToolName,
          description: newToolDescription,
          parameters: parameters,
        },
      };
      setFormData((prev) => ({ ...prev, tools: [...prev.tools, newTool] }));
      setNewToolName('');
      setNewToolDescription('');
      setNewToolParameters('');
      setShowToolInput(false); // Hide input after adding
    } catch (error) {
      alert('Parámetros JSON inválidos. Por favor, verifica el formato.');
      console.error("Invalid JSON parameters:", error);
    }
  };

  const handleRemoveTool = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Ensure apiKeyId is set if there are keys available
    const dataToSave = {
      ...formData,
      apiKeyId: formData.apiKeyId || (apiKeys.length > 0 ? apiKeys[0].id : ''),
    };

    // Basic validation
    if (!dataToSave.name || !dataToSave.instructions || !dataToSave.model || !dataToSave.apiKeyId) {
        alert("Por favor, complete los campos obligatorios: Nombre, Instrucciones, Modelo y Credencial OpenAI.");
        setIsSaving(false);
        return;
    }

    const success = await onSave(dataToSave);
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Common input/select/textarea classes - IMPROVED STYLING
  // Added focus ring color, padding, border, rounded corners, and shadow
  const formInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const formTextareaClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const formSelectClasses = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {existingAssistant ? 'Editar Asistente Oficial OpenAI' : 'Crear Nuevo Asistente Oficial OpenAI'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={formInputClasses}
            />
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
              Instrucciones <span className="text-red-500">*</span>
            </label>
            <textarea
              name="instructions"
              id="instructions"
              rows={4}
              value={formData.instructions}
              onChange={handleChange}
              required
              className={formTextareaClasses}
            ></textarea>
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Modelo <span className="text-red-500">*</span>
            </label>
            <select
              name="model"
              id="model"
              value={formData.model}
              onChange={handleChange}
              required
              className={formSelectClasses}
            >
              {OPENAI_MODELS.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label htmlFor="apiKeyId" className="block text-sm font-medium text-gray-700">
              Credencial OpenAI <span className="text-red-500">*</span>
            </label>
            {apiKeys.length === 0 ? (
              <p className="text-sm text-red-600 mt-1">
                <Info size={14} className="inline mr-1" />
                No hay credenciales de OpenAI disponibles. Añada una en la sección de Credenciales.
              </p>
            ) : (
              <select
                name="apiKeyId"
                id="apiKeyId"
                value={formData.apiKeyId}
                onChange={handleChange}
                required
                className={formSelectClasses}
              >
                <option value="">Seleccione una credencial</option>
                {apiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.name}
                  </option>
                ))}
              </select>
            )}
          </div>

           {/* Temperature */}
           <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
              Temperature
            </label>
            <input
              type="number"
              name="temperature"
              id="temperature"
              value={formData.temperature ?? ''} // Use ?? '' to handle undefined/null for input value
              onChange={handleNumberChange}
              step="0.01"
              min="0"
              max="2"
              className={formInputClasses}
            />
             <p className="mt-1 text-xs text-gray-500">Controla la aleatoriedad. Valores más altos significan respuestas más creativas y diversas (0.0 a 2.0).</p>
          </div>

           {/* Top P */}
           <div>
            <label htmlFor="top_p" className="block text-sm font-medium text-gray-700">
              Top P
            </label>
            <input
              type="number"
              name="top_p"
              id="top_p"
              value={formData.top_p ?? ''} // Use ?? '' to handle undefined/null for input value
              onChange={handleNumberChange}
              step="0.01"
              min="0"
              max="1"
              className={formInputClasses}
            />
             <p className="mt-1 text-xs text-gray-500">Controla la diversidad mediante el muestreo de núcleo (0.0 a 1.0).</p>
          </div>


          {/* Tools Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Herramientas (Functions)</label>
              <button
                type="button"
                onClick={() => setShowToolInput(!showToolInput)}
                className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                 {showToolInput ? 'Cancelar' : <><Plus size={16} className="mr-1" /> Añadir Herramienta</>}
              </button>
            </div>

            {showToolInput && (
              <div className="border p-3 rounded-md space-y-3 mb-4 bg-gray-50">
                 <h4 className="text-md font-semibold text-gray-800">Nueva Herramienta (Function)</h4>
                 <div>
                    <label htmlFor="newToolName" className="block text-sm font-medium text-gray-700">
                      Nombre de la Función <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="newToolName"
                      value={newToolName}
                      onChange={(e) => setNewToolName(e.target.value)}
                      className={formInputClasses}
                      placeholder="ej: get_current_weather"
                    />
                 </div>
                 <div>
                    <label htmlFor="newToolDescription" className="block text-sm font-medium text-gray-700">
                      Descripción de la Función
                    </label>
                    <textarea
                      id="newToolDescription"
                      rows={2}
                      value={newToolDescription}
                      onChange={(e) => setNewToolDescription(e.target.value)}
                      className={formTextareaClasses}
                      placeholder="ej: Obtiene el clima actual para una ubicación dada"
                    ></textarea>
                 </div>
                 <div>
                    <label htmlFor="newToolParameters" className="block text-sm font-medium text-gray-700">
                      Parámetros (JSON Schema) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="newToolParameters"
                      rows={4}
                      value={newToolParameters}
                      onChange={(e) => setNewToolParameters(e.target.value)}
                      required
                      className={`${formTextareaClasses} font-mono text-xs`} // Added font-mono and text-xs for code-like appearance
                      placeholder={`{\n  "type": "object",\n  "properties": {\n    "location": {\n      "type": "string",\n      "description": "La ciudad y estado, ej. San Francisco, CA"\n    },\n    "unit": {\n      "type": "string",\n      "enum": ["celsius", "fahrenheit"]\n    }\n  },\n  "required": ["location"]\n}`}
                    ></textarea>
                     <p className="mt-1 text-xs text-gray-500">Debe ser un objeto JSON Schema válido.</p>
                 </div>
                 <button
                    type="button"
                    onClick={handleAddTool}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                 >
                    <Plus size={16} className="mr-1" /> Añadir
                 </button>
              </div>
            )}

            {formData.tools.length > 0 && (
              <ul className="border rounded-md divide-y divide-gray-200">
                {formData.tools.map((tool, index) => (
                  tool.type === 'function' && (
                    <li key={index} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tool.function.name}</p>
                        <p className="text-xs text-gray-500">{tool.function.description}</p>
                         <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-1 rounded overflow-x-auto">
                            {JSON.stringify(tool.function.parameters, null, 2)}
                         </pre>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(index)}
                        className="text-red-600 hover:text-red-800 ml-3"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  )
                ))}
              </ul>
            )}
             {formData.tools.length === 0 && !showToolInput && (
                <p className="text-sm text-gray-500">No hay herramientas añadidas.</p>
             )}
          </div>


          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving || apiKeys.length === 0 || !formData.apiKeyId}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : (
                existingAssistant ? 'Actualizar Asistente' : 'Crear Asistente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OpenAIOfficialAssistantModal;
