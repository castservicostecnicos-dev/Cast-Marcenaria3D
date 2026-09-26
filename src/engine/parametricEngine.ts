/**
 * MarcenariaCAD Pro - Core Parametric Modeling Engine
 * Recalculates all pieces, structural modules, spatial positions,
 * edge bandings, hardware items and machining operations.
 */

import { FurnitureModel, ModuleStructure, Piece, HardwareItem, EdgeBandingConfig } from '../types/furniture';
import { DEFAULT_HARDWARE_CATALOG } from '../data/defaultHardware';
import {
  generateDoorHingeDrillings,
  generateSystem32LineBore,
  generateMinifixJointDrillings,
  generateBackGrooveSlot,
  calculateHingePositions
} from './drillingEngine';

export interface ParametricInput {
  name: string;
  type: FurnitureModel['type'];
  width: number;
  height: number;
  depth: number;
  carcaseMaterialId?: string;
  frontMaterialId?: string;
  backMaterialId?: string;
  edgeTapeId?: string;
  carcaseThickness?: number;
  frontThickness?: number;
  backThickness?: number;
  plinthHeight?: number;
  modules?: ModuleStructure[];
  hardwareSpecs?: FurnitureModel['hardwareSpecs'];
}

export function createDefaultEdgeBanding(tapeId: string, thickness: number = 1.0, isDoor: boolean = false): EdgeBandingConfig {
  if (isDoor) {
    // Doors get edge banding on all 4 sides
    return {
      top: true,
      bottom: true,
      left: true,
      right: true,
      tapeMaterialId: tapeId,
      tapeThickness: thickness,
      tapeWidth: 22
    };
  }
  
  // Standard carcase piece: front side taped with 1mm tape
  return {
    top: false,
    bottom: false,
    left: true, // front edge
    right: false,
    tapeMaterialId: tapeId,
    tapeThickness: thickness,
    tapeWidth: 22
  };
}

