import React, { useState, useMemo } from 'react';
import { useAppConfig } from '../lib/AppContext';
import { SetorDef } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Users, Settings, Package, Cpu, Truck, Zap } from 'lucide-react';

const getSubSectorIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('exp') || n.includes('imp')) return Package;
  if (n.includes('sist') || n.includes('inter')) return Cpu;
  if (n.includes('doca')) return Truck;
  if (n.includes('expr')) return Zap;
  return MapPin;
};

export const FloorPlan: React.FC<{
  onConfigure: () => void;
  isViewMode?: boolean;
}> = ({ onConfigure, isViewMode = false }) => {
  const { config, activeTurno, setConfig } = useAppConfig();
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showHCInMap, setShowHCInMap] = useState(false);

  const activeSector = useMemo(() => config?.setores?.find(s => s.id === activeSectorId), [config, activeSectorId]);

  const currentViewBox = useMemo(() => {
    const defaultVB = `0 0 ${config?.imageDimensions?.width || 1600} ${config?.imageDimensions?.height || 900}`;
    if (!activeSectorId || !activeSector || !activeSector.poligono || activeSector.poligono.length < 3) {
      return defaultVB;
    }

    // Determine the points to use for the bounding box
    let xs: number[] = [];
    let ys: number[] = [];
    
    // Check if the sector has valid subsectors positioned on the map
    const positionedSubSectors = (activeSector.subSetores || []).filter(sub => sub.posicao);
    
    if (positionedSubSectors.length > 0) {
      // If there are subsectors, zoom on their cluster instead of the whole TECA
      xs = positionedSubSectors.map(sub => sub.posicao!.x);
      ys = positionedSubSectors.map(sub => sub.posicao!.y);
      
      // Since subsectors are coordinates of center points, we might need a tiny 
      // minimal width/height if there's only 1 subsector or they are aligned
      if (xs.length === 1) {
         xs.push(xs[0] - 100, xs[0] + 100);
         ys.push(ys[0] - 100, ys[0] + 100);
      }
    } else {
      // Fallback to the macro polygon
      xs = activeSector.poligono.map(p => p.x);
      ys = activeSector.poligono.map(p => p.y);
    }

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Padding parameters to leave some context around the points
    let w = maxX - minX;
    let h = maxY - minY;
    
    // Ensure minimal dimensions so it doesn't over-zoom when points are too close
    w = Math.max(w, 200); 
    h = Math.max(h, 200); 
    
    const cw = config?.imageDimensions?.width || 1600;
    const ch = config?.imageDimensions?.height || 900;

    const paddingX = Math.max(w * 0.3, cw * 0.05);
    const paddingY = Math.max(h * 0.3, ch * 0.05);

    return `${minX - paddingX} ${minY - paddingY} ${w + paddingX * 2} ${h + paddingY * 2}`;
  }, [activeSectorId, activeSector, config?.imageDimensions]);

  // Aggregate stats logic
  const getSectorStats = (sectorId: string, tId: number) => {
    const turnoData = config?.turnos?.find(t => t.turnoId === tId);
    const sector = config?.setores?.find(s => s.id === sectorId);
    if (!turnoData || !sector) return { op: 0, aux: 0, total: 0 };
    
    let op = 0, aux = 0;
    (sector.subSetores || []).forEach(sub => {
      const hc = turnoData?.hc?.find(h => h.subSetorId === sub.id);
      if (hc) {
        op += hc.operador;
        aux += hc.auxiliar;
      }
    });
    return { op, aux, total: op + aux };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if an input or textarea is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (!activeSectorId) {
        const sectors = config.setores;
        if (sectors.length === 0) return;

        let currentIndex = hoveredSector ? sectors.findIndex(s => s.id === hoveredSector) : -1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % sectors.length;
          setHoveredSector(sectors[nextIndex].id);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = currentIndex <= 0 ? sectors.length - 1 : currentIndex - 1;
          setHoveredSector(sectors[prevIndex].id);
        } else if ((e.key === 'Enter' || e.key === ' ') && hoveredSector) {
          e.preventDefault();
          setActiveSectorId(hoveredSector);
        }
      } else {
        if (e.key === 'Escape') {
          e.preventDefault();
          setActiveSectorId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.setores, activeSectorId, hoveredSector]);

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-gray-100 overflow-hidden flex" onMouseMove={handleMouseMove}>
      
      {/* SVG Map Area */}
      <div className={`relative flex-1 h-full transition-all duration-300 ${activeSectorId ? 'mr-80 lg:mr-96' : ''}`}>
        
        {activeSectorId && (
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
            <button 
              onClick={() => setActiveSectorId(null)}
              className="px-4 py-2 bg-white text-gray-800 rounded-lg shadow-md hover:bg-gray-50 font-medium flex items-center gap-2"
            >
              &larr; Voltar
            </button>
            <button 
              onClick={() => setShowHCInMap(!showHCInMap)}
              className={`px-4 py-2 rounded-lg shadow-md font-medium text-sm flex items-center gap-2 transition-colors ${showHCInMap ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
              title="Mostrar Headcount por Subsetor"
            >
              <Users size={16} />
              {showHCInMap ? 'Ocultar HC' : 'Mostrar HC'}
            </button>
          </div>
        )}

        <motion.svg
          animate={{ viewBox: currentViewBox }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
        >
          <image href={config.imagemCroqui || ""} width={config?.imageDimensions?.width || 1600} height={config?.imageDimensions?.height || 900} />
          
          {/* Polygons */}
          {(config?.setores || []).map(sector => {
            const isHovered = hoveredSector === sector.id && !activeSectorId;
            const isActive = activeSectorId === sector.id;
            const isFaded = activeSectorId && !isActive;

            return (
              <g key={sector.id}>
                <polygon
                  points={sector.poligono.map(p => `${p.x},${p.y}`).join(' ')}
                  fill={sector.cor}
                  fillOpacity={isActive ? 0.05 : isHovered ? 0.3 : isFaded ? 0.1 : 0.2}
                  stroke={sector.cor}
                  strokeWidth={isActive ? 3 : 2}
                  opacity={isFaded ? 0.3 : 1}
                  className={`transition-all duration-300 ${!activeSectorId ? 'cursor-pointer' : ''}`}
                  onMouseEnter={() => !activeSectorId && setHoveredSector(sector.id)}
                  onMouseLeave={() => setHoveredSector(null)}
                  onClick={() => !activeSectorId && setActiveSectorId(sector.id)}
                />
                
                {/* Macro Stats Card (Visible only in Level 1) - Multi-Turn Comparative View */}
                {!activeSectorId && sector.poligono.length >= 3 && (() => {
                  // Calculate centroid (simplified as bounding box center for display)
                  const xs = sector.poligono.map(p => p.x);
                  const ys = sector.poligono.map(p => p.y);
                  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
                  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

                  let cardX = cx - 170;
                  let cardY = cy - 100;

                  if (sector.nome.toUpperCase().includes("TECA III - REC") || sector.nome.toUpperCase().includes("TECA 3 - REC") || sector.nome.toUpperCase() === "TECA III" || sector.nome.toUpperCase() === "TECA 3") {
                    
                    // Encontrar o setor de Liberação para espelhar a altura (Y)
                    const liberacaoSector = config?.setores?.find(s => s.nome.toUpperCase().includes("TECA III - LIB") || s.nome.toUpperCase().includes("TECA 3 - LIB"));
                    
                    if (liberacaoSector && liberacaoSector.poligono.length >= 3) {
                       // Se existe o setor de liberação, usa a mesma matemática de Y dele
                       const lys = liberacaoSector.poligono.map(p => p.y);
                       const lcy = (Math.min(...lys) + Math.max(...lys)) / 2;
                       cardY = lcy - 100;
                    } else {
                       // Fallback caso não encontre
                       cardY = cy + 260;
                    }
                    
                    // Shift horizontal position
                    cardX = cx - 10;
                  }

                  return (
                    <foreignObject 
                      x={cardX} 
                      y={cardY} 
                      width="340" 
                      height="195" 
                      className="pointer-events-none overflow-visible"
                    >
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: isHovered ? 1 : 0.95, 
                          scale: isHovered ? 1.05 : 1,
                          boxShadow: isHovered ? "0 10px 25px -5px rgba(0, 0, 0, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                        }}
                        transition={{ duration: 0.2 }}
                        className={`w-full h-full flex flex-col bg-white border-2 rounded-xl overflow-hidden transition-colors ${isHovered ? 'border-blue-500' : 'border-gray-200'}`}
                      >
                         {/* Card Header: Sector Name */}
                         <div className="bg-gray-800 px-3 py-2 flex items-center justify-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sector.cor }} />
                            <span className="text-[10.5px] font-black text-white truncate uppercase tracking-widest">{sector.nome}</span>
                         </div>

                         {/* Comparative Grid Table & Totals Container */}
                         <div className="flex-1 flex w-full">
                           {/* Left Side: Turn Breakdown */}
                           <div className="flex-[2] flex flex-col justify-center divide-y divide-gray-100 border-r border-gray-200">
                              {/* Table Header Row */}
                              <div className="grid grid-cols-4 bg-gray-50 text-[7px] font-black text-gray-400 py-1.5 text-center tracking-tighter">
                                 <span>TURNO</span>
                                 <span>OPE</span>
                                 <span>AUX</span>
                                 <span className="text-gray-900 border-l border-gray-200">TOTAL</span>
                              </div>

                              {/* Turn Rows */}
                              {[1, 2, 3].map(tId => {
                                 const stats = getSectorStats(sector.id, tId);
                                 return (
                                   <div key={tId} className={`grid grid-cols-4 py-2.5 text-center items-center bg-white transition-colors`}>
                                      <span className={`text-[9.5px] font-black text-gray-500`}>T{tId}</span>
                                      <span className={`text-[12.5px] font-black ${stats.op > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>{stats.op}</span>
                                      <span className={`text-[12.5px] font-black ${stats.aux > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{stats.aux}</span>
                                      <span className={`text-[13.5px] font-black border-l border-gray-100 text-gray-900`}>{stats.total}</span>
                                   </div>
                                 );
                              })}
                           </div>

                           {/* Right Side: Macro Totals */}
                           <div className="flex-[1.2] flex flex-col bg-slate-50">
                              <div className="bg-slate-200 text-[7px] font-black text-slate-700 py-1.5 text-center tracking-widest border-b border-slate-300">
                                 TOTAL GERAL
                              </div>
                              <div className="flex-1 flex flex-col items-center justify-center p-3 gap-1.5">
                                 {(() => {
                                    const totalOp = [1, 2, 3].reduce((sum, t) => sum + getSectorStats(sector.id, t).op, 0);
                                    const totalAux = [1, 2, 3].reduce((sum, t) => sum + getSectorStats(sector.id, t).aux, 0);
                                    const grandTotal = totalOp + totalAux;
                                    return (
                                       <>
                                          <div className="flex w-full justify-between items-center">
                                             <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">OPE</span>
                                             <span className="text-[16px] font-black text-emerald-600">{totalOp}</span>
                                          </div>
                                          <div className="flex w-full justify-between items-center">
                                             <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">AUX</span>
                                             <span className="text-[16px] font-black text-amber-500">{totalAux}</span>
                                          </div>
                                          <div className="w-full border-t-2 border-slate-200 my-1"></div>
                                          <div className="flex w-full justify-between items-center">
                                             <span className="text-[9.5px] font-black text-slate-700 uppercase tracking-wider">SOMA</span>
                                             <span className="text-[20px] font-black text-slate-900 leading-none">{grandTotal}</span>
                                          </div>
                                       </>
                                    );
                                 })()}
                              </div>
                           </div>
                         </div>


                      </motion.div>
                    </foreignObject>
                  );
                })()}
              </g>
            );
          })}

          {/* Sub-sector Overlays (Only visible in Level 2) */}
          <AnimatePresence>
            {activeSector && activeSector.subSetores.map(sub => {
               if (!sub.posicao) return null;
               
               return (
                 <motion.foreignObject 
                   key={sub.id}
                   x={sub.posicao.x - 60} 
                   y={sub.posicao.y - (showHCInMap ? 30 : 12)}
                   width="120" 
                   height={showHCInMap ? "72" : "24"}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   drag
                   dragMomentum={false}
                   onDragEnd={(e, info) => {
                     // SVG to Screen scale approximation
                     const svgHeight = config.imageDimensions.height;
                     const screenHeight = window.innerHeight;
                     const scale = svgHeight / screenHeight; // rough approximation
                     
                     setConfig(prev => {
                       return {
                         ...prev,
                         setores: prev.setores.map(s => s.id === activeSector.id ? {
                           ...s,
                           subSetores: s.subSetores.map(ss => ss.id === sub.id ? {
                             ...ss,
                             posicao: { 
                               x: ss.posicao!.x + (info.offset.x * scale),
                               y: ss.posicao!.y + (info.offset.y * scale)
                             }
                           } : ss)
                         } : s)
                       };
                     });
                   }}
                   style={{ x: 0, y: 0 }} // Reset internal transform so it re-renders at new x,y from props
                   className="overflow-visible pointer-events-auto cursor-grab active:cursor-grabbing"
                 >
                   <div className="w-full h-full flex items-center justify-center flex-col">
                     <div className="flex flex-col border-l-4 rounded-sm overflow-hidden shadow-xl" style={{ borderLeftColor: activeSector.cor }}>
                       <div className="bg-slate-900 text-white text-[7.5px] font-black px-2.5 py-1 text-center truncate w-full flex items-center justify-center">
                         {sub.nome}
                       </div>
                       {showHCInMap && (
                         <div className="bg-white flex flex-col divide-y divide-slate-100 border-t border-slate-700">
                           {[1, 2, 3].map(tId => {
                             const tData = config?.turnos?.find(t => t.turnoId === tId);
                             const hc = tData?.hc?.find(h => h.subSetorId === sub.id) || { operador: 0, auxiliar: 0 };
                             return (
                                <div key={tId} className={`px-2 py-0.5 text-[7px] w-full flex items-center justify-between gap-1 transition-opacity ${hc.operador === 0 && hc.auxiliar === 0 ? 'opacity-30' : 'opacity-100'}`}>
                                  <span className="text-slate-500 font-bold">{tId}T - </span>
                                  <div className="flex gap-2">
                                     <span className={`text-emerald-600 font-bold ${hc.operador === 0 ? 'opacity-30' : 'opacity-100'}`}>OPE: <span className="text-emerald-900 font-black">{hc.operador}</span></span>
                                     <span className={`text-amber-600 font-bold ${hc.auxiliar === 0 ? 'opacity-30' : 'opacity-100'}`}>AUX: <span className="text-amber-900 font-black">{hc.auxiliar}</span></span>
                                  </div>
                                </div>
                             );
                           })}
                         </div>
                       )}
                     </div>
                   </div>
                 </motion.foreignObject>
               );
             })}
          </AnimatePresence>
        </motion.svg>
      </div>



      {/* Side Panel (Detail View) */}
      <AnimatePresence>
        {activeSectorId && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-0 right-0 w-80 lg:w-96 h-full bg-white border-l border-gray-200 shadow-2xl flex flex-col z-20"
          >
            <div className="p-4 border-b border-gray-100 bg-white">
               <div className="flex items-center justify-between">
                 <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                   {activeSector?.nome}
                 </h2>
                 <button 
                   onClick={() => setActiveSectorId(null)}
                   className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 shadow-sm"
                   title="Fechar Painel"
                 >
                   <Users size={18} />
                 </button>
               </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 pb-24">
               {[1, 2, 3].map(tId => {
                  const isCurrent = activeTurno === tId;
                  const sectorStats = getSectorStats(activeSector.id, tId);
                  
                  return (
                    <div key={tId} className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all flex flex-col overflow-hidden">
                       {/* Card Header for the Turn */}
                       <div className="px-4 py-2 border-b bg-slate-100 border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-slate-300" />
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">Turno {tId}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                             <span className="text-[6.75px] font-bold uppercase tracking-wider text-slate-500">Total:</span>
                             <span className="text-xs font-black text-slate-900">{sectorStats.total}</span>
                          </div>
                       </div>

                       {/* Table of Sub-Sectors */}
                       <div className="overflow-x-auto">
                          <table className="w-full text-center border-collapse">
                             <thead>
                                <tr className="bg-slate-900 text-slate-400 text-[8.5px] font-black uppercase tracking-widest">
                                   <th className="text-left px-4 py-1.5 bg-slate-900/90 backdrop-blur sticky left-0 z-10">Subsetor</th>
                                   <th className="px-2 py-1.5">AUX</th>
                                   <th className="px-2 py-1.5">OPE</th>
                                   <th className="px-4 py-1.5 text-white border-l border-slate-800">Total</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {(activeSector?.subSetores || []).map((sub: any) => {
                                   const tData = config?.turnos?.find(t => t.turnoId === tId);
                                   const hc = tData?.hc?.find(h => h.subSetorId === sub.id) || { operador: 0, auxiliar: 0 };
                                   const total = hc.operador + hc.auxiliar;
                                   
                                   return (
                                       <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                                         <td className="px-4 py-1.5 text-left bg-white group-hover:bg-slate-50/50 sticky left-0 z-10 transition-colors">
                                            <span className="text-[9.5px] font-black text-slate-700 uppercase tracking-tight truncate block max-w-[130px]" title={sub.nome}>
                                               {sub.nome}
                                            </span>
                                         </td>
                                         <td className={`px-2 py-1.5 text-[10.5px] font-black ${hc.auxiliar > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                            {hc.auxiliar}
                                         </td>
                                         <td className={`px-2 py-1.5 text-[10.5px] font-black ${hc.operador > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {hc.operador}
                                         </td>
                                         <td className="px-4 py-1.5 text-[11px] font-black border-l border-slate-50 transition-colors text-slate-900 bg-slate-50/50">
                                            {total}
                                         </td>
                                      </tr>
                                   );
                                })}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  );
               })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
