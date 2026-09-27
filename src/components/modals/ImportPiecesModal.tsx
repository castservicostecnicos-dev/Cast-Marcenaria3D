/**
 * MarcenariaCAD Pro - Import Pieces from Other Projects & Templates Modal
 * Allows selecting pieces from other projects or saved templates to merge
 * into the current furniture model or create a new custom furniture from them.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FurnitureModel, Piece, Project } from '../../types/furniture';
import { loadAllProjects, loadCustomTemplates, StoredCustomTemplate } from '../../services/storage';
import { FURNITURE_TEMPLATES, FurnitureTemplate } from '../../data/templates';
import {
  FolderInput,
  Check,
  X,
  Layers,
  Box,
  Plus,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  Scissors,
  Cpu
} from 'lucide-react';

interface ImportPiecesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFurniture: FurnitureModel;
  onImportPiecesToCurrent: (pieces: Piece[]) => void;
  onCreateNewFromImportedPieces: (pieces: Piece[], modelName: string) => void;
}

interface SourceOption {
  id: string;
  name: string;
  type: 'project' | 'custom' | 'template';
  description: string;
  furniture: FurnitureModel;
}

export const ImportPiecesModal: React.FC<ImportPiecesModalProps> = ({
  isOpen,
  onClose,
  currentFurniture,
  onImportPiecesToCurrent,
  onCreateNewFromImportedPieces
}) => {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedPieceIds, setSelectedPieceIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newModelName, setNewModelName] = useState('Móvel Customizado por Importação');

  useEffect(() => {
    if (isOpen) {
      const list: SourceOption[] = [];

      // 1. Saved Projects
      const projects = loadAllProjects();
      projects.forEach(p => {
        list.push({
          id: `proj_${p.id}`,
          name: `[Projeto] ${p.name}`,
          type: 'project',
          description: `${p.furniture.pieces.length} peças · Cliente: ${p.client.name}`,
          furniture: p.furniture
        });
      });

      // 2. Custom Saved Templates
      const customTemplates = loadCustomTemplates();
      customTemplates.forEach(t => {
        list.push({
          id: `custom_${t.id}`,
          name: `[Modelo Salvo] ${t.name}`,
          type: 'custom',
          description: `${t.furnitureSnapshot.pieces.length} peças · ${t.category}`,
          furniture: t.furnitureSnapshot
        });
      });

      // 3. Default Catalog Templates
      FURNITURE_TEMPLATES.forEach(tmpl => {
        try {
          const furn = tmpl.create();
          list.push({
            id: `tmpl_${tmpl.id}`,
            name: `[Catálogo] ${tmpl.name}`,
            type: 'template',
            description: `${furn.pieces.length} peças · ${tmpl.category}`,
            furniture: furn
          });
        } catch (e) {
          console.warn('Erro ao criar template:', e);
        }
      });

      setSources(list);
      if (list.length > 0 && !selectedSourceId) {
        setSelectedSourceId(list[0].id);
      }
    }
  }, [isOpen]);

  const activeSource = useMemo(() => {
    return sources.find(s => s.id === selectedSourceId) || sources[0];
  }, [sources, selectedSourceId]);

  const availablePieces = useMemo(() => {
    if (!activeSource) return [];
    return activeSource.furniture.pieces;
  }, [activeSource]);

  const filteredPieces = useMemo(() => {
    return availablePieces.filter(p => {
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'laterals') return p.type === 'lateral_left' || p.type === 'lateral_right' || p.type === 'divider_vertical';
      if (categoryFilter === 'horizontal') return p.type === 'base' || p.type === 'top' || p.type === 'shelf_fixed' || p.type === 'shelf_adjustable';
      if (categoryFilter === 'doors') return p.type === 'door';
      if (categoryFilter === 'drawers') return p.type.startsWith('drawer_');
      return true;
    });
  }, [availablePieces, categoryFilter]);

  if (!isOpen) return null;

  const handleTogglePiece = (id: string) => {
    setSelectedPieceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = new Set(filteredPieces.map(p => p.id));
    setSelectedPieceIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedPieceIds(new Set());
  };

  const getSelectedPieces = (): Piece[] => {
    return availablePieces.filter(p => selectedPieceIds.has(p.id));
  };

  const handleImportToCurrent = () => {
    const selected = getSelectedPieces();
    if (selected.length === 0) return;
    onImportPiecesToCurrent(selected);
    onClose();
  };

  const handleCreateNew = () => {
    const selected = getSelectedPieces();
    if (selected.length === 0) return;
    onCreateNewFromImportedPieces(selected, newModelName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Importar Peças de Outros Projetos</h3>
              <p className="text-xs text-slate-400">
                Selecione peças de projetos salvos ou modelos de catálogo para mesclar ou criar um novo móvel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Selector & Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <span className="text-xs font-medium text-slate-400">Origem:</span>
            <select
              value={selectedSourceId}
              onChange={e => {
                setSelectedSourceId(e.target.value);
                setSelectedPieceIds(new Set());
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {sources.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.furniture.pieces.length} peças)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Todas as Peças ({availablePieces.length})</option>
              <option value="laterals">Laterais & Divisórias</option>
              <option value="horizontal">Bases, Tampos & Prateleiras</option>
              <option value="doors">Portas</option>
              <option value="drawers">Peças de Gaveta</option>
            </select>

            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Todas
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Pieces Table */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <span className="sr-only">Seleção</span>
                  </th>
                  <th className="py-2.5 px-3">CÓDIGO</th>
                  <th className="py-2.5 px-3 font-sans">NOME DA PEÇA</th>
                  <th className="py-2.5 px-3 font-sans">TIPO</th>
                  <th className="py-2.5 px-3">DIMENSÕES (L x W x E)</th>
                  <th className="py-2.5 px-3 font-sans">FURAÇÕES CNC</th>
                  <th className="py-2.5 px-3 font-sans">BORDAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredPieces.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      Nenhuma peça encontrada neste filtro.
                    </td>
                  </tr>
                ) : (
                  filteredPieces.map(p => {
                    const isSelected = selectedPieceIds.has(p.id);
                    const edgesCount = [p.edgeBanding.top, p.edgeBanding.bottom, p.edgeBanding.left, p.edgeBanding.right].filter(Boolean).length;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleTogglePiece(p.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500/10 hover:bg-amber-500/15'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400 inline" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 inline" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-400">{p.code}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">{p.name}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {p.length} x {p.width} x {p.thickness} mm
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {p.drillings.length > 0 ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              {p.drillings.length} furos
                            </span>
                          ) : (
                            <span className="text-slate-500">0 furos</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">
                          {edgesCount > 0 ? (
                            <span className="text-cyan-400">{edgesCount} face(s)</span>
                          ) : (
                            <span className="text-slate-600">Sem fita</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400">
              Selecionadas: <span className="text-amber-400 font-bold text-sm">{selectedPieceIds.size}</span> de {filteredPieces.length} peças
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleImportToCurrent}
              disabled={selectedPieceIds.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors border border-slate-700 shadow-sm"
              title="Adiciona as peças selecionadas à árvore do móvel atual"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Adicionar ao Móvel Atual ({selectedPieceIds.size})</span>
            </button>

            <button
              onClick={handleCreateNew}
              disabled={selectedPieceIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 disabled:hover:from-amber-600 disabled:hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
              title="Cria um móvel novo a partir das peças selecionadas"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Criar Novo Móvel com Estas Peças</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
