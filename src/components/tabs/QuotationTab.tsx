/**
 * MarcenariaCAD Pro - Quotation & Budgeting Tab
 * Displays comprehensive financial breakdown, direct material costs,
 * machining services, assembly labor, and configurable profit margin & taxes.
 */

import React, { useState } from 'react';
import { QuotationResult, QuotationConfig } from '../../types/quotation';
import { DEFAULT_QUOTATION_CONFIG } from '../../engine/quotationEngine';
import { DollarSign, Percent, TrendingUp, Truck, Wrench, ShieldCheck, Printer } from 'lucide-react';

interface QuotationTabProps {
  quotation: QuotationResult;
  config: QuotationConfig;
  onUpdateConfig: (updated: QuotationConfig) => void;
}

export const QuotationTab: React.FC<QuotationTabProps> = ({
  quotation,
  config,
  onUpdateConfig
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Header Summary */}
      <div className="p-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
              Módulo de Orçamento & Engenharia de Custos
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Preço Final do Mobiliário</h2>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Valor Sugerido para Venda</span>
            <span className="text-3xl font-bold text-amber-400 font-mono">
              {formatCurrency(quotation.finalSellingPrice)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              ou à vista {formatCurrency(quotation.cashPrice)} (5% desc.) · 10x de {formatCurrency(quotation.suggestedInstallmentPrice)}
            </span>
          </div>
        </div>

        {/* 4 Macro KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">1. Materiais (Chapas + Fitas)</span>
            <span className="text-lg font-bold text-white font-mono mt-1 block">
              {formatCurrency(quotation.subtotalMaterials)}
            </span>
            <span className="text-[11px] text-slate-500">MDFs, fitas de borda com 15% sobra</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">2. Ferragens & Acessórios</span>
            <span className="text-lg font-bold text-white font-mono mt-1 block">
              {formatCurrency(quotation.subtotalHardware)}
            </span>
            <span className="text-[11px] text-slate-500">Dobradiças, corrediças, puxadores, união</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">3. Fabricação & Serviços</span>
            <span className="text-lg font-bold text-white font-mono mt-1 block">
              {formatCurrency(quotation.subtotalOperations + quotation.subtotalLaborAndServices)}
            </span>
            <span className="text-[11px] text-slate-500">Corte, CNC, montagem de oficina, frete</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 bg-gradient-to-br from-slate-950 to-amber-950/20">
            <span className="text-xs text-amber-400 font-medium block">4. Lucro Líquido Estimado</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
              {formatCurrency(quotation.profitMarginAmount)}
            </span>
            <span className="text-[11px] text-slate-400">Margem aplicada de {config.profitMarginPercent}%</span>
          </div>
        </div>
      </div>

      {/* Main Budget Grid: Sliders / Config Left + Cost Items Table Right */}
      <div className="flex-1 p-6 grid grid-cols-3 gap-6">
        {/* Left Column: Parameter Sliders */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 h-fit space-y-5">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-400" />
            Configuração de Taxas e Margens
          </h3>

          {/* Margem de Lucro */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Margem de Lucro Desejada</span>
              <span className="font-mono text-amber-400 font-bold">{config.profitMarginPercent}%</span>
            </div>
            <input
              type="range"
              min={15}
              max={65}
              step={1}
              value={config.profitMarginPercent}
              onChange={e => onUpdateConfig({ ...config, profitMarginPercent: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Impostos */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Alíquota de Impostos (Simples/NF)</span>
              <span className="font-mono text-slate-200">{config.taxPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={config.taxPercent}
              onChange={e => onUpdateConfig({ ...config, taxPercent: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Horas de Montagem */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Horas de Oficina / Montagem</span>
              <span className="font-mono text-slate-200">{config.estimatedAssemblyHours} horas</span>
            </div>
            <input
              type="range"
              min={2}
              max={24}
              step={1}
              value={config.estimatedAssemblyHours}
              onChange={e => onUpdateConfig({ ...config, estimatedAssemblyHours: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Custo da Hora Marcenaria */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Valor da Hora Oficina</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-mono">R$</span>
                <input
                  type="number"
                  value={config.hourlyLaborRate}
                  onChange={e => onUpdateConfig({ ...config, hourlyLaborRate: parseFloat(e.target.value) || 0 })}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white text-right focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Frete / Transporte */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Frete & Instalação</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-mono">R$</span>
                <input
                  type="number"
                  value={config.transportCost}
                  onChange={e => onUpdateConfig({ ...config, transportCost: parseFloat(e.target.value) || 0 })}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-white text-right focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Cost Items Table */}
        <div className="col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Demonstrativo Detalhado de Custos ({quotation.items.length} itens)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Custo Direto: {formatCurrency(quotation.subtotalDirectCosts)}
            </span>
          </div>

          <div className="flex-1 overflow-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">ITEM / INSUMO</th>
                  <th className="py-2.5 px-4">CATEGORIA</th>
                  <th className="py-2.5 px-4">QUANTIDADE</th>
                  <th className="py-2.5 px-4">VALOR UNIT.</th>
                  <th className="py-2.5 px-4 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {quotation.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-4 font-medium text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 capitalize">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-white text-right">
                      {formatCurrency(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
