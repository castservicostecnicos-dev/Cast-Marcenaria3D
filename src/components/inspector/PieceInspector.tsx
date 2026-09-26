/**
 * MarcenariaCAD Pro - Piece Technical Inspector & 2D Blueprint
 * Displays detailed orthographic drawing with exact drillings,
 * edge tape toggles on all 4 sides, and DXF/G-Code export.
 */

import React from 'react';
import { Piece, EdgePosition } from '../../types/furniture';
import { BoardMaterial, EdgeTapeMaterial } from '../../types/materials';
import { generatePieceDXF, generatePieceGCode } from '../../engine/cncExporter';
import { X, Download, FileCode, Check, AlertCircle } from 'lucide-react';

interface PieceInspectorProps {
  piece: Piece | null;
  materials: BoardMaterial[];
  edgeTapes: EdgeTapeMaterial[];
  onClose: () => void;
  onUpdatePiece: (updated: Piece) => void;
}

export const PieceInspector: React.FC<PieceInspectorProps> = ({
  piece,
  materials,
  edgeTapes,
  onClose,
  onUpdatePiece
}) => {
  if (!piece) return null;

  const mat = materials.find(m => m.id === piece.materialId);
  const eb = piece.edgeBanding;
  const currentTape = edgeTapes.find(t => t.id === eb.tapeMaterialId) || edgeTapes[0];
  const tapeColor = currentTape?.colorHex || '#38bdf8';

  const toggleEdge = (edge: EdgePosition) => {
    const updated: Piece = {
      ...piece,
      edgeBanding: {
        ...piece.edgeBanding,
        [edge]: !piece.edgeBanding[edge]
      }
    };
    onUpdatePiece(updated);
  };

  const handleTapeMaterialChange = (tapeId: string) => {
    const tape = edgeTapes.find(t => t.id === tapeId);
    const updated: Piece = {
      ...piece,
      edgeBanding: {
        ...piece.edgeBanding,
        tapeMaterialId: tapeId,
        tapeThickness: tape ? tape.thickness : piece.edgeBanding.tapeThickness
      }
    };
    onUpdatePiece(updated);
  };

  const handleTapeThicknessChange = (thickness: number) => {
    const updated: Piece = {
      ...piece,
      edgeBanding: {
        ...piece.edgeBanding,
        tapeThickness: thickness
      }
    };
    onUpdatePiece(updated);
  };

  const handleDownloadDXF = () => {
    const dxfContent = generatePieceDXF(piece);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${piece.code}_${piece.name.replace(/\s+/g, '_')}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadGCode = () => {
    const gcodeContent = generatePieceGCode(piece);
    const blob = new Blob([gcodeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${piece.code}.nc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Determine natural orientation of piece for 2D orthographic drawing
  // Vertical pieces (laterals, doors, vertical dividers) stand upright with width horizontal and height vertical
  const isVerticalPiece = piece.type === 'lateral_left' ||
    piece.type === 'lateral_right' ||
    piece.type === 'divider_vertical' ||
    piece.type === 'door' ||
    (piece.length > piece.width && piece.grain === 'vertical');

  const dimX = isVerticalPiece ? piece.width : piece.length;
  const dimY = isVerticalPiece ? piece.length : piece.width;

  // SVG Drawing proportions
  const maxViewBox = 340;
  const scale = Math.min((maxViewBox - 65) / dimX, (maxViewBox - 65) / dimY);
  const drawW = dimX * scale;
  const drawH = dimY * scale;
  const startX = (maxViewBox - drawW) / 2;
  const startY = (maxViewBox - drawH) / 2;

  // Edge tape mapping based on orientation
  // In vertical piece: left = front edge, right = back edge, top = top edge, bottom = bottom edge
  const tapeTop = eb.top;
  const tapeBottom = eb.bottom;
  const tapeLeft = eb.left;
  const tapeRight = eb.right;

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono text-amber-400 font-semibold">{piece.code}</span>
          <h3 className="text-sm font-semibold text-white truncate max-w-[220px]">{piece.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fechar Detalhamento"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2D Orthographic Technical Drawing */}
      <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center">
        <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between w-full">
          <span>DESENHO TÉCNICO 2D (COTAÇÃO & FURAÇÃO)</span>
          <span className="text-amber-400">Escala 1:{Math.round(1 / scale)}</span>
        </div>

        <svg width={maxViewBox} height={maxViewBox} className="overflow-visible select-none">
          {/* Main Piece Rectangle */}
          <rect
            x={startX}
            y={startY}
            width={drawW}
            height={drawH}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
            rx="2"
          />

          {/* Grain Direction Indicator */}
          {piece.grain !== 'none' && (
            <line
              x1={startX + drawW / 2}
              y1={startY + 10}
              x2={startX + drawW / 2}
              y2={startY + drawH - 10}
              stroke="#334155"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          )}

          {/* Edge Banding Lines (Rendered with Real Tape Color) */}
          {/* Top Edge */}
          <line
            x1={startX}
            y1={startY}
            x2={startX + drawW}
            y2={startY}
            stroke={tapeTop ? tapeColor : '#334155'}
            strokeWidth={tapeTop ? 3.5 : 1}
          />
          {/* Bottom Edge */}
          <line
            x1={startX}
            y1={startY + drawH}
            x2={startX + drawW}
            y2={startY + drawH}
            stroke={tapeBottom ? tapeColor : '#334155'}
            strokeWidth={tapeBottom ? 3.5 : 1}
          />
          {/* Left Edge */}
          <line
            x1={startX}
            y1={startY}
            x2={startX}
            y2={startY + drawH}
            stroke={tapeLeft ? tapeColor : '#334155'}
            strokeWidth={tapeLeft ? 3.5 : 1}
          />
          {/* Right Edge */}
          <line
            x1={startX + drawW}
            y1={startY}
            x2={startX + drawW}
            y2={startY + drawH}
            stroke={tapeRight ? tapeColor : '#334155'}
            strokeWidth={tapeRight ? 3.5 : 1}
          />

          {/* Drillings Rendering with Exact Scale and Coordinates */}
          {piece.drillings.map((drill, idx) => {
            const cx = startX + drill.x * scale;
            const cy = startY + (dimY - drill.y) * scale;
            const r = Math.max(3, (drill.diameter / 2) * scale);
            const isHinge = drill.type === 'hinge_cup';
            const isMinifix = drill.type === 'minifix_cam';
            const isDowel = drill.type === 'dowel';

            return (
              <g key={idx} className="cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={isHinge ? '#ef4444' : isMinifix ? '#10b981' : isDowel ? '#f59e0b' : '#06b6d4'}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                {/* Center crosshair */}
                <line x1={cx - r - 2} y1={cy} x2={cx + r + 2} y2={cy} stroke="#ffffff" strokeWidth="0.6" />
                <line x1={cx} y1={cy - r - 2} x2={cx} y2={cy + r + 2} stroke="#ffffff" strokeWidth="0.6" />
                <title>{`${drill.name} (Ø${drill.diameter}mm x ${drill.depth}mm) - X: ${drill.x}mm, Y: ${drill.y}mm [Face: ${drill.face}]`}</title>
              </g>
            );
          })}

          {/* Dimension Lines */}
          {/* Horizontal Dimension (dimX) */}
          <line x1={startX} y1={startY + drawH + 15} x2={startX + drawW} y2={startY + drawH + 15} stroke="#94a3b8" strokeWidth="1" />
          <text x={startX + drawW / 2} y={startY + drawH + 26} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontFamily="monospace">
            {dimX} mm {isVerticalPiece ? '(Largura/Prof.)' : '(Comprimento)'}
          </text>

          {/* Vertical Dimension (dimY) */}
          <line x1={startX - 15} y1={startY} x2={startX - 15} y2={startY + drawH} stroke="#94a3b8" strokeWidth="1" />
          <text x={startX - 20} y={startY + drawH / 2} fill="#cbd5e1" fontSize="10" textAnchor="middle" transform={`rotate(-90 ${startX - 20} ${startY + drawH / 2})`} fontFamily="monospace">
            {dimY} mm {isVerticalPiece ? '(Altura/Comprimento)' : '(Largura)'}
          </text>
        </svg>
      </div>

      {/* Specifications */}
      <div className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Material</span>
          <span className="font-medium text-slate-200">{mat?.name || 'MDF'}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Espessura</span>
          <span className="font-mono text-slate-200">{piece.thickness} mm</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Dimensões Reais</span>
          <span className="font-mono text-amber-400 font-semibold">{piece.length} x {piece.width} mm</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Sentido do Veio</span>
          <span className="text-slate-200 capitalize">{piece.grain}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Quantidade</span>
          <span className="font-mono text-slate-200">{piece.quantity} un</span>
        </div>
      </div>

      {/* Interactive Edge Banding Configuration */}
      <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Fita de Borda</span>
          </h4>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: tapeColor }}
            />
            <span className="text-[10px] font-mono text-slate-300">{currentTape?.name.split(' ')[2] || 'Fita'}</span>
          </div>
        </div>

        {/* Tape Material Selector */}
        <div className="space-y-1.5 mb-2.5">
          <select
            value={eb.tapeMaterialId}
            onChange={e => handleTapeMaterialChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
          >
            {edgeTapes.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Thickness buttons */}
          <div className="grid grid-cols-3 gap-1">
            {[0.45, 1.0, 2.0].map(th => {
              const isSel = (eb.tapeThickness || 1.0) === th;
              return (
                <button
                  key={th}
                  type="button"
                  onClick={() => handleTapeThicknessChange(th)}
                  className={`py-0.5 rounded text-center text-[10px] font-mono border ${
                    isSel ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {th}mm
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Face Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => toggleEdge('top')}
            className={`flex items-center justify-between px-3 py-2 rounded border transition-all ${
              eb.top
                ? 'border-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={eb.top ? { backgroundColor: `${tapeColor}25` } : undefined}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eb.top ? tapeColor : '#475569' }} />
              <span>Topo</span>
            </div>
            {eb.top ? <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <span className="text-[10px] text-slate-600">—</span>}
          </button>
          <button
            onClick={() => toggleEdge('bottom')}
            className={`flex items-center justify-between px-3 py-2 rounded border transition-all ${
              eb.bottom
                ? 'border-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={eb.bottom ? { backgroundColor: `${tapeColor}25` } : undefined}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eb.bottom ? tapeColor : '#475569' }} />
              <span>Base</span>
            </div>
            {eb.bottom ? <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <span className="text-[10px] text-slate-600">—</span>}
          </button>
          <button
            onClick={() => toggleEdge('left')}
            className={`flex items-center justify-between px-3 py-2 rounded border transition-all ${
              eb.left
                ? 'border-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={eb.left ? { backgroundColor: `${tapeColor}25` } : undefined}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eb.left ? tapeColor : '#475569' }} />
              <span>Esquerda</span>
            </div>
            {eb.left ? <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <span className="text-[10px] text-slate-600">—</span>}
          </button>
          <button
            onClick={() => toggleEdge('right')}
            className={`flex items-center justify-between px-3 py-2 rounded border transition-all ${
              eb.right
                ? 'border-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            style={eb.right ? { backgroundColor: `${tapeColor}25` } : undefined}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: eb.right ? tapeColor : '#475569' }} />
              <span>Direita</span>
            </div>
            {eb.right ? <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <span className="text-[10px] text-slate-600">—</span>}
          </button>
        </div>
      </div>

      {/* Drillings Schedule */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Usinagens & Furações ({piece.drillings.length})
        </h4>
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {piece.drillings.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Nenhuma furação necessária para esta peça.</p>
          ) : (
            piece.drillings.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] p-2 bg-slate-950/60 rounded border border-slate-800/80">
                <div>
                  <span className="font-medium text-slate-200">{d.name}</span>
                  <div className="text-slate-400 font-mono">
                    Ø{d.diameter} mm · Prof: {d.depth} mm
                  </div>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">
                  X:{d.x} Y:{d.y}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Single Piece Export Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
        <button
          onClick={handleDownloadDXF}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          Exportar DXF da Peça (AutoCAD)
        </button>
        <button
          onClick={handleDownloadGCode}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          Exportar G-Code CNC (ISO)
        </button>
      </div>
    </div>
  );
};
