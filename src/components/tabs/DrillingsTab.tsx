/**
 * MarcenariaCAD Pro - CNC Drillings & Machining Schedule Tab
 * Summarizes all System 32, hinge cup 35mm, minifix cam 15mm, dowel 8mm
 * and groove operations for workshop and CNC machining center.
 */

import React, { useState } from 'react';
import { Piece, DrillingOperation } from '../../types/furniture';
import { Wrench, Compass, Cpu, Filter, Eye } from 'lucide-react';

interface DrillingsTabProps {
  pieces: Piece[];
  onSelectPiece: (piece: Piece) => void;
}

export const DrillingsTab: React.FC<DrillingsTabProps> = ({ pieces, onSelectPiece }) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Flatten all drillings with piece reference
  const allOperations = React.useMemo(() => {
    const list: Array<{ piece: Piece; drill: DrillingOperation }> = [];
    pieces.forEach(p => {
      p.drillings.forEach(d => {
        list.push({ piece: p, drill: d });
      });
    });
    return list;
  }, [pieces]);

  const filtered = allOperations.filter(item => {
    if (filterType === 'all') return true;
    return item.drill.type === filterType;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Mapa de Furação & Usinagens CNC</h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Todas as Operações ({allOperations.length})</option>
              <option value="hinge_cup">Caneco Dobradiça Ø35mm</option>
              <option value="minifix_cam">Minifix Tambor Ø15mm</option>
              <option value="dowel">Cavilha de Madeira Ø8mm</option>
              <option value="system32">Linha Sistema 32 (Ø5mm)</option>
              <option value="handle_hole">Puxadores (Ø4.5mm)</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total de Operações: <span className="text-cyan-400 font-semibold">{allOperations.length} furos</span>
        </div>
      </div>

      {/* Operations Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-4">PEÇA (CÓDIGO)</th>
              <th className="py-2.5 px-4">OPERAÇÃO / FERRAMENTA</th>
              <th className="py-2.5 px-4">TIPO</th>
              <th className="py-2.5 px-4">DIÂMETRO</th>
              <th className="py-2.5 px-4">PROFUNDIDADE</th>
              <th className="py-2.5 px-4">COORDENADAS (X / Y)</th>
              <th className="py-2.5 px-4">FACE</th>
              <th className="py-2.5 px-4 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-mono">
            {filtered.map((item, idx) => {
              const d = item.drill;
              const p = item.piece;

              return (
                <tr
                  key={idx}
                  className="hover:bg-slate-900/50 transition-colors cursor-pointer"
                  onClick={() => onSelectPiece(p)}
                >
                  <td className="py-2.5 px-4 font-semibold text-amber-400">
                    {p.code} <span className="font-sans text-slate-400 text-xs font-normal">({p.name})</span>
                  </td>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                    {d.name}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                      d.type === 'hinge_cup' ? 'bg-red-950 text-red-400 border border-red-800' :
                      d.type === 'minifix_cam' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      d.type === 'dowel' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-cyan-950 text-cyan-400 border border-cyan-800'
                    }`}>
                      {d.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-white font-semibold">
                    Ø {d.diameter} mm
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {d.depth} mm {d.isThrough ? '(passante)' : '(cego)'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">
                    X: {d.x} mm · Y: {d.y} mm
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 uppercase">
                    {d.face}
                  </td>
                  <td className="py-2.5 px-4 text-right font-sans">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectPiece(p);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                    >
                      Ver Peça
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
