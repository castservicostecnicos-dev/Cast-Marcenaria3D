/**
 * MarcenariaCAD Pro - Parametric Furniture Property & Edge Banding Editor
 * Allows live modification of overall dimensions, materials, module counts,
 * doors, drawers and internal shelves, as well as face-by-face edge banding configuration
 * with real-time 3D color visualization.
 */

import React, { useState, useMemo } from 'react';
import { FurnitureModel, ModuleStructure, Piece, PieceType } from '../../types/furniture';
import { BoardMaterial, EdgeTapeMaterial } from '../../types/materials';
import {
  Sliders,
  Layers,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Scissors,
  Copy,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';

interface FurnitureEditorProps {
  furniture: FurnitureModel;
  materials: BoardMaterial[];
  edgeTapes: EdgeTapeMaterial[];
  onChange: (updated: FurnitureModel) => void;
  selectedPieceId?: string | null;
  onSelectPiece?: (piece: Piece | null) => void;
}

export const FurnitureEditor: React.FC<FurnitureEditorProps> = ({
  furniture,
  materials,
  edgeTapes,
  onChange,
  selectedPieceId,
  onSelectPiece
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'params' | 'edge_banding'>('params');
  const [pieceFilterCategory, setPieceFilterCategory] = useState<string>('all');
  const [activePieceId, setActivePieceId] = useState<string>(() => {
    return selectedPieceId || furniture.pieces[0]?.id || '';
  });

  // Keep activePieceId in sync if selectedPieceId changes from external click
  React.useEffect(() => {
    if (selectedPieceId) {
      setActivePieceId(selectedPieceId);
    }
  }, [selectedPieceId]);

  // Dimensions & parameters handlers
  const handleDimensionChange = (key: 'width' | 'height' | 'depth' | 'plinthHeight', value: number) => {
    if (isNaN(value) || value <= 0) return;
    onChange({
      ...furniture,
      [key]: value
    });
  };

  const handleMaterialChange = (key: 'carcaseMaterialId' | 'frontMaterialId' | 'backMaterialId' | 'edgeTapeId', value: string) => {
    onChange({
      ...furniture,
      [key]: value
    });
  };

  const handleUpdateModule = (modIndex: number, partial: Partial<ModuleStructure>) => {
    const updatedModules = [...furniture.modules];
    updatedModules[modIndex] = {
      ...updatedModules[modIndex],
      ...partial
    };
    onChange({
      ...furniture,
      modules: updatedModules
    });
  };

  const handleAddModule = () => {
    const newIdx = furniture.modules.length + 1;
    const newMod: ModuleStructure = {
      id: `mod_${Date.now()}`,
      name: `Módulo ${newIdx}`,
      width: 600,
      height: furniture.height - furniture.plinthHeight - 36,
      depth: furniture.depth,
      offsetX: 0,
      numShelves: 1,
      shelfType: 'adjustable',
      numDrawers: 0,
      drawerType: 'external',
      doorsType: 'single_left',
      hasBackPanel: true,
      hasPlinth: furniture.plinthHeight > 0
    };
    onChange({
      ...furniture,
      modules: [...furniture.modules, newMod]
    });
  };

  const handleRemoveModule = (modIndex: number) => {
    if (furniture.modules.length <= 1) return;
    const updated = furniture.modules.filter((_, i) => i !== modIndex);
    onChange({
      ...furniture,
      modules: updated
    });
  };

  // -------------------------------------------------------------
  // EDGE BANDING CONFIGURATION HANDLERS
  // -------------------------------------------------------------

  // Toggle single face of a piece
  const handleTogglePieceFace = (pieceId: string, face: 'top' | 'bottom' | 'left' | 'right') => {
    const updatedPieces = furniture.pieces.map(p => {
      if (p.id !== pieceId) return p;
      return {
        ...p,
        edgeBanding: {
          ...p.edgeBanding,
          [face]: !p.edgeBanding[face]
        }
      };
    });
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Change applied tape material for a specific piece
  const handleSetPieceTapeMaterial = (pieceId: string, tapeId: string) => {
    const tape = edgeTapes.find(t => t.id === tapeId);
    const updatedPieces = furniture.pieces.map(p => {
      if (p.id !== pieceId) return p;
      return {
        ...p,
        edgeBanding: {
          ...p.edgeBanding,
          tapeMaterialId: tapeId,
          tapeThickness: tape ? tape.thickness : p.edgeBanding.tapeThickness
        }
      };
    });
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Change tape thickness for a piece
  const handleSetPieceTapeThickness = (pieceId: string, thickness: number) => {
    const updatedPieces = furniture.pieces.map(p => {
      if (p.id !== pieceId) return p;
      return {
        ...p,
        edgeBanding: {
          ...p.edgeBanding,
          tapeThickness: thickness
        }
      };
    });
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Set all 4 edges for a specific piece
  const handleSetAllEdgesForPiece = (pieceId: string, state: boolean) => {
    const updatedPieces = furniture.pieces.map(p => {
      if (p.id !== pieceId) return p;
      return {
        ...p,
        edgeBanding: {
          ...p.edgeBanding,
          top: state,
          bottom: state,
          left: state,
          right: state
        }
      };
    });
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Set front edge only for a specific piece (marcenaria padrão)
  const handleSetFrontEdgeOnly = (targetPiece: Piece) => {
    const updatedPieces = furniture.pieces.map(p => {
      if (p.id !== targetPiece.id) return p;
      const isVertical = p.type === 'lateral_left' || p.type === 'lateral_right' || p.type === 'divider_vertical';
      return {
        ...p,
        edgeBanding: {
          ...p.edgeBanding,
          top: !isVertical, // front edge on horizontal pieces
          bottom: false,
          left: isVertical, // front edge on vertical pieces
          right: false
        }
      };
    });
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Replicate edge banding setup from current piece to all pieces of same type
  const handleReplicateToSameType = (sourcePiece: Piece) => {
    const updatedPieces = furniture.pieces.map(p => {
      if (p.type !== sourcePiece.type) return p;
      return {
        ...p,
        edgeBanding: {
          ...sourcePiece.edgeBanding
        }
      };
    });
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Batch: Apply default joinery rule across all pieces
  const handleApplyFactoryDefault = () => {
    const updatedPieces = furniture.pieces.map(p => {
      const isFront = p.type === 'door' || p.type === 'drawer_front';
      const isDrawerBox = p.type === 'drawer_side' || p.type === 'drawer_subfront' || p.type === 'drawer_back';
      const isCarcase = p.type === 'lateral_left' || p.type === 'lateral_right' || p.type === 'divider_vertical';
      const isShelfOrBase = p.type === 'base' || p.type === 'top' || p.type === 'shelf_fixed' || p.type === 'shelf_adjustable' || p.type === 'plinth';
      
      if (isFront) {
        // Doors and drawer fronts get 4-side perimeter tape
        return {
          ...p,
          edgeBanding: {
            ...p.edgeBanding,
            top: true,
            bottom: true,
            left: true,
            right: true,
            tapeMaterialId: furniture.edgeTapeId,
            tapeThickness: 1.0
          }
        };
      } else if (isDrawerBox) {
        // Drawer sides get top edge tape
        return {
          ...p,
          edgeBanding: {
            ...p.edgeBanding,
            top: true,
            bottom: false,
            left: false,
            right: false,
            tapeThickness: 0.45
          }
        };
      } else if (isCarcase) {
        // Lateral/divider gets front edge (left: true)
        return {
          ...p,
          edgeBanding: {
            ...p.edgeBanding,
            top: false,
            bottom: false,
            left: true,
            right: false,
            tapeThickness: 1.0
          }
        };
      } else if (isShelfOrBase) {
        // Base/top/shelf gets front edge (top: true)
        return {
          ...p,
          edgeBanding: {
            ...p.edgeBanding,
            top: true,
            bottom: false,
            left: false,
            right: false,
            tapeThickness: 1.0
          }
        };
      }
      return p;
    });

    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Batch: 4 sides on everything
  const handleApplyAllSidesGlobal = () => {
    const updatedPieces = furniture.pieces.map(p => ({
      ...p,
      edgeBanding: {
        ...p.edgeBanding,
        top: true,
        bottom: true,
        left: true,
        right: true
      }
    }));
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Batch: Clear all edge tapes
  const handleClearAllEdgesGlobal = () => {
    const updatedPieces = furniture.pieces.map(p => ({
      ...p,
      edgeBanding: {
        ...p.edgeBanding,
        top: false,
        bottom: false,
        left: false,
        right: false
      }
    }));
    onChange({
      ...furniture,
      pieces: updatedPieces
    });
  };

  // Batch: Set global tape material across all pieces
  const handleApplyGlobalTapeMaterial = (tapeId: string) => {
    const tape = edgeTapes.find(t => t.id === tapeId);
    handleMaterialChange('edgeTapeId', tapeId);
    const updatedPieces = furniture.pieces.map(p => ({
      ...p,
      edgeBanding: {
        ...p.edgeBanding,
        tapeMaterialId: tapeId,
        tapeThickness: tape ? tape.thickness : p.edgeBanding.tapeThickness
      }
    }));
    onChange({
      ...furniture,
      edgeTapeId: tapeId,
      pieces: updatedPieces
    });
  };

  // -------------------------------------------------------------
  // METRICS & COMPUTED TOTALS
  // -------------------------------------------------------------

  const { totalMeters, totalCost, tapedPiecesCount, totalFacesCount } = useMemo(() => {
    let mm = 0;
    let cost = 0;
    let piecesWithTape = 0;
    let facesWithTape = 0;

    furniture.pieces.forEach(p => {
      const isVertical = p.type === 'lateral_left' || p.type === 'lateral_right' || p.type === 'divider_vertical';
      const isDrawerSide = p.type === 'drawer_side';
      const L = p.length;
      const W = p.width;

      const eb = p.edgeBanding;
      let pieceTaped = false;

      const tape = edgeTapes.find(t => t.id === eb.tapeMaterialId) || edgeTapes[0];
      const pricePerMm = (tape?.pricePerMeter || 2.0) / 1000;

      let pieceMm = 0;
      if (isVertical) {
        if (eb.top) { pieceMm += W; facesWithTape++; pieceTaped = true; }
        if (eb.bottom) { pieceMm += W; facesWithTape++; pieceTaped = true; }
        if (eb.left) { pieceMm += L; facesWithTape++; pieceTaped = true; }
        if (eb.right) { pieceMm += L; facesWithTape++; pieceTaped = true; }
      } else if (isDrawerSide) {
        if (eb.top) { pieceMm += L; facesWithTape++; pieceTaped = true; }
        if (eb.bottom) { pieceMm += L; facesWithTape++; pieceTaped = true; }
        if (eb.left) { pieceMm += W; facesWithTape++; pieceTaped = true; }
        if (eb.right) { pieceMm += W; facesWithTape++; pieceTaped = true; }
      } else {
        if (eb.top) { pieceMm += L; facesWithTape++; pieceTaped = true; }
        if (eb.bottom) { pieceMm += L; facesWithTape++; pieceTaped = true; }
        if (eb.left) { pieceMm += W; facesWithTape++; pieceTaped = true; }
        if (eb.right) { pieceMm += W; facesWithTape++; pieceTaped = true; }
      }

      if (pieceTaped) piecesWithTape++;
      mm += pieceMm;
      cost += pieceMm * pricePerMm;
    });

    return {
      totalMeters: (mm / 1000).toFixed(2),
      totalCost: cost.toFixed(2),
      tapedPiecesCount: piecesWithTape,
      totalFacesCount: facesWithTape
    };
  }, [furniture.pieces, edgeTapes]);

  // Filtered pieces for the selector
  const filteredPieces = useMemo(() => {
    return furniture.pieces.filter(p => {
      if (pieceFilterCategory === 'all') return true;
      if (pieceFilterCategory === 'doors_drawers') {
        return p.type === 'door' || p.type === 'drawer_front';
      }
      if (pieceFilterCategory === 'carcase') {
        return p.type === 'lateral_left' || p.type === 'lateral_right' || p.type === 'divider_vertical' || p.type === 'base' || p.type === 'top';
      }
      if (pieceFilterCategory === 'shelves') {
        return p.type === 'shelf_fixed' || p.type === 'shelf_adjustable';
      }
      if (pieceFilterCategory === 'drawer_box') {
        return p.type === 'drawer_side' || p.type === 'drawer_subfront' || p.type === 'drawer_back' || p.type === 'drawer_bottom';
      }
      return true;
    });
  }, [furniture.pieces, pieceFilterCategory]);

  const activePiece = useMemo(() => {
    return furniture.pieces.find(p => p.id === activePieceId) || furniture.pieces[0];
  }, [furniture.pieces, activePieceId]);

  const activePieceTape = useMemo(() => {
    if (!activePiece) return edgeTapes[0];
    return edgeTapes.find(t => t.id === activePiece.edgeBanding.tapeMaterialId) || edgeTapes[0];
  }, [activePiece, edgeTapes]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden">
      {/* Panel Main Header & Sub-Tab Switcher */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/70 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Editor de Móveis</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {furniture.type}
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('params')}
            className={`py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'params'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Parâmetros
          </button>
          <button
            onClick={() => setActiveSubTab('edge_banding')}
            className={`py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 relative ${
              activeSubTab === 'edge_banding'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Fitas de Borda
            <span className={`text-[10px] px-1 rounded font-mono ml-0.5 ${
              activeSubTab === 'edge_banding' ? 'bg-slate-950 text-amber-400 font-bold' : 'bg-slate-800 text-slate-300'
            }`}>
              {totalMeters}m
            </span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PARÂMETROS GERAIS (Dimensões, Materiais e Módulos) */}
      {activeSubTab === 'params' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {/* DIMENSIONS */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
              Dimensões Gerais (Milímetros)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">LARGURA (X)</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={furniture.width}
                    step={50}
                    min={300}
                    max={4500}
                    onChange={e => handleDimensionChange('width', parseInt(e.target.value, 10))}
                    className="w-full bg-transparent font-mono text-sm text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mm</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">ALTURA (Y)</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={furniture.height}
                    step={50}
                    min={300}
                    max={3000}
                    onChange={e => handleDimensionChange('height', parseInt(e.target.value, 10))}
                    className="w-full bg-transparent font-mono text-sm text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mm</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">PROFUND. (Z)</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    value={furniture.depth}
                    step={20}
                    min={200}
                    max={1200}
                    onChange={e => handleDimensionChange('depth', parseInt(e.target.value, 10))}
                    className="w-full bg-transparent font-mono text-sm text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mm</span>
                </div>
              </div>
            </div>

            {/* Rodapé / Suspenso */}
            <div className="mt-2 bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300">Altura do Rodapé</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={furniture.plinthHeight}
                  step={10}
                  min={0}
                  max={200}
                  onChange={e => handleDimensionChange('plinthHeight', parseInt(e.target.value, 10))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-right focus:outline-none"
                />
                <span className="text-xs text-slate-400">mm</span>
              </div>
            </div>
          </div>

          {/* MATERIALS CONFIGURATION */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
              Materiais & Acabamentos
            </label>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">MDF da Caixa / Carcaça</span>
                <select
                  value={furniture.carcaseMaterialId}
                  onChange={e => handleMaterialChange('carcaseMaterialId', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.manufacturer}) - {m.defaultThickness}mm
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">MDF das Frentes (Portas/Gavetas)</span>
                <select
                  value={furniture.frontMaterialId}
                  onChange={e => handleMaterialChange('frontMaterialId', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.manufacturer}) - {m.defaultThickness}mm
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Fita de Borda Padrão do Projeto</span>
                <select
                  value={furniture.edgeTapeId}
                  onChange={e => handleApplyGlobalTapeMaterial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {edgeTapes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (R$ {t.pricePerMeter.toFixed(2)}/m)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* MODULES & INTERNAL DIVISIONS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Módulos Estruturais ({furniture.modules.length})
              </label>
              <button
                onClick={handleAddModule}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Módulo
              </button>
            </div>

            <div className="space-y-3">
              {furniture.modules.map((mod, idx) => (
                <div key={mod.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                    <span className="font-medium text-slate-200">
                      Módulo #{idx + 1} ({Math.round(mod.width)} mm)
                    </span>
                    {furniture.modules.length > 1 && (
                      <button
                        onClick={() => handleRemoveModule(idx)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Excluir Módulo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Doors Config */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Portas</span>
                      <select
                        value={mod.doorsType}
                        onChange={e => handleUpdateModule(idx, { doorsType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        <option value="none">Sem portas (Nicho)</option>
                        <option value="single_left">1 Porta (Esq)</option>
                        <option value="single_right">1 Porta (Dir)</option>
                        <option value="double">2 Portas de Abrir</option>
                      </select>
                    </div>

                    {/* Drawers Config */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Gavetas</span>
                      <select
                        value={mod.numDrawers}
                        onChange={e => handleUpdateModule(idx, { numDrawers: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                      >
                        <option value={0}>0 gavetas</option>
                        <option value={1}>1 gavetão</option>
                        <option value={2}>2 gavetas</option>
                        <option value={3}>3 gavetas</option>
                        <option value={4}>4 gavetas</option>
                      </select>
                    </div>
                  </div>

                  {/* Shelves Config */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Prateleiras Internas:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateModule(idx, { numShelves: Math.max(0, mod.numShelves - 1) })}
                        className="w-6 h-6 rounded bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center font-mono hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="font-mono text-white text-xs w-5 text-center">{mod.numShelves}</span>
                      <button
                        onClick={() => handleUpdateModule(idx, { numShelves: Math.min(8, mod.numShelves + 1) })}
                        className="w-6 h-6 rounded bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center font-mono hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CONFIGURADOR MANUAL DE FITAS DE BORDA (Face a Face) */}
      {activeSubTab === 'edge_banding' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {/* Metrics & Total Consumption Banner */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Scissors className="w-3.5 h-3.5" />
                CONSUMO DE FITA DE BORDA
              </span>
              <span className="text-emerald-400 font-mono font-bold">R$ {totalCost}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">METRAGEM</span>
                <span className="font-mono font-bold text-white text-sm">{totalMeters} m</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">PEÇAS</span>
                <span className="font-mono font-bold text-white text-sm">{tapedPiecesCount} / {furniture.pieces.length}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">FACES</span>
                <span className="font-mono font-bold text-sky-400 text-sm">{totalFacesCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Global Batch Presets */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Ações em Lote para Todo o Móvel
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                onClick={handleApplyFactoryDefault}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors text-center font-medium flex flex-col items-center gap-1"
                title="Aplica 4 cantos nas portas/gavetas e borda frontal visível na caixaria"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Padrão Marcenaria</span>
              </button>

              <button
                onClick={handleApplyAllSidesGlobal}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors text-center font-medium flex flex-col items-center gap-1"
                title="Aplica fita nos 4 lados de todas as peças do móvel"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>4 Lados em Tudo</span>
              </button>

              <button
                onClick={handleClearAllEdgesGlobal}
                className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors text-center font-medium flex flex-col items-center gap-1"
                title="Remove a fita de todas as peças"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpar Tudo</span>
              </button>
            </div>
          </div>

          {/* Piece Category Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Configuração por Peça
              </label>
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-500" />
                <select
                  value={pieceFilterCategory}
                  onChange={e => setPieceFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
                >
                  <option value="all">Todas as Peças ({furniture.pieces.length})</option>
                  <option value="doors_drawers">Portas & Frentes Gaveta</option>
                  <option value="carcase">Laterais & Caixaria</option>
                  <option value="shelves">Prateleiras</option>
                  <option value="drawer_box">Caixas de Gaveta</option>
                </select>
              </div>
            </div>

            {/* Piece Selector Dropdown */}
            <select
              value={activePiece?.id || ''}
              onChange={e => {
                setActivePieceId(e.target.value);
                const found = furniture.pieces.find(p => p.id === e.target.value);
                if (found && onSelectPiece) onSelectPiece(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              {filteredPieces.map(p => {
                const count = (p.edgeBanding.top ? 1 : 0) + (p.edgeBanding.bottom ? 1 : 0) + (p.edgeBanding.left ? 1 : 0) + (p.edgeBanding.right ? 1 : 0);
                return (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ({p.length}x{p.width} mm) [{count}/4 lados]
                  </option>
                );
              })}
            </select>
          </div>

          {/* Active Piece Card with 4-Edge Interactive Blueprint Diagram */}
          {activePiece && (
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-3">
              {/* Piece Info & Tape Swatch */}
              <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">{activePiece.code}</span>
                    <span className="text-white font-semibold truncate max-w-[170px]">{activePiece.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activePiece.length} x {activePiece.width} x {activePiece.thickness} mm
                  </span>
                </div>

                {/* 3D Highlight Indicator */}
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px]"
                  title="Cor da fita aplicada no 3D"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shadow"
                    style={{ backgroundColor: activePieceTape.colorHex }}
                  />
                  <span className="text-slate-300 font-mono">{activePieceTape.colorHex}</span>
                </div>
              </div>

              {/* Tape Material & Thickness Picker for this piece */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block mb-1">Padrão da Fita</span>
                  <select
                    value={activePiece.edgeBanding.tapeMaterialId}
                    onChange={e => handleSetPieceTapeMaterial(activePiece.id, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                  >
                    {edgeTapes.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Espessura Fita</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[0.45, 1.0, 2.0].map(th => {
                      const isCurrent = (activePiece.edgeBanding.tapeThickness || 1.0) === th;
                      return (
                        <button
                          key={th}
                          type="button"
                          onClick={() => handleSetPieceTapeThickness(activePiece.id, th)}
                          className={`py-1 rounded text-center font-mono text-[10px] transition-colors border ${
                            isCurrent
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {th}mm
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE 4-EDGE BLUEPRINT DIAGRAM */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-center select-none">
                <span className="text-[10px] text-slate-400 font-mono mb-2 uppercase">
                  Diagrama Interativo Face a Face (Clique para Ligar/Desligar)
                </span>

                {/* TOP EDGE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTogglePieceFace(activePiece.id, 'top')}
                  className={`w-44 py-1.5 px-2 rounded-t-lg border-2 transition-all flex items-center justify-between text-[10px] font-mono font-medium ${
                    activePiece.edgeBanding.top
                      ? 'border-emerald-500 text-white shadow-md'
                      : 'border-slate-800 text-slate-500 bg-slate-950/60 hover:border-slate-700'
                  }`}
                  style={activePiece.edgeBanding.top ? { backgroundColor: `${activePieceTape.colorHex}33` } : undefined}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activePiece.edgeBanding.top ? activePieceTape.colorHex : '#475569' }}
                    />
                    TOPO (Superior)
                  </span>
                  <span className="font-bold">
                    {activePiece.edgeBanding.top ? '✓ SIM' : 'NÃO'}
                  </span>
                </button>

                {/* MIDDLE ROW (LEFT EDGE + CENTER RECTANGLE + RIGHT EDGE) */}
                <div className="flex items-center gap-1.5 w-full justify-center my-1.5">
                  {/* LEFT EDGE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleTogglePieceFace(activePiece.id, 'left')}
                    className={`h-24 px-2 rounded-l-lg border-2 transition-all flex flex-col items-center justify-between text-[10px] font-mono font-medium ${
                      activePiece.edgeBanding.left
                        ? 'border-emerald-500 text-white shadow-md'
                        : 'border-slate-800 text-slate-500 bg-slate-950/60 hover:border-slate-700'
                    }`}
                    style={activePiece.edgeBanding.left ? { backgroundColor: `${activePieceTape.colorHex}33` } : undefined}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activePiece.edgeBanding.left ? activePieceTape.colorHex : '#475569' }}
                    />
                    <span className="writing-mode-vertical rotate-180 text-[9px] uppercase tracking-wider">
                      ESQUERDA
                    </span>
                    <span className="font-bold">{activePiece.edgeBanding.left ? '✓' : '—'}</span>
                  </button>

                  {/* CENTER PIECE PREVIEW BOX */}
                  <div className="flex-1 max-w-[140px] h-24 bg-slate-950 rounded border border-slate-700/60 flex flex-col items-center justify-center p-2 text-center shadow-inner relative overflow-hidden">
                    {/* Visual 3D Edge Banding Color Frame inside piece preview */}
                    {activePiece.edgeBanding.top && (
                      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: activePieceTape.colorHex }} />
                    )}
                    {activePiece.edgeBanding.bottom && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ backgroundColor: activePieceTape.colorHex }} />
                    )}
                    {activePiece.edgeBanding.left && (
                      <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: activePieceTape.colorHex }} />
                    )}
                    {activePiece.edgeBanding.right && (
                      <div className="absolute top-0 bottom-0 right-0 w-1.5" style={{ backgroundColor: activePieceTape.colorHex }} />
                    )}

                    <span className="text-[10px] text-amber-400 font-mono font-bold truncate w-full">
                      {activePiece.code}
                    </span>
                    <span className="text-[9px] text-slate-300 line-clamp-2 leading-tight mt-0.5">
                      {activePiece.name}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono mt-1">
                      {activePiece.length} x {activePiece.width}
                    </span>
                  </div>

                  {/* RIGHT EDGE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleTogglePieceFace(activePiece.id, 'right')}
                    className={`h-24 px-2 rounded-r-lg border-2 transition-all flex flex-col items-center justify-between text-[10px] font-mono font-medium ${
                      activePiece.edgeBanding.right
                        ? 'border-emerald-500 text-white shadow-md'
                        : 'border-slate-800 text-slate-500 bg-slate-950/60 hover:border-slate-700'
                    }`}
                    style={activePiece.edgeBanding.right ? { backgroundColor: `${activePieceTape.colorHex}33` } : undefined}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activePiece.edgeBanding.right ? activePieceTape.colorHex : '#475569' }}
                    />
                    <span className="writing-mode-vertical text-[9px] uppercase tracking-wider">
                      DIREITA
                    </span>
                    <span className="font-bold">{activePiece.edgeBanding.right ? '✓' : '—'}</span>
                  </button>
                </div>

                {/* BOTTOM EDGE BUTTON */}
                <button
                  type="button"
                  onClick={() => handleTogglePieceFace(activePiece.id, 'bottom')}
                  className={`w-44 py-1.5 px-2 rounded-b-lg border-2 transition-all flex items-center justify-between text-[10px] font-mono font-medium ${
                    activePiece.edgeBanding.bottom
                      ? 'border-emerald-500 text-white shadow-md'
                      : 'border-slate-800 text-slate-500 bg-slate-950/60 hover:border-slate-700'
                  }`}
                  style={activePiece.edgeBanding.bottom ? { backgroundColor: `${activePieceTape.colorHex}33` } : undefined}
                >
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activePiece.edgeBanding.bottom ? activePieceTape.colorHex : '#475569' }}
                    />
                    BASE (Inferior)
                  </span>
                  <span className="font-bold">
                    {activePiece.edgeBanding.bottom ? '✓ SIM' : 'NÃO'}
                  </span>
                </button>
              </div>

              {/* Quick Actions for this piece */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSetAllEdgesForPiece(activePiece.id, true)}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px] font-medium text-center"
                >
                  4 Lados
                </button>
                <button
                  type="button"
                  onClick={() => handleSetFrontEdgeOnly(activePiece)}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[10px] font-medium text-center"
                >
                  Apenas Frente
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllEdgesForPiece(activePiece.id, false)}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-300 text-[10px] font-medium text-center"
                >
                  Sem Fita
                </button>
              </div>

              {/* Replicate to all pieces of same type button */}
              <button
                type="button"
                onClick={() => handleReplicateToSameType(activePiece)}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar padrão para todas as peças do tipo ({activePiece.type})
              </button>
            </div>
          )}

          {/* COMPACT PIECE LIST WITH DIRECT 1-CLICK TOGGLE BUTTONS [T] [B] [E] [D] */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Tabela Rápida de Peças ({filteredPieces.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">T: Topo | B: Base | E: Esq | D: Dir</span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredPieces.map(p => {
                const isSelected = p.id === activePiece?.id;
                const pTape = edgeTapes.find(t => t.id === p.edgeBanding.tapeMaterialId) || edgeTapes[0];
                const activeColor = pTape.colorHex;

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => {
                        setActivePieceId(p.id);
                        if (onSelectPiece) onSelectPiece(p);
                      }}
                      className="cursor-pointer flex-1 min-w-0 pr-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-amber-400 font-semibold">{p.code}</span>
                        <span className="text-white text-xs truncate max-w-[110px]">{p.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {p.length}x{p.width}mm
                      </span>
                    </div>

                    {/* 4 Clickable Face Tags */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Top Face */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleTogglePieceFace(p.id, 'top');
                        }}
                        className={`w-5 h-5 rounded text-[9px] font-mono font-bold transition-all flex items-center justify-center border ${
                          p.edgeBanding.top
                            ? 'text-white border-white/40 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        style={p.edgeBanding.top ? { backgroundColor: activeColor } : undefined}
                        title="Face Topo (Superior)"
                      >
                        T
                      </button>

                      {/* Bottom Face */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleTogglePieceFace(p.id, 'bottom');
                        }}
                        className={`w-5 h-5 rounded text-[9px] font-mono font-bold transition-all flex items-center justify-center border ${
                          p.edgeBanding.bottom
                            ? 'text-white border-white/40 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        style={p.edgeBanding.bottom ? { backgroundColor: activeColor } : undefined}
                        title="Face Base (Inferior)"
                      >
                        B
                      </button>

                      {/* Left Face */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleTogglePieceFace(p.id, 'left');
                        }}
                        className={`w-5 h-5 rounded text-[9px] font-mono font-bold transition-all flex items-center justify-center border ${
                          p.edgeBanding.left
                            ? 'text-white border-white/40 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        style={p.edgeBanding.left ? { backgroundColor: activeColor } : undefined}
                        title="Face Esquerda (Frontal nas verticais)"
                      >
                        E
                      </button>

                      {/* Right Face */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleTogglePieceFace(p.id, 'right');
                        }}
                        className={`w-5 h-5 rounded text-[9px] font-mono font-bold transition-all flex items-center justify-center border ${
                          p.edgeBanding.right
                            ? 'text-white border-white/40 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        style={p.edgeBanding.right ? { backgroundColor: activeColor } : undefined}
                        title="Face Direita (Traseira nas verticais)"
                      >
                        D
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
