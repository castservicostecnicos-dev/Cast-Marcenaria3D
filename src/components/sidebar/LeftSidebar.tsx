/**
 * MarcenariaCAD Pro - Left Sidebar
 * Tabbed navigation for Component Library/Templates, Pieces Tree,
 * Materials Catalog, Hardware Schedule, and AI Quick Commands.
 */

import React, { useState } from 'react';
import { FurnitureModel, Piece } from '../../types/furniture';
import { BoardMaterial } from '../../types/materials';
import { FURNITURE_TEMPLATES, FurnitureTemplate } from '../../data/templates';
import { DEFAULT_HARDWARE_CATALOG } from '../../data/defaultHardware';
import {
  Library,
  Layers,
  Palette,
  Wrench,
  Sparkles,
  ChevronRight,
  Send,
  Check
} from 'lucide-react';

interface LeftSidebarProps {
  furniture: FurnitureModel;
  materials: BoardMaterial[];
  selectedPieceId?: string | null;
  onSelectPiece: (piece: Piece) => void;
  onLoadTemplate: (template: FurnitureTemplate) => void;
  onApplyAICommand: (command: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  furniture,
  materials,
  selectedPieceId,
  onSelectPiece,
  onLoadTemplate,
  onApplyAICommand
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'pieces' | 'materials' | 'hardware' | 'ai_chat'>('library');
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onApplyAICommand(chatInput);
    setChatInput('');
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0 z-10">
      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-[11px]">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'library' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Biblioteca de Templates"
        >
          <Library className="w-3.5 h-3.5" />
          Modelos
        </button>
        <button
          onClick={() => setActiveTab('pieces')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'pieces' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Árvore de Peças"
        >
          <Layers className="w-3.5 h-3.5" />
          Peças ({furniture.pieces.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'materials' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Catálogo de Materiais"
        >
          <Palette className="w-3.5 h-3.5" />
          Chapas
        </button>
        <button
          onClick={() => setActiveTab('ai_chat')}
          className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'ai_chat' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Comandos por IA"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          IA
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* 1. LIBRARY OF TEMPLATES */}
        {activeTab === 'library' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>TEMPLATES PARAMÉTRICOS</span>
              <span>{FURNITURE_TEMPLATES.length} itens</span>
            </div>
            {FURNITURE_TEMPLATES.map(tmpl => (
              <div
                key={tmpl.id}
                onClick={() => onLoadTemplate(tmpl)}
                className="p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                    {tmpl.name}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {tmpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                  {tmpl.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{tmpl.dimensions.width} x {tmpl.dimensions.height} x {tmpl.dimensions.depth} mm</span>
                  <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Carregar <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. PIECES TREE */}
        {activeTab === 'pieces' && (
          <div className="space-y-1.5">
            <div className="text-slate-400 text-[11px] mb-2 flex items-center justify-between">
              <span>PEÇAS ESTRUTURAIS ({furniture.pieces.length})</span>
              <span className="text-amber-400 font-mono">Clique para inspecionar</span>
            </div>
            {furniture.pieces.map(piece => {
              const isSelected = piece.id === selectedPieceId;
              return (
                <div
                  key={piece.id}
                  onClick={() => onSelectPiece(piece)}
                  className={`p-2.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-amber-400 font-semibold">{piece.code}</span>
                      <span className="font-medium text-xs truncate max-w-[150px]">{piece.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {piece.length} x {piece.width} x {piece.thickness} mm
                    </span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* 3. MATERIALS CATALOG */}
        {activeTab === 'materials' && (
          <div className="space-y-2.5">
            <span className="text-slate-400 text-[11px] block mb-2">CATÁLOGO DE CHAPAS MDF/MDP</span>
            {materials.map(m => (
              <div
                key={m.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg shrink-0 border border-slate-700 shadow-inner"
                  style={{ backgroundColor: m.colorHex }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white">{m.name}</h5>
                    <span className="font-mono text-emerald-400 text-[11px]">
                      R$ {m.pricePerSheet.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {m.manufacturer} · {m.finish} · {m.sheetWidth}x{m.sheetLength}mm
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. AI QUICK COMMANDS ASSISTANT */}
        {activeTab === 'ai_chat' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-slate-300">
              <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Assistente de Comandos Paramétricos
              </span>
              Digite alterações em linguagem natural para o modelo recalcular as peças instantaneamente.
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Exemplos de Comandos:
              </span>
              {[
                'Altere a largura para 2600 mm',
                'Altere a altura para 2400 mm',
                'Troque todas as portas para MDF Carvalho',
                'Troque todas as frentes para MDF Grafite',
                'Coloque fita de borda em todas as bordas frontais'
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => onApplyAICommand(cmd)}
                  className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  "{cmd}"
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="mt-auto pt-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus-within:border-amber-500">
                <input
                  type="text"
                  placeholder="Ex: Altere a largura para 2600 mm..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="w-full bg-transparent px-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                  title="Executar comando"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
};
