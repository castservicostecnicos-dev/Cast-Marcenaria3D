/**
 * MarcenariaCAD Pro - New / Edit Project Settings Modal
 * Configures Project Name, Client Info, Room dimensions, and presets.
 * Supports Starting from Scratch, Library Templates, Custom Saved Models,
 * Client Order Descriptions, and Pieces Lists.
 */

import React, { useState, useEffect } from 'react';
import { Project, FurnitureModel } from '../../types/furniture';
import { FURNITURE_TEMPLATES } from '../../data/templates';
import { loadCustomTemplates, StoredCustomTemplate } from '../../services/storage';
import { createParametricFurniture } from '../../engine/parametricEngine';
import { 
  FolderPlus, 
  User, 
  Home, 
  Sparkles, 
  X, 
  Check, 
  Box, 
  PlusSquare, 
  FileSpreadsheet, 
  MessageSquareText,
  Bookmark
} from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (updated: Partial<Project>, selectedTemplateId?: string, customFurniture?: FurnitureModel) => void;
  onOpenOrderModal?: () => void;
  onOpenPiecesListModal?: () => void;
  isNew?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  onOpenOrderModal,
  onOpenPiecesListModal,
  isNew = false
}) => {
  const [name, setName] = useState(isNew ? 'Novo Projeto Planejado' : project.name);
  const [clientName, setClientName] = useState(project.client.name);
  const [clientPhone, setClientPhone] = useState(project.client.phone || '');
  const [roomName, setRoomName] = useState(project.room.name);
  const [roomWidth, setRoomWidth] = useState(project.room.dimensions.width);
  const [roomLength, setRoomLength] = useState(project.room.dimensions.length);
  const [roomHeight, setRoomHeight] = useState(project.room.dimensions.height);

  // New Project Starting Mode
  const [startMode, setStartMode] = useState<'scratch' | 'template' | 'custom'>('scratch');
  
  // Custom scratch dimensions
  const [scratchWidth, setScratchWidth] = useState(1800);
  const [scratchHeight, setScratchHeight] = useState(850);
  const [scratchDepth, setScratchDepth] = useState(600);
  const [scratchModules, setScratchModules] = useState(2);
  const [scratchPlinth, setScratchPlinth] = useState(80);

  // Selected template
  const [selectedTemplate, setSelectedTemplate] = useState<string>(FURNITURE_TEMPLATES[0].id);
  const [customTemplates, setCustomTemplates] = useState<StoredCustomTemplate[]>([]);
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const custom = loadCustomTemplates();
      setCustomTemplates(custom);
      if (custom.length > 0 && !selectedCustomTemplateId) {
        setSelectedCustomTemplateId(custom[0].id);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let customFurn: FurnitureModel | undefined = undefined;

    if (isNew) {
      if (startMode === 'scratch') {
        // Build a clean, blank carcase model from scratch
        const spanW = (scratchWidth - 36 - (scratchModules - 1) * 18) / scratchModules;
        const mods = [];
        for (let i = 0; i < scratchModules; i++) {
          mods.push({
            id: `mod_${i + 1}`,
            name: `Módulo ${i + 1}`,
            width: spanW,
            height: scratchHeight - scratchPlinth - 36,
            depth: scratchDepth,
            offsetX: 18 + i * (spanW + 18),
            numShelves: 1,
            shelfType: 'adjustable' as const,
            numDrawers: 0,
            drawerType: 'external' as const,
            doorsType: 'none' as const,
            hasBackPanel: true,
            hasPlinth: scratchPlinth > 0
          });
        }

        customFurn = createParametricFurniture({
          name: name || 'Móvel Sob Medida',
          type: 'cozinha_balcao',
          width: scratchWidth,
          height: scratchHeight,
          depth: scratchDepth,
          plinthHeight: scratchPlinth,
          modules: mods
        });
      } else if (startMode === 'custom') {
        const found = customTemplates.find(t => t.id === selectedCustomTemplateId);
        if (found) {
          customFurn = JSON.parse(JSON.stringify(found.furnitureSnapshot));
        }
      }
    }

    onSave(
      {
        name,
        client: {
          ...project.client,
          name: clientName,
          phone: clientPhone
        },
        room: {
          ...project.room,
          name: roomName,
          dimensions: {
            width: roomWidth,
            length: roomLength,
            height: roomHeight
          }
        }
      },
      isNew && startMode === 'template' ? selectedTemplate : undefined,
      customFurn
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {isNew ? 'Iniciar Novo Projeto de Marcenaria' : 'Configurações do Projeto'}
              </h3>
              <p className="text-xs text-slate-400">
                {isNew ? 'Comece do zero, escolha um modelo ou importe dados' : 'Cliente, ambiente e dimensões da sala'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Quick Action Badges if New */}
          {isNew && (
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block text-xs">Como deseja iniciar o projeto?</label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStartMode('scratch')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    startMode === 'scratch'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <PlusSquare className={`w-5 h-5 mb-2 ${startMode === 'scratch' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold block text-xs">Do Zero</span>
                    <span className="text-[10px] text-slate-400">Carcaça limpa sob medida</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStartMode('template')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    startMode === 'template'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Box className={`w-5 h-5 mb-2 ${startMode === 'template' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold block text-xs">Biblioteca</span>
                    <span className="text-[10px] text-slate-400">Modelos prontos padrão</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStartMode('custom')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    startMode === 'custom'
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 mb-2 ${startMode === 'custom' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold block text-xs">Meus Modelos</span>
                    <span className="text-[10px] text-slate-400">{customTemplates.length} salvos</span>
                  </div>
                </button>
              </div>

              {/* Extra shortcuts: Order Description or Pieces List */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {onOpenOrderModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrderModal();
                    }}
                    className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left flex items-center gap-2 text-slate-300 transition-colors"
                  >
                    <MessageSquareText className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-semibold block text-[11px] text-white">Por Pedido do Cliente</span>
                      <span className="text-[10px] text-slate-400">Gerar via texto / WhatsApp</span>
                    </div>
                  </button>
                )}

                {onOpenPiecesListModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPiecesListModal();
                    }}
                    className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left flex items-center gap-2 text-slate-300 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold block text-[11px] text-white">Por Lista de Peças</span>
                      <span className="text-[10px] text-slate-400">Tabela de corte / Excel</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Project & Client Identification */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Nome do Projeto</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Cliente</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* If Starting from Scratch: Custom dimensions */}
          {isNew && startMode === 'scratch' && (
            <div className="pt-3 border-t border-slate-800 space-y-3 bg-slate-950/60 p-3.5 rounded-xl border">
              <span className="font-semibold text-amber-400 block text-xs">Dimensões da Nova Carcaça Paramétrica:</span>
              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">LARGURA (mm)</label>
                  <input
                    type="number"
                    value={scratchWidth}
                    onChange={e => setScratchWidth(parseInt(e.target.value, 10) || 600)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">ALTURA (mm)</label>
                  <input
                    type="number"
                    value={scratchHeight}
                    onChange={e => setScratchHeight(parseInt(e.target.value, 10) || 600)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">PROFUNDIDADE (mm)</label>
                  <input
                    type="number"
                    value={scratchDepth}
                    onChange={e => setScratchDepth(parseInt(e.target.value, 10) || 300)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono pt-1">
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">NÚMERO DE MÓDULOS / VÃOS</label>
                  <select
                    value={scratchModules}
                    onChange={e => setScratchModules(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  >
                    <option value={1}>1 Módulo</option>
                    <option value={2}>2 Módulos</option>
                    <option value={3}>3 Módulos</option>
                    <option value={4}>4 Módulos</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px]">ALTURA DO RODAPÉ (mm)</label>
                  <input
                    type="number"
                    value={scratchPlinth}
                    onChange={e => setScratchPlinth(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* If Starting from Standard Template */}
          {isNew && startMode === 'template' && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-slate-300 font-medium block mb-1">
                Selecione o Modelo Paramétrico Inicial:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {FURNITURE_TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedTemplate === tmpl.id
                        ? 'bg-amber-500/10 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{tmpl.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {tmpl.dimensions.width} x {tmpl.dimensions.height} x {tmpl.dimensions.depth} mm · {tmpl.category}
                      </span>
                    </div>
                    {selectedTemplate === tmpl.id && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If Starting from User's Custom Saved Model */}
          {isNew && startMode === 'custom' && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-slate-300 font-medium block mb-1">
                Selecione um Modelo Salvo da Sua Biblioteca:
              </label>
              {customTemplates.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                  Você ainda não possui modelos salvos na biblioteca.
                  <br />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Ao editar qualquer projeto, clique em "Salvar Modelo na Biblioteca" para reutilizar depois.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {customTemplates.map(tmpl => (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedCustomTemplateId(tmpl.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        selectedCustomTemplateId === tmpl.id
                          ? 'bg-amber-500/10 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block">{tmpl.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {tmpl.dimensions.width} x {tmpl.dimensions.height} x {tmpl.dimensions.depth} mm · {tmpl.category}
                        </span>
                      </div>
                      {selectedCustomTemplateId === tmpl.id && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Room Environment Info */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-slate-300 font-medium block mb-1">Ambiente</label>
            <input
              type="text"
              required
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-slate-400 block mb-1 text-[10px]">LARGURA AMBIENTE (mm)</label>
              <input
                type="number"
                value={roomWidth}
                onChange={e => setRoomWidth(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px]">COMPRIMENTO (mm)</label>
              <input
                type="number"
                value={roomLength}
                onChange={e => setRoomLength(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px]">PÉ-DIREITO / TETO (mm)</label>
              <input
                type="number"
                value={roomHeight}
                onChange={e => setRoomHeight(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg"
            >
              {isNew ? 'Iniciar Projeto' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
