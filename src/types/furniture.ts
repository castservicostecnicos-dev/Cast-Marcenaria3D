/**
 * MarcenariaCAD Pro - Core Domain Types
 * Parametric furniture, pieces, drillings, edge banding, hardware, cutting plan and project data models.
 */

export type UnitType = 'mm';

export type GrainDirection = 'horizontal' | 'vertical' | 'none';

export type EdgePosition = 'top' | 'bottom' | 'left' | 'right';

export interface EdgeBandingConfig {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  tapeMaterialId: string;
  tapeThickness: number; // e.g. 0.45mm, 1mm, 2mm
  tapeWidth: number; // e.g. 22mm, 35mm
}

export type HoleType = 
  | 'system32'         // 5mm shelf pin / runner hole, prof. 12mm
  | 'hinge_cup'        // 35mm cup hole, prof. 12.5mm
  | 'hinge_screw'      // 2mm pilot or 5mm euro screw
  | 'minifix_cam'      // 15mm cam housing, prof. 12mm
  | 'minifix_bolt'     // 8mm bolt hole, prof. 34mm
  | 'dowel'            // 8mm wooden dowel, prof. 24mm
  | 'slide_runner'     // Drawer slide mounting holes
  | 'handle_hole'      // 4mm / 5mm handle screw holes
  | 'confirmat'        // 5mm / 7mm confirmat screw
  | 'pocket_screw'     // Kreg style pocket hole
  | 'groove'           // Rebaixo/rasgo para fundo (slot)
  | 'through';         // General through hole

export interface DrillingOperation {
  id: string;
  name: string;
  type: HoleType;
  diameter: number; // mm
  depth: number; // mm (0 = passante)
  isThrough: boolean;
  x: number; // mm from piece left edge
  y: number; // mm from piece bottom/front edge
  face: 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';
  description?: string;
}

export interface SlotOperation {
  id: string;
  name: string;
  width: number; // mm (e.g. 6mm for back panel)
  depth: number; // mm (e.g. 8mm)
  distanceFromEdge: number; // mm from back edge (e.g. 15mm)
  edge: 'top' | 'bottom' | 'left' | 'right';
}

export type PieceType = 
  | 'lateral_left'
  | 'lateral_right'
  | 'base'
  | 'top'
  | 'shelf_fixed'
  | 'shelf_adjustable'
  | 'divider_vertical'
  | 'back'
  | 'door'
  | 'drawer_front'
  | 'drawer_side'
  | 'drawer_subfront'
  | 'drawer_back'
  | 'drawer_bottom'
  | 'plinth'           // rodapé
  | 'stretcher'        // travessa
  | 'filler';          // tamponamento / fechamento

export interface Piece {
  id: string;
  code: string;
  name: string;
  type: PieceType;
  moduleId: string;
  materialId: string;
  thickness: number; // mm (15, 18, 25, 6 etc.)
  length: number; // mm (maior dimensão ou sentido do veio)
  width: number; // mm (menor dimensão)
  quantity: number;
  grain: GrainDirection;
  edgeBanding: EdgeBandingConfig;
  drillings: DrillingOperation[];
  slots: SlotOperation[];
  notes?: string;
  
  // 3D Spatial position relative to furniture origin (0, 0, 0 at bottom-left-front)
  position: {
    x: number; // mm
    y: number; // mm (height from floor)
    z: number; // mm (depth)
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
  dimensions3D: {
    width: number;  // X span
    height: number; // Y span
    depth: number;  // Z span
  };
  color?: string;
  isSubAssembly?: boolean;
  hingeSide?: 'left' | 'right';
}

export interface HardwareItem {
  id: string;
  code: string;
  name: string;
  category: 'hinge' | 'slide' | 'handle' | 'connector' | 'shelf_pin' | 'foot' | 'hanger' | 'accessory';
  manufacturer: string;
  model: string;
  specs: string;
  quantity: number;
  unitPrice: number;
  mountingRules?: {
    system32Compliant?: boolean;
    clearanceNeeded?: number;
    drillingDiameter?: number;
    drillingDistance?: number;
  };
}

export interface ModuleStructure {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  offsetX: number;
  numShelves: number;
  shelfType: 'adjustable' | 'fixed';
  numDrawers: number;
  drawerType: 'internal' | 'external';
  doorsType: 'none' | 'single_left' | 'single_right' | 'double' | 'sliding';
  hasBackPanel: boolean;
  hasPlinth: boolean;
  hasClothesRail?: boolean;
}

export interface FurnitureModel {
  id: string;
  name: string;
  type: 'cozinha_aereo' | 'cozinha_balcao' | 'armario_quarto' | 'closet' | 'rack_sala' | 'banheiro' | 'escritorio' | 'nicho_livre';
  
  // Overall external dimensions (mm)
  width: number;
  height: number;
  depth: number;
  
  // Construction engineering rules
  carcaseMaterialId: string;
  frontMaterialId: string;
  backMaterialId: string;
  edgeTapeId: string;
  
  carcaseThickness: number; // default 18mm
  frontThickness: number;   // default 18mm
  backThickness: number;    // default 6mm
  
  plinthHeight: number;     // rodapé (e.g. 100mm, 0 se suspenso)
  backGrooveOffset: number; // recuo do fundo (e.g. 15mm)
  doorGap: number;          // folga da porta (e.g. 2mm)
  drawerRunnerClearance: number; // folga corrediça (e.g. 26mm total: 13mm each side)
  
  hardwareSpecs: {
    hingeType: 'straight' | 'half_cranked' | 'full_cranked' | 'soft_close';
    slideType: 'telescopic' | 'undermount_soft_close';
    connectorType: 'minifix_dowel' | 'confirmat' | 'screw';
    handleType: 'perfil_gola' | 'handle_bar_black' | 'handle_bar_inox' | 'handle_knob' | 'cava';
    shelfPinType: 'pin_5mm_nickel';
  };
  
  modules: ModuleStructure[];
  pieces: Piece[];
  hardware: HardwareItem[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ClientInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ProjectRoom {
  id: string;
  name: string;
  roomType: 'cozinha' | 'dormitorio' | 'sala' | 'banheiro' | 'escritorio' | 'outro';
  dimensions: {
    width: number;
    length: number;
    height: number;
  };
}

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  timestamp: string;
  description: string;
  snapshot: FurnitureModel;
}

export interface Project {
  id: string;
  name: string;
  client: ClientInfo;
  room: ProjectRoom;
  furniture: FurnitureModel;
  versions: ProjectVersion[];
  currentVersionIndex: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
