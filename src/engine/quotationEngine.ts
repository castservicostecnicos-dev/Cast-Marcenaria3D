/**
 * MarcenariaCAD Pro - Quotation & Budget Engine
 * Calculates full production costs, materials, hardware, labor,
 * edge banding linear meters, and final selling price with configurable margins.
 */

import { FurnitureModel } from '../types/furniture';
import { BoardMaterial, EdgeTapeMaterial } from '../types/materials';
import { CuttingOptimizationResult } from '../types/cuttingPlan';
import { CostItem, QuotationConfig, QuotationResult } from '../types/quotation';

export const DEFAULT_QUOTATION_CONFIG: QuotationConfig = {
  hourlyLaborRate: 65.0,            // R$ 65/h marcenaria
  estimatedAssemblyHours: 6.0,      // 6 horas de montagem
  cuttingServiceCostPerM2: 25.0,    // R$ 25/m2 corte esquadrejadeira / seccionadora
  drillingServiceCostPerHole: 0.80, // R$ 0,80 por furo CNC / furadeira múltipla
  edgeTapeApplicationCostPerM: 3.50,// R$ 3,50 / metro colagem em coladeira de borda
  transportCost: 150.0,             // R$ 150 frete entrega
  profitMarginPercent: 35.0,        // 35% margem de lucro
  taxPercent: 6.0,                  // 6% Simples Nacional
  discountPercent: 5.0              // 5% desconto à vista
};

