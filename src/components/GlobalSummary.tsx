import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, ChevronUp, ChevronRight, PieChart } from 'lucide-react';
import { useAppConfig } from '../lib/AppContext';

export function GlobalSummary() {
  const { config } = useAppConfig();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col w-[306px]"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="text-white fill-white/20" size={16} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Painel Resumo</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1 rounded-md"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            
            <div className="p-3 flex flex-col gap-2">
              {[1, 2, 3].map(tId => {
                const tData = config?.turnos?.find(t => t.turnoId === tId);
                const hcArray = tData?.hc || [];
                const totalOpe = hcArray.reduce((acc, curr) => acc + curr.operador, 0);
                const totalAux = hcArray.reduce((acc, curr) => acc + curr.auxiliar, 0);
                const totalTurno = totalOpe + totalAux;

                return (
                  <div key={tId} className="flex justify-between items-center bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shadow-sm">
                       {tId}T
                    </div>
                    <div className="flex gap-2 items-center">
                       <div className="flex flex-col items-center w-8">
                          <span className="text-[9px] font-bold text-amber-600 tracking-wider">AUX</span>
                          <span className="text-sm font-black text-amber-900">{totalAux.toString().padStart(2, '0')}</span>
                       </div>
                       <div className="flex flex-col items-center w-8">
                          <span className="text-[9px] font-bold text-emerald-600 tracking-wider">OPE</span>
                          <span className="text-sm font-black text-emerald-900">{totalOpe.toString().padStart(2, '0')}</span>
                       </div>
                       
                       <div className="h-7 w-px bg-blue-200/60 mx-1"></div>
                       
                       <div className="flex flex-col items-center w-10">
                          <span className="text-[9px] font-bold text-slate-500 tracking-wider">TOTAL</span>
                          <span className="text-sm font-black text-slate-900">{totalTurno.toString().padStart(2, '0')}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              let totalAuxAll = 0;
              let totalOpeAll = 0;
              
              (config?.turnos || []).forEach(t => {
                const hcArray = t.hc || [];
                totalOpeAll += hcArray.reduce((sum, curr) => sum + curr.operador, 0);
                totalAuxAll += hcArray.reduce((sum, curr) => sum + curr.auxiliar, 0);
              });
              
              const totalContrato = totalAuxAll + totalOpeAll;

              return (
                <div className="bg-slate-800 border-t border-slate-700 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">Total Contrato</span>
                    <span className="text-xl leading-none font-black text-white">{totalContrato.toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 rounded-xl px-2 py-2 border border-slate-700/50">
                     <div className="flex flex-col items-center flex-1">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">AUX</span>
                        <span className="text-sm font-black text-amber-500">{totalAuxAll.toString().padStart(2, '0')}</span>
                     </div>
                     <div className="h-6 w-px bg-slate-700/50 mx-1"></div>
                     <div className="flex flex-col items-center flex-1">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">OPE</span>
                        <span className="text-sm font-black text-emerald-500">{totalOpeAll.toString().padStart(2, '0')}</span>
                     </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg px-4 py-2 rounded-full flex items-center gap-2 hover:shadow-xl hover:scale-105 transition-all"
          >
            <PieChart size={18} className="fill-white/20" />
            <span className="text-xs font-bold tracking-wide uppercase">Resumo HC</span>
            <ChevronUp size={16} className="ml-1 opacity-70" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