export function recalculateFurnitureModel(model: FurnitureModel): FurnitureModel {
  const {
    width,
    height,
    depth,
    carcaseThickness,
    frontThickness,
    backThickness,
    plinthHeight,
    backGrooveOffset,
    doorGap,
    drawerRunnerClearance,
    carcaseMaterialId,
    frontMaterialId,
    backMaterialId,
    edgeTapeId
  } = model;

  const pieces: Piece[] = [];
  const hardwareMap: Map<string, HardwareItem> = new Map();

  function addHardware(code: string, qty: number) {
    const template = DEFAULT_HARDWARE_CATALOG.find(h => h.code === code) || DEFAULT_HARDWARE_CATALOG[0];
    if (hardwareMap.has(code)) {
      const existing = hardwareMap.get(code)!;
      existing.quantity += qty;
    } else {
      hardwareMap.set(code, {
        ...template,
        quantity: qty
      });
    }
  }

  // 1. CARCASE LATERALS (Lateral Esquerda e Lateral Direita)
  // Height = total height (or total height - plinth if plinth is separate)
  const lateralHeight = height;
  const lateralDepth = depth;

  // Lateral Esquerda
  const lateralLeftDrillings = generateSystem32LineBore(lateralHeight, lateralDepth, plinthHeight + 80, 80);
  const backGroove = generateBackGrooveSlot(lateralDepth, lateralHeight, backThickness, backGrooveOffset);

  pieces.push({
    id: 'pc_lat_esq',
    code: 'LAT-ESQ',
    name: 'Lateral Esquerda',
    type: 'lateral_left',
    moduleId: 'root',
    materialId: carcaseMaterialId,
    thickness: carcaseThickness,
    length: lateralHeight,
    width: lateralDepth,
    quantity: 1,
    grain: 'vertical',
    edgeBanding: {
      top: true,
      bottom: true,
      left: true, // front edge (1mm PVC)
      right: false,
      tapeMaterialId: edgeTapeId,
      tapeThickness: 1.0,
      tapeWidth: 22
    },
    drillings: lateralLeftDrillings,
    slots: [backGroove],
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    dimensions3D: {
      width: carcaseThickness,
      height: lateralHeight,
      depth: lateralDepth
    },
    notes: 'Lateral externa com furação Sistema 32 e canal traseiro'
  });

  // Lateral Direita
  pieces.push({
    id: 'pc_lat_dir',
    code: 'LAT-DIR',
    name: 'Lateral Direita',
    type: 'lateral_right',
    moduleId: 'root',
    materialId: carcaseMaterialId,
    thickness: carcaseThickness,
    length: lateralHeight,
    width: lateralDepth,
    quantity: 1,
    grain: 'vertical',
    edgeBanding: {
      top: true,
      bottom: true,
      left: true,
      right: false,
      tapeMaterialId: edgeTapeId,
      tapeThickness: 1.0,
      tapeWidth: 22
    },
    drillings: generateSystem32LineBore(lateralHeight, lateralDepth, plinthHeight + 80, 80),
    slots: [backGroove],
    position: {
      x: width - carcaseThickness,
      y: 0,
      z: 0
    },
    dimensions3D: {
      width: carcaseThickness,
      height: lateralHeight,
      depth: lateralDepth
    },
    notes: 'Lateral externa direita com furação Sistema 32'
  });

  // 2. BASE & TAMPO (Top and Bottom Panels)
  // Interior width between outer laterals
  const interiorWidth = width - 2 * carcaseThickness;
  const horizontalDepth = lateralDepth; // or lateralDepth - backGrooveOffset if applied

  // Base
  const baseDrillings = generateMinifixJointDrillings(interiorWidth, horizontalDepth);
  pieces.push({
    id: 'pc_base',
    code: 'BAS-INF',
    name: 'Base Inferior',
    type: 'base',
    moduleId: 'root',
    materialId: carcaseMaterialId,
    thickness: carcaseThickness,
    length: interiorWidth,
    width: horizontalDepth,
    quantity: 1,
    grain: 'horizontal',
    edgeBanding: {
      top: true, // front edge
      bottom: false,
      left: false,
      right: false,
      tapeMaterialId: edgeTapeId,
      tapeThickness: 1.0,
      tapeWidth: 22
    },
    drillings: baseDrillings,
    slots: [backGroove],
    position: {
      x: carcaseThickness,
      y: plinthHeight,
      z: 0
    },
    dimensions3D: {
      width: interiorWidth,
      height: carcaseThickness,
      depth: horizontalDepth
    },
    notes: 'Base estrutural com furação minifix e cavilha'
  });

  // Tampo Superior
  pieces.push({
    id: 'pc_tampo',
    code: 'TAM-SUP',
    name: 'Tampo Superior',
    type: 'top',
    moduleId: 'root',
    materialId: carcaseMaterialId,
    thickness: carcaseThickness,
    length: interiorWidth,
    width: horizontalDepth,
    quantity: 1,
    grain: 'horizontal',
    edgeBanding: {
      top: true, // front edge
      bottom: false,
      left: false,
      right: false,
      tapeMaterialId: edgeTapeId,
      tapeThickness: 1.0,
      tapeWidth: 22
    },
    drillings: generateMinifixJointDrillings(interiorWidth, horizontalDepth),
    slots: [backGroove],
    position: {
      x: carcaseThickness,
      y: height - carcaseThickness,
      z: 0
    },
    dimensions3D: {
      width: interiorWidth,
      height: carcaseThickness,
      depth: horizontalDepth
    },
    notes: 'Tampo superior estrutural'
  });

  // Add Minifix & Dowel hardware for Base & Top
  addHardware('UNI-MIN-15', 8);
  addHardware('UNI-CAV-830', 8);

  // 3. PLINTH / RODAPÉ (se plinthHeight > 0)
  if (plinthHeight > 0) {
    // Front plinth
    pieces.push({
      id: 'pc_rodape_front',
      code: 'ROD-FRT',
      name: 'Rodapé Frontal',
      type: 'plinth',
      moduleId: 'root',
      materialId: carcaseMaterialId,
      thickness: carcaseThickness,
      length: interiorWidth,
      width: plinthHeight,
      quantity: 1,
      grain: 'horizontal',
      edgeBanding: {
        top: true,
        bottom: true,
        left: false,
        right: false,
        tapeMaterialId: edgeTapeId,
        tapeThickness: 0.45,
        tapeWidth: 22
      },
      drillings: [],
      slots: [],
      position: {
        x: carcaseThickness,
        y: 0,
        z: 30 // 30mm recuo
      },
      dimensions3D: {
        width: interiorWidth,
        height: plinthHeight,
        depth: carcaseThickness
      }
    });

    // Pés plásticos niveladores
    const numFeet = interiorWidth > 1200 ? 6 : 4;
    addHardware('PE-NIV-100', numFeet);
  }

  // 4. MODULES & DIVIDERS
  const numModules = model.modules.length > 0 ? model.modules.length : 1;
  const interiorHeight = height - plinthHeight - 2 * carcaseThickness;
  const numDividers = numModules - 1;
  const totalDividersThickness = numDividers * carcaseThickness;
  const totalUsableWidth = interiorWidth - totalDividersThickness;
  const moduleSpanWidth = totalUsableWidth / numModules;

  let currentOffsetX = carcaseThickness;

  model.modules.forEach((mod, modIdx) => {
    // Recalculate module coordinates
    mod.width = moduleSpanWidth;
    mod.height = interiorHeight;
    mod.depth = horizontalDepth;
    mod.offsetX = currentOffsetX;

    // Shelves in this module
    if (mod.numShelves > 0) {
      const shelfDepth = horizontalDepth - 20; // 20mm clearance from front
      const shelfSpacing = interiorHeight / (mod.numShelves + 1);

      for (let s = 1; s <= mod.numShelves; s++) {
        const shelfY = plinthHeight + carcaseThickness + s * shelfSpacing;
        pieces.push({
          id: `pc_prat_${modIdx}_${s}`,
          code: `PRA-M${modIdx + 1}-${s}`,
          name: `Prateleira Módulo ${modIdx + 1} #${s}`,
          type: mod.shelfType === 'fixed' ? 'shelf_fixed' : 'shelf_adjustable',
          moduleId: mod.id,
          materialId: carcaseMaterialId,
          thickness: carcaseThickness,
          length: Math.round(moduleSpanWidth - (mod.shelfType === 'adjustable' ? 2 : 0)),
          width: shelfDepth,
          quantity: 1,
          grain: 'horizontal',
          edgeBanding: {
            top: true, // front edge
            bottom: false,
            left: false,
            right: false,
            tapeMaterialId: edgeTapeId,
            tapeThickness: 1.0,
            tapeWidth: 22
          },
          drillings: [],
          slots: [],
          position: {
            x: currentOffsetX + 1,
            y: shelfY,
            z: 15
          },
          dimensions3D: {
            width: moduleSpanWidth - 2,
            height: carcaseThickness,
            depth: shelfDepth
          }
        });

        // 4 shelf pins per adjustable shelf, or 4 confirmat/minifix if fixed
        if (mod.shelfType === 'adjustable') {
          addHardware('SUP-PRA-5MM', 4);
        } else {
          addHardware('UNI-MIN-15', 4);
          addHardware('UNI-CAV-830', 4);
        }
      }
    }

    // Drawers in this module
    if (mod.numDrawers > 0) {
      // If module is a dedicated gaveteiro (no doors, no shelves), drawers occupy full height
      const isDedicatedGaveteiro = mod.doorsType === 'none' && mod.numShelves === 0;
      const drawerHeightTotal = isDedicatedGaveteiro
        ? (interiorHeight - doorGap * 2)
        : (interiorHeight * 0.55);
      
      const singleDrawerFrontHeight = Math.round(
        (drawerHeightTotal - (mod.numDrawers - 1) * doorGap) / mod.numDrawers
      );
      
      // Standard slide lengths: 250, 300, 350, 400, 450, 500, 550 mm
      const maxAllowedSlide = Math.max(250, Math.floor((horizontalDepth - 50) / 50) * 50);
      const drawerSlideLength = Math.min(500, maxAllowedSlide);
      const drawerBoxDepth = drawerSlideLength;
      const drawerBoxThickness = 15; // 15mm standard carcase MDF/MDP for drawer box
      const drawerClearanceEachSide = 13; // 13mm clearance on each side for telescopic slide
      const drawerBoxOuterWidth = moduleSpanWidth - (drawerClearanceEachSide * 2);
      const drawerBoxInnerWidth = Math.round(drawerBoxOuterWidth - (drawerBoxThickness * 2));
      const drawerSideHeight = Math.max(90, Math.min(240, Math.round(singleDrawerFrontHeight - 35)));

      for (let d = 0; d < mod.numDrawers; d++) {
        const frontY = plinthHeight + carcaseThickness + doorGap + d * (singleDrawerFrontHeight + doorGap);
        const boxY = frontY + 15; // 15mm clearance from bottom of front panel

        // 1. Frente Externa da Gaveta (Drawer Front)
        pieces.push({
          id: `pc_gav_frente_${modIdx}_${d}`,
          code: `FRT-GAV-M${modIdx + 1}-${d + 1}`,
          name: `Frente Gaveta Módulo ${modIdx + 1} #${d + 1}`,
          type: 'drawer_front',
          moduleId: mod.id,
          materialId: frontMaterialId,
          thickness: frontThickness,
          length: Math.round(moduleSpanWidth - doorGap * 2),
          width: singleDrawerFrontHeight,
          quantity: 1,
          grain: 'horizontal',
          edgeBanding: createDefaultEdgeBanding(edgeTapeId, 1.0, true),
          drillings: [
            {
              id: `drill_handle_${modIdx}_${d}_1`,
              name: 'Furo Puxador A',
              type: 'handle_hole',
              diameter: 4.5,
              depth: frontThickness,
              isThrough: true,
              x: (moduleSpanWidth - 160) / 2,
              y: singleDrawerFrontHeight / 2,
              face: 'front'
            },
            {
              id: `drill_handle_${modIdx}_${d}_2`,
              name: 'Furo Puxador B',
              type: 'handle_hole',
              diameter: 4.5,
              depth: frontThickness,
              isThrough: true,
              x: (moduleSpanWidth + 160) / 2,
              y: singleDrawerFrontHeight / 2,
              face: 'front'
            }
          ],
          slots: [],
          position: {
            x: currentOffsetX + doorGap,
            y: frontY,
            z: 0
          },
          dimensions3D: {
            width: moduleSpanWidth - doorGap * 2,
            height: singleDrawerFrontHeight,
            depth: frontThickness
          }
        });

        // 2. Lateral Esquerda da Gaveta (Left Drawer Side)
        pieces.push({
          id: `pc_gav_lat_esq_${modIdx}_${d}`,
          code: `LAT-ESQ-GAV-M${modIdx + 1}-${d + 1}`,
          name: `Lateral Esquerda Gaveta Módulo ${modIdx + 1} #${d + 1}`,
          type: 'drawer_side',
          moduleId: mod.id,
          materialId: carcaseMaterialId,
          thickness: drawerBoxThickness,
          length: drawerBoxDepth,
          width: drawerSideHeight,
          quantity: 1,
          grain: 'horizontal',
          edgeBanding: {
            top: true,
            bottom: false,
            left: false,
            right: false,
            tapeMaterialId: edgeTapeId,
            tapeThickness: 0.45,
            tapeWidth: 22
          },
          drillings: [
            {
              id: `drill_slide_esq_1_${modIdx}_${d}`,
              name: 'Furo Fixação Corrediça Frontal',
              type: 'slide_runner',
              diameter: 3.5,
              depth: 10,
              isThrough: false,
              x: 37,
              y: 25,
              face: 'left',
              description: 'Fixação corrediça telescópica (dianteira)'
            },
            {
              id: `drill_slide_esq_2_${modIdx}_${d}`,
              name: 'Furo Fixação Corrediça Traseira',
              type: 'slide_runner',
              diameter: 3.5,
              depth: 10,
              isThrough: false,
              x: drawerBoxDepth - 50,
              y: 25,
              face: 'left',
              description: 'Fixação corrediça telescópica (traseira)'
            }
          ],
          slots: [
            {
              id: `slot_fundo_esq_${modIdx}_${d}`,
              name: 'Canal para Fundo 6mm',
              width: 6.5,
              depth: 8,
              distanceFromEdge: 10,
              edge: 'bottom'
            }
          ],
          position: {
            x: currentOffsetX + drawerClearanceEachSide,
            y: boxY,
            z: frontThickness
          },
          dimensions3D: {
            width: drawerBoxThickness,
            height: drawerSideHeight,
            depth: drawerBoxDepth
          }
        });

        // 3. Lateral Direita da Gaveta (Right Drawer Side)
        pieces.push({
          id: `pc_gav_lat_dir_${modIdx}_${d}`,
          code: `LAT-DIR-GAV-M${modIdx + 1}-${d + 1}`,
          name: `Lateral Direita Gaveta Módulo ${modIdx + 1} #${d + 1}`,
          type: 'drawer_side',
          moduleId: mod.id,
          materialId: carcaseMaterialId,
          thickness: drawerBoxThickness,
          length: drawerBoxDepth,
          width: drawerSideHeight,
          quantity: 1,
          grain: 'horizontal',
          edgeBanding: {
            top: true,
            bottom: false,
            left: false,
            right: false,
            tapeMaterialId: edgeTapeId,
            tapeThickness: 0.45,
            tapeWidth: 22
          },
          drillings: [
            {
              id: `drill_slide_dir_1_${modIdx}_${d}`,
              name: 'Furo Fixação Corrediça Frontal',
              type: 'slide_runner',
              diameter: 3.5,
              depth: 10,
              isThrough: false,
              x: 37,
              y: 25,
              face: 'right',
              description: 'Fixação corrediça telescópica (dianteira)'
            },
            {
              id: `drill_slide_dir_2_${modIdx}_${d}`,
              name: 'Furo Fixação Corrediça Traseira',
              type: 'slide_runner',
              diameter: 3.5,
              depth: 10,
              isThrough: false,
              x: drawerBoxDepth - 50,
              y: 25,
              face: 'right',
              description: 'Fixação corrediça telescópica (traseira)'
            }
          ],
          slots: [
            {
              id: `slot_fundo_dir_${modIdx}_${d}`,
              name: 'Canal para Fundo 6mm',
              width: 6.5,
              depth: 8,
              distanceFromEdge: 10,
              edge: 'bottom'
            }
          ],
          position: {
            x: currentOffsetX + moduleSpanWidth - drawerClearanceEachSide - drawerBoxThickness,
            y: boxY,
            z: frontThickness
          },
          dimensions3D: {
            width: drawerBoxThickness,
            height: drawerSideHeight,
            depth: drawerBoxDepth
          }
        });

        // 4. Contrafrente da Gaveta (Drawer Box Front Head)
        pieces.push({
          id: `pc_gav_contra_${modIdx}_${d}`,
          code: `CON-GAV-M${modIdx + 1}-${d + 1}`,
          name: `Contrafrente Gaveta Módulo ${modIdx + 1} #${d + 1}`,
          type: 'drawer_subfront',
          moduleId: mod.id,
          materialId: carcaseMaterialId,
          thickness: drawerBoxThickness,
          length: drawerBoxInnerWidth,
          width: drawerSideHeight,
          quantity: 1,
          grain: 'horizontal',
          edgeBanding: {
            top: true,
            bottom: false,
            left: false,
            right: false,
            tapeMaterialId: edgeTapeId,
            tapeThickness: 0.45,
            tapeWidth: 22
          },
          drillings: [
            {
              id: `drill_contra_fix1_${modIdx}_${d}`,
              name: 'Furo Fixação Frente Externa Esq',
              type: 'through',
              diameter: 4,
              depth: 0,
              isThrough: true,
              x: 40,
              y: drawerSideHeight / 2,
              face: 'back'
            },
            {
              id: `drill_contra_fix2_${modIdx}_${d}`,
              name: 'Furo Fixação Frente Externa Dir',
              type: 'through',
              diameter: 4,
              depth: 0,
              isThrough: true,
              x: drawerBoxInnerWidth - 40,
              y: drawerSideHeight / 2,
              face: 'back'
            }
          ],
          slots: [
            {
              id: `slot_fundo_contra_${modIdx}_${d}`,
              name: 'Canal para Fundo 6mm',
              width: 6.5,
              depth: 8,
              distanceFromEdge: 10,
              edge: 'bottom'
            }
          ],
          position: {
            x: currentOffsetX + drawerClearanceEachSide + drawerBoxThickness,
            y: boxY,
            z: frontThickness
          },
          dimensions3D: {
            width: drawerBoxInnerWidth,
            height: drawerSideHeight,
            depth: drawerBoxThickness
          }
        });

        // 5. Traseira da Gaveta (Drawer Box Back)
        pieces.push({
          id: `pc_gav_tras_${modIdx}_${d}`,
          code: `TRA-GAV-M${modIdx + 1}-${d + 1}`,
          name: `Traseira Gaveta Módulo ${modIdx + 1} #${d + 1}`,
          type: 'drawer_back',
          moduleId: mod.id,
          materialId: carcaseMaterialId,
          thickness: drawerBoxThickness,
          length: drawerBoxInnerWidth,
          width: drawerSideHeight,
          quantity: 1,
          grain: 'horizontal',
          edgeBanding: {
            top: true,
            bottom: false,
            left: false,
            right: false,
            tapeMaterialId: edgeTapeId,
            tapeThickness: 0.45,
            tapeWidth: 22
          },
          drillings: [],
          slots: [
            {
              id: `slot_fundo_tras_${modIdx}_${d}`,
              name: 'Canal para Fundo 6mm',
              width: 6.5,
              depth: 8,
              distanceFromEdge: 10,
              edge: 'bottom'
            }
          ],
          position: {
            x: currentOffsetX + drawerClearanceEachSide + drawerBoxThickness,
            y: boxY,
            z: frontThickness + drawerBoxDepth - drawerBoxThickness
          },
          dimensions3D: {
            width: drawerBoxInnerWidth,
            height: drawerSideHeight,
            depth: drawerBoxThickness
          }
        });

        // 6. Fundo da Gaveta (6mm)
        pieces.push({
          id: `pc_gav_fundo_${modIdx}_${d}`,
          code: `FUN-GAV-M${modIdx + 1}-${d + 1}`,
          name: `Fundo Gaveta Módulo ${modIdx + 1} #${d + 1}`,
          type: 'drawer_bottom',
          moduleId: mod.id,
          materialId: backMaterialId,
          thickness: backThickness,
          length: Math.round(drawerBoxInnerWidth + 14),
          width: Math.round(drawerBoxDepth - 10),
          quantity: 1,
          grain: 'none',
          edgeBanding: {
            top: false,
            bottom: false,
            left: false,
            right: false,
            tapeMaterialId: edgeTapeId,
            tapeThickness: 0.45,
            tapeWidth: 22
          },
          drillings: [],
          slots: [],
          position: {
            x: currentOffsetX + drawerClearanceEachSide + drawerBoxThickness - 7,
            y: boxY + 10,
            z: frontThickness + 5
          },
          dimensions3D: {
            width: drawerBoxInnerWidth + 14,
            height: backThickness,
            depth: drawerBoxDepth - 10
          }
        });

        // Hardware: 1 telescopic slide pair + 1 handle + assembly screws per drawer
        addHardware('COR-TEL-500', 1);
        addHardware('PUX-BAR-160', 1);
        addHardware('PAR-CON-750', 8);
      }
    }

    // Doors in this module
    if (mod.doorsType !== 'none') {
      const doorHeightTotal = interiorHeight - doorGap * 2;
      const doorY = plinthHeight + carcaseThickness + doorGap;

      if (mod.doorsType === 'single_left' || mod.doorsType === 'single_right') {
        const doorWidthSingle = moduleSpanWidth - doorGap * 2;
        const hingeSide = mod.doorsType === 'single_left' ? 'left' : 'right';
        const hingeDrills = generateDoorHingeDrillings(doorWidthSingle, doorHeightTotal, hingeSide);

        pieces.push({
          id: `pc_porta_${modIdx}`,
          code: hingeSide === 'left' ? `POR-ESQ-M${modIdx + 1}` : `POR-DIR-M${modIdx + 1}`,
          name: hingeSide === 'left' ? `Porta Esquerda Módulo ${modIdx + 1}` : `Porta Direita Módulo ${modIdx + 1}`,
          type: 'door',
          moduleId: mod.id,
          materialId: frontMaterialId,
          thickness: frontThickness,
          length: Math.round(doorHeightTotal),
          width: Math.round(doorWidthSingle),
          quantity: 1,
          grain: 'vertical',
          hingeSide,
          edgeBanding: createDefaultEdgeBanding(edgeTapeId, 1.0, true),
          drillings: hingeDrills,
          slots: [],
          position: {
            x: currentOffsetX + doorGap,
            y: doorY,
            z: 0
          },
          dimensions3D: {
            width: doorWidthSingle,
            height: doorHeightTotal,
            depth: frontThickness
          }
        });

        const numHinges = hingeDrills.filter(d => d.type === 'hinge_cup').length;
        addHardware('DOB-RET-AM', numHinges);
        addHardware('PUX-BAR-160', 1);
      } else if (mod.doorsType === 'double') {
        const singleDoorWidth = (moduleSpanWidth - doorGap * 3) / 2;

        // Left leaf
        pieces.push({
          id: `pc_porta_esq_${modIdx}`,
          code: `POR-ESQ-M${modIdx + 1}`,
          name: `Porta Esquerda Módulo ${modIdx + 1}`,
          type: 'door',
          moduleId: mod.id,
          materialId: frontMaterialId,
          thickness: frontThickness,
          length: Math.round(doorHeightTotal),
          width: Math.round(singleDoorWidth),
          quantity: 1,
          grain: 'vertical',
          hingeSide: 'left',
          edgeBanding: createDefaultEdgeBanding(edgeTapeId, 1.0, true),
          drillings: generateDoorHingeDrillings(singleDoorWidth, doorHeightTotal, 'left'),
          slots: [],
          position: {
            x: currentOffsetX + doorGap,
            y: doorY,
            z: 0
          },
          dimensions3D: {
            width: singleDoorWidth,
            height: doorHeightTotal,
            depth: frontThickness
          }
        });

        // Right leaf
        pieces.push({
          id: `pc_porta_dir_${modIdx}`,
          code: `POR-DIR-M${modIdx + 1}`,
          name: `Porta Direita Módulo ${modIdx + 1}`,
          type: 'door',
          moduleId: mod.id,
          materialId: frontMaterialId,
          thickness: frontThickness,
          length: Math.round(doorHeightTotal),
          width: Math.round(singleDoorWidth),
          quantity: 1,
          grain: 'vertical',
          hingeSide: 'right',
          edgeBanding: createDefaultEdgeBanding(edgeTapeId, 1.0, true),
          drillings: generateDoorHingeDrillings(singleDoorWidth, doorHeightTotal, 'right'),
          slots: [],
          position: {
            x: currentOffsetX + doorGap + singleDoorWidth + doorGap,
            y: doorY,
            z: 0
          },
          dimensions3D: {
            width: singleDoorWidth,
            height: doorHeightTotal,
            depth: frontThickness
          }
        });

        const hingesPerLeaf = calculateHingePositions(doorHeightTotal).length;
        addHardware('DOB-RET-AM', hingesPerLeaf * 2);
        addHardware('PUX-BAR-160', 2);
      }
    }

    // Clothes rail (Cabideiro) if requested
    if (mod.hasClothesRail) {
      addHardware('TUB-CAB-OVA', 1);
    }

    currentOffsetX += moduleSpanWidth;

    // Add Vertical Divider between modules
    if (modIdx < numDividers) {
      pieces.push({
        id: `pc_div_${modIdx}`,
        code: `DIV-${modIdx + 1}`,
        name: `Divisória Vertical #${modIdx + 1}`,
        type: 'divider_vertical',
        moduleId: 'root',
        materialId: carcaseMaterialId,
        thickness: carcaseThickness,
        length: interiorHeight,
        width: horizontalDepth - 10,
        quantity: 1,
        grain: 'vertical',
        edgeBanding: {
          top: false,
          bottom: false,
          left: true, // front edge
          right: false,
          tapeMaterialId: edgeTapeId,
          tapeThickness: 1.0,
          tapeWidth: 22
        },
        drillings: generateSystem32LineBore(interiorHeight, horizontalDepth - 10, 50, 50),
        slots: [backGroove],
        position: {
          x: currentOffsetX,
          y: plinthHeight + carcaseThickness,
          z: 10
        },
        dimensions3D: {
          width: carcaseThickness,
          height: interiorHeight,
          depth: horizontalDepth - 10
        }
      });

      // Divider fixations
      addHardware('UNI-MIN-15', 4);
      addHardware('UNI-CAV-830', 4);

      currentOffsetX += carcaseThickness;
    }
  });

  // 5. BACK PANEL (Fundo 6mm)
  // Back panel sits in the 8mm deep groove on laterals, base, and top
  const backPanelWidth = interiorWidth + 16; // 8mm groove each side
  const backPanelHeight = interiorHeight + 2 * carcaseThickness + 16;

  pieces.push({
    id: 'pc_fundo_geral',
    code: 'FUN-GER',
    name: 'Fundo Geral 6mm',
    type: 'back',
    moduleId: 'root',
    materialId: backMaterialId,
    thickness: backThickness,
    length: Math.round(backPanelHeight),
    width: Math.round(backPanelWidth),
    quantity: 1,
    grain: 'none',
    edgeBanding: {
      top: false,
      bottom: false,
      left: false,
      right: false,
      tapeMaterialId: edgeTapeId,
      tapeThickness: 0.45,
      tapeWidth: 22
    },
    drillings: [],
    slots: [],
    position: {
      x: carcaseThickness - 8,
      y: plinthHeight - 8,
      z: depth - backGrooveOffset
    },
    dimensions3D: {
      width: backPanelWidth,
      height: backPanelHeight,
      depth: backThickness
    },
    notes: 'Fundo encaixado no rasgo de 8mm de profundidade'
  });

  return {
    ...model,
    pieces,
    hardware: Array.from(hardwareMap.values()),
    updatedAt: new Date().toISOString()
  };
}

