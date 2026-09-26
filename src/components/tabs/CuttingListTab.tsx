/**
 * MarcenariaCAD Pro - Cutting List Table Tab
 * Filterable, sortable cutting schedule with edge band indicators,
 * grain direction, and piece drillings count.
 */

import React, { useState } from 'react';
import { Piece } from '../../types/furniture';
import { BoardMaterial } from '../../types/materials';
import { Search, Download, FileSpreadsheet, Eye, ArrowUpDown, Filter } from 'lucide-react';
import { generateCuttingListCSV } from '../../engine/cncExporter';

interface CuttingListTabProps {
  pieces: Piece[];
  materials: BoardMaterial[];
  onSelectPiece: (piece: Piece) => void;
  onExportCSV: () => void;
}

export const CuttingListTab: React.FC<CuttingListTabProps> = ({
  pieces,
  materials,
  onSelectPiece,
  onExportCSV
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'length' | 'width' | 'code'>('length');
  const [sortDesc, setSortDesc] = useState(true);

  const materialsMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    materials.forEach(m => {
      map[m.id] = m.name;
    });
    return map;
  }, [materials]);

  // Filtering
  const filtered = pieces.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMat = selectedMaterialFilter === 'all' || p.materialId === selectedMaterialFilter;
    return matchesSearch && matchesMat;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'length') diff = a.length - b.length;
    else if (sortBy === 'width') diff = a.width - b.width;
    else if (sortBy === 'code') diff = a.code.localeCompare(b.code);
    return sortDesc ? -diff : diff;
  });

  const toggleSort = (field: 'length' | 'width' | 'code') => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código ou nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-64"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMaterialFilter}
              onChange={e => setSelectedMaterialFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Todos os Materiais</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono mr-2">
            {sorted.length} de {pieces.length} peças
          </span>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Exportar CSV (Corte Certo)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('code')}>
                <div className="flex items-center gap-1">
                  <span>CÓDIGO</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-4">DESCRIÇÃO DA PEÇA</th>
              <th className="py-2.5 px-4">MATERIAL</th>
              <th className="py-2.5 px-4">ESP.</th>
              <th className="py-2.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('length')}>
                <div className="flex items-center gap-1">
                  <span>COMP. (mm)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('width')}>
                <div className="flex items-center gap-1">
                  <span>LARG. (mm)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-4">QTD</th>
              <th className="py-2.5 px-4">VEIO</th>
              <th className="py-2.5 px-4">FITAS DE BORDA (T / B / E / D)</th>
              <th className="py-2.5 px-4">FUROS</th>
              <th className="py-2.5 px-4 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {sorted.map(piece => {
              const eb = piece.edgeBanding;
              const matName = materialsMap[piece.materialId] || 'MDF';

              return (
                <tr
                  key={piece.id}
                  className="hover:bg-slate-900/50 transition-colors group cursor-pointer"
                  onClick={() => onSelectPiece(piece)}
                >
                  <td className="py-2.5 px-4 font-mono font-semibold text-amber-400">
                    {piece.code}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-200">
                    {piece.name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {matName}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">
                    {piece.thickness} mm
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-white">
                    {piece.length}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-white">
                    {piece.width}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-200">
                    {piece.quantity}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 capitalize">
                    {piece.grain}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${eb.top ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-600'}`}>
                        T
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${eb.bottom ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-600'}`}>
                        B
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${eb.left ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-600'}`}>
                        E
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${eb.right ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'text-slate-600'}`}>
                        D
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">
                    {piece.drillings.length > 0 ? (
                      <span className="text-cyan-400">{piece.drillings.length} op.</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectPiece(piece);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                    >
                      Ver 2D
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
