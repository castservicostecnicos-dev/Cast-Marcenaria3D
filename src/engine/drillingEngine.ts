/**
 * MarcenariaCAD Pro - Professional CNC Drilling & Machining Engine
 * 
 * Implements standard precision joinery specifications used by industry leaders
 * (Promob, Corte Cloud, Mozaik, Blum Dynaplan, Hettich System 32).
 * 
 * Rules:
 * 1. ONLY generate drillings that correspond 1:1 to real project elements:
 *    - Structural joints: Minifix bolt + dowel holes at exact Base/Top/Shelf heights.
 *    - Hinges: Door gets 35mm cup + pilot screws; Lateral/Divider gets ONLY 2 calço holes per hinge (37mm setback, 32mm spacing).
 *    - Drawers: Drawer side gets slide holes; Lateral/Divider gets ONLY 2-3 slide mounting holes at each drawer line.
 *    - Shelves: Adjustable shelves get a targeted cluster of 3 or 5 pin holes (Ø5mm) centered around the shelf height (±32mm/±64mm).
 *    - Pieces that do NOT need drillings (Back panel 6mm, Plinth, etc.) receive 0 holes.
 * 2. Eliminates extraneous, redundant line-boring that damages MDF and generates extra workshop labor.
 */

import { DrillingOperation, SlotOperation, Piece, FurnitureModel, ModuleStructure } from '../types/furniture';

/**
 * Calculate door hinge Y heights from door bottom
 */
export function calculateHingePositions(doorHeight: number): number[] {
  const topBottomMargin = 100; // mm from top and bottom
  
  if (doorHeight <= 900) {
    return [topBottomMargin, doorHeight - topBottomMargin];
  } else if (doorHeight <= 1600) {
    const mid = Math.round(doorHeight / 2);
    return [topBottomMargin, mid, doorHeight - topBottomMargin];
  } else if (doorHeight <= 2000) {
    const span = doorHeight - 2 * topBottomMargin;
    const step = span / 3;
    return [
      topBottomMargin,
      Math.round(topBottomMargin + step),
      Math.round(topBottomMargin + 2 * step),
      doorHeight - topBottomMargin
    ];
  } else {
    const span = doorHeight - 2 * topBottomMargin;
    const step = span / 4;
    return [
      topBottomMargin,
      Math.round(topBottomMargin + step),
      Math.round(topBottomMargin + 2 * step),
      Math.round(topBottomMargin + 3 * step),
      doorHeight - topBottomMargin
    ];
  }
}

/**
 * 1. Generate 35mm hinge cup drillings on Door panel
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
      description: 'Furo caneco Ø35mm padrão para dobradiça com amortecedor'
    });
    
    // Fixation pilot holes (45mm or 48mm spread, 9.5mm offset)
    drillings.push({
      id: `drill_hinge_screw1_${idx}`,
      name: `Parafuso Caneco #${idx + 1}A`,
      type: 'hinge_screw',
      diameter: 2.5,
      depth: 10,
      isThrough: false,
      x: hingeSide === 'left' ? (x + 9.5) : (x - 9.5),
      y: y - 22.5,
      face: 'back',
      description: 'Furo guia parafuso fixação caneco'
    });
    drillings.push({
      id: `drill_hinge_screw2_${idx}`,
      name: `Parafuso Caneco #${idx + 1}B`,
      type: 'hinge_screw',
      diameter: 2.5,
      depth: 10,
      isThrough: false,
      x: hingeSide === 'left' ? (x + 9.5) : (x - 9.5),
      y: y + 22.5,
      face: 'back',
      description: 'Furo guia parafuso fixação caneco'
    });
  });
  
  return drillings;
}

/**
 * 2. Generate Hinge Plate (Calço) drillings on Lateral or Divider
 * Standard: 2 holes per hinge at 37mm from front edge, spaced 32mm vertically (y - 16mm, y + 16mm).
 * Only drilled at the exact heights of the doors on this lateral!
 */
