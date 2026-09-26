/**
 * MarcenariaCAD Pro - 2D Cutting Plan & Guillotine Sheet Optimizer
 * Computes 2D bin-packing layout of pieces onto commercial MDF boards (e.g. 2750 x 1850mm),
 * taking into account blade kerf (serra 4mm), edge trims (refilo 10mm),
 * and grain direction constraints.
 */

import { Piece } from '../types/furniture';
import { BoardMaterial } from '../types/materials';
import { CuttingOptimizationResult, CutSheet, PlacedPiece } from '../types/cuttingPlan';

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function optimizeCuttingPlan(
  pieces: Piece[],
  materials: BoardMaterial[],
  kerf: number = 4, // 4mm saw blade
  trimMargin: number = 10 // 10mm border trim
): CuttingOptimizationResult[] {
  // Group pieces by materialId and thickness
  const groups = new Map<string, Piece[]>();

  pieces.forEach(p => {
    // Unroll quantity
    for (let q = 0; q < p.quantity; q++) {
      const key = `${p.materialId}__${p.thickness}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(p);
    }
  });

  const results: CuttingOptimizationResult[] = [];

  groups.forEach((groupPieces, key) => {
    const [matId, thicknessStr] = key.split('__');
    const thickness = parseFloat(thicknessStr);
    const material = materials.find(m => m.id === matId) || materials[0];

    const sheetWidth = material.sheetWidth || 2750;
    const sheetLength = material.sheetLength || 1850;

    // Usable bounds on sheet after edge trims
    const usableW = sheetWidth - 2 * trimMargin;
    const usableH = sheetLength - 2 * trimMargin;

    // Sort pieces by largest area descending (First Fit Decreasing heuristic)
    const sorted = [...groupPieces].sort((a, b) => {
      const areaA = a.length * a.width;
      const areaB = b.length * b.width;
      return areaB - areaA;
    });

    const sheets: CutSheet[] = [];
    const unplaced: Piece[] = [];

    // Helper to start a new sheet
    function createNewSheet(index: number): { sheet: CutSheet; freeRects: FreeRect[] } {
      const sheet: CutSheet = {
        id: `sheet_${matId}_${index}`,
        sheetIndex: index + 1,
        materialId: matId,
        thickness,
        sheetWidth,
        sheetLength,
        kerf,
        trimMargin,
        pieces: [],
        usedAreaMm2: 0,
        totalAreaMm2: sheetWidth * sheetLength,
        efficiencyPercent: 0,
        wastePercent: 100,
        cuts: []
      };

      const initialRect: FreeRect = {
        x: trimMargin,
        y: trimMargin,
        width: usableW,
        height: usableH
      };

      return { sheet, freeRects: [initialRect] };
    }

    let current = createNewSheet(0);
    sheets.push(current.sheet);

    // Place each piece
    sorted.forEach((p, pIndex) => {
      let placed = false;
      const pLen = p.length;
      const pWid = p.width;
      const canRotate = p.grain === 'none';

      // Try placing on existing sheets
      for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
        const activeSheet = sheets[sIdx];
        const freeRects = (sIdx === sheets.length - 1) ? current.freeRects : [];

        // Find best fitting free rect (Best Area Fit)
        let bestRectIdx = -1;
        let bestRotate = false;
        let bestScore = Number.MAX_VALUE;

        for (let r = 0; r < freeRects.length; r++) {
          const rect = freeRects[r];

          // Check standard orientation (width=pLen, height=pWid)
          if (pLen <= rect.width && pWid <= rect.height) {
            const leftover = (rect.width * rect.height) - (pLen * pWid);
            if (leftover < bestScore) {
              bestScore = leftover;
              bestRectIdx = r;
              bestRotate = false;
            }
          }

          // Check rotated orientation if allowed
          if (canRotate && pWid <= rect.width && pLen <= rect.height) {
            const leftover = (rect.width * rect.height) - (pWid * pLen);
            if (leftover < bestScore) {
              bestScore = leftover;
              bestRectIdx = r;
              bestRotate = true;
            }
          }
        }

        if (bestRectIdx !== -1) {
          const targetRect = freeRects[bestRectIdx];
          const w = bestRotate ? pWid : pLen;
          const h = bestRotate ? pLen : pWid;

          // Place piece
          const placedPiece: PlacedPiece = {
            piece: p,
            x: targetRect.x,
            y: targetRect.y,
            width: w,
            height: h,
            rotated: bestRotate
          };

          activeSheet.pieces.push(placedPiece);
          activeSheet.usedAreaMm2 += (w * h);

          // Split remaining space into 2 new free rects (Guillotine cut)
          freeRects.splice(bestRectIdx, 1);

          const rightW = targetRect.width - w - kerf;
          const bottomH = targetRect.height - h - kerf;

          if (rightW > 50) {
            freeRects.push({
              x: targetRect.x + w + kerf,
              y: targetRect.y,
              width: rightW,
              height: targetRect.height
            });
          }

          if (bottomH > 50) {
            freeRects.push({
              x: targetRect.x,
              y: targetRect.y + h + kerf,
              width: w,
              height: bottomH
            });
          }

          placed = true;
          break;
        }
      }

      // If cannot fit in current sheets, create new sheet!
      if (!placed) {
        current = createNewSheet(sheets.length);
        sheets.push(current.sheet);

        const targetRect = current.freeRects[0];
        const canFitStandard = (pLen <= targetRect.width && pWid <= targetRect.height);
        const canFitRotated = canRotate && (pWid <= targetRect.width && pLen <= targetRect.height);

        if (canFitStandard || canFitRotated) {
          const rotate = !canFitStandard && canFitRotated;
          const w = rotate ? pWid : pLen;
          const h = rotate ? pLen : pWid;

          current.sheet.pieces.push({
            piece: p,
            x: targetRect.x,
            y: targetRect.y,
            width: w,
            height: h,
            rotated: rotate
          });
          current.sheet.usedAreaMm2 += (w * h);

          current.freeRects.splice(0, 1);
          const rightW = targetRect.width - w - kerf;
          const bottomH = targetRect.height - h - kerf;

          if (rightW > 50) {
            current.freeRects.push({
              x: targetRect.x + w + kerf,
              y: targetRect.y,
              width: rightW,
              height: targetRect.height
            });
          }
          if (bottomH > 50) {
            current.freeRects.push({
              x: targetRect.x,
              y: targetRect.y + h + kerf,
              width: w,
              height: bottomH
            });
          }
        } else {
          unplaced.push(p);
        }
      }
    });

    // Compute efficiency metrics for each sheet
    let totalUsedAllSheets = 0;
    let totalAreaAllSheets = 0;

    sheets.forEach(s => {
      s.efficiencyPercent = Math.round((s.usedAreaMm2 / s.totalAreaMm2) * 1000) / 10;
      s.wastePercent = Math.round((100 - s.efficiencyPercent) * 10) / 10;
      totalUsedAllSheets += s.usedAreaMm2;
      totalAreaAllSheets += s.totalAreaMm2;
    });

    const overallEff = totalAreaAllSheets > 0
      ? Math.round((totalUsedAllSheets / totalAreaAllSheets) * 1000) / 10
      : 0;

    results.push({
      materialId: matId,
      materialName: material.name,
      thickness,
      totalPieces: groupPieces.length,
      sheetsNeeded: sheets.length,
      sheets,
      overallEfficiencyPercent: overallEff,
      overallWastePercent: Math.round((100 - overallEff) * 10) / 10,
      unplacedPieces: unplaced
    });
  });

  return results;
}
