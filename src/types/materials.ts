/**
 * MarcenariaCAD Pro - Materials & Edge Banding Catalog Types
 */

export type BoardCategory = 'mdf' | 'mdp' | 'compensado' | 'madeira_macica' | 'hdf' | 'osb';

export type FinishType = 'texturizado' | 'acetinado' | 'super_mate' | 'alto_brilho' | 'madeirado_sincronizado';

export interface BoardMaterial {
  id: string;
  name: string;
  code: string;
  category: BoardCategory;
  manufacturer: string; // Duratex, Arauco, Guararapes, Berneck, etc.
  collection?: string;
  finish: FinishType;
  colorHex: string;
  textureUrl?: string;
  woodPattern?: 'solid' | 'oak' | 'walnut' | 'freijo' | 'linen' | 'concrete' | 'marble';
  thicknessesAvailable: number[]; // e.g. [6, 15, 18, 25]
  defaultThickness: number;
  sheetWidth: number; // mm (e.g. 2750)
  sheetLength: number; // mm (e.g. 1850)
  hasGrain: boolean;
  pricePerSheet: number; // BRL
  unit: 'chapa';
  isCustom?: boolean;
}

export interface EdgeTapeMaterial {
  id: string;
  name: string;
  code: string;
  materialType: 'pvc' | 'abs' | 'melaminica';
  manufacturer: string;
  matchingBoardId?: string;
  thickness: number; // mm (e.g. 0.45, 1.0, 2.0)
  width: number; // mm (e.g. 22, 35, 45, 64)
  colorHex: string;
  pricePerMeter: number; // BRL / metro linear
}
