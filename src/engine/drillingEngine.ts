/**
 * MarcenariaCAD Pro - Drilling & Machining Engine (System 32 & CNC)
 */

import { DrillingOperation, SlotOperation, Piece } from '../types/furniture';

export function calculateHingePositions(doorHeight: number): number[] {
  // Return Y positions in mm from door bottom
  const topBottomMargin = 100; // mm from top and bottom
  
  if (doorHeight <= 900) {
    // 2 hinges
    return [topBottomMargin, doorHeight - topBottomMargin];
  } else if (doorHeight <= 1600) {
    // 3 hinges
    const mid = doorHeight / 2;
    return [topBottomMargin, mid, doorHeight - topBottomMargin];
  } else if (doorHeight <= 2000) {
    // 4 hinges
    const span = doorHeight - 2 * topBottomMargin;
    const step = span / 3;
    return [
      topBottomMargin,
      topBottomMargin + step,
      topBottomMargin + 2 * step,
      doorHeight - topBottomMargin
    ];
  } else {
    // 5 hinges
    const span = doorHeight - 2 * topBottomMargin;
    const step = span / 4;
    return [
      topBottomMargin,
      topBottomMargin + step,
      topBottomMargin + 2 * step,
      topBottomMargin + 3 * step,
      doorHeight - topBottomMargin
    ];
  }
}

/**
 * Generate 35mm hinge cup drillings on door
 */
export function generateDoorHingeDrillings(
  doorWidth: number,
  doorHeight: number,
  hingeSide: 'left' | 'right'
): DrillingOperation[] {
  const positionsY = calculateHingePositions(doorHeight);
  const cupDistance = 21.5; // distance from edge to hole center (for 35mm cup with 4mm tab)
  const x = hingeSide === 'left' ? cupDistance : (doorWidth - cupDistance);
  
  const drillings: DrillingOperation[] = [];
  
  positionsY.forEach((y, idx) => {
    // 35mm Cup hole
    drillings.push({
      id: `drill_hinge_cup_${idx}`,
      name: `Caneco Dobradiça #${idx + 1}`,
      type: 'hinge_cup',
      diameter: 35,
      depth: 12.5,
      isThrough: false,
      x,
      y,
      face: 'back',
      description: 'Furo caneco 35mm para dobradiça de pressão'
    });
    
    // Fixation pilot holes (45mm spread or 48mm spread, 9.5mm offset)
    drillings.push({
      id: `drill_hinge_screw1_${idx}`,
      name: `Parafuso Fixação Dobradiça #${idx + 1}A`,
      type: 'hinge_screw',
      diameter: 2.5,
      depth: 10,
      isThrough: false,
      x: hingeSide === 'left' ? (x + 9.5) : (x - 9.5),
      y: y - 22.5,
      face: 'back',
      description: 'Furo guia parafuso fixação'
    });
    drillings.push({
      id: `drill_hinge_screw2_${idx}`,
      name: `Parafuso Fixação Dobradiça #${idx + 1}B`,
      type: 'hinge_screw',
      diameter: 2.5,
      depth: 10,
      isThrough: false,
      x: hingeSide === 'left' ? (x + 9.5) : (x - 9.5),
      y: y + 22.5,
      face: 'back',
      description: 'Furo guia parafuso fixação'
    });
  });
  
  return drillings;
}

/**
 * Generate System 32 line boring for cabinet laterals and dividers
 */
export function generateSystem32LineBore(
  pieceHeight: number,
  pieceDepth: number,
  startOffset: number = 100,
  endOffset: number = 100,
  frontRowDist: number = 37,
  backRowDist: number = 69
): DrillingOperation[] {
  const drillings: DrillingOperation[] = [];
  const pitch = 32; // mm
  
  const usableHeight = pieceHeight - startOffset - endOffset;
  const numHoles = Math.max(1, Math.floor(usableHeight / pitch));
  
  for (let i = 0; i <= numHoles; i++) {
    const y = startOffset + i * pitch;
    
    // Front row (usually 37mm from front edge)
    drillings.push({
      id: `drill_sys32_front_${i}`,
      name: `Furo Sist. 32 Frontal #${i + 1}`,
      type: 'system32',
      diameter: 5,
      depth: 12,
      isThrough: false,
      x: frontRowDist,
      y,
      face: 'left',
      description: 'Furação Sistema 32 passo 32mm para suportes e corrediças'
    });
    
    // Back row (usually 37mm or 69mm from back edge)
    const backX = pieceDepth - backRowDist;
    if (backX > frontRowDist + 50) {
      drillings.push({
        id: `drill_sys32_back_${i}`,
        name: `Furo Sist. 32 Traseiro #${i + 1}`,
        type: 'system32',
        diameter: 5,
        depth: 12,
        isThrough: false,
        x: backX,
        y,
        face: 'left',
        description: 'Furação Sistema 32 passo 32mm traseira'
      });
    }
  }
  
  return drillings;
}

/**
 * Generate Minifix + Dowel joint drillings for base/top panels
 */
export function generateMinifixJointDrillings(
  panelLength: number,
  panelWidth: number
): DrillingOperation[] {
  const drillings: DrillingOperation[] = [];
  
  // Offsets along panel depth (panelWidth)
  const offsets = [50, panelWidth - 50];
  if (panelWidth > 450) {
    offsets.splice(1, 0, Math.round(panelWidth / 2));
  }
  
  offsets.forEach((depthDist, idx) => {
    // Left side joint (inset 34mm from left edge)
    drillings.push({
      id: `drill_minifix_l_${idx}`,
      name: `Minifix Tambor Esq #${idx + 1}`,
      type: 'minifix_cam',
      diameter: 15,
      depth: 12,
      isThrough: false,
      x: 34,
      y: depthDist,
      face: 'bottom',
      description: 'Alojamento do tambor Minifix 15mm (lateral esquerda)'
    });
    
    // Wood dowel 8mm (inset 66mm from left edge, 32mm from minifix)
    drillings.push({
      id: `drill_dowel_l_${idx}`,
      name: `Cavilha Esq #${idx + 1}`,
      type: 'dowel',
      diameter: 8,
      depth: 24,
      isThrough: false,
      x: 66,
      y: depthDist,
      face: 'bottom',
      description: 'Furo para cavilha de guia 8x30mm'
    });
    
    // Right side joint (inset 34mm from right edge)
    drillings.push({
      id: `drill_minifix_r_${idx}`,
      name: `Minifix Tambor Dir #${idx + 1}`,
      type: 'minifix_cam',
      diameter: 15,
      depth: 12,
      isThrough: false,
      x: panelLength - 34,
      y: depthDist,
      face: 'bottom',
      description: 'Alojamento do tambor Minifix 15mm (lateral direita)'
    });
    drillings.push({
      id: `drill_dowel_r_${idx}`,
      name: `Cavilha Dir #${idx + 1}`,
      type: 'dowel',
      diameter: 8,
      depth: 24,
      isThrough: false,
      x: panelLength - 66,
      y: depthDist,
      face: 'bottom',
      description: 'Furo para cavilha de guia 8x30mm'
    });
  });
  
  return drillings;
}

/**
 * Generate standard back panel groove (rebaixo/rasgo)
 */
export function generateBackGrooveSlot(
  width: number,
  depth: number,
  backThickness: number = 6,
  offsetFromBack: number = 15
): SlotOperation {
  return {
    id: 'slot_back_groove',
    name: 'Rasgo para Fundo 6mm',
    width: backThickness + 0.5, // 6.5mm
    depth: 8,                   // 8mm canal
    distanceFromEdge: offsetFromBack,
    edge: 'right'
  };
}