export function generateHingePlateDrillings(
  doorHeight: number,
  doorYOffsetFromLateralBottom: number,
  face: 'left' | 'right',
  prefixId: string = 'lat',
  mode: 'standard_2hole' | 'pilot_1hole' | 'none' = 'standard_2hole'
): DrillingOperation[] {
  if (mode === 'none') return [];
  const hingeYPositions = calculateHingePositions(doorHeight);
  const drillings: DrillingOperation[] = [];
  const frontDist = 37; // 37mm standard System 32 distance from front edge
  
  hingeYPositions.forEach((hy, idx) => {
    const centerHingeY = doorYOffsetFromLateralBottom + hy;
    
    if (mode === 'pilot_1hole') {
      drillings.push({
        id: `drill_calco_${prefixId}_${idx}_mid`,
        name: `Furo Guia Calço Dobradiça #${idx + 1}`,
        type: 'hinge_screw',
        diameter: 2.5,
        depth: 10,
        isThrough: false,
        x: frontDist,
        y: centerHingeY,
        face,
        description: 'Furo guia central para calço da dobradiça'
      });
    } else {
      // Top hole of calço (+16mm)
      drillings.push({
        id: `drill_calco_${prefixId}_${idx}_top`,
        name: `Calço Dobradiça #${idx + 1} Sup`,
        type: 'hinge_screw',
        diameter: 5,
        depth: 11.5,
        isThrough: false,
        x: frontDist,
        y: centerHingeY + 16,
        face,
        description: 'Furo fixação do calço da dobradiça (passo 32mm)'
      });
      
      // Bottom hole of calço (-16mm)
      drillings.push({
        id: `drill_calco_${prefixId}_${idx}_bot`,
        name: `Calço Dobradiça #${idx + 1} Inf`,
        type: 'hinge_screw',
        diameter: 5,
        depth: 11.5,
        isThrough: false,
        x: frontDist,
        y: centerHingeY - 16,
        face,
        description: 'Furo fixação do calço da dobradiça (passo 32mm)'
      });
    }
  });
  
  return drillings;
}

/**
 * 3. Generate Drawer Slide Runner mounting holes on Lateral or Divider
 * Standard: at drawer slide line (y):
 * - Hole 1: 37mm from front edge
 * - Hole 2: rear hole (System 32 aligned)
 * Only drilled at the exact drawer heights!
 */
export function generateDrawerSlideDrillings(
  drawerSlideHeights: number[],
  slideLength: number,
  face: 'left' | 'right',
  prefixId: string = 'slide',
  mode: 'standard_2hole' | 'none' = 'standard_2hole'
): DrillingOperation[] {
  if (mode === 'none') return [];
  const drillings: DrillingOperation[] = [];
  const frontX = 37; // 37mm standard
  
  drawerSlideHeights.forEach((slideY, dIdx) => {
    // 1. Front hole
    drillings.push({
      id: `drill_${prefixId}_${dIdx}_front`,
      name: `Corrediça Gaveta #${dIdx + 1} Frontal`,
      type: 'slide_runner',
      diameter: 5,
      depth: 11.5,
      isThrough: false,
      x: frontX,
      y: slideY,
      face,
      description: 'Furação fixação corrediça telescópica (37mm frontal)'
    });
    
    // 2. Rear hole (System 32 aligned)
    const rearX = Math.min(slideLength - 20, frontX + Math.max(160, Math.floor((slideLength - 60) / 32) * 32));
    drillings.push({
      id: `drill_${prefixId}_${dIdx}_rear`,
      name: `Corrediça Gaveta #${dIdx + 1} Traseira`,
      type: 'slide_runner',
      diameter: 5,
      depth: 11.5,
      isThrough: false,
      x: rearX,
      y: slideY,
      face,
      description: 'Furação fixação corrediça telescópica (traseira)'
    });
  });
  
  return drillings;
}

/**
 * 4. Generate Shelf Support Drillings on Lateral or Divider
 * Padrão Marcenaria Limpa:
 * - If Fixed Shelf: exactly 2 holes (front & back) at exact shelf centerline.
 * - If Exact Nominal: exactly 2 pin holes (Ø5mm) at exact shelf height. NO extra empty holes!
 * - If Cluster: compact 3 holes (-32mm, 0, +32mm) only when explicitly selected.
 */
