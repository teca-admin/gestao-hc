import React, { useState } from 'react';
import { useAppConfig } from './lib/AppContext';
import { TURNOS } from './types';
import { FloorPlan } from './components/FloorPlan';
import { ConfigModal } from './components/ConfigModal';
import { GlobalSummary } from './components/GlobalSummary';
import { Settings, Download, Upload, PlusCircle, Trash2, Share2, Eye } from 'lucide-react';
import { NewProjectModal } from './components/NewProjectModal';
import { ShareModal } from './components/ShareModal';
import { useViewMode } from './lib/useViewMode';

export default function App() {
  const { activeTurno, setActiveTurno, exportConfig, importConfig, projects, activeProjectId, loadProject, createNewProject, deleteProject } = useAppConfig();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { isViewMode } = useViewMode();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... mantido ... (código dentro da função)
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importConfig(content);
        if (success) {
          alert("Configurações importadas com sucesso!");
        } else {
          alert("Erro: Arquivo JSON inválido ou incompatível.");
        }
      }
    };
    reader.readAsText(file);
    // Reset file input target
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="h-[88px] px-6 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img 
            src="https://lh3.googleusercontent.com/d/1sNzDKhdh2zH8d8DoyqIjx8l5LzBEXN5g" 
            alt="WFS Logo" 
            className="h-[72px] w-auto object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="w-12 h-12 bg-blue-600 text-white rounded-lg hidden items-center justify-center font-bold text-xl">
            WFS
          </div>
          <div className="h-8 w-px bg-gray-300 mx-2 hidden sm:block"></div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 hidden sm:block leading-none">Gestão de HC</h1>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 block sm:hidden">Gestão de HC</h1>
              {isViewMode && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Eye size={12} />
                  VISUALIZAÇÃO
                </span>
              )}
            </div>
            
            {/* Project Selector */}
            <div className="flex items-center gap-2">
              <select
                value={activeProjectId}
                onChange={(e) => loadProject(Number(e.target.value))}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-700 py-1 px-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
              {!isViewMode && (
                <>
                  <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="text-[10px] flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100 transition-colors font-bold"
                    title="Criar Nova Planta/Croqui"
                  >
                    <PlusCircle size={12} />
                    NOVO
                  </button>
                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm("Você tem certeza que deseja excluir esta planta inteira? Tudo será apagado.")) {
                          deleteProject(activeProjectId);
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir este Croqui"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            {!isViewMode && (
              <>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm font-medium"
                  title="Compartilhar Visualização"
                >
                  <Share2 size={18} />
                  <span className="hidden lg:inline">Compartilhar</span>
                </button>
                
                <button 
                  onClick={() => setIsConfigOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                  title="Configurar Setores"
                >
                  <Settings size={18} />
                  <span className="hidden lg:inline">Configurar Setores</span>
                </button>
                
                <label className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer group" title="Importar JSON">
                  <Upload size={18} className="group-hover:text-blue-600 transition-colors" />
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>

                <button 
                  onClick={exportConfig}
                  className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm group" title="Exportar JSON"
                >
                  <Download size={18} className="group-hover:text-blue-600 transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Map Viewer */}
      <main className="flex-1 overflow-hidden relative">
        <FloorPlan onConfigure={() => setIsConfigOpen(true)} isViewMode={isViewMode} />
        <GlobalSummary />
      </main>

      {/* Configuration Modal */}
      {isConfigOpen && !isViewMode && (
        <ConfigModal onClose={() => setIsConfigOpen(false)} />
      )}
      
      {/* New Project Modal */}
      {isNewProjectModalOpen && !isViewMode && (
        <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} />
      )}
      
      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal onClose={() => setIsShareModalOpen(false)} />
      )}
    </div>
  );
}
