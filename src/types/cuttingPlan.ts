/**
 * MarcenariaCAD Pro - Cutting Plan & 2D Nesting Optimization Types
 */

import { Piece } from './furniture';

export interface PlacedPiece {
  piece: Piece;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export interface CutSheet {
  id: string;
  sheetIndex: number;
  materialId: string;
  thickness: number;
  sheetWidth: number;  // mm (ex: 2750)
  sheetLength: number; // mm (ex: 1850)
  kerf: number;        // espessura da serra (ex: 4mm)
  trimMargin: number;  // refilo das bordas (ex: 10mm)
  pieces: PlacedPiece[];
  usedAreaMm2: number;
  totalAreaMm2: number;
  efficiencyPercent: number;
  wastePercent: number;
  cuts: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: 'primary' | 'secondary' | 'trim';
  }>;
}

export interface CuttingOptimizationResult {
  materialId: string;
  materialName: string;
  thickness: number;
  totalPieces: number;
  sheetsNeeded: number;
  sheets: CutSheet[];
  overallEfficiencyPercent: number;
  overallWastePercent: number;
  unplacedPieces: Piece[];
}