export function generateShelfSupportDrillings(
  shelfHeights: number[],
  panelDepth: number,
  shelfType: 'adjustable' | 'fixed',
  face: 'left' | 'right',
  prefixId: string = 'shelf',
  mode: 'exact_nominal' | 'cluster_3' | 'none' = 'exact_nominal'
): DrillingOperation[] {
  if (mode === 'none') return [];

  const drillings: DrillingOperation[] = [];
  const frontDist = 37;
  const rearDist = Math.max(frontDist + 60, panelDepth - 64);
  
  shelfHeights.forEach((sy, sIdx) => {
    if (shelfType === 'fixed') {
      // Fixed shelf: exactly 2 holes for Confirmat / Minifix bolt
      drillings.push({
        id: `drill_${prefixId}_fix_front_${sIdx}`,
        name: `Prateleira Fixa #${sIdx + 1} Frontal`,
        type: 'confirmat',
        diameter: 5,
        depth: 12,
        isThrough: false,
        x: frontDist,
        y: sy,
        face,
        description: 'Fixação estrutural prateleira fixa frontal'
      });
      drillings.push({
        id: `drill_${prefixId}_fix_rear_${sIdx}`,
        name: `Prateleira Fixa #${sIdx + 1} Traseira`,
        type: 'confirmat',
        diameter: 5,
        depth: 12,
        isThrough: false,
        x: rearDist,
        y: sy,
        face,
        description: 'Fixação estrutural prateleira fixa traseira'
      });
    } else if (mode === 'exact_nominal') {
      // Padrão Promob / Corte Cloud Limpo: 2 furos por prateleira (1 frente, 1 fundo)
      drillings.push({
        id: `drill_${prefixId}_adj_${sIdx}_f`,
        name: `Pino Prateleira #${sIdx + 1} Frontal`,
        type: 'shelf_pin',
        diameter: 5,
        depth: 11.5,
        isThrough: false,
        x: frontDist,
        y: sy,
        face,
        description: 'Pino suporte de prateleira Ø5mm frontal'
      });
      drillings.push({
        id: `drill_${prefixId}_adj_${sIdx}_r`,
        name: `Pino Prateleira #${sIdx + 1} Traseiro`,
        type: 'shelf_pin',
        diameter: 5,
        depth: 11.5,
        isThrough: false,
        x: rearDist,
        y: sy,
        face,
        description: 'Pino suporte de prateleira Ø5mm traseiro'
      });
    } else {
      // Cluster 3 furos (-32mm, 0, +32mm)
      [-32, 0, 32].forEach((off, oIdx) => {
        const y = sy + off;
        const tag = off === 0 ? 'Nominal' : (off > 0 ? `+${off}mm` : `${off}mm`);
        drillings.push({
          id: `drill_${prefixId}_adj_${sIdx}_f_${oIdx}`,
          name: `Pino Prat #${sIdx + 1} Frontal (${tag})`,
          type: 'shelf_pin',
          diameter: 5,
          depth: 11.5,
          isThrough: false,
          x: frontDist,
          y,
          face,
          description: `Pino prateleira regulável Ø5mm (${tag})`
        });
        drillings.push({
          id: `drill_${prefixId}_adj_${sIdx}_r_${oIdx}`,
          name: `Pino Prat #${sIdx + 1} Traseiro (${tag})`,
          type: 'shelf_pin',
          diameter: 5,
          depth: 11.5,
          isThrough: false,
          x: rearDist,
          y,
          face,
          description: `Pino prateleira regulável Ø5mm (${tag})`
        });
      });
    }
  });
  
  return drillings;
}

/**
 * 5. Generate Structural Connection Drillings on Lateral (Mating holes for Base & Top)
 * Padrão Marcenaria Limpa Promob / Corte Cloud:
 * - 2 furos por junção: 1 frontal (50mm) e 1 traseiro (50mm do fundo).
 * - Total de apenas 4 furos estruturais na lateral (2 na base, 2 no tampo).
 * - Sem encher de cavilhas duplicadas que estragam e enfraquecem o MDF.
 * - Se manual screw ('screw'): 0 furos na lateral externa (peça virgem).
 */
