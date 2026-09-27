/**
 * MarcenariaCAD Pro - Save Current Furniture as New Template / Model
 * Adds the customized furniture to the user's permanent model library.
 */

import React, { useState } from 'react';
import { FurnitureModel } from '../../types/furniture';
import { saveCustomTemplate, StoredCustomTemplate } from '../../services/storage';
import { BookmarkPlus, Check, X, FolderCheck } from 'lucide-react';

interface SaveModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  furniture: FurnitureModel;
  onSaved: (template: StoredCustomTemplate) => void;
}

export const SaveModelModal: React.FC<SaveModelModalProps> = ({
  isOpen,
  onClose,
  furniture,
  onSaved
}) => {
  const [name, setName] = useState(furniture.name || 'Meu Novo Modelo Paramétrico');
  const [category, setCategory] = useState<StoredCustomTemplate['category']>('Cozinha');
  const [description, setDescription] = useState(
    `Modelo de ${furniture.width} x ${furniture.height} x ${furniture.depth} mm com ${furniture.modules.length} módulos e furações CNC otimizadas.`
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveCustomTemplate({
      name,
      category,
      description,
      thumbnail: 'personalizado',
      dimensions: {
        width: furniture.width,
        height: furniture.height,
        depth: furniture.depth
      },
      furnitureSnapshot: JSON.parse(JSON.stringify(furniture))
    });

    onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Salvar Modelo na Biblioteca</h3>
              <p className="text-xs text-slate-400">Salve o design atual para reutilizar em novos projetos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Nome do Modelo</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Categoria</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Cozinha">Cozinha</option>
              <option value="Dormitório">Dormitório</option>
              <option value="Sala">Sala</option>
              <option value="Banheiro">Banheiro</option>
              <option value="Escritório">Escritório</option>
              <option value="Personalizado">Personalizado</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Descrição</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Dimensões:</span>
            <span className="text-amber-400 font-semibold">{furniture.width} x {furniture.height} x {furniture.depth} mm</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar na Biblioteca</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
