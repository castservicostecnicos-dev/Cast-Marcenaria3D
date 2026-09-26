/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * MarcenariaCAD Pro - Professional Parametric Joinery & Furniture CAD/CAM Platform
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Project, Piece, FurnitureModel } from './types/furniture';
import { BoardMaterial, EdgeTapeMaterial } from './types/materials';
import { QuotationConfig, QuotationResult } from './types/quotation';
import { CuttingOptimizationResult } from './types/cuttingPlan';

// Data & Defaults
import { DEFAULT_BOARD_MATERIALS, DEFAULT_EDGE_TAPES } from './data/defaultMaterials';
import { FURNITURE_TEMPLATES, FurnitureTemplate } from './data/templates';

// Engines & Services
import { recalculateFurnitureModel, createParametricFurniture } from './engine/parametricEngine';
import { optimizeCuttingPlan } from './engine/cuttingOptimizer';
import { calculateQuotation, DEFAULT_QUOTATION_CONFIG } from './engine/quotationEngine';
import { validateFabricationRules, FabricationDiagnostic } from './engine/ruleValidator';
import { generateCuttingListCSV } from './engine/cncExporter';
import { createInitialProject, saveProject, createNewProjectVersion } from './services/storage';
import { executeAICommandOnFurniture, InterpretedFurnitureProposal } from './services/geminiAI';

// Layout & Viewport Components
import { Header, ActiveTab } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { LeftSidebar } from './components/sidebar/LeftSidebar';
import { CADViewer3D } from './components/viewport/CADViewer3D';

// Inspectors & Tabs
import { FurnitureEditor } from './components/inspector/FurnitureEditor';
import { PieceInspector } from './components/inspector/PieceInspector';
import { CuttingPlanTab } from './components/tabs/CuttingPlanTab';
import { CuttingListTab } from './components/tabs/CuttingListTab';
import { DrillingsTab } from './components/tabs/DrillingsTab';
import { QuotationTab } from './components/tabs/QuotationTab';
import { ValidationTab } from './components/tabs/ValidationTab';

// Modals & Icons
import { AIModal } from './components/modals/AIModal';
import { ExportPackageModal } from './components/modals/ExportPackageModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { ArrowLeft, RotateCw, DoorOpen, Sparkles, Eye, Check } from 'lucide-react';