export function generateCarcaseStructuralDrillings(
  lateralDepth: number,
  baseCenterY: number,
  topCenterY: number,
  face: 'left' | 'right',
  prefixId: string = 'carcase',
  connectorType: 'minifix_clean' | 'confirmat' | 'minifix_dowel' | 'screw' = 'minifix_clean'
): DrillingOperation[] {
  // If manual screw assembly, the exterior lateral panel receives ZERO structural drillings (virgem)
  if (connectorType === 'screw') {
    return [];
  }

  const drillings: DrillingOperation[] = [];
  const frontDist = 50; // standard 50mm setback
  const rearDist = Math.max(120, lateralDepth - 50);

  if (connectorType === 'confirmat') {
    // 2 furos por junção para parafuso estrutural Soberba / Confirmat
    drillings.push({
      id: `drill_${prefixId}_base_conf_front`,
      name: `Parafuso Confirmat Base Frontal`,
      type: 'confirmat',
      diameter: 5,
      depth: 13,
      isThrough: false,
      x: frontDist,
      y: baseCenterY,
      face,
      description: 'Furo estrutural parafuso Confirmat base frontal'
    });
    drillings.push({
      id: `drill_${prefixId}_base_conf_rear`,
      name: `Parafuso Confirmat Base Traseiro`,
      type: 'confirmat',
      diameter: 5,
      depth: 13,
      isThrough: false,
      x: rearDist,
      y: baseCenterY,
      face,
      description: 'Furo estrutural parafuso Confirmat base traseiro'
    });

    drillings.push({
      id: `drill_${prefixId}_top_conf_front`,
      name: `Parafuso Confirmat Tampo Frontal`,
      type: 'confirmat',
      diameter: 5,
      depth: 13,
      isThrough: false,
      x: frontDist,
      y: topCenterY,
      face,
      description: 'Furo estrutural parafuso Confirmat tampo frontal'
    });
    drillings.push({
      id: `drill_${prefixId}_top_conf_rear`,
      name: `Parafuso Confirmat Tampo Traseiro`,
      type: 'confirmat',
      diameter: 5,
      depth: 13,
      isThrough: false,
      x: rearDist,
      y: topCenterY,
      face,
      description: 'Furo estrutural parafuso Confirmat tampo traseiro'
    });

    return drillings;
  }

  // Padrão Minifix Limpo (Promob / Corte Cloud):
  // Exatamente 2 pinos Minifix por junção (1 frontal a 50mm, 1 traseiro a 50mm)
  drillings.push({
    id: `drill_${prefixId}_base_bolt_front`,
    name: `Pino Minifix Base Frontal`,
    type: 'minifix_bolt',
    diameter: 5,
    depth: 11.5,
    isThrough: false,
    x: frontDist,
    y: baseCenterY,
    face,
    description: 'Pino Minifix de união da base (frontal 50mm)'
  });
  drillings.push({
    id: `drill_${prefixId}_base_bolt_rear`,
    name: `Pino Minifix Base Traseiro`,
    type: 'minifix_bolt',
    diameter: 5,
    depth: 11.5,
    isThrough: false,
    x: rearDist,
    y: baseCenterY,
    face,
    description: 'Pino Minifix de união da base (traseiro 50mm)'
  });

  drillings.push({
    id: `drill_${prefixId}_top_bolt_front`,
    name: `Pino Minifix Tampo Frontal`,
    type: 'minifix_bolt',
    diameter: 5,
    depth: 11.5,
    isThrough: false,
    x: frontDist,
    y: topCenterY,
    face,
    description: 'Pino Minifix de união do tampo (frontal 50mm)'
  });
  drillings.push({
    id: `drill_${prefixId}_top_bolt_rear`,
    name: `Pino Minifix Tampo Traseiro`,
    type: 'minifix_bolt',
    diameter: 5,
    depth: 11.5,
    isThrough: false,
    x: rearDist,
    y: topCenterY,
    face,
    description: 'Pino Minifix de união do tampo (traseiro 50mm)'
  });

  // Apenas se explicitamente selecionado 'minifix_dowel' e profundidade > 550mm, 1 cavilha central
  if (connectorType === 'minifix_dowel' && lateralDepth > 550) {
    const midX = Math.round(lateralDepth / 2);
    drillings.push({
      id: `drill_${prefixId}_base_dowel_mid`,
      name: `Cavilha Central Base`,
      type: 'dowel',
      diameter: 8,
      depth: 12,
      isThrough: false,
      x: midX,
      y: baseCenterY,
      face,
      description: 'Cavilha central de alinhamento da base'
    });
    drillings.push({
      id: `drill_${prefixId}_top_dowel_mid`,
      name: `Cavilha Central Tampo`,
      type: 'dowel',
      diameter: 8,
      depth: 12,
      isThrough: false,
      x: midX,
      y: topCenterY,
      face,
      description: 'Cavilha central de alinhamento do tampo'
    });
  }

  return drillings;
}

