import React, { useState } from 'react';
import { X, LayoutDashboard, PenTool, Save } from 'lucide-react';
import { EditSectorsTab } from './EditSectorsTab';
import { DrawPolygonsTab } from './DrawPolygonsTab';
import { useAppConfig } from '../lib/AppContext';

export const ConfigModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config, setConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState<'edit' | 'draw'>('edit');
  
  // Shared local state to prevent data loss between tabs
  const [localConfig, setLocalConfig] = useState(JSON.parse(JSON.stringify(config)));

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in fade-in duration-300">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Configuração de Setores e HC</h2>
              <p className="text-sm text-gray-500 font-medium">Gerencie o Head Count e o croqui do Terminal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <LayoutDashboard size={18} />
            Editar Setores e HC
          </button>
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'draw'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <PenTool size={18} />
            Desenhar Polígonos e Posições
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-white">
          {activeTab === 'edit' ? (
            <EditSectorsTab localConfig={localConfig} setLocalConfig={setLocalConfig} />
          ) : (
            <DrawPolygonsTab localConfig={localConfig} setLocalConfig={setLocalConfig} />
          )}
        </div>

        {/* Unified Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 z-10 shrink-0">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2.5 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save size={18} /> Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
