/**
 * MarcenariaCAD Pro - Create Furniture Model from Pieces List (Lista de Peças)
 * Supports interactive table entry or direct copy-paste from spreadsheets / CSV.
 */

import React, { useState } from 'react';
import { FurnitureModel, Piece, PieceType } from '../../types/furniture';
import { BoardMaterial } from '../../types/materials';
import { recalculateFurnitureModel } from '../../engine/parametricEngine';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Upload, 
  Table, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PieceDraft {
  id: string;
  name: string;
  type: PieceType;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  edgeTop: boolean;
  edgeBottom: boolean;
  edgeLeft: boolean;
  edgeRight: boolean;
}

interface CreateFromPiecesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: BoardMaterial[];
  onGenerateModel: (model: FurnitureModel, projectName: string) => void;
}

const DEFAULT_PRESET_PIECES: PieceDraft[] = [
  { id: '1', name: 'Lateral Esquerda', type: 'lateral_left', length: 850, width: 600, thickness: 18, quantity: 1, edgeTop: true, edgeBottom: true, edgeLeft: true, edgeRight: false },
  { id: '2', name: 'Lateral Direita', type: 'lateral_right', length: 850, width: 600, thickness: 18, quantity: 1, edgeTop: true, edgeBottom: true, edgeLeft: true, edgeRight: false },
  { id: '3', name: 'Base Inferior', type: 'base', length: 1164, width: 600, thickness: 18, quantity: 1, edgeTop: true, edgeBottom: false, edgeLeft: false, edgeRight: false },
  { id: '4', name: 'Tampo Superior', type: 'top', length: 1164, width: 600, thickness: 18, quantity: 1, edgeTop: true, edgeBottom: false, edgeLeft: false, edgeRight: false },
  { id: '5', name: 'Prateleira Central', type: 'shelf_adjustable', length: 1162, width: 580, thickness: 18, quantity: 1, edgeTop: true, edgeBottom: false, edgeLeft: false, edgeRight: false },
  { id: '6', name: 'Porta Esquerda', type: 'door', length: 710, width: 590, thickness: 18, quantity: 1, edgeTop: true, edgeBottom: true, edgeLeft: true, edgeRight: true },
  { id: '7', name: 'Porta Direita', type: 'door', length: 710, width: 590, thickness: 18, quantity: 1, edgeTop: true, edgeBottom: true, edgeLeft: true, edgeRight: true },
  { id: '8', name: 'Fundo Traseiro 6mm', type: 'back', length: 830, width: 1180, thickness: 6, quantity: 1, edgeTop: false, edgeBottom: false, edgeLeft: false, edgeRight: false },
];

