/**
 * MarcenariaCAD Pro - Professional Desktop Top Bar Contract
 * One-row, 3-zone layout with brand title, primary mode navigation tabs,
 * and high-intent actions (Visualization mode, AI description, and manufacturing export).
 */

import React from 'react';
import {
  Sparkles,
  Package,
  Layers,
  Undo2,
  Redo2,
  FolderOpen,
  Scissors,
  DollarSign,
  ShieldCheck,
  Cpu,
  Box,
  Eye,
  ArrowLeft,
  RotateCw,
  DoorOpen
} from 'lucide-react';

export type ActiveTab = '3d' | 'cutting_list' | 'cutting_plan' | 'drillings' | 'quotation' | 'validation';

interface HeaderProps {
  projectName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAIModal: () => void;
  onOpenExportModal: () => void;
  onOpenProjectSettings: () => void;
  onNewProject: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  validationIssuesCount: number;
  isPresentationMode: boolean;
  onTogglePresentationMode: () => void;
  openProgress?: number;
  onChangeOpenProgress?: (val: number) => void;
  onResetOpen?: () => void;
  onOpenAll?: () => void;
  autoRotate?: boolean;
  onToggleAutoRotate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  activeTab,
  onTabChange,
  onOpenAIModal,
  onOpenExportModal,
  onOpenProjectSettings,
  onNewProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  validationIssuesCount,
  isPresentationMode,
  onTogglePresentationMode,
  openProgress = 0,
  onChangeOpenProgress,
  onResetOpen,
  onOpenAll,
  autoRotate = false,
  onToggleAutoRotate
}) => {
  // If in Presentation / Visualizar Projeto Mode: render streamlined presentation top bar
  if (isPresentationMode) {
    return (
      <header className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-5 select-none shrink-0 z-30 transition-all">
        {/* Zone 1: Direct Return to Edit Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePresentationMode}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md active:scale-95 group"
            title="Voltar para a tela de edição do projeto (Atalho: Esc)"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar a Editar</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-amber-600/30 text-slate-950 rounded text-[10px] font-mono">
              Esc
            </kbd>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <span className="text-sm font-semibold text-white truncate max-w-[280px] block">
              {projectName}
            </span>
            <span className="text-[10px] text-amber-400 font-medium">
              Modo Visualização do Cliente
            </span>
          </div>
        </div>

        {/* Zone 2: Presentation Interactive Sliding Controls */}
        <div className="flex items-center gap-4">
          {onChangeOpenProgress && (
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
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
                className="w-28 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                title="Deslize para abrir ou fechar as portas e gavetas (ou clique direto nelas)"
              />
              <span className="font-mono text-[11px] text-slate-300 w-8 text-center">
                {Math.round(openProgress * 100)}%
              </span>
              {openProgress > 0 ? (
                <button
                  onClick={onResetOpen}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Fechar
                </button>
              ) : (
                <button
                  onClick={onOpenAll}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Abrir 100%
                </button>
              )}
            </div>
          )}

          {onToggleAutoRotate && (
            <button
              onClick={onToggleAutoRotate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                autoRotate
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
              <span>Giro 360° {autoRotate ? 'Ativo' : 'Pausado'}</span>
            </button>
          )}
        </div>

        {/* Zone 3: Export or Finish */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition-colors border border-slate-700"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Pacote Fabricação</span>
          </button>
        </div>
      </header>
    );
  }

  // Normal Editing Top Bar
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5 select-none shrink-0 z-20">
      {/* Zone 1: Brand Wordmark & Project Name Trigger */}
      <div className="flex items-center gap-4">
        <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-amber-400 font-mono">■</span> MarcenariaCAD Pro
        </span>

        <div className="h-4 w-px bg-slate-800 hidden md:block" />

        <button
          onClick={onOpenProjectSettings}
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-950/70 hover:bg-slate-800 border border-slate-800 transition-colors truncate max-w-[200px]"
          title="Clique para editar dados do projeto e cliente"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium">{projectName}</span>
        </button>

        {/* Undo / Redo controls */}
        <div className="flex items-center gap-0.5 ml-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Desfazer alteração"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Refazer alteração"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Zone 2: Navigation Tabs & Fast Return to Editor if on another tab */}
      <div className="flex items-center gap-2">
        {activeTab !== '3d' && (
          <button
            onClick={() => onTabChange('3d')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors mr-1"
            title="Voltar imediatamente para o editor de móveis 3D"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Editor</span>
          </button>
        )}

        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onTabChange('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === '3d'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Editor 3D
          </button>

          <button
            onClick={() => onTabChange('cutting_list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'cutting_list'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Lista de Corte
          </button>

          <button
            onClick={() => onTabChange('cutting_plan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'cutting_plan'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Plano de Corte 2D
          </button>

          <button
            onClick={() => onTabChange('drillings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'drillings'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Furações CNC
          </button>

          <button
            onClick={() => onTabChange('quotation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'quotation'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Orçamento
          </button>

          <button
            onClick={() => onTabChange('validation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'validation'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Auditoria
            {validationIssuesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono flex items-center justify-center font-bold">
                {validationIssuesCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Zone 3: Primary Actions (Visualizar Projeto, Descrever com IA & Pacote Fabricação) */}
      <div className="flex items-center gap-2.5">
        {/* Prominent Visualizar Projeto Button */}
        <button
          onClick={onTogglePresentationMode}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md active:scale-95 border border-emerald-400/30 ring-1 ring-emerald-500/20"
          title="Visualizar o projeto em modo apresentação 3D realista para clientes (Atalho: V)"
        >
          <Eye className="w-4 h-4 text-emerald-200" />
          <span className="whitespace-nowrap font-bold">Visualizar Projeto</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.2 bg-emerald-800/60 text-emerald-100 rounded text-[9px] font-mono border border-emerald-400/20">
            V
          </kbd>
        </button>

        <button
          onClick={onNewProject}
          className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors hidden xl:block"
        >
          Novo
        </button>

        <button
          onClick={onOpenAIModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-all shadow-md active:scale-95"
          title="Descrever móvel por comando de voz ou texto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Descrever com IA</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition-colors border border-slate-700"
          title="Exportar pacote completo para marcenaria (PDF, DXF, G-Code, CSV)"
        >
          <Package className="w-3.5 h-3.5 text-amber-400" />
          <span className="whitespace-nowrap">Pacote Fabricação</span>
        </button>
      </div>
    </header>
  );
};
