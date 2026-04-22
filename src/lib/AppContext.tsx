import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig, TURNOS } from '../types';
import { supabase } from './supabase';

interface AppContextType {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  activeTurno: number;
  setActiveTurno: (id: number) => void;
  importConfig: (jsonString: string) => boolean;
  exportConfig: () => void;
  
  projects: { id: number, projectName: string }[];
  activeProjectId: number;
  loadProject: (id: number) => void;
  createNewProject: (name: string, imageUrl?: string) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
}

const INITIAL_CONFIG: AppConfig = {
  versao: "1.0",
  dataExportacao: new Date().toISOString(),
  imagemCroqui: "",
  imageDimensions: { width: 1600, height: 900 },
  setores: [],
  turnos: [
    { turnoId: 1, folguistas: 0, hc: [] },
    { turnoId: 2, folguistas: 0, hc: [] },
    { turnoId: 3, folguistas: 0, hc: [] }
  ]
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const stored = localStorage.getItem('hc_config');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Could not parse config from localStorage.", e);
    }
    return INITIAL_CONFIG;
  });

  const [activeTurno, setActiveTurno] = useState<number>(1);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  
  const [projects, setProjects] = useState<{ id: number, projectName: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number>(1);
  
  // Cache de configs carregados para troca instantânea
  const [configCache, setConfigCache] = useState<Map<number, AppConfig>>(new Map());

  // Load from Supabase on mount
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const { data, error } = await supabase.from('hc_config').select('id, config_data');
        if (data && data.length > 0) {
          // MIGRAÇÃO: Renomear "Croqui 1" para "Terminal de Cargas"
          const needsMigration = data.some(row => 
            row.config_data?.projectName === 'Croqui 1'
          );
          
          if (needsMigration) {
            console.log('🔄 Migrando nome "Croqui 1" para "Terminal de Cargas"...');
            const croqui1 = data.find(row => row.config_data?.projectName === 'Croqui 1');
            if (croqui1) {
              await supabase.from('hc_config').upsert({
                id: croqui1.id,
                config_data: {
                  ...croqui1.config_data,
                  projectName: 'Terminal de Cargas'
                }
              }, { onConflict: 'id' });
              
              // Atualizar data local para não precisar reload
              const updatedIndex = data.findIndex(row => row.id === croqui1.id);
              if (updatedIndex !== -1) {
                data[updatedIndex].config_data.projectName = 'Terminal de Cargas';
              }
            }
          }
          
          const loadedProjects = data.map(row => ({
            id: row.id,
            projectName: row.config_data?.projectName || `Layout ${row.id}`
          }));
          setProjects(loadedProjects);

          // Criar cache de TODOS os projetos de uma vez
          const cache = new Map<number, AppConfig>();
          data.forEach(row => {
            const incomingConfig = row.config_data || {};
            cache.set(row.id, {
              ...INITIAL_CONFIG,
              ...incomingConfig,
              imageDimensions: incomingConfig.imageDimensions || { width: 1600, height: 900 }
            });
          });
          setConfigCache(cache);

          // Pega o id=1 ou o primeiro e seta
          const defaultProject = data?.find(r => r.id === 1) || data[0];
          if (defaultProject) {
            setActiveProjectId(defaultProject.id);
            const cachedConfig = cache.get(defaultProject.id);
            if (cachedConfig) {
              setConfig(cachedConfig);
            }
          }
        } else {
          // Nenhum projeto no DB, verificar se existe algo no localStorage
          const localData = localStorage.getItem('hc_config');
          let baseConfig;
          
          if (localData) {
            console.log("Migrando dados locais para o novo banco...");
            baseConfig = JSON.parse(localData);
          } else {
            baseConfig = { ...INITIAL_CONFIG, projectName: "Terminal de Cargas" };
          }
          
          await supabase.from('hc_config').upsert({ id: 1, config_data: baseConfig }, { onConflict: 'id' });
          setProjects([{ id: 1, projectName: baseConfig.projectName || "Terminal de Cargas" }]);
          setConfig(baseConfig);
          
          // Inicializar cache
          const cache = new Map<number, AppConfig>();
          cache.set(1, baseConfig);
          setConfigCache(cache);
        }
      } catch (err) {
        console.error("Supabase load error:", err);
      } finally {
        setIsDbLoading(false);
      }
    };
    loadFromDB();
  }, []);

  // Sync to local and Supabase when modified
  useEffect(() => {
    localStorage.setItem('hc_config', JSON.stringify(config));
    
    // Atualizar cache imediatamente
    setConfigCache(prev => {
      const newCache = new Map(prev);
      newCache.set(activeProjectId, config);
      return newCache;
    });
    
    if (isDbLoading) return;

    const timer = setTimeout(async () => {
      try {
        // Garantir que o config tem o mesmo nome reflete na listagem local
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, projectName: config.projectName || p.projectName } : p));
        
        await supabase.from('hc_config').upsert({ 
          id: activeProjectId, 
          config_data: config 
        }, { onConflict: 'id' });
      } catch (err) {
        console.error("Supabase request failed:", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [config, isDbLoading, activeProjectId]);

  const loadProject = async (id: number) => {
    // Verificar se já está no cache - troca INSTANTÂNEA
    const cachedConfig = configCache.get(id);
    if (cachedConfig) {
      setActiveProjectId(id);
      setConfig(cachedConfig);
      return; // Retorna imediatamente, sem loading
    }
    
    // Se não estiver no cache, busca do banco (raro)
    setIsDbLoading(true);
    setActiveProjectId(id);
    try {
      const { data, error } = await supabase.from('hc_config').select('config_data').eq('id', id).single();
      if (data && data.config_data) {
        const incomingConfig = data.config_data || {};
        const loadedConfig = {
           ...INITIAL_CONFIG,
           ...incomingConfig,
           imageDimensions: incomingConfig.imageDimensions || { width: 1600, height: 900 }
        };
        setConfig(loadedConfig);
        
        // Adicionar ao cache
        setConfigCache(prev => {
          const newCache = new Map(prev);
          newCache.set(id, loadedConfig);
          return newCache;
        });
      } else {
        alert("Erro ao carregar o croqui.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDbLoading(false);
    }
  };

  const createNewProject = async (name: string, imageUrl?: string) => {
    setIsDbLoading(true);
    try {
      const nextId = Math.max(0, ...projects.map(p => p.id)) + 1;
      const newConfig: AppConfig = {
        versao: "1.0",
        projectName: name,
        dataExportacao: new Date().toISOString(),
        imagemCroqui: imageUrl || "https://images.unsplash.com/photo-1628135899997-75e985888806?auto=format&fit=crop&q=80&w=1600",
        imageDimensions: { width: 1600, height: 900 },
        setores: [], // Começa vazio conforme solicitado
        turnos: TURNOS.map(t => ({ turnoId: t.id, folguistas: 0, hc: [] }))
      };
      
      await supabase.from('hc_config').upsert({ id: nextId, config_data: newConfig }, { onConflict: 'id' });
      
      setProjects(prev => [...prev, { id: nextId, projectName: name }]);
      setActiveProjectId(nextId);
      setConfig(newConfig);
      
      // Adicionar ao cache
      setConfigCache(prev => {
        const newCache = new Map(prev);
        newCache.set(nextId, newConfig);
        return newCache;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsDbLoading(false);
    }
  };

  const deleteProject = async (id: number) => {
    if (projects.length <= 1) {
      alert("Você não pode deletar o último croqui do sistema.");
      return;
    }
    try {
      await supabase.from('hc_config').delete().eq('id', id);
      setProjects(prev => prev.filter(p => p.id !== id));
      
      // Remover do cache
      setConfigCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(id);
        return newCache;
      });
      
      if (activeProjectId === id) {
        const nextActive = projects.find(p => p.id !== id);
        if (nextActive) {
          loadProject(nextActive.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const importConfig = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data && data.versao && data.setores && data.turnos) {
        setConfig({
           ...INITIAL_CONFIG,
           ...data,
           imageDimensions: data.imageDimensions || { width: 1600, height: 900 }
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchorNode.setAttribute("download", `terminal_hc_config_${dateStr}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <AppContext.Provider value={{
      config, setConfig,
      activeTurno, setActiveTurno,
      importConfig, exportConfig,
      projects, activeProjectId,
      loadProject, createNewProject, deleteProject
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppConfig must be used within AppProvider");
  return context;
};
