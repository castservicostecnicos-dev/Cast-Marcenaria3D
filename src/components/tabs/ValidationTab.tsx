/**
 * MarcenariaCAD Pro - Fabrication Verification & Diagnostics Tab
 * Automatically inspects the furniture for manufacturing errors,
 * oversized pieces, missing edge bands, clearance conflicts, and missing hardware.
 */

import React from 'react';
import { FabricationDiagnostic } from '../../engine/ruleValidator';
import { Piece } from '../../types/furniture';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';

interface ValidationTabProps {
  diagnostics: FabricationDiagnostic[];
  onSelectPieceById: (pieceId: string) => void;
}

export const ValidationTab: React.FC<ValidationTabProps> = ({
  diagnostics,
  onSelectPieceById
}) => {
  const errors = diagnostics.filter(d => d.severity === 'error');
  const warnings = diagnostics.filter(d => d.severity === 'warning');
  const infos = diagnostics.filter(d => d.severity === 'info');

  const allClear = errors.length === 0 && warnings.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-6">
      {/* Top Banner */}
      <div className="mb-6 flex items-center justify-between p-5 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          {allClear ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-white">Auditoria de Engenharia & Fabricação</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Validação de restrições de marcenaria, integridade de chapas, furações e ferragens
            </p>
          </div>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span>{errors.length} Erros Críticos</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{warnings.length} Alertas</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>{infos.length} Informações</span>
          </div>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="space-y-3">
        {/* Errors Section */}
        {errors.map(diag => (
          <div
            key={diag.id}
            className="p-4 bg-red-950/20 border border-red-900/60 rounded-xl flex items-start justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-200">{diag.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{diag.message}</p>
                {diag.actionHint && (
                  <p className="text-xs text-red-300/80 mt-1 font-mono">
                    👉 Ação recomendada: {diag.actionHint}
                  </p>
                )}
              </div>
            </div>

            {diag.targetPieceId && (
              <button
                onClick={() => onSelectPieceById(diag.targetPieceId!)}
                className="flex items-center gap-1 text-xs text-red-300 hover:text-white bg-red-900/40 hover:bg-red-800 px-3 py-1.5 rounded-lg transition-colors font-medium shrink-0 ml-4"
              >
                Inspecionar Peça
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* Warnings Section */}
        {warnings.map(diag => (
          <div
            key={diag.id}
            className="p-4 bg-amber-950/20 border border-amber-900/60 rounded-xl flex items-start justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-200">{diag.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{diag.message}</p>
                {diag.actionHint && (
                  <p className="text-xs text-amber-300/80 mt-1 font-mono">
                    👉 Ação: {diag.actionHint}
                  </p>
                )}
              </div>
            </div>

            {diag.targetPieceId && (
              <button
                onClick={() => onSelectPieceById(diag.targetPieceId!)}
                className="flex items-center gap-1 text-xs text-amber-300 hover:text-white bg-amber-900/40 hover:bg-amber-800 px-3 py-1.5 rounded-lg transition-colors font-medium shrink-0 ml-4"
              >
                Ajustar Peça
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* Info Section */}
        {infos.map(diag => (
          <div
            key={diag.id}
            className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start justify-between"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{diag.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{diag.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