export function calculateQuotation(
  furniture: FurnitureModel,
  materials: BoardMaterial[],
  edgeTapes: EdgeTapeMaterial[],
  cuttingResults: CuttingOptimizationResult[],
  config: QuotationConfig = DEFAULT_QUOTATION_CONFIG
): QuotationResult {
  const items: CostItem[] = [];

  // 1. BOARD MATERIALS (CHAPAS)
  let subtotalMaterials = 0;
  cuttingResults.forEach((res, idx) => {
    const mat = materials.find(m => m.id === res.materialId);
    const unitPrice = mat ? mat.pricePerSheet : 220.0;
    const sheetsCount = Math.max(1, res.sheetsNeeded);
    const totalCost = sheetsCount * unitPrice;
    subtotalMaterials += totalCost;

    items.push({
      id: `cost_sheet_${idx}`,
      category: 'chapas',
      name: `Chapa ${res.materialName} ${res.thickness}mm (2750x1850mm)`,
      quantity: sheetsCount,
      unit: 'chapas',
      unitCost: unitPrice,
      totalCost
    });
  });

  // 2. EDGE BANDING (FITAS DE BORDA)
  // Calculate total linear meters of edge banding
  let totalEdgeMeters = 0;
  const edgeMetersByTape = new Map<string, number>();

  furniture.pieces.forEach(p => {
    const eb = p.edgeBanding;
    const lenM = p.length / 1000;
    const widM = p.width / 1000;

    let pieceMeters = 0;
    if (eb.top) pieceMeters += lenM;
    if (eb.bottom) pieceMeters += lenM;
    if (eb.left) pieceMeters += widM;
    if (eb.right) pieceMeters += widM;

    // Multiply by quantity
    const totalForPiece = pieceMeters * p.quantity;
    totalEdgeMeters += totalForPiece;

    const tapeId = eb.tapeMaterialId || furniture.edgeTapeId;
    edgeMetersByTape.set(tapeId, (edgeMetersByTape.get(tapeId) || 0) + totalForPiece);
  });

  // Round meters + 10% safety margin for trims
  let subtotalTapes = 0;
  edgeMetersByTape.forEach((meters, tapeId) => {
    const tape = edgeTapes.find(t => t.id === tapeId) || edgeTapes[0];
    const billedMeters = Math.ceil(meters * 1.15); // +15% perdas
    const unitPrice = tape ? tape.pricePerMeter : 1.50;
    const totalCost = billedMeters * unitPrice;
    subtotalTapes += totalCost;

    items.push({
      id: `cost_tape_${tapeId}`,
      category: 'fitas',
      name: `${tape ? tape.name : 'Fita de Borda PVC 1mm'} (com 15% sobra)`,
      quantity: billedMeters,
      unit: 'm',
      unitCost: unitPrice,
      totalCost
    });
  });

  // 3. HARDWARE (FERRAGENS E ACESSÓRIOS)
  let subtotalHardware = 0;
  furniture.hardware.forEach((h, idx) => {
    const totalCost = h.quantity * h.unitPrice;
    subtotalHardware += totalCost;

    items.push({
      id: `cost_hd_${idx}`,
      category: 'ferragens',
      name: `${h.name} (${h.manufacturer})`,
      quantity: h.quantity,
      unit: 'un',
      unitCost: h.unitPrice,
      totalCost
    });
  });

  // 4. CUTTING & MACHINING OPERATIONS
  let totalAreaM2 = 0;
  let totalDrillingsCount = 0;

  furniture.pieces.forEach(p => {
    totalAreaM2 += (p.length * p.width / 1_000_000) * p.quantity;
    totalDrillingsCount += p.drillings.length * p.quantity;
  });

  const cuttingCost = Math.round(totalAreaM2 * config.cuttingServiceCostPerM2);
  const drillingCost = Math.round(totalDrillingsCount * config.drillingServiceCostPerHole);
  const edgeGluingCost = Math.round(totalEdgeMeters * config.edgeTapeApplicationCostPerM);
  const subtotalOperations = cuttingCost + drillingCost + edgeGluingCost;

  items.push({
    id: 'cost_op_cutting',
    category: 'corte_usinagem',
    name: 'Serviço de Seccionamento / Corte de Peças',
    quantity: Math.round(totalAreaM2 * 10) / 10,
    unit: 'm²',
    unitCost: config.cuttingServiceCostPerM2,
    totalCost: cuttingCost
  });

  items.push({
    id: 'cost_op_drilling',
    category: 'corte_usinagem',
    name: 'Furação Sistema 32 / Canecos / Cavilhas em Furadeira/CNC',
    quantity: totalDrillingsCount,
    unit: 'furos',
    unitCost: config.drillingServiceCostPerHole,
    totalCost: drillingCost
  });

  items.push({
    id: 'cost_op_edging',
    category: 'corte_usinagem',
    name: 'Aplicação e Refilo de Fita de Borda em Coladeira',
    quantity: Math.round(totalEdgeMeters),
    unit: 'm',
    unitCost: config.edgeTapeApplicationCostPerM,
    totalCost: edgeGluingCost
  });

  // 5. LABOR & TRANSPORT
  const laborCost = config.hourlyLaborRate * config.estimatedAssemblyHours;
  const transportCost = config.transportCost;
  const subtotalLaborAndServices = laborCost + transportCost;

  items.push({
    id: 'cost_labor_assembly',
    category: 'montagem',
    name: `Mão de Obra de Montagem em Oficina (${config.estimatedAssemblyHours}h)`,
    quantity: config.estimatedAssemblyHours,
    unit: 'h',
    unitCost: config.hourlyLaborRate,
    totalCost: laborCost
  });

  items.push({
    id: 'cost_transport',
    category: 'transporte',
    name: 'Embalagem, Carregamento e Frete até o Cliente',
    quantity: 1,
    unit: 'serviço',
    unitCost: transportCost,
    totalCost: transportCost
  });

  // TOTAL DIRECT PRODUCTION COST
  const subtotalDirectCosts = subtotalMaterials + subtotalTapes + subtotalHardware + subtotalOperations + subtotalLaborAndServices;

  // PROFIT MARGIN & TAXES
  // Formula: Selling Price = Direct Cost / (1 - (Margin% + Tax%))
  const marginRatio = (config.profitMarginPercent + config.taxPercent) / 100;
  const safeDivisor = Math.max(0.1, 1 - marginRatio);
  const finalSellingPrice = Math.round(subtotalDirectCosts / safeDivisor);

  const profitMarginAmount = Math.round(finalSellingPrice * (config.profitMarginPercent / 100));
  const taxAmount = Math.round(finalSellingPrice * (config.taxPercent / 100));
  const cashPrice = Math.round(finalSellingPrice * (1 - config.discountPercent / 100));
  const suggestedInstallmentPrice = Math.round(finalSellingPrice / 10);

  const breakdownByCategory: Record<string, number> = {
    chapas: subtotalMaterials,
    fitas: subtotalTapes,
    ferragens: subtotalHardware,
    corte_usinagem: subtotalOperations,
    montagem: laborCost,
    transporte: transportCost,
    lucro: profitMarginAmount,
    impostos: taxAmount
  };

  return {
    items,
    subtotalMaterials: Math.round(subtotalMaterials + subtotalTapes),
    subtotalHardware: Math.round(subtotalHardware),
    subtotalLaborAndServices: Math.round(subtotalLaborAndServices),
    subtotalOperations: Math.round(subtotalOperations),
    subtotalDirectCosts: Math.round(subtotalDirectCosts),
    profitMarginAmount,
    taxAmount,
    finalSellingPrice,
    suggestedInstallmentPrice,
    cashPrice,
    marginPercentActual: config.profitMarginPercent,
    breakdownByCategory
  };
}
