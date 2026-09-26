/**
 * MarcenariaCAD Pro - Technical Status & 3D Control Bar
 * Displays live dimensions, piece counts, materials summary,
 * smooth sliding door/drawer opening slider (0-100%), exploded view, and viewport modes.
 */

import React from 'react';
import { FurnitureModel } from '../../types/furniture';
import { Wrench, Sparkles, Sliders, DoorOpen } from 'lucide-react';

interface StatusBarProps {
  furniture: FurnitureModel;
  renderMode: 'technical' | 'client';
  onToggleRenderMode: () => void;
  explodedProgress: number;
  onChangeExploded: (val: number) => void;
  openProgress: number;
  onChangeOpenProgress: (val: number) => void;
  onResetOpen: () => void;
  onOpenAll: () => void;
  showDrillings: boolean;
  onToggleDrillings: () => void;
  activeTab: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  furniture,
  renderMode,
  onToggleRenderMode,
  explodedProgress,
  onChangeExploded,
  openProgress,
  onChangeOpenProgress,
  onResetOpen,
  onOpenAll,
  showDrillings,
  onToggleDrillings,
  activeTab
}) => {
  return (
    <footer className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-5 select-none shrink-0 z-20 text-xs text-slate-400 font-mono">
      {/* Left: Overall Dimensions & Piece Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="text-[10px] text-slate-500 uppercase font-sans">DIMENSÕES:</span>
          <span className="text-white font-semibold">{furniture.width}</span>
          <span className="text-slate-500">x</span>
          <span className="text-white font-semibold">{furniture.height}</span>
          <span className="text-slate-500">x</span>
          <span className="text-white font-semibold">{furniture.depth}</span>
          <span className="text-[11px] text-slate-500">mm</span>
        </div>

        <span className="text-slate-700">·</span>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans">PEÇAS: </span>
          <span className="text-amber-400 font-semibold">{furniture.pieces.length}</span>
        </div>

        <span className="text-slate-700">·</span>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans">MÓDULOS: </span>
          <span className="text-slate-300">{furniture.modules.length}</span>
        </div>

        <span className="text-slate-700">·</span>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-sans">FERRAGENS: </span>
          <span className="text-slate-300">
            {furniture.hardware.reduce((acc, h) => acc + h.quantity, 0)} un
          </span>
        </div>
      </div>

      {/* Right: 3D Viewport Controls (active on 3D view) */}
      {activeTab === '3d' && (
        <div className="flex items-center gap-4 font-sans text-xs">
          {/* Smooth Doors & Drawers Opening Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
              Abertura:
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={openProgress}
              onChange={e => onChangeOpenProgress(parseFloat(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              title="Deslize para abrir ou fechar gradualmente todas as portas e gavetas"
            />
            <span className="font-mono text-[10px] text-slate-300 w-7">
              {Math.round(openProgress * 100)}%
            </span>
            {openProgress > 0 ? (
              <button
                onClick={onResetOpen}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Fechar todas as portas e gavetas"
              >
                Fechar Tudo
              </button>
            ) : (
              <button
                onClick={onOpenAll}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Abrir 100% de portas e gavetas"
              >
                Abrir Tudo
              </button>
            )}
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Exploded View Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Vista Explodida:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={explodedProgress}
              onChange={e => onChangeExploded(parseFloat(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              title="Deslize para afastar as peças do móvel"
            />
            <span className="font-mono text-[10px] text-slate-400 w-7">
              {Math.round(explodedProgress * 100)}%
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          {/* Drillings visibility in 3D */}
          <button
            onClick={onToggleDrillings}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              showDrillings
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Furações 3D
          </button>

          {/* Client vs Technical Mode Toggle */}
          <button
            onClick={onToggleRenderMode}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-[11px]"
            title="Alternar entre modo técnico com cotas e furações e modo cliente com acabamentos realistas"
          >
            {renderMode === 'technical' ? (
              <>
                <Wrench className="w-3 h-3 text-cyan-400" />
                Modo Técnico
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-amber-400" />
                Modo Cliente
              </>
            )}
          </button>
        </div>
      )}
    </footer>
  );
};
