import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppConfig } from '../lib/AppContext';
import { Point } from '../types';
import { Save, Undo, Trash2, Crosshair, ImagePlus, Package, Cpu, Truck, Zap, MapPin, ZoomIn, ZoomOut, Maximize, Hand } from 'lucide-react';

const getSubSectorIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('exp') || n.includes('imp')) return Package;
  if (n.includes('sist') || n.includes('inter')) return Cpu;
  if (n.includes('doca')) return Truck;
  if (n.includes('envio') || n.includes('carga')) return Package;
  if (n.includes('expr')) return Zap;
  return MapPin;
};

export const DrawPolygonsTab: React.FC<{ 
  localConfig: any; 
  setLocalConfig: React.Dispatch<React.SetStateAction<any>>;
}> = ({ localConfig, setLocalConfig }) => {
  const { config } = useAppConfig();
  const [selectedSectorId, setSelectedSectorId] = useState<string>(localConfig?.setores?.[0]?.id || '');
  
  // 'draw', 'place', 'pan', 'none'
  const [mode, setMode] = useState<'draw' | 'place' | 'pan' | 'none'>('none');
  const [activeSubSectorId, setActiveSubSectorId] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingSubSector, setIsDraggingSubSector] = useState(false);
  const [draggedSubSectorId, setDraggedSubSectorId] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeSector = localConfig?.setores?.find((s: any) => s.id === selectedSectorId);

  // Helper to get SVG coordinates from mouse event
  const getSVGCoordinates = (e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const inverseCTM = ctm.inverse();
      const svgPoint = pt.matrixTransform(inverseCTM);
      return { x: Math.round(svgPoint.x), y: Math.round(svgPoint.y) };
    }
    return null;
  };

  // Handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * delta, 0.1), 10);
      setZoom(newZoom);
    }
  };

  const startPanning = (e: React.MouseEvent) => {
    if (mode === 'pan' || e.button === 1) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleSubSectorMouseDown = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation();
    setDraggedSubSectorId(subId);
    setIsDraggingSubSector(true);
  };

  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDraggingSubSector && draggedSubSectorId) {
      const point = getSVGCoordinates(e);
      if (point) {
        setLocalConfig((prev: any) => {
          const next = { ...prev };
          const sectorIndex = next.setores.findIndex((s: any) => s.id === selectedSectorId);
          if (sectorIndex > -1) {
            const subSectorIndex = next.setores[sectorIndex].subSetores.findIndex((sub: any) => sub.id === draggedSubSectorId);
            if (subSectorIndex > -1) {
              next.setores[sectorIndex].subSetores[subSectorIndex].posicao = point;
            }
          }
          return next;
        });
      }
    }
  };

  const handleMouseUpGlobal = () => {
    setIsPanning(false);
    setIsDraggingSubSector(false);
    setDraggedSubSectorId(null);
  };

  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const pushPoint = (point: Point) => {
    if (mode === 'draw') {
      setLocalConfig((prev: any) => {
        const next = { ...prev };
        const sectorIndex = next.setores.findIndex((s: any) => s.id === selectedSectorId);
        if (sectorIndex > -1) {
          next.setores[sectorIndex].poligono.push(point);
        }
        return next;
      });
    } else if (mode === 'place' && activeSubSectorId) {
       setLocalConfig((prev: any) => {
          const next = { ...prev };
          const sectorIndex = next.setores.findIndex((s: any) => s.id === selectedSectorId);
          if (sectorIndex > -1) {
             const subSectorIndex = next.setores[sectorIndex].subSetores.findIndex((sub: any) => sub.id === activeSubSectorId);
             if (subSectorIndex > -1) {
                 next.setores[sectorIndex].subSetores[subSectorIndex].posicao = point;
             }
          }
          return next;
       });
       setMode('none');
       setActiveSubSectorId(null);
    }
  };

  const popPoint = () => {
    if (mode !== 'draw') return;
     setLocalConfig((prev: any) => {
        const next = { ...prev };
        const sectorIndex = next.setores.findIndex((s: any) => s.id === selectedSectorId);
        if (sectorIndex > -1) {
           next.setores[sectorIndex].poligono.pop();
        }
        return next;
     });
  };

  const clearPolygon = () => {
     setLocalConfig((prev: any) => {
        const next = { ...prev };
        const sectorIndex = next.setores.findIndex((s: any) => s.id === selectedSectorId);
        if (sectorIndex > -1) {
           next.setores[sectorIndex].poligono = [];
        }
        return next;
     });
  };

  const handleClickMap = (e: React.MouseEvent<SVGSVGElement>) => {
    if (mode === 'none') return;
    const point = getSVGCoordinates(e);
    if (point) {
      pushPoint(point);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
         // Load image to get true dimensions
         const img = new Image();
         img.onload = () => {
            setLocalConfig((prev: any) => ({
               ...prev,
               imagemCroqui: dataUrl,
               imageDimensions: { width: img.naturalWidth, height: img.naturalHeight }
            }));
         };
         img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
    // reseta o input para permitir subir a mesma imagem novamente se precisar
    e.target.value = '';
  };

  const activePoints = activeSector?.poligono || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Controls */}
        <div className="w-80 shrink-0 bg-white border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto">
          
          <label className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer group">
             <ImagePlus size={18} className="group-hover:text-blue-600" /> Alterar Imagem Base
             <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Selecione o Setor Macro</label>
            <select
              value={selectedSectorId}
              onChange={e => { setSelectedSectorId(e.target.value); setMode('none'); }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {(localConfig?.setores || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {activeSector && (
             <>
               <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Cor do Polígono:</span>
                  <input 
                     type="color" 
                     value={activeSector.cor} 
                     onChange={e => setLocalConfig((prev: any) => {
                        const next = {...prev};
                        const idx = next.setores.findIndex((x:any) => x.id === activeSector.id);
                        if(idx > -1) next.setores[idx].cor = e.target.value;
                        return next;
                     })}
                     className="w-8 h-8 rounded shrink-0 cursor-pointer border border-gray-200"
                  />
               </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900">Zoom e Navegação</h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setZoom(z => Math.min(z * 1.2, 10))} 
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shadow-sm active:scale-95"
                      title="Aproximar"
                    >
                      <ZoomIn size={18} />
                    </button>
                    <button 
                      onClick={() => setZoom(z => Math.max(z / 1.2, 0.1))} 
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shadow-sm active:scale-95"
                      title="Afastar"
                    >
                      <ZoomOut size={18} />
                    </button>
                    <button 
                      onClick={resetView} 
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shadow-sm active:scale-95"
                      title="Resetar Vista"
                    >
                      <Maximize size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => setMode(mode === 'pan' ? 'none' : 'pan')}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all border ${
                      mode === 'pan' 
                        ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' 
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    }`}
                  >
                    <Hand size={18} /> {mode === 'pan' ? 'Panorâmica Ativa' : 'Mover Croqui'}
                  </button>
                </div>

               <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900">Desenho do Polígono</h4>
                  <p className="text-xs text-gray-500 leading-tight">Mapeie as coordenadas limitadoras do setor baseando-se no croqui.</p>
                  
                  <button
                     onClick={() => setMode(mode === 'draw' ? 'none' : 'draw')}
                     className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-colors border ${
                        mode === 'draw' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-inner' 
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                     }`}
                  >
                     <Crosshair size={18} /> {mode === 'draw' ? 'Finalizar Desenho' : 'Iniciar Desenho'}
                  </button>
                  
                  <div className="flex gap-2">
                     <button onClick={popPoint} disabled={activePoints.length === 0} className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-gray-100 text-gray-600 rounded font-medium hover:bg-gray-200 disabled:opacity-50 text-sm">
                        <Undo size={16} /> Desfazer
                     </button>
                     <button onClick={clearPolygon} disabled={activePoints.length === 0} className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-red-50 text-red-600 rounded font-medium hover:bg-red-100 disabled:opacity-50 text-sm">
                        <Trash2 size={16} /> Limpar
                     </button>
                  </div>
               </div>

               <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900">Posicionar Sub-setores</h4>
                  <p className="text-xs text-gray-500 leading-tight">Defina a localização de cada sub-setor clicando no botão e depois no mapa.</p>
                  
                  <div className="space-y-2">
                     {(activeSector?.subSetores || []).map((sub:any) => (
                        <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                           <span className="text-sm font-medium truncate shrink" title={sub.nome}>{sub.nome}</span>
                           <button
                              onClick={() => {
                                 setMode('place');
                                 setActiveSubSectorId(sub.id);
                              }}
                              className={`shrink-0 px-2 py-1 text-xs font-bold rounded ${
                                 mode === 'place' && activeSubSectorId === sub.id 
                                    ? 'bg-blue-500 text-white' 
                                    : sub.posicao ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                           >
                              {mode === 'place' && activeSubSectorId === sub.id ? 'Clique no mapa' : sub.posicao ? 'Reposicionar' : 'Posicionar'}
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
             </>
          )}

        </div>

        {/* Map Area */}
        <div 
          className="flex-1 bg-gray-200 relative overflow-hidden flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={startPanning}
          onMouseMove={handleMouseMoveGlobal}
          onMouseUp={handleMouseUpGlobal}
          onMouseLeave={handleMouseUpGlobal}
        >
           {/* Interactive SVG Workspace */}
           <div 
              ref={containerRef}
              className={`relative shadow-2xl bg-white border-2 transition-transform duration-75 select-none ${
                mode === 'draw' ? 'cursor-crosshair border-blue-400' : 
                mode === 'place' ? 'cursor-crosshair border-green-400' :
                mode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') :
                'border-transparent'
              }`}
              style={{
                 width: localConfig?.imageDimensions?.width || 1600,
                 height: localConfig?.imageDimensions?.height || 900,
                 transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                 transformOrigin: 'center center',
                 maxWidth: 'none',
                 maxHeight: 'none'
              }}
           >
             <svg
               ref={svgRef}
               viewBox={`0 0 ${localConfig?.imageDimensions?.width || 1600} ${localConfig?.imageDimensions?.height || 900}`}
               className="w-full h-full block"
               onClick={handleClickMap}
               preserveAspectRatio="xMidYMid meet"
             >
               <image href={localConfig?.imagemCroqui || ""} width={localConfig?.imageDimensions?.width || 1600} height={localConfig?.imageDimensions?.height || 900} />
               
               {/* Draw all sectors passively */}
               {(localConfig?.setores || []).map((sector: any) => {
                  const isActiveSector = sector.id === selectedSectorId;
                  if (isActiveSector) return null; // draw active one on top
                  if(sector?.poligono?.length < 1) return null;
                  return (
                     <polygon 
                        key={sector.id}
                        points={(sector?.poligono || []).map((p:any) => `${p.x},${p.y}`).join(' ')}
                        fill={sector.cor}
                        fillOpacity={0.15}
                        stroke={sector.cor}
                        strokeWidth={2}
                        className="pointer-events-none"
                     />
                  );
               })}

               {/* Draw active sector prominently */}
               {activeSector && (
                  <>
                     {activePoints.length > 0 && (
                        <polygon 
                           points={activePoints.map((p:any) => `${p.x},${p.y}`).join(' ')}
                           fill={activeSector.cor}
                           fillOpacity={0.3}
                           stroke={activeSector.cor}
                           strokeWidth={4}
                           strokeDasharray={mode === 'draw' ? "8,4" : "none"}
                           className="pointer-events-none"
                        />
                     )}
                     {mode === 'draw' && activePoints.map((p:any, i:number) => (
                        <circle key={i} cx={p.x} cy={p.y} r={8} fill="white" stroke={activeSector.cor} strokeWidth={3} className="pointer-events-none" />
                     ))}

                     {/* Sub-sectors placements */}
                     {(activeSector?.subSetores || []).map((sub:any) => {
                        if(!sub.posicao) return null;
                        const isPlacingThis = mode === 'place' && activeSubSectorId === sub.id;
                        const Icon = getSubSectorIcon(sub.nome);
                        
                        return (
                           <g 
                              key={sub.id} 
                              className={`cursor-move transition-opacity ${isDraggingSubSector && draggedSubSectorId !== sub.id ? 'opacity-40' : 'opacity-100'}`}
                              transform={`translate(${sub.posicao.x}, ${sub.posicao.y})`}
                              onMouseDown={(e) => handleSubSectorMouseDown(e, sub.id)}
                           >
                              <foreignObject x="-20" y="-20" width="40" height="40">
                                <div className={`w-full h-full rounded-full flex items-center justify-center border-2 border-white shadow-lg ${isPlacingThis ? 'bg-amber-500 scale-110 active:scale-95' : 'bg-emerald-500 hover:scale-105 active:scale-95'} transition-transform`}>
                                  <Icon size={20} className="text-white" />
                                </div>
                              </foreignObject>
                              <text x={0} y={34} fontSize={12} fontWeight="bold" fill="white" textAnchor="middle" filter="drop-shadow(0px 1px 2px rgb(0 0 0 / 0.8))" className="select-none">{sub.nome}</text>
                           </g>
                        )
                     })}
                  </>
               )}

             </svg>
           </div>
        </div>

      </div>

      {/* Footer removed, handled by ConfigModal */}
    </div>
  );
};