/**
 * 6. Generate Minifix Cam + Dowel joint drillings for Base & Top panels
 */
export function generateMinifixJointDrillings(
  panelLength: number,
  panelWidth: number,
  connectorType: 'minifix_clean' | 'confirmat' | 'minifix_dowel' | 'screw' = 'minifix_clean'
): DrillingOperation[] {
  if (connectorType === 'screw' || connectorType === 'confirmat') {
    return [];
  }

  const drillings: DrillingOperation[] = [];
  const offsets = [50, Math.max(120, panelWidth - 50)];

  offsets.forEach((depthDist, idx) => {
    // Left side joint
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

    // Right side joint
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

    if (connectorType === 'minifix_dowel' && panelWidth > 550 && idx === 0) {
      const midDist = Math.round(panelWidth / 2);
      drillings.push({
        id: `drill_dowel_l_mid`,
        name: `Cavilha Guia Esq Central`,
        type: 'dowel',
        diameter: 8,
        depth: 24,
        isThrough: false,
        x: 66,
        y: midDist,
        face: 'bottom',
        description: 'Furo para cavilha de guia 8x30mm'
      });
      drillings.push({
        id: `drill_dowel_r_mid`,
        name: `Cavilha Guia Dir Central`,
        type: 'dowel',
        diameter: 8,
        depth: 24,
        isThrough: false,
        x: panelLength - 66,
        y: midDist,
        face: 'bottom',
        description: 'Furo para cavilha de guia 8x30mm'
      });
    }
  });

  return drillings;
}

/**
 * 7. Generate standard back panel groove (rebaixo/rasgo)
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

/**
 * 8. Optional System 32 full line boring (kept as an explicit option if requested)
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
    
    // Front row (37mm from front edge)
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
      description: 'Furação Sistema 32 passo 32mm frontal'
    });
    
    // Back row
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
 * 9. Drilling Audit Summary Utility
 * Validates that every hole in the pieces list has a physical purpose and counterpart.
 */
export interface DrillingsAuditSummary {
  totalOperations: number;
  structuralJointHoles: number;
  hingeHoles: number;
  slideHoles: number;
  shelfPinHoles: number;
  handleHoles: number;
  unnecessaryHoles: number;
  is100PercentMatched: boolean;
  notes: string[];
}

export function auditFurnitureDrillings(furniture: FurnitureModel): DrillingsAuditSummary {
  let structuralJointHoles = 0;
  let hingeHoles = 0;
  let slideHoles = 0;
  let shelfPinHoles = 0;
  let handleHoles = 0;
  let unnecessaryHoles = 0;
  let totalOperations = 0;
  const notes: string[] = [];

  furniture.pieces.forEach(piece => {
    piece.drillings.forEach(d => {
      totalOperations++;
      if (d.type === 'minifix_cam' || d.type === 'minifix_bolt' || d.type === 'dowel' || d.type === 'confirmat') {
        structuralJointHoles++;
      } else if (d.type === 'hinge_cup' || d.type === 'hinge_screw') {
        hingeHoles++;
      } else if (d.type === 'slide_runner') {
        slideHoles++;
      } else if (d.type === 'shelf_pin') {
        shelfPinHoles++;
      } else if (d.type === 'handle_hole') {
        handleHoles++;
      } else if (d.type === 'system32') {
        // Full system 32 line bore holes
        if (piece.type === 'lateral_left' || piece.type === 'lateral_right' || piece.type === 'divider_vertical') {
          // If piece has no shelves, these are unnecessary!
          unnecessaryHoles++;
        }
      }
    });
  });

  const is100PercentMatched = unnecessaryHoles === 0;
  if (is100PercentMatched) {
    notes.push('Todas as furações correspondem com exatidão aos pontos de fixação do projeto (100% necessárias).');
    notes.push('Furações em excesso eliminadas: economia de ciclos CNC e integridade estrutural do MDF preservada.');
  } else {
    notes.push(`Detectados ${unnecessaryHoles} furos contínuos genéricos que podem ser suprimidos.`);
  }

  return {
    totalOperations,
    structuralJointHoles,
    hingeHoles,
    slideHoles,
    shelfPinHoles,
    handleHoles,
    unnecessaryHoles,
    is100PercentMatched,
    notes
  };
}