export default function App() {
  // Core Project State
  const [project, setProject] = useState<Project>(() => {
    const initial = createInitialProject();
    return {
      ...initial,
      furniture: recalculateFurnitureModel(initial.furniture)
    };
  });
  const [materials] = useState<BoardMaterial[]>(DEFAULT_BOARD_MATERIALS);
  const [edgeTapes] = useState<EdgeTapeMaterial[]>(DEFAULT_EDGE_TAPES);
  const [quotationConfig, setQuotationConfig] = useState<QuotationConfig>(DEFAULT_QUOTATION_CONFIG);

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<FurnitureModel[]>([]);
  const [redoStack, setRedoStack] = useState<FurnitureModel[]>([]);

  // Navigation & Selection
  const [activeTab, setActiveTab] = useState<ActiveTab>('3d');
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  // Presentation & Viewport Controls
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [previousTabBeforeView, setPreviousTabBeforeView] = useState<ActiveTab>('3d');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [renderMode, setRenderMode] = useState<'technical' | 'client'>('technical');
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [openProgress, setOpenProgress] = useState<number>(0); // 0.0 (closed) to 1.0 (fully open)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({}); // individual pieces toggled
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showDrillings, setShowDrillings] = useState<boolean>(true);

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Toast / Status Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to commit furniture model updates with Undo history
  const updateFurniture = useCallback((newModel: FurnitureModel, recordHistory = true) => {
    const recalculated = recalculateFurnitureModel(newModel);
    if (recordHistory) {
      setUndoStack(prev => [...prev.slice(-20), project.furniture]);
      setRedoStack([]);
    }
    setProject(prev => {
      const updated = {
        ...prev,
        furniture: recalculated,
        updatedAt: new Date().toISOString()
      };
      saveProject(updated);
      return updated;
    });
  }, [project.furniture]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, project.furniture]);
    updateFurniture(previous, false);
    showToast('Alteração desfeita.');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, project.furniture]);
    updateFurniture(next, false);
    showToast('Alteração refeita.');
  };

  // Slider change applies to all items and clears individual overrides
  const handleChangeOpenProgress = (val: number) => {
    setOpenProgress(val);
    setOpenItems({});
  };

  // Individual door or drawer opening toggle (by clicking in 3D scene)
  const handleToggleItemOpen = (itemId: string, type: 'door' | 'drawer') => {
    setOpenItems(prev => {
      const currentlyOpen = prev[itemId] !== undefined ? prev[itemId] : (openProgress > 0.3);
      const next = !currentlyOpen;
      showToast(type === 'door' ? (next ? 'Porta aberta' : 'Porta fechada') : (next ? 'Gaveta aberta' : 'Gaveta fechada'));
      return {
        ...prev,
        [itemId]: next
      };
    });
  };

  const handleResetOpen = () => {
    setOpenProgress(0);
    setOpenItems({});
    showToast('Todas as portas e gavetas fechadas.');
  };

  const handleOpenAll = () => {
    setOpenProgress(1.0);
    setOpenItems({});
    showToast('Todas as portas e gavetas abertas a 100%.');
  };

  // Toggle Presentation / Visualizar Projeto Mode with instant return memory
  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode(prev => {
      const next = !prev;
      if (next) {
        setPreviousTabBeforeView(activeTab);
        setActiveTab('3d');
        setRenderMode('client');
        setSelectedPieceId(null);
        showToast('Modo Visualização Ativado. Clique em "Voltar a Editar" ou pressione Esc para retornar.');
      } else {
        setAutoRotate(false);
        setActiveTab(previousTabBeforeView);
        showToast('Retornou para o modo de edição.');
      }
      return next;
    });
  }, [activeTab, previousTabBeforeView]);

  const handleReturnToEditor = useCallback(() => {
    setIsPresentationMode(false);
    setAutoRotate(false);
    setActiveTab(previousTabBeforeView);
    showToast('Retornou para o modo de edição.');
  }, [previousTabBeforeView]);

  // Keyboard shortcut listener (Esc to return to edit, V to toggle view)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Escape' && isPresentationMode) {
        setIsPresentationMode(false);
        setAutoRotate(false);
        showToast('Retornou para o modo de edição.');
      } else if ((e.key === 'v' || e.key === 'V') && !e.ctrlKey && !e.metaKey) {
        togglePresentationMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode, togglePresentationMode]);

  // Derived Calculations
  const cuttingResults: CuttingOptimizationResult[] = useMemo(() => {
    return optimizeCuttingPlan(project.furniture.pieces, materials);
  }, [project.furniture.pieces, materials]);

  const quotation: QuotationResult = useMemo(() => {
    return calculateQuotation(project.furniture, materials, edgeTapes, cuttingResults, quotationConfig);
  }, [project.furniture, materials, edgeTapes, cuttingResults, quotationConfig]);

  const diagnostics: FabricationDiagnostic[] = useMemo(() => {
    return validateFabricationRules(project.furniture, materials);
  }, [project.furniture, materials]);

  const criticalIssuesCount = useMemo(() => {
    return diagnostics.filter(d => d.severity === 'error' || d.severity === 'warning').length;
  }, [diagnostics]);

  // Material names for presentation summary
  const carcaseMatName = useMemo(() => {
    return materials.find(m => m.id === project.furniture.carcaseMaterialId)?.name || 'MDF Branco TX';
  }, [materials, project.furniture.carcaseMaterialId]);

  const frontMatName = useMemo(() => {
    return materials.find(m => m.id === project.furniture.frontMaterialId)?.name || 'MDF Louro Freijó';
  }, [materials, project.furniture.frontMaterialId]);

  // Currently selected piece object
  const selectedPiece = useMemo(() => {
    if (!selectedPieceId) return null;
    return project.furniture.pieces.find(p => p.id === selectedPieceId) || null;
  }, [selectedPieceId, project.furniture.pieces]);

  // Piece update handler
  const handleUpdatePiece = (updatedPiece: Piece) => {
    const updatedPieces = project.furniture.pieces.map(p =>
      p.id === updatedPiece.id ? updatedPiece : p
    );
    updateFurniture({
      ...project.furniture,
      pieces: updatedPieces
    });
  };

  // AI Generation Confirmation
  const handleGenerateFromAI = (proposal: InterpretedFurnitureProposal) => {
    const newModel = createParametricFurniture({
      name: proposal.name,
      type: proposal.type,
      width: proposal.width,
      height: proposal.height,
      depth: proposal.depth,
      modules: proposal.suggestedModules
    });

    setUndoStack(prev => [...prev, project.furniture]);
    setRedoStack([]);
    setProject(prev => ({
      ...prev,
      name: proposal.name,
      furniture: newModel
    }));
    setActiveTab('3d');
    showToast(`Móvel "${proposal.name}" gerado com sucesso pela IA!`);
  };

  // Conversational AI Commands
  const handleApplyAICommand = (cmd: string) => {
    const result = executeAICommandOnFurniture(cmd, project.furniture.width, project.furniture.height);
    if (result.success && result.modifiedInput) {
      const updated = {
        ...project.furniture,
        ...result.modifiedInput
      };
      updateFurniture(updated);
      showToast(result.message);
    } else {
      showToast(result.message);
    }
  };

  // Template Loader
  const handleLoadTemplate = (template: FurnitureTemplate) => {
    const newModel = template.create();
    setUndoStack(prev => [...prev, project.furniture]);
    setRedoStack([]);
    setProject(prev => ({
      ...prev,
      name: template.name,
      furniture: newModel
    }));
    setActiveTab('3d');
    showToast(`Modelo "${template.name}" carregado.`);
  };

  // Export CSV shortcut
  const handleExportCSVDirect = () => {
    const map: Record<string, string> = {};
    materials.forEach(m => { map[m.id] = m.name; });
    const csv = generateCuttingListCSV(project.furniture.pieces, map);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_Lista_Corte.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Lista de corte CSV gerada!');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Contract (supports regular and presentation modes) */}
      <Header
        projectName={project.name}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenProjectSettings={() => setIsProjectModalOpen(true)}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        validationIssuesCount={criticalIssuesCount}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={togglePresentationMode}
        openProgress={openProgress}
        onChangeOpenProgress={handleChangeOpenProgress}
        onResetOpen={handleResetOpen}
        onOpenAll={handleOpenAll}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(prev => !prev)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Hidden in Presentation Mode for 100% immersion) */}
        {!isPresentationMode && (
          <LeftSidebar
            furniture={project.furniture}
            materials={materials}
            selectedPieceId={selectedPieceId}
            onSelectPiece={p => {
              setSelectedPieceId(p.id);
              if (activeTab !== '3d') setActiveTab('3d');
            }}
            onLoadTemplate={handleLoadTemplate}
            onApplyAICommand={handleApplyAICommand}
          />
        )}

        {/* Center Main Stage */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeTab === '3d' && (
            <div className="w-full h-full relative">
              <CADViewer3D
                furniture={project.furniture}
                materials={materials}
                edgeTapes={edgeTapes}
                selectedPieceId={selectedPieceId}
                onSelectPiece={piece => setSelectedPieceId(piece ? piece.id : null)}
                renderMode={isPresentationMode ? 'client' : renderMode}
                explodedProgress={explodedProgress}
                openProgress={openProgress}
                openItems={openItems}
                onToggleItemOpen={handleToggleItemOpen}
                showDimensions={showDimensions && !isPresentationMode}
                showDrillings={showDrillings && !isPresentationMode}
                autoRotate={autoRotate}
                isPresentationMode={isPresentationMode}
              />

              {/* Floating Presentation HUD & Instant Return Button when in Visualizar Projeto mode */}
              {isPresentationMode && (
                <>
                  {/* Top-Left Prominent Quick Return Button */}
                  <div className="absolute top-4 left-4 z-20">
                    <button
                      onClick={togglePresentationMode}
                      className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-2xl active:scale-95 group border border-amber-300"
                      title="Voltar instantaneamente para a tela de edição do projeto (Atalho: Esc)"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      <span>Voltar a Editar Projeto</span>
                      <kbd className="px-1.5 py-0.5 bg-amber-600/30 text-slate-950 rounded text-[10px] font-mono ml-0.5">
                        Esc
                      </kbd>
                    </button>
                  </div>

                  {/* Top-Right Quick Presentation Controls with Smooth Slider */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-2xl text-xs">
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
                        onChange={e => handleChangeOpenProgress(parseFloat(e.target.value))}
                        className="w-28 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        title="Deslize para abrir ou fechar as portas e gavetas (ou clique direto nelas)"
                      />
                      <span className="font-mono text-[11px] text-slate-300 w-8 text-center">
                        {Math.round(openProgress * 100)}%
                      </span>
                      {openProgress > 0 ? (
                        <button
                          onClick={handleResetOpen}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Fechar
                        </button>
                      ) : (
                        <button
                          onClick={handleOpenAll}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          Abrir 100%
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setAutoRotate(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border shadow-2xl backdrop-blur-md ${
                        autoRotate
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                          : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
                      <span>Giro 360° {autoRotate ? 'Ativo' : 'Pausado'}</span>
                    </button>
                  </div>

                  {/* Bottom-Left Minimalist Project Presentation Card */}
                  <div className="absolute bottom-6 left-6 z-20 max-w-sm p-4 bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl space-y-2 pointer-events-auto select-none">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        Apresentação do Projeto
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {project.room.name}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cliente: <span className="text-slate-200">{project.client.name}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">DIMENSÕES TÉCNICAS</span>
                        <span className="font-mono text-white text-xs font-semibold">
                          {project.furniture.width} x {project.furniture.height} x {project.furniture.depth} mm
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">VALOR ESTIMADO</span>
                        <span className="font-mono text-emerald-400 text-xs font-bold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quotation.finalSellingPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                      <span>Acabamento: {frontMatName}</span>
                      <span className="text-slate-500">Caixa: {carcaseMatName}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'cutting_plan' && (
            <div className="w-full h-full">
              <CuttingPlanTab
                optimizationResults={cuttingResults}
                materials={materials}
                onSelectPiece={piece => {
                  setSelectedPieceId(piece.id);
                  setActiveTab('3d');
                }}
              />
            </div>
          )}

          {activeTab === 'cutting_list' && (
            <div className="w-full h-full">
              <CuttingListTab
                pieces={project.furniture.pieces}
                materials={materials}
                onSelectPiece={piece => {
                  setSelectedPieceId(piece.id);
                  setActiveTab('3d');
                }}
                onExportCSV={handleExportCSVDirect}
              />
            </div>
          )}

          {activeTab === 'drillings' && (
            <div className="w-full h-full">
              <DrillingsTab
                pieces={project.furniture.pieces}
                onSelectPiece={piece => {
                  setSelectedPieceId(piece.id);
                  setActiveTab('3d');
                }}
              />
            </div>
          )}

          {activeTab === 'quotation' && (
            <div className="w-full h-full">
              <QuotationTab
                quotation={quotation}
                config={quotationConfig}
                onUpdateConfig={setQuotationConfig}
              />
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="w-full h-full">
              <ValidationTab
                diagnostics={diagnostics}
                onSelectPieceById={id => {
                  setSelectedPieceId(id);
                  setActiveTab('3d');
                }}
              />
            </div>
          )}
        </main>

        {/* Right Inspector Panel (Hidden in Presentation Mode) */}
        {activeTab === '3d' && !isPresentationMode && (
          <aside className="w-88 shrink-0 h-full overflow-hidden z-10">
            {selectedPiece ? (
              <PieceInspector
                piece={selectedPiece}
                materials={materials}
                edgeTapes={edgeTapes}
                onClose={() => setSelectedPieceId(null)}
                onUpdatePiece={handleUpdatePiece}
              />
            ) : (
              <FurnitureEditor
                furniture={project.furniture}
                materials={materials}
                edgeTapes={edgeTapes}
                onChange={updateFurniture}
                selectedPieceId={selectedPieceId}
                onSelectPiece={piece => setSelectedPieceId(piece ? piece.id : null)}
              />
            )}
          </aside>
        )}
      </div>

      {/* Bottom Technical Status Bar (Hidden in Presentation Mode for maximum clean space) */}
      {!isPresentationMode && (
        <StatusBar
          furniture={project.furniture}
          renderMode={renderMode}
          onToggleRenderMode={() => setRenderMode(prev => prev === 'technical' ? 'client' : 'technical')}
          explodedProgress={explodedProgress}
          onChangeExploded={setExplodedProgress}
          openProgress={openProgress}
          onChangeOpenProgress={handleChangeOpenProgress}
          onResetOpen={handleResetOpen}
          onOpenAll={handleOpenAll}
          showDrillings={showDrillings}
          onToggleDrillings={() => setShowDrillings(prev => !prev)}
          activeTab={activeTab}
        />
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-slate-700 text-white rounded-xl shadow-2xl text-xs font-medium animate-fade-in flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleGenerateFromAI}
      />

      <ExportPackageModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        materials={materials}
        cuttingResults={cuttingResults}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={project}
        onSave={updated => {
          setProject(prev => ({ ...prev, ...updated }));
          showToast('Configurações do projeto salvas.');
        }}
      />

      <ProjectModal
        isOpen={isNewProjectModalOpen}
        isNew={true}
        onClose={() => setIsNewProjectModalOpen(false)}
        project={project}
        onSave={(updated, templateId) => {
          const tmpl = FURNITURE_TEMPLATES.find(t => t.id === templateId) || FURNITURE_TEMPLATES[0];
          const initialFurn = tmpl.create();
          const newProj: Project = {
            id: `proj_${Date.now()}`,
            name: updated.name || 'Novo Projeto Planejado',
            client: updated.client || project.client,
            room: updated.room || project.room,
            furniture: initialFurn,
            versions: [{
              id: `ver_${Date.now()}_1`,
              versionNumber: 1,
              timestamp: new Date().toISOString(),
              description: 'Versão inicial criada',
              snapshot: initialFurn
            }],
            currentVersionIndex: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setProject(newProj);
          setUndoStack([]);
          setRedoStack([]);
          showToast(`Projeto "${newProj.name}" iniciado.`);
        }}
      />
    </div>
  );
}
