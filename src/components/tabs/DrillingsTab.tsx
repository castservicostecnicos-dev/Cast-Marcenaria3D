/**
 * MarcenariaCAD Pro - CNC Drillings & Machining Schedule Tab
 * Summarizes all precision joinery operations: System 32, hinge cup 35mm, calços,
 * minifix 15mm/5mm, dowel 8mm, slides and shelf pins for CNC machining centers.
 */

import React, { useState } from 'react';
import { Piece, DrillingOperation, FurnitureModel } from '../../types/furniture';
import { Cpu, Filter, CheckCircle2, ShieldAlert, Sparkles, Layers, ShieldCheck, Check } from 'lucide-react';

interface DrillingsTabProps {
  pieces: Piece[];
  furniture?: FurnitureModel;
  onUpdateDrillingConfig?: (config: NonNullable<FurnitureModel['drillingConfig']>) => void;
  onSelectPiece: (piece: Piece) => void;
}

export const DrillingsTab: React.FC<DrillingsTabProps> = ({
  pieces,
  furniture,
  onUpdateDrillingConfig,
  onSelectPiece
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPieceCode, setFilterPieceCode] = useState<string>('all');

  const currentConfig = furniture?.drillingConfig || {
    connectorType: 'minifix_clean',
    shelfDrillingMode: 'exact_nominal',
    hingePlateMode: 'standard_2hole',
    slideDrillingMode: 'standard_2hole'
  };

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

  // Breakdown statistics
  const stats = React.useMemo(() => {
    let structural = 0;
    let hinges = 0;
    let slides = 0;
    let shelves = 0;
    let handles = 0;

    allOperations.forEach(item => {
      const t = item.drill.type;
      if (t === 'minifix_cam' || t === 'minifix_bolt' || t === 'dowel' || t === 'confirmat') structural++;
      else if (t === 'hinge_cup' || t === 'hinge_screw') hinges++;
      else if (t === 'slide_runner') slides++;
      else if (t === 'shelf_pin' || t === 'system32') shelves++;
      else if (t === 'handle_hole') handles++;
    });

    return { structural, hinges, slides, shelves, handles };
  }, [allOperations]);

  const filtered = allOperations.filter(item => {
    if (filterType !== 'all' && item.drill.type !== filterType) return false;
    if (filterPieceCode !== 'all' && item.piece.code !== filterPieceCode) return false;
    return true;
  });

  // Unique piece codes with drillings
  const piecesWithDrills = React.useMemo(() => {
    const map = new Map<string, string>();
    pieces.forEach(p => {
      if (p.drillings.length > 0) {
        map.set(p.code, `${p.code} (${p.name})`);
      }
    });
    return Array.from(map.entries());
  }, [pieces]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Precision Audit Banner */}
      <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-emerald-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              Motor de Furação CNC Otimizado (Norma Promob / Corte Cloud)
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                100% Preciso
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Furações geradas estritamente para as uniões, corrediças, dobradiças e prateleiras reais do projeto. Sem furos a mais que enfraqueçam o MDF ou estraguem as peças.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onUpdateDrillingConfig && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80 text-[11px]">
              <span className="text-slate-400 font-sans px-1">Padrão:</span>
              <button
                onClick={() => onUpdateDrillingConfig({
                  connectorType: 'minifix_clean',
                  shelfDrillingMode: 'exact_nominal',
                  hingePlateMode: 'standard_2hole',
                  slideDrillingMode: 'standard_2hole'
                })}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  currentConfig.connectorType === 'minifix_clean' && currentConfig.shelfDrillingMode === 'exact_nominal'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Minifix Limpo (10 furos)
              </button>
              <button
                onClick={() => onUpdateDrillingConfig({
                  ...currentConfig,
                  connectorType: 'confirmat'
                })}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  currentConfig.connectorType === 'confirmat'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Confirmat Soberba
              </button>
              <button
                onClick={() => onUpdateDrillingConfig({
                  ...currentConfig,
                  connectorType: 'screw'
                })}
                className={`px-2 py-0.5 rounded font-medium transition-all ${
                  currentConfig.connectorType === 'screw'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Chapa Virgem
              </button>
            </div>
          )}

          <div className="text-right shrink-0 font-mono text-xs text-slate-400">
            Total Furos: <span className="text-emerald-400 font-bold text-sm">{allOperations.length}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-5 gap-3 p-4 bg-slate-900/60 border-b border-slate-800 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px]">UNIÕES ESTRUTURAIS</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">{stats.structural}</span>
          <span className="text-[10px] text-slate-400 block">Minifix & Cavilhas</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px]">DOBRADIÇAS & CALÇOS</span>
          <span className="text-lg font-bold text-red-400 font-mono">{stats.hinges}</span>
          <span className="text-[10px] text-slate-400 block">Canecos Ø35mm + Calços</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px]">CORREDIÇAS DE GAVETA</span>
          <span className="text-lg font-bold text-cyan-400 font-mono">{stats.slides}</span>
          <span className="text-[10px] text-slate-400 block">Furações nas Laterais e Caixas</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px]">SUPORTES PRATELEIRAS</span>
          <span className="text-lg font-bold text-amber-400 font-mono">{stats.shelves}</span>
          <span className="text-[10px] text-slate-400 block">Pinos Ø5mm (Grupos controlados)</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px]">PUXADORES</span>
          <span className="text-lg font-bold text-purple-400 font-mono">{stats.handles}</span>
          <span className="text-[10px] text-slate-400 block">Passantes Ø4.5mm</span>
        </div>
      </div>

      {/* Header Bar / Filters */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Listagem de Usinagens</h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Todas as Operações ({allOperations.length})</option>
              <option value="minifix_cam">Minifix Tambor Ø15mm</option>
              <option value="minifix_bolt">Minifix Pino Ø5mm</option>
              <option value="dowel">Cavilha de Madeira Ø8mm</option>
              <option value="hinge_cup">Caneco Dobradiça Ø35mm</option>
              <option value="hinge_screw">Calço / Fixação Dobradiça</option>
              <option value="slide_runner">Fixação Corrediça</option>
              <option value="shelf_pin">Pino Suporte de Prateleira</option>
              <option value="handle_hole">Puxadores (Ø4.5mm)</option>
            </select>

            <select
              value={filterPieceCode}
              onChange={e => setFilterPieceCode(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Todas as Peças</option>
              {piecesWithDrills.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Exibindo: <span className="text-cyan-400 font-semibold">{filtered.length}</span> de {allOperations.length} operações
        </div>
      </div>

      {/* Operations Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-4">PEÇA (CÓDIGO)</th>
              <th className="py-2.5 px-4">OPERAÇÃO / DETALHE TÉCNICO</th>
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
                    <div>{d.name}</div>
                    {d.description && (
                      <div className="text-[10px] text-slate-400 font-normal">{d.description}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                      d.type === 'hinge_cup' ? 'bg-red-950 text-red-400 border border-red-800' :
                      d.type === 'minifix_cam' || d.type === 'minifix_bolt' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      d.type === 'dowel' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      d.type === 'slide_runner' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                      d.type === 'shelf_pin' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {d.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-white font-semibold">
                    Ø {d.diameter} mm
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {d.depth > 0 ? `${d.depth} mm` : 'Passante'} {d.isThrough ? '(passante)' : ''}
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
                      Inspecionar
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
