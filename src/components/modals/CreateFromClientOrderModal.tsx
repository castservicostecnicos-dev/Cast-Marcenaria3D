/**
 * MarcenariaCAD Pro - Create Model from Client Order Description
 * Interprets client requests (WhatsApp, quotation email, customer brief)
 * and generates the complete parametric 3D model with optimized CNC drillings.
 */

import React, { useState } from 'react';
import { FurnitureModel } from '../../types/furniture';
import { parseFurnitureDescriptionLocally } from '../../services/geminiAI';
import { createParametricFurniture } from '../../engine/parametricEngine';
import { 
  Sparkles, 
  MessageSquareText, 
  Check, 
  X, 
  Layers, 
  Maximize2, 
  Sliders, 
  Wrench, 
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface CreateFromClientOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateModel: (model: FurnitureModel, projectName: string) => void;
}

const PRESET_CLIENT_ORDERS = [
  {
    title: 'Balcão de Cozinha com Gaveteiro',
    text: 'Balcão de pia para cozinha medindo 2100mm de largura, 850mm de altura e 600mm de profundidade, dividido em 3 módulos: o primeiro módulo com gaveteiro de 3 gavetas com amortecedor, o segundo com porta dupla e 1 prateleira interna, e o terceiro com porta de abrir direita. Caixa em MDF Branco TX 18mm e frentes em Louro Freijó 18mm.'
  },
  {
    title: 'Guarda-Roupa Casal com Cabideiro',
    text: 'Guarda-roupa planejado de 2400mm de largura por 2300mm de altura e 600mm de profundidade, com 3 módulos iguais. Módulo 1 com cabideiro e prateleira superior maleiro, módulo 2 central com 4 gavetas e prateleiras, e módulo 3 com prateleiras reguláveis e porta de abrir. Frentes em Carvalho Malva e estrutura branca.'
  },
  {
    title: 'Armário Aéreo Basculante',
    text: 'Armário aéreo suspenso para cozinha de 1600mm de largura, 700mm de altura e 350mm de profundidade, 2 módulos com portas duplas e prateleiras reguláveis em MDF Grafite Silk com puxadores barra.'
  },
  {
    title: 'Rack Baixo para Sala com Nicho',
    text: 'Rack para sala de TV suspenso com 2000mm de largura, 500mm de altura e 450mm de profundidade, contendo 2 gavetões nas pontas e nicho central aberto para aparelhos eletrônicos.'
  }
];

export const CreateFromClientOrderModal: React.FC<CreateFromClientOrderModalProps> = ({
  isOpen,
  onClose,
  onGenerateModel
}) => {
  const [description, setDescription] = useState(PRESET_CLIENT_ORDERS[0].text);

  if (!isOpen) return null;

  // Real-time interpretation of client text
  const interpretation = parseFurnitureDescriptionLocally(description);

  const handleGenerate = () => {
    const newModel = createParametricFurniture({
      name: interpretation.name,
      type: interpretation.type,
      width: interpretation.width,
      height: interpretation.height,
      depth: interpretation.depth,
      modules: interpretation.suggestedModules
    });

    onGenerateModel(newModel, interpretation.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Criar Modelo por Descrição do Pedido do Cliente
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  IA & Engenharia Paramétrica
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cole a mensagem do cliente (WhatsApp, e-mail ou rascunho) para gerar o projeto técnico completo com furações exatas.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Quick Examples */}
          <div>
            <span className="text-slate-400 text-[11px] font-semibold block mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              EXEMPLOS RÁPIDOS DE PEDIDOS:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_CLIENT_ORDERS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDescription(preset.text)}
                  className="text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-colors text-xs"
                >
                  <span className="font-semibold text-amber-400 block mb-0.5">{preset.title}</span>
                  <span className="text-slate-400 text-[11px] line-clamp-1">{preset.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="text-slate-300 font-medium block mb-1.5">
              Descrição do Pedido do Cliente:
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Digite as dimensões, módulos, portas, gavetas e acabamentos solicitados pelo cliente..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500 font-sans shadow-inner"
            />
          </div>

          {/* Live Interpretation Preview */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Interpretação Paramétrica Detectada:
              </span>
              <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Furações Otimizadas Ativadas
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">TIPO DE MÓVEL</span>
                <span className="font-semibold text-white truncate block">{interpretation.name}</span>
                <span className="text-[10px] text-amber-400 capitalize">{interpretation.type.replace('_', ' ')}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">DIMENSÕES (L x A x P)</span>
                <span className="font-semibold text-white font-mono block">
                  {interpretation.width} x {interpretation.height} x {interpretation.depth} mm
                </span>
                <span className="text-[10px] text-slate-400">Dimensões úteis</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MÓDULOS & DIVISÕES</span>
                <span className="font-semibold text-white block">
                  {interpretation.numModules} módulos
                </span>
                <span className="text-[10px] text-slate-400">
                  {interpretation.doorsCount} portas · {interpretation.drawersCount} gavetas · {interpretation.shelvesCount} prateleiras
                </span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MATERIAIS DETECTADOS</span>
                <span className="font-semibold text-white truncate block">{interpretation.frontMaterialName}</span>
                <span className="text-[10px] text-slate-400 truncate block">Caixa: {interpretation.carcaseMaterialName}</span>
              </div>
            </div>

            {/* Modules Breakdown Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-slate-400 text-[10px] font-mono block">ESTRUTURA INTERNA DOS MÓDULOS:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {interpretation.suggestedModules.map((m, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px]">
                    <div className="font-medium text-slate-200 mb-1">{m.name}</div>
                    <div className="text-slate-400 text-[10px] space-y-0.5">
                      <div>Portas: <span className="text-slate-300">{m.doorsType}</span></div>
                      <div>Gavetas: <span className="text-slate-300">{m.numDrawers}</span></div>
                      <div>Prateleiras: <span className="text-slate-300">{m.numShelves}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-xs"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={!description.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg active:scale-95 text-xs"
          >
            <Check className="w-4 h-4" />
            <span>Gerar Projeto 3D e Produção</span>
          </button>
        </div>
      </div>
    </div>
  );
};
