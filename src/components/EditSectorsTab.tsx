import React, { useState } from 'react';
import { TURNOS } from '../types';
import { Plus, Trash2, AlertTriangle, ChevronDown, ChevronRight, Layout, Users } from 'lucide-react';

export const EditSectorsTab: React.FC<{ 
  localConfig: any; 
  setLocalConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ localConfig, setLocalConfig }) => {
  const [selectedTurnoId, setSelectedTurnoId] = useState<number>(1);
  const [expandedSectors, setExpandedSectors] = useState<string[]>([]);
  
  // Confirmation Modal State
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    type: 'sector' | 'subsector';
    name: string;
    parentId?: string;
  } | null>(null);

  const toggleSector = (id: string) => {
    setExpandedSectors(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const addMacroSector = () => {
    const id = `setor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const colors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
    const color = colors[localConfig.setores.length % colors.length];
    
    setLocalConfig((prev: any) => ({
      ...prev,
      setores: [...prev.setores, {
        id,
        nome: 'Novo Setor Macro',
        cor: color,
        poligono: [{x: 100, y: 100}, {x: 300, y: 100}, {x: 300, y: 300}, {x: 100, y: 300}],
        subSetores: []
      }]
    }));
    setExpandedSectors(prev => [...prev, id]);
  };

  const getSubSectorHC = (turnoId: number, subSetorId: string) => {
    const turno = localConfig?.turnos?.find((t: any) => t.turnoId === turnoId);
    if (!turno) return { operador: 0, auxiliar: 0 };
    return turno?.hc?.find((h: any) => h.subSetorId === subSetorId) || { operador: 0, auxiliar: 0 };
  };

  const getSectorTotalHC = (sector: any, turnoId: number) => {
    let ope = 0;
    let aux = 0;
    sector.subSetores.forEach((sub: any) => {
      const hc = getSubSectorHC(turnoId, sub.id);
      ope += hc.operador;
      aux += hc.auxiliar;
    });
    return { ope, aux, total: ope + aux };
  };

  const updateHC = (subSetorId: string, field: 'operador' | 'auxiliar', value: number) => {
    setLocalConfig((prev: any) => {
      const turnoIndex = prev.turnos.findIndex((t: any) => t.turnoId === selectedTurnoId);
      if (turnoIndex === -1) return prev;
      
      const newTurnos = [...prev.turnos];
      const newHc = [...newTurnos[turnoIndex].hc];
      const hcIndex = newHc.findIndex((h: any) => h.subSetorId === subSetorId);
      
      if (hcIndex > -1) {
        newHc[hcIndex] = { ...newHc[hcIndex], [field]: value };
      } else {
        newHc.push({ subSetorId, operador: field === 'operador' ? value : 0, auxiliar: field === 'auxiliar' ? value : 0 });
      }
      
      newTurnos[turnoIndex] = { ...newTurnos[turnoIndex], hc: newHc };
      return { ...prev, turnos: newTurnos };
    });
  };

  const addSubSector = (sectorId: string) => {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setLocalConfig((prev: any) => {
      const sectorIndex = prev.setores.findIndex((s: any) => s.id === sectorId);
      if (sectorIndex === -1) return prev;
      
      const newSetores = [...prev.setores];
      newSetores[sectorIndex] = {
        ...newSetores[sectorIndex],
        subSetores: [...newSetores[sectorIndex].subSetores, { id, nome: 'Novo Sub-setor', posicao: null }]
      };
      
      return { ...prev, setores: newSetores };
    });
  };

  const activeTurnoData = localConfig?.turnos?.find((t: any) => t.turnoId === selectedTurnoId);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-64 flex flex-col gap-6 shrink-0">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Turno em Edição</label>
            <select
              value={selectedTurnoId}
              onChange={e => setSelectedTurnoId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-gray-700"
            >
              {TURNOS.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <button
            onClick={addMacroSector}
            className="w-full py-4 px-4 bg-white border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-sm font-bold">Novo Setor Macro</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
               <Layout className="text-blue-600" size={24} />
               Gerenciamento de Setores
             </h2>
          </div>

          {localConfig.setores.map((sector: any) => {
            const isExpanded = expandedSectors.includes(sector.id);
            const totals = getSectorTotalHC(sector, selectedTurnoId);
            
            return (
              <div key={sector.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${isExpanded ? 'border-blue-200 ring-4 ring-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
                {/* Sector Header */}
                <div 
                  className={`px-4 py-3 flex items-center gap-4 cursor-pointer select-none transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                  onClick={() => toggleSector(sector.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isExpanded ? <ChevronDown size={20} className="text-blue-500" /> : <ChevronRight size={20} className="text-gray-400" />}
                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: sector.cor }} />
                    <div className="flex-1 truncate">
                      <h3 className="font-black text-gray-900 truncate tracking-tight">{sector.nome}</h3>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          OPE: {totals.ope}
                        </span>
                        <span className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          AUX: {totals.aux}
                        </span>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 px-1.5 rounded-sm">
                          Σ: {totals.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 px-2" onClick={e => e.stopPropagation()}>
                    <input 
                      type="color" 
                      value={sector.cor}
                      onChange={(e) => {
                        setLocalConfig((prev: any) => {
                          const sIdx = prev.setores.findIndex((s: any) => s.id === sector.id);
                          if (sIdx === -1) return prev;
                          const newSetores = [...prev.setores];
                          newSetores[sIdx] = { ...newSetores[sIdx], cor: e.target.value };
                          return { ...prev, setores: newSetores };
                        });
                      }}
                      className="w-6 h-6 rounded-md cursor-pointer border-none p-0 bg-transparent"
                      title="Cor do Setor"
                    />
                    <button
                      onClick={() => {
                        setConfirmDelete({
                          id: sector.id,
                          type: 'sector',
                          name: sector.nome
                        });
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-white">
                    <div className="p-3 bg-gray-50/50 border-b border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex-1 max-w-sm">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nome do Setor Macro</label>
                          <input 
                            type="text"
                            value={sector.nome}
                            onChange={(e) => {
                              setLocalConfig((prev: any) => {
                                const sIdx = prev.setores.findIndex((s: any) => s.id === sector.id);
                                if (sIdx === -1) return prev;
                                const newSetores = [...prev.setores];
                                newSetores[sIdx] = { ...newSetores[sIdx], nome: e.target.value };
                                return { ...prev, setores: newSetores };
                              });
                            }}
                            className="w-full text-sm font-bold px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <button
                          onClick={() => addSubSector(sector.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-all shadow-sm"
                        >
                          <Plus size={16} /> Adicionar Sub-setor
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/30">
                            <th className="px-6 py-2 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">Sub-setor</th>
                            <th className="px-6 py-2 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider w-32">Operadores</th>
                            <th className="px-6 py-2 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider w-32">Auxiliares</th>
                            <th className="px-6 py-2 border-b border-gray-100 text-sm font-semibold text-gray-500 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {sector.subSetores.map((sub: any) => {
                            const hc = getSubSectorHC(selectedTurnoId, sub.id);
                            return (
                              <tr key={sub.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-2.5">
                                   <input 
                                     type="text"
                                     value={sub.nome}
                                     onChange={(e) => {
                                       setLocalConfig((prev: any) => {
                                         const sIdx = prev.setores.findIndex((s: any) => s.id === sector.id);
                                         if (sIdx === -1) return prev;
                                         const newSetores = [...prev.setores];
                                         const newSubSetores = [...newSetores[sIdx].subSetores];
                                         const ssIdx = newSubSetores.findIndex((ss: any) => ss.id === sub.id);
                                         if (ssIdx > -1) {
                                           newSubSetores[ssIdx] = { ...newSubSetores[ssIdx], nome: e.target.value };
                                           newSetores[sIdx] = { ...newSetores[sIdx], subSetores: newSubSetores };
                                         }
                                         return { ...prev, setores: newSetores };
                                       });
                                     }}
                                     className="w-full bg-transparent border-b border-transparent group-hover:border-gray-200 focus:border-blue-500 focus:outline-none font-bold text-gray-700 px-1 py-1 text-sm"
                                     placeholder="Nome do sub-setor"
                                   />
                                </td>
                                <td className="px-6 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={hc.operador === 0 ? '' : hc.operador}
                                      placeholder="0"
                                      onChange={(e) => updateHC(sub.id, 'operador', parseInt(e.target.value) || 0)}
                                      className="w-full px-3 py-1.5 border border-emerald-200 bg-emerald-50/30 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-center font-black text-emerald-700"
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={hc.auxiliar === 0 ? '' : hc.auxiliar}
                                      placeholder="0"
                                      onChange={(e) => updateHC(sub.id, 'auxiliar', parseInt(e.target.value) || 0)}
                                      className="w-full px-3 py-1.5 border border-amber-200 bg-amber-50/30 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none text-center font-black text-amber-700"
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-2.5 text-right">
                                   <button 
                                     className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white"
                                     onClick={() => {
                                       setConfirmDelete({
                                         id: sub.id,
                                         type: 'subsector',
                                         name: sub.nome,
                                         parentId: sector.id
                                       });
                                     }}
                                   >
                                      <Trash2 size={16} />
                                   </button>
                                </td>
                              </tr>
                            );
                          })}
                          {sector.subSetores.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 opacity-50">
                                  <Layout size={32} className="text-gray-400" />
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum sub-setor nesta área</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {localConfig.setores.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-100/50 rounded-3xl border-2 border-dashed border-gray-200">
               <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                 <Layout size={40} className="text-gray-300" />
               </div>
               <h3 className="text-xl font-black text-gray-900 mb-2">Sem setores cadastrados</h3>
               <p className="text-gray-500 max-w-sm mb-8">Comece criando o primeiro setor macro para organizar o seu croqui operacional.</p>
               <button 
                 onClick={addMacroSector}
                 className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform hover:scale-105"
               >
                 Criar Primeiro Setor
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-red-50 text-red-500 rounded-2xl mb-6 mx-auto transform rotate-12">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-3">Confirmar Exclusão?</h3>
              <p className="text-slate-500 text-center text-sm leading-relaxed">
                Você está prestes a remover <span className="font-black text-slate-900">"{confirmDelete.name}"</span>. 
                {confirmDelete.type === 'sector' && " Todos os dados e sub-setores vinculados serão perdidos permanentemente."}
              </p>
            </div>
            <div className="grid grid-cols-2 p-4 gap-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="py-4 text-sm font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-2xl"
              >
                Manter
              </button>
              <button 
                onClick={() => {
                  if (confirmDelete.type === 'sector') {
                    setLocalConfig((prev: any) => {
                      const next = { ...prev };
                      next.setores = next.setores.filter((s: any) => s.id !== confirmDelete.id);
                      return next;
                    });
                  } else {
                    setLocalConfig((prev: any) => {
                      const next = { ...prev };
                      const sIdx = next.setores.findIndex((s: any) => s.id === confirmDelete.parentId);
                      if (sIdx > -1) {
                         const newSetores = [...next.setores];
                         newSetores[sIdx] = {
                           ...newSetores[sIdx],
                           subSetores: newSetores[sIdx].subSetores.filter((s: any) => s.id !== confirmDelete.id)
                         };
                         next.setores = newSetores;
                      }
                      return next;
                    });
                  }
                  setConfirmDelete(null);
                }}
                className="py-4 text-sm font-black text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all rounded-2xl"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
