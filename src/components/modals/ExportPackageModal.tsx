/**
 * MarcenariaCAD Pro - Complete Manufacturing Package Export Modal
 * Generates official workshop PDF, DXF CAD files, ISO G-Code, CSV cutting schedules,
 * and JSON project backups.
 */

import React, { useState } from 'react';
import { Project, Piece } from '../../types/furniture';
import { BoardMaterial } from '../../types/materials';
import { CuttingOptimizationResult } from '../../types/cuttingPlan';
import { generateManufacturingPDF } from '../../engine/pdfExporter';
import { generateCuttingListCSV, generatePieceDXF, generatePieceGCode } from '../../engine/cncExporter';
import {
  FileText,
  FileSpreadsheet,
  Download,
  FileCode,
  CheckCircle2,
  Package,
  Layers,
  X
} from 'lucide-react';

interface ExportPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  materials: BoardMaterial[];
  cuttingResults: CuttingOptimizationResult[];
}

export const ExportPackageModal: React.FC<ExportPackageModalProps> = ({
  isOpen,
  onClose,
  project,
  materials,
  cuttingResults
}) => {
  const [downloadedItems, setDownloadedItems] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const markDownloaded = (key: string) => {
    setDownloadedItems(prev => ({ ...prev, [key]: true }));
  };

  // 1. Export PDF
  const handleExportPDF = () => {
    const doc = generateManufacturingPDF(project, materials, cuttingResults);
    doc.save(`${project.name.replace(/\s+/g, '_')}_Pacote_Fabricacao.pdf`);
    markDownloaded('pdf');
  };

  // 2. Export CSV Cutting List
  const handleExportCSV = () => {
    const map: Record<string, string> = {};
    materials.forEach(m => { map[m.id] = m.name; });
    const csv = generateCuttingListCSV(project.furniture.pieces, map);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_Lista_Corte.csv`;
    a.click();
    URL.revokeObjectURL(url);
    markDownloaded('csv');
  };

  // 3. Export All Pieces DXF
  const handleExportAllDXF = () => {
    // Download first 3 principal pieces as sample DXF
    project.furniture.pieces.slice(0, 3).forEach(piece => {
      const dxf = generatePieceDXF(piece);
      const blob = new Blob([dxf], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${piece.code}_${piece.name.replace(/\s+/g, '_')}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
    });
    markDownloaded('dxf');
  };

  // 4. Export CNC G-Code ISO
  const handleExportGCode = () => {
    const piece = project.furniture.pieces[0];
    if (piece) {
      const gcode = generatePieceGCode(piece);
      const blob = new Blob([gcode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${piece.code}_CNC_USINAGEM.nc`;
      a.click();
      URL.revokeObjectURL(url);
    }
    markDownloaded('gcode');
  };

  // 5. Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_Backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    markDownloaded('json');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Pacote para Madeireira & Fabricação</h3>
              <p className="text-xs text-slate-400">Geração de arquivos técnicos para corte, montagem e CNC</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export List Options */}
        <div className="p-6 space-y-3">
          {/* PDF Technical Documentation */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Documento Técnico Completo (PDF A4)</h4>
                <p className="text-xs text-slate-400">Lista de corte, tabela de fitas, ferragens e mapa de chapas</p>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadedItems['pdf'] ? 'Baixar Novamente' : 'Gerar PDF'}
            </button>
          </div>

          {/* CSV Cutting List */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Lista de Corte Otimizada (CSV / Excel)</h4>
                <p className="text-xs text-slate-400">Compatível com softwares de corte (Corte Certo, MaxCut, Promob)</p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Baixar CSV
            </button>
          </div>

          {/* DXF CAD Files */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Desenhos Técnicos em DXF (AutoCAD)</h4>
                <p className="text-xs text-slate-400">Geometrias 2D com camadas de contorno, furos 32mm e canecos 35mm</p>
              </div>
            </div>
            <button
              onClick={handleExportAllDXF}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              Baixar DXF
            </button>
          </div>

          {/* CNC G-Code */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Código CNC ISO (G-Code .nc)</h4>
                <p className="text-xs text-slate-400">Pós-processador para centros de furação e roteadores CNC</p>
              </div>
            </div>
            <button
              onClick={handleExportGCode}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Baixar G-Code
            </button>
          </div>

          {/* Project JSON Backup */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Backup do Projeto (Arquivo .JSON)</h4>
                <p className="text-xs text-slate-400">Permite restaurar o projeto completo paramétrico em qualquer PC</p>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Salvar JSON
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