export function createParametricFurniture(input: ParametricInput): FurnitureModel {
  const carcaseThickness = input.carcaseThickness || 18;
  const frontThickness = input.frontThickness || 18;
  const backThickness = input.backThickness || 6;
  const plinthHeight = input.plinthHeight !== undefined ? input.plinthHeight : (input.type.includes('balcao') || input.type.includes('armario') ? 100 : 0);

  const defaultModules: ModuleStructure[] = input.modules || [
    {
      id: 'mod_1',
      name: 'Módulo 1',
      width: (input.width - 2 * carcaseThickness) / 2,
      height: input.height - plinthHeight - 2 * carcaseThickness,
      depth: input.depth,
      offsetX: carcaseThickness,
      numShelves: 2,
      shelfType: 'adjustable',
      numDrawers: 0,
      drawerType: 'external',
      doorsType: 'single_left',
      hasBackPanel: true,
      hasPlinth: plinthHeight > 0
    },
    {
      id: 'mod_2',
      name: 'Módulo 2',
      width: (input.width - 2 * carcaseThickness) / 2,
      height: input.height - plinthHeight - 2 * carcaseThickness,
      depth: input.depth,
      offsetX: (input.width - 2 * carcaseThickness) / 2 + carcaseThickness,
      numShelves: 1,
      shelfType: 'adjustable',
      numDrawers: 3,
      drawerType: 'external',
      doorsType: 'none',
      hasBackPanel: true,
      hasPlinth: plinthHeight > 0
    }
  ];

  const initialModel: FurnitureModel = {
    id: `furn_${Date.now()}`,
    name: input.name || 'Armário Paramétrico',
    type: input.type || 'cozinha_balcao',
    width: input.width,
    height: input.height,
    depth: input.depth,
    carcaseMaterialId: input.carcaseMaterialId || 'mat_mdf_branco_tx_18',
    frontMaterialId: input.frontMaterialId || 'mat_mdf_louro_freijo_18',
    backMaterialId: input.backMaterialId || 'mat_mdf_branco_tx_6',
    edgeTapeId: input.edgeTapeId || 'tape_pvc_freijo_1mm',
    carcaseThickness,
    frontThickness,
    backThickness,
    plinthHeight,
    backGrooveOffset: 15,
    doorGap: 2,
    drawerRunnerClearance: 26,
    hardwareSpecs: input.hardwareSpecs || {
      hingeType: 'straight',
      slideType: 'telescopic',
      connectorType: 'minifix_dowel',
      handleType: 'handle_bar_black',
      shelfPinType: 'pin_5mm_nickel'
    },
    modules: defaultModules,
    pieces: [],
    hardware: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return recalculateFurnitureModel(initialModel);
}
