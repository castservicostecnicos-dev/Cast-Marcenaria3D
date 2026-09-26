/**
 * MarcenariaCAD Pro - Quotation and Cost Breakdown Types
 */

export interface CostItem {
  id: string;
  category: 'chapas' | 'fitas' | 'ferragens' | 'corte_usinagem' | 'mao_de_obra' | 'montagem' | 'transporte' | 'impostos' | 'outros';
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface QuotationConfig {
  hourlyLaborRate: number; // R$/hora
  estimatedAssemblyHours: number; // horas
  cuttingServiceCostPerM2: number; // R$/m2 de chapa cortada
  drillingServiceCostPerHole: number; // R$/furo CNC
  edgeTapeApplicationCostPerM: number; // R$/metro de fita colada
  transportCost: number; // Frete fixo
  profitMarginPercent: number; // Margem de lucro (ex: 35%)
  taxPercent: number; // Impostos (ex: 6%)
  discountPercent: number; // Desconto à vista
}

export interface QuotationResult {
  items: CostItem[];
  subtotalMaterials: number;
  subtotalHardware: number;
  subtotalLaborAndServices: number;
  subtotalOperations: number;
  subtotalDirectCosts: number;
  
  profitMarginAmount: number;
  taxAmount: number;
  finalSellingPrice: number;
  suggestedInstallmentPrice: number; // parcelado 10x
  cashPrice: number; // com desconto
  
  marginPercentActual: number;
  breakdownByCategory: Record<string, number>;
}