export const CreateFromPiecesListModal: React.FC<CreateFromPiecesListModalProps> = ({
  isOpen,
  onClose,
  materials,
  onGenerateModel
}) => {
  const [modelName, setModelName] = useState('Armário Montado por Lista de Peças');
  const [carcaseMaterialId, setCarcaseMaterialId] = useState(materials[0]?.id || 'mat_mdf_branco_tx_18');
  const [frontMaterialId, setFrontMaterialId] = useState(materials[1]?.id || 'mat_mdf_louro_freijo_18');
  const [pieces, setPieces] = useState<PieceDraft[]>(DEFAULT_PRESET_PIECES);
  const [activeTab, setActiveTab] = useState<'table' | 'paste'>('table');
  const [pasteText, setPasteText] = useState('');

  if (!isOpen) return null;

  const handleAddRow = () => {
    setPieces(prev => [
      ...prev,
      {
        id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: 'Nova Peça',
        type: 'shelf_adjustable',
        length: 600,
        width: 400,
        thickness: 18,
        quantity: 1,
        edgeTop: true,
        edgeBottom: false,
        edgeLeft: false,
        edgeRight: false
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof PieceDraft, val: any) => {
    setPieces(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split('\n');
    const parsed: PieceDraft[] = [];

    lines.forEach((line, idx) => {
      // Split by tab, semicolon or comma
      const parts = line.split(/[\t;]|,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 3) {
        const name = parts[0] || `Peça #${idx + 1}`;
        const length = parseInt(parts[1], 10) || 600;
        const width = parseInt(parts[2], 10) || 400;
        const thickness = parseInt(parts[3], 10) || 18;
        const quantity = parseInt(parts[4], 10) || 1;

        let type: PieceType = 'shelf_adjustable';
        const lowerName = name.toLowerCase();
        if (lowerName.includes('lateral esq')) type = 'lateral_left';
        else if (lowerName.includes('lateral dir')) type = 'lateral_right';
        else if (lowerName.includes('base') || lowerName.includes('fundo inf')) type = 'base';
        else if (lowerName.includes('tampo') || lowerName.includes('superior')) type = 'top';
        else if (lowerName.includes('porta')) type = 'door';
        else if (lowerName.includes('gaveta') && lowerName.includes('frente')) type = 'drawer_front';
        else if (lowerName.includes('lateral gaveta')) type = 'drawer_side';
        else if (lowerName.includes('fundo') || lowerName.includes('traseira 6')) type = 'back';
        else if (lowerName.includes('divis')) type = 'divider_vertical';

        parsed.push({
          id: `p_paste_${idx}_${Date.now()}`,
          name,
          type,
          length,
          width,
          thickness,
          quantity,
          edgeTop: true,
          edgeBottom: type === 'door',
          edgeLeft: type === 'door',
          edgeRight: type === 'door'
        });
      }
    });

    if (parsed.length > 0) {
      setPieces(parsed);
      setActiveTab('table');
    }
  };

  const handleGenerate = () => {
    // Calculate overall cabinet bounding box from pieces
    let maxWidth = 0;
    let maxHeight = 0;
    let maxDepth = 0;

    pieces.forEach(p => {
      if (p.type === 'lateral_left' || p.type === 'lateral_right') {
        maxHeight = Math.max(maxHeight, p.length);
        maxDepth = Math.max(maxDepth, p.width);
      } else if (p.type === 'base' || p.type === 'top') {
        maxWidth = Math.max(maxWidth, p.length + 36);
        maxDepth = Math.max(maxDepth, p.width);
      } else if (p.type === 'back') {
        maxHeight = Math.max(maxHeight, p.length);
        maxWidth = Math.max(maxWidth, p.width);
      }
    });

    if (maxWidth === 0) maxWidth = 1200;
    if (maxHeight === 0) maxHeight = 850;
    if (maxDepth === 0) maxDepth = 600;

    // Convert draft pieces into 3D Pieces with positioning
    const convertedPieces: Piece[] = [];
    let currentX = 18;

    pieces.forEach((p, idx) => {
      const isFrontPiece = p.type === 'door' || p.type === 'drawer_front';
      const matId = isFrontPiece ? frontMaterialId : carcaseMaterialId;

      // Smart 3D coordinate placement
      let posX = 0;
      let posY = 0;
      let posZ = 0;
      let dims3D = { width: p.width, height: p.length, depth: p.thickness };

      if (p.type === 'lateral_left') {
        posX = 0;
        posY = 0;
        posZ = 0;
        dims3D = { width: p.thickness, height: p.length, depth: p.width };
      } else if (p.type === 'lateral_right') {
        posX = maxWidth - p.thickness;
        posY = 0;
        posZ = 0;
        dims3D = { width: p.thickness, height: p.length, depth: p.width };
      } else if (p.type === 'base') {
        posX = 18;
        posY = 80;
        posZ = 0;
        dims3D = { width: p.length, height: p.thickness, depth: p.width };
      } else if (p.type === 'top') {
        posX = 18;
        posY = maxHeight - p.thickness;
        posZ = 0;
        dims3D = { width: p.length, height: p.thickness, depth: p.width };
      } else if (p.type === 'back') {
        posX = 10;
        posY = 80;
        posZ = maxDepth - 15;
        dims3D = { width: p.width, height: p.length, depth: p.thickness };
      } else if (p.type === 'door') {
        posX = currentX;
        posY = 90;
        posZ = 0;
        dims3D = { width: p.width, height: p.length, depth: p.thickness };
        currentX += p.width + 4;
      } else {
        // Shelves / generic
        posX = 18;
        posY = maxHeight / 2;
        posZ = 15;
        dims3D = { width: p.length, height: p.thickness, depth: p.width };
      }

      convertedPieces.push({
        id: `pc_custom_${idx}_${Date.now()}`,
        code: `P${idx + 1}`,
        name: p.name,
        type: p.type,
        moduleId: 'root',
        materialId: matId,
        thickness: p.thickness,
        length: p.length,
        width: p.width,
        quantity: p.quantity,
        grain: p.thickness <= 6 ? 'none' : 'horizontal',
        edgeBanding: {
          top: p.edgeTop,
          bottom: p.edgeBottom,
          left: p.edgeLeft,
          right: p.edgeRight,
          tapeMaterialId: 'tape_pvc_freijo_1mm',
          tapeThickness: 1.0,
          tapeWidth: 22
        },
        drillings: [],
        slots: [],
        position: { x: posX, y: posY, z: posZ },
        dimensions3D: dims3D,
        notes: 'Peça adicionada via importação de lista de corte'
      });
    });

    const newModel: FurnitureModel = {
      id: `model_custom_${Date.now()}`,
      name: modelName,
      type: 'cozinha_balcao',
      width: maxWidth,
      height: maxHeight,
      depth: maxDepth,
      carcaseMaterialId,
      frontMaterialId,
      backMaterialId: 'mat_mdf_branco_tx_6',
      edgeTapeId: 'tape_pvc_freijo_1mm',
      carcaseThickness: 18,
      frontThickness: 18,
      backThickness: 6,
      plinthHeight: 80,
      backGrooveOffset: 15,
      doorGap: 3,
      drawerRunnerClearance: 13,
      modules: [
        {
          id: 'mod_1',
          name: 'Módulo Principal',
          width: maxWidth - 36,
          height: maxHeight - 116,
          depth: maxDepth,
          offsetX: 18,
          numShelves: 1,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'double',
          hasBackPanel: true,
          hasPlinth: true
        }
      ],
      pieces: convertedPieces,
      hardware: [],
      hardwareSpecs: {
        hingeType: 'soft_close',
        slideType: 'telescopic',
        connectorType: 'minifix_dowel',
        handleType: 'handle_bar_black',
        shelfPinType: 'pin_5mm_nickel'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onGenerateModel(newModel, modelName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Criar Modelo a partir de Lista de Peças
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Importação Rápida
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Digite a tabela de peças ou cole os dados copiados do Excel/Corte Cloud para montar o modelo 3D.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800/80 grid grid-cols-3 gap-4 text-xs shrink-0">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Nome do Novo Modelo</label>
            <input
              type="text"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-medium focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Material da Estrutura (Caixa)</label>
            <select
              value={carcaseMaterialId}
              onChange={e => setCarcaseMaterialId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            >
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.defaultThickness}mm)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Material das Portas / Frentes</label>
            <select
              value={frontMaterialId}
              onChange={e => setFrontMaterialId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            >
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.defaultThickness}mm)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2 text-xs gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('table')}
            className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'table'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            Editor Visual de Peças ({pieces.length} itens)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Colar Texto / CSV / Excel
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {activeTab === 'table' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-mono">
                  {pieces.length} peças configuradas · As peças serão montadas no ambiente CAD 3D com plano de corte
                </span>
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Peça</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">NOME DA PEÇA</th>
                      <th className="py-2.5 px-3">TIPO</th>
                      <th className="py-2.5 px-3">COMPRIMENTO (mm)</th>
                      <th className="py-2.5 px-3">LARGURA (mm)</th>
                      <th className="py-2.5 px-3">ESPESSURA (mm)</th>
                      <th className="py-2.5 px-3">QTD</th>
                      <th className="py-2.5 px-3 text-center">FITA (C / B / E / D)</th>
                      <th className="py-2.5 px-3 text-right">EXCLUIR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-mono text-xs">
                    {pieces.map(p => (
                      <tr key={p.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={p.name}
                            onChange={e => handleUpdateRow(p.id, 'name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-sans focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={p.type}
                            onChange={e => handleUpdateRow(p.id, 'type', e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-sans focus:outline-none"
                          >
                            <option value="lateral_left">Lateral Esquerda</option>
                            <option value="lateral_right">Lateral Direita</option>
                            <option value="base">Base Inferior</option>
                            <option value="top">Tampo Superior</option>
                            <option value="shelf_adjustable">Prateleira Móvel</option>
                            <option value="shelf_fixed">Prateleira Fixa</option>
                            <option value="divider_vertical">Divisória</option>
                            <option value="door">Porta</option>
                            <option value="drawer_front">Frente de Gaveta</option>
                            <option value="drawer_side">Lateral de Gaveta</option>
                            <option value="back">Fundo 6mm</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={p.length}
                            onChange={e => handleUpdateRow(p.id, 'length', parseInt(e.target.value, 10) || 0)}
                            className="w-20 bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-right"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={p.width}
                            onChange={e => handleUpdateRow(p.id, 'width', parseInt(e.target.value, 10) || 0)}
                            className="w-20 bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-right"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={p.thickness}
                            onChange={e => handleUpdateRow(p.id, 'thickness', parseInt(e.target.value, 10) || 18)}
                            className="w-16 bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-right"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={p.quantity}
                            onChange={e => handleUpdateRow(p.id, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-14 bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-center"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <label className="flex items-center gap-0.5 cursor-pointer text-[10px]" title="Borda Superior">
                              <input
                                type="checkbox"
                                checked={p.edgeTop}
                                onChange={e => handleUpdateRow(p.id, 'edgeTop', e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span className="text-slate-400">C</span>
                            </label>
                            <label className="flex items-center gap-0.5 cursor-pointer text-[10px]" title="Borda Inferior">
                              <input
                                type="checkbox"
                                checked={p.edgeBottom}
                                onChange={e => handleUpdateRow(p.id, 'edgeBottom', e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span className="text-slate-400">B</span>
                            </label>
                            <label className="flex items-center gap-0.5 cursor-pointer text-[10px]" title="Borda Esquerda">
                              <input
                                type="checkbox"
                                checked={p.edgeLeft}
                                onChange={e => handleUpdateRow(p.id, 'edgeLeft', e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span className="text-slate-400">E</span>
                            </label>
                            <label className="flex items-center gap-0.5 cursor-pointer text-[10px]" title="Borda Direita">
                              <input
                                type="checkbox"
                                checked={p.edgeRight}
                                onChange={e => handleUpdateRow(p.id, 'edgeRight', e.target.checked)}
                                className="accent-amber-500 rounded"
                              />
                              <span className="text-slate-400">D</span>
                            </label>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleRemoveRow(p.id)}
                            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Remover linha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">
                Cole a lista de peças no formato CSV ou colunas do Excel:
                <br />
                <code className="text-amber-400 text-[11px] font-mono">
                  Nome_da_Peça [TAB] Comprimento [TAB] Largura [TAB] Espessura [TAB] Quantidade
                </code>
              </p>
              <textarea
                rows={10}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={`Lateral Esquerda\t850\t600\t18\t1\nLateral Direita\t850\t600\t18\t1\nBase Inferior\t1164\t600\t18\t1\nTampo Superior\t1164\t600\t18\t1\nPrateleira\t1162\t580\t18\t1\nPorta\t710\t590\t18\t2\nFundo 6mm\t830\t1180\t6\t1`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleParsePaste}
                disabled={!pasteText.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Processar e Carregar na Tabela</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Total de Peças: <span className="text-white font-bold font-mono">{pieces.reduce((acc, p) => acc + p.quantity, 0)}</span> peças físicas
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={pieces.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg active:scale-95 text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Gerar Modelo e Visualizar 3D</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
