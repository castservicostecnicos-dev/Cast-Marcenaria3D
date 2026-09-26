/**
 * MarcenariaCAD Pro - AI Natural Language Parametric Creator Modal
 * Parses user speech/text into parametric furniture engineering rules,
 * presents an intermediate parameter confirmation review, and generates the model.
 */

import React, { useState } from 'react';
import { interpretFurnitureWithAI, InterpretedFurnitureProposal } from '../../services/geminiAI';
import { ParametricInput } from '../../engine/parametricEngine';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, Sliders, X } from 'lucide-react';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (proposal: InterpretedFurnitureProposal) => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState(
    'Crie um armário de cozinha com 2400 mm de largura, 2200 mm de altura e 600 mm de profundidade, dividido em 4 módulos, com duas portas de abrir, três gavetas, prateleiras internas reguláveis, MDF branco de 18 mm, fundo de 6 mm e puxadores pretos.'
  );
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<InterpretedFurnitureProposal | null>(null);

  if (!isOpen) return null;

  const quickExamples = [
    'Guarda-roupa casal 2700 x 2400 x 600 mm com 3 módulos, 4 gavetas internas, maleiro superior e 2 cabideiros em MDF Carvalho.',
    'Balcão de cozinha 1800 x 850 x 600 mm com 3 gavetões para panelas e duas portas de abrir em MDF Grafite Silk.',
    'Rack para sala de TV com 2200 x 550 x 450 mm, suspenso, com portas basculantes e nicho para receptor em MDF Freijó.'
  ];

  const handleInterpret = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await interpretFurnitureWithAI(prompt);
      setProposal(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGenerate = () => {
    if (proposal) {
      onGenerate(proposal);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Descrever Móvel com Inteligência Artificial</h3>
              <p className="text-xs text-slate-400">Geração de estrutura paramétrica a partir de linguagem natural</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!proposal ? (
            <>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Descreva o móvel com suas medidas, divisões, portas, gavetas e acabamentos:
                </label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ex: Crie um armário com 2400 mm de largura, 2200 mm de altura e 600 mm de profundidade..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Quick Prompt Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Exemplos Prontos para Testar:
                </span>
                <div className="space-y-1.5">
                  {quickExamples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800/60 text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      "{ex}"
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Proposal Confirmation Review */
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                  Parâmetros Interpretados pela IA:
                </span>
                <p className="text-xs text-slate-300">{proposal.rawExplanation}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DIMENSÕES TÉCNICAS</span>
                  <span className="font-mono text-white text-sm font-bold">
                    {proposal.width} L x {proposal.height} A x {proposal.depth} P mm
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DIVISÃO ESTRUTURAL</span>
                  <span className="font-mono text-white text-sm font-bold">
                    {proposal.numModules} Módulos ({Math.round((proposal.width - 36) / proposal.numModules)} mm cada)
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">PORTAS & GAVETAS</span>
                  <span className="font-mono text-white text-sm font-bold">
                    {proposal.doorsCount} portas · {proposal.drawersCount} gavetas com amortecedor
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">PRATELEIRAS & MALEIRO</span>
                  <span className="font-mono text-white text-sm font-bold">
                    {proposal.shelvesCount} prateleiras Sistema 32
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">MATERIAL DA CARCAÇA</span>
                  <span className="text-slate-200 font-medium">{proposal.carcaseMaterialName}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">MATERIAL DAS FRENTES</span>
                  <span className="text-slate-200 font-medium">{proposal.frontMaterialName}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {!proposal ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={loading || !prompt.trim()}
                onClick={handleInterpret}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Interpretando com IA...
                  </>
                ) : (
                  <>
                    Interpretar e Revisar Parâmetros
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setProposal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Editar Descrição
              </button>
              <button
                onClick={handleConfirmGenerate}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                Gerar Projeto Paramétrico
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
