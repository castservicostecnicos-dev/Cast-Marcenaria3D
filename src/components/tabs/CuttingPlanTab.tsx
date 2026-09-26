/**
 * MarcenariaCAD Pro - 2D Cutting Plan & Sheet Nesting Visualizer
 * Renders graphical 2D cutting maps for commercial MDF boards (2750x1850mm),
 * showing piece codes, cutting kerf lines, efficiency %, and waste %.
 */

import React, { useState } from 'react';
import { CuttingOptimizationResult, CutSheet } from '../../types/cuttingPlan';
import { BoardMaterial } from '../../types/materials';
import { Piece } from '../../types/furniture';
import { Layers, Scissors, CheckCircle, AlertTriangle, Maximize2 } from 'lucide-react';

interface CuttingPlanTabProps {
  optimizationResults: CuttingOptimizationResult[];
  materials: BoardMaterial[];
  onSelectPiece: (piece: Piece) => void;
}

export const CuttingPlanTab: React.FC<CuttingPlanTabProps> = ({
  optimizationResults,
  materials,
  onSelectPiece
}) => {
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  if (optimizationResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <Scissors className="w-12 h-12 mb-3 text-slate-600" />
        <p className="text-sm">Nenhuma peça para otimização de corte.</p>
      </div>
    );
  }

  const currentGroup = optimizationResults[activeGroupIndex] || optimizationResults[0];
  const currentSheet = currentGroup.sheets[activeSheetIndex] || currentGroup.sheets[0];

  // Visual SVG scaling for standard 2750 x 1850mm board
  const svgWidth = 900;
  const svgHeight = 600;
  const scaleX = svgWidth / currentSheet.sheetWidth;
  const scaleY = svgHeight / currentSheet.sheetLength;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar with Material Groups & Metrics */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Plano de Corte Otimizado (2D Nesting)</h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {optimizationResults.map((grp, idx) => (
              <button
                key={grp.materialId}
                onClick={() => {
                  setActiveGroupIndex(idx);
                  setActiveSheetIndex(0);
                }}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeGroupIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {grp.materialName} ({grp.thickness}mm)
              </button>
            ))}
          </div>
        </div>

        {/* Global Group Efficiency Badge */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Total Chapas: </span>
            <span className="text-white font-semibold">{currentGroup.sheetsNeeded} un</span>
          </div>
          <div>
            <span className="text-slate-400">Aproveitamento: </span>
            <span className="text-emerald-400 font-semibold">{currentGroup.overallEfficiencyPercent}%</span>
          </div>
          <div>
            <span className="text-slate-400">Desperdício: </span>
            <span className="text-amber-400 font-semibold">{currentGroup.overallWastePercent}%</span>
          </div>
        </div>
      </div>

      {/* Main Content: Sheet Selector + SVG Map */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sheet Thumbnails List */}
        <div className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 overflow-y-auto space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Chapas ({currentGroup.sheets.length})
          </h4>
          {currentGroup.sheets.map((sheet, sIdx) => (
            <div
              key={sheet.id}
              onClick={() => setActiveSheetIndex(sIdx)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                activeSheetIndex === sIdx
                  ? 'bg-slate-800 border-amber-500 shadow-md'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white">Chapa #{sheet.sheetIndex}</span>
                <span className="text-[11px] font-mono text-emerald-400">{sheet.efficiencyPercent}%</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {sheet.pieces.length} peças · {sheet.sheetWidth} x {sheet.sheetLength} mm
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${sheet.efficiencyPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Large Cutting Map Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 overflow-auto">
          {currentSheet && (
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-between w-[900px] mb-2 text-xs font-mono text-slate-400">
                <span>Chapa Comercial: {currentSheet.sheetWidth} x {currentSheet.sheetLength} x {currentSheet.thickness} mm</span>
                <span>Refilo: {currentSheet.trimMargin}mm | Serra (Kerf): {currentSheet.kerf}mm</span>
              </div>

              {/* Board SVG Representation */}
              <div className="border-2 border-slate-700 rounded-md shadow-2xl bg-slate-900 overflow-hidden">
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  viewBox={`0 0 ${currentSheet.sheetWidth} ${currentSheet.sheetLength}`}
                  className="select-none"
                >
                  {/* Trim Margin Area */}
                  <rect
                    x="0"
                    y="0"
                    width={currentSheet.sheetWidth}
                    height={currentSheet.sheetLength}
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="4"
                  />

                  {/* Usable Area Boundary */}
                  <rect
                    x={currentSheet.trimMargin}
                    y={currentSheet.trimMargin}
                    width={currentSheet.sheetWidth - 2 * currentSheet.trimMargin}
                    height={currentSheet.sheetLength - 2 * currentSheet.trimMargin}
                    fill="#1e293b"
                    stroke="#475569"
                    strokeDasharray="10 10"
                    strokeWidth="2"
                  />

                  {/* Placed Pieces */}
                  {currentSheet.pieces.map((placed, idx) => {
                    const p = placed.piece;
                    return (
                      <g
                        key={idx}
                        onClick={() => onSelectPiece(p)}
                        className="cursor-pointer group"
                      >
                        {/* Piece Body */}
                        <rect
                          x={placed.x}
                          y={placed.y}
                          width={placed.width}
                          height={placed.height}
                          fill="#334155"
                          stroke="#020617"
                          strokeWidth="3"
                          rx="2"
                          className="group-hover:fill-amber-600 transition-colors"
                        />

                        {/* Edge Banding Indicators on Borders */}
                        {p.edgeBanding.top && (
                          <line
                            x1={placed.x}
                            y1={placed.y}
                            x2={placed.x + placed.width}
                            y2={placed.y}
                            stroke="#38bdf8"
                            strokeWidth="5"
                          />
                        )}
                        {p.edgeBanding.bottom && (
                          <line
                            x1={placed.x}
                            y1={placed.y + placed.height}
                            x2={placed.x + placed.width}
                            y2={placed.y + placed.height}
                            stroke="#38bdf8"
                            strokeWidth="5"
                          />
                        )}

                        {/* Piece Labels (if big enough) */}
                        {placed.width > 120 && placed.height > 60 && (
                          <>
                            <text
                              x={placed.x + placed.width / 2}
                              y={placed.y + placed.height / 2 - 8}
                              fill="#f8fafc"
                              fontSize="26"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {p.code}
                            </text>
                            <text
                              x={placed.x + placed.width / 2}
                              y={placed.y + placed.height / 2 + 22}
                              fill="#cbd5e1"
                              fontSize="18"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {placed.width} x {placed.height} mm
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Details Legend */}
              <div className="flex items-center gap-6 mt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-700 border border-slate-600 inline-block"></span>
                  Peça em MDF
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-400 inline-block"></span>
                  Borda com Fita PVC
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800 inline-block"></span>
                  Retalho / Sobra
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
