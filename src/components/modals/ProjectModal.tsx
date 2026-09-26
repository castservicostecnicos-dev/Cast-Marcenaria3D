/**
 * MarcenariaCAD Pro - New / Edit Project Settings Modal
 * Configures Project Name, Client Info, Room dimensions, and presets.
 */

import React, { useState } from 'react';
import { Project } from '../../types/furniture';
import { FURNITURE_TEMPLATES } from '../../data/templates';
import { FolderPlus, User, Home, Sparkles, X, Check } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (updated: Partial<Project>, selectedTemplateId?: string) => void;
  isNew?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  isNew = false
}) => {
  const [name, setName] = useState(isNew ? 'Novo Projeto Planejado' : project.name);
  const [clientName, setClientName] = useState(project.client.name);
  const [clientPhone, setClientPhone] = useState(project.client.phone || '');
  const [roomName, setRoomName] = useState(project.room.name);
  const [roomWidth, setRoomWidth] = useState(project.room.dimensions.width);
  const [roomLength, setRoomLength] = useState(project.room.dimensions.length);
  const [roomHeight, setRoomHeight] = useState(project.room.dimensions.height);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(FURNITURE_TEMPLATES[0].id);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      isNew ? selectedTemplate : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {isNew ? 'Criar Novo Projeto de Móveis' : 'Configurações do Projeto'}
              </h3>
              <p className="text-xs text-slate-400">Cliente, ambiente e parâmetros iniciais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Project Name */}
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

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Nome do Cliente</label>
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

          {/* Room Info */}
          <div className="pt-2 border-t border-slate-800/80">
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

          {/* Template Selection if New */}
          {isNew && (
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-slate-300 font-medium block mb-2">
                Selecione o Modelo Paramétrico Inicial:
              </label>
              <div className="space-y-2">
                {FURNITURE_TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
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
              {isNew ? 'Criar Projeto' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
