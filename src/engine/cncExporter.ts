/**
 * MarcenariaCAD Pro - CNC & CAD Exporter
 * Generates ASCII DXF CAD files and ISO standard G-Code for CNC Routers and Point-to-Point Boring machines.
 */

import { Piece } from '../types/furniture';

/**
 * Generate standard CSV file for cutting list (compatible with Corte Certo, Promob Cut, Excel, Google Sheets)
 */
export function generateCuttingListCSV(pieces: Piece[], materialsNameMap: Record<string, string>): string {
  const headers = [
    'Código',
    'Descrição da Peça',
    'Material',
    'Espessura (mm)',
    'Comprimento (mm)',
    'Largura (mm)',
    'Quantidade',
    'Sentido do Veio',
    'Fita Topo',
    'Fita Base',
    'Fita Esquerda',
    'Fita Direita',
    'Furações (Qtd)',
    'Módulo',
    'Observações'
  ];

  const rows = pieces.map(p => {
    const matName = materialsNameMap[p.materialId] || p.materialId;
    const eb = p.edgeBanding;
    const drillCount = p.drillings.length;

    return [
      `"${p.code}"`,
      `"${p.name}"`,
      `"${matName}"`,
      p.thickness,
      p.length,
      p.width,
      p.quantity,
      `"${p.grain === 'none' ? 'Sem Veio' : p.grain === 'vertical' ? 'Vertical' : 'Horizontal'}"`,
      eb.top ? '"1mm"' : '"-"',
      eb.bottom ? '"1mm"' : '"-"',
      eb.left ? '"1mm"' : '"-"',
      eb.right ? '"1mm"' : '"-"',
      drillCount,
      `"${p.moduleId}"`,
      `"${p.notes || ''}"`
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\r\n');
}

/**
 * Generate standard DXF (AutoCAD R12/2000 ASCII) for a single piece with layers for contour, 32mm holes, hinge cups, and slots
 */
export function generatePieceDXF(piece: Piece): string {
  const isVertical = piece.type === 'lateral_left' ||
    piece.type === 'lateral_right' ||
    piece.type === 'divider_vertical' ||
    piece.type === 'door';
  const L = isVertical ? piece.width : piece.length;
  const W = isVertical ? piece.length : piece.width;

  let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n4\n`;
  
  // Layer definitions
  dxf += `0\nLAYER\n2\nCONTORNO\n70\n0\n62\n7\n6\nCONTINUOUS\n0\n`;
  dxf += `0\nLAYER\n2\nFUROS_5MM\n70\n0\n62\n1\n6\nCONTINUOUS\n0\n`;
  dxf += `0\nLAYER\n2\nCANECO_35MM\n70\n0\n62\n4\n6\nCONTINUOUS\n0\n`;
  dxf += `0\nLAYER\n2\nMINIFIX_15MM\n70\n0\n62\n3\n6\nCONTINUOUS\n0\n`;
  dxf += `0\nENDTAB\n0\nENDSEC\n`;

  // Entities Section
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  // 1. Boundary Rectangle (Contorno da Peça)
  const corners = [
    { x: 0, y: 0 },
    { x: L, y: 0 },
    { x: L, y: W },
    { x: 0, y: W }
  ];

  for (let i = 0; i < 4; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % 4];
    dxf += `0\nLINE\n8\nCONTORNO\n10\n${p1.x}\n20\n${p1.y}\n30\n0.0\n11\n${p2.x}\n21\n${p2.y}\n31\n0.0\n`;
  }

  // 2. Drillings as Circles
  piece.drillings.forEach(d => {
    let layer = 'FUROS_5MM';
    if (d.diameter >= 30) layer = 'CANECO_35MM';
    else if (d.diameter >= 12) layer = 'MINIFIX_15MM';

    const radius = d.diameter / 2;
    dxf += `0\nCIRCLE\n8\n${layer}\n10\n${d.x}\n20\n${d.y}\n30\n0.0\n40\n${radius}\n`;
  });

  // End DXF
  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

/**
 * Generate ISO standard G-Code for CNC Router / Boring Machine
 */
export function generatePieceGCode(piece: Piece): string {
  const isVertical = piece.type === 'lateral_left' ||
    piece.type === 'lateral_right' ||
    piece.type === 'divider_vertical' ||
    piece.type === 'door';
  const L = isVertical ? piece.width : piece.length;
  const W = isVertical ? piece.length : piece.width;

  const lines: string[] = [
    `; ==========================================`,
    `; MARCAD CNC POST-PROCESSOR ISO G-CODE`,
    `; Peca: ${piece.name} [${piece.code}]`,
    `; Dimensoes usinagem: ${L} x ${W} x ${piece.thickness} mm`,
    `; Operacoes: Contorno + ${piece.drillings.length} Furos`,
    `; ==========================================`,
    `G21 ; Unidades em milímetros`,
    `G90 ; Coordenadas absolutas`,
    `G17 ; Plano XY`,
    `G94 ; Avanço em mm/min`,
    `G00 Z25.000 ; Altura segura de aproximação`,
    ``,
    `; --- ETAPA 1: FURACOES ---`,
    `T1 M06 ; Ferramenta Broca`,
    `S18000 M03 ; Spindle 18.000 RPM ligar`,
    `G04 P2.0 ; Aguarda rotação estabilizar`
  ];

  piece.drillings.forEach((drill, idx) => {
    lines.push(
      `; Furo #${idx + 1}: ${drill.name} (Diam: ${drill.diameter}mm, Prof: ${drill.depth}mm)`,
      `G00 X${drill.x.toFixed(3)} Y${drill.y.toFixed(3)}`,
      `G00 Z3.000`,
      `G01 Z-${drill.depth.toFixed(3)} F800`,
      `G04 P0.2 ; Retenção no fundo do furo`,
      `G00 Z5.000`
    );
  });

  lines.push(
    ``,
    `; --- ETAPA 2: CONTORNO E ESQUADRO ---`,
    `T2 M06 ; Fresa de corte 6mm downcut`,
    `S18000 M03`,
    `G00 X0.000 Y0.000`,
    `G00 Z3.000`,
    `G01 Z-${piece.thickness.toFixed(3)} F1500`,
    `G01 X${L.toFixed(3)} Y0.000 F3000`,
    `G01 X${L.toFixed(3)} Y${W.toFixed(3)}`,
    `G01 X0.000 Y${W.toFixed(3)}`,
    `G01 X0.000 Y0.000`,
    `G00 Z25.000`,
    ``,
    `M05 ; Desliga Spindle`,
    `G00 X0 Y0 ; Retorna para origem da mesa`,
    `M30 ; Fim de programa CNC`
  );

  return lines.join('\n');
}
