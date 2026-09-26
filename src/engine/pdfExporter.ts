/**
 * MarcenariaCAD Pro - Professional Manufacturing PDF Exporter
 * Generates official workshop fabrication drawings, cutting schedule,
 * edge banding tables, and hardware list using jsPDF.
 */

import { jsPDF } from 'jspdf';
import { FurnitureModel, Project } from '../types/furniture';
import { BoardMaterial } from '../types/materials';
import { CuttingOptimizationResult } from '../types/cuttingPlan';

export function generateManufacturingPDF(
  project: Project,
  materials: BoardMaterial[],
  cuttingResults: CuttingOptimizationResult[]
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const furniture = project.furniture;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Helper
  function renderHeader(title: string, subtitle: string) {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, margin, pageWidth - 2 * margin, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('MARCENARIACAD PRO  |  PACOTE TÉCNICO DE FABRICAÇÃO', margin + 6, margin + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`${title.toUpperCase()} — ${subtitle}`, margin + 6, margin + 14);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${dateStr}`, pageWidth - margin - 25, margin + 8);
  }

  // Footer Helper
  function renderFooter(page: number, total: number) {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - margin - 6, pageWidth - margin, pageHeight - margin - 6);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('MarcenariaCAD Pro - Software Paramétrico de Engenharia de Móveis', margin, pageHeight - margin);
    doc.text(`Página ${page} de ${total}`, pageWidth - margin - 22, pageHeight - margin);
  }

  // --- PAGE 1: DADOS DO PROJETO & RESUMO TÉCNICO ---
  renderHeader('Resumo do Projeto', project.name);

  let y = margin + 28;

  // Project Info Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - 2 * margin, 34, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS GERAIS DO PROJETO', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Projeto: ${project.name}`, margin + 5, y + 13);
  doc.text(`Cliente: ${project.client?.name || 'Não informado'}`, margin + 5, y + 19);
  doc.text(`Ambiente: ${project.room?.name || 'Cozinha'} (${project.room?.dimensions.width || 3000} x ${project.room?.dimensions.length || 3000} mm)`, margin + 5, y + 25);

  doc.text(`Dimensões Totais do Móvel:`, margin + 105, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${furniture.width} L x ${furniture.height} A x ${furniture.depth} P mm`, margin + 105, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Peças: ${furniture.pieces.length} itens | Módulos: ${furniture.modules.length}`, margin + 105, y + 25);

  y += 42;

  // Cutting List Table Preview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LISTA DE CORTE DAS PEÇAS (ORDEM DE CORTE)', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('CÓD', margin + 2, y + 5);
  doc.text('DESCRIÇÃO', margin + 20, y + 5);
  doc.text('DIMENSÕES (L x P x E)', margin + 85, y + 5);
  doc.text('QTD', margin + 130, y + 5);
  doc.text('FITAS', margin + 145, y + 5);
  doc.text('FUROS', margin + 168, y + 5);

  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  furniture.pieces.forEach((p, idx) => {
    if (y > pageHeight - margin - 20) {
      // next page
      renderFooter(1, 2);
      doc.addPage();
      renderHeader('Lista de Peças (Continuação)', project.name);
      y = margin + 28;

      // Table header on page 2
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('CÓD', margin + 2, y + 5);
      doc.text('DESCRIÇÃO', margin + 20, y + 5);
      doc.text('DIMENSÕES (L x P x E)', margin + 85, y + 5);
      doc.text('QTD', margin + 130, y + 5);
      doc.text('FITAS', margin + 145, y + 5);
      doc.text('FUROS', margin + 168, y + 5);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3.5, pageWidth - 2 * margin, 6, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(p.code, margin + 2, y + 1);
    doc.text(p.name.substring(0, 34), margin + 20, y + 1);
    doc.text(`${p.length} x ${p.width} x ${p.thickness} mm`, margin + 85, y + 1);
    doc.text(`${p.quantity}`, margin + 132, y + 1);

    // Edge bands
    const eb = p.edgeBanding;
    const tapeMarks = [
      eb.top ? 'T' : '-',
      eb.bottom ? 'B' : '-',
      eb.left ? 'E' : '-',
      eb.right ? 'D' : '-'
    ].join(' ');
    doc.text(tapeMarks, margin + 145, y + 1);

    doc.text(`${p.drillings.length}`, margin + 172, y + 1);

    y += 5.5;
  });

  renderFooter(1, 2);

  // --- PAGE 2: FERRAGENS & PLANO DE CORTE ---
  doc.addPage();
  renderHeader('Ferragens e Aproveitamento de Chapas', project.name);

  y = margin + 28;

  // Hardware Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('RELAÇÃO DE FERRAGENS E COMPONENTES', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('CÓDIGO', margin + 2, y + 5);
  doc.text('ITEM / ESPECIFICAÇÃO TÉCNICA', margin + 25, y + 5);
  doc.text('FABRICANTE', margin + 120, y + 5);
  doc.text('QTD', margin + 165, y + 5);

  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  furniture.hardware.forEach((h, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3.5, pageWidth - 2 * margin, 6, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.text(h.code, margin + 2, y + 1);
    doc.text(h.name.substring(0, 50), margin + 25, y + 1);
    doc.text(h.manufacturer.substring(0, 22), margin + 120, y + 1);
    doc.text(`${h.quantity}`, margin + 167, y + 1);
    y += 6;
  });

  y += 10;

  // Cutting Optimization Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ESTIMATIVA DE CHAPAS (OTIMIZAÇÃO 2D)', margin, y);
  y += 5;

  cuttingResults.forEach(res => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, pageWidth - 2 * margin, 18, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`${res.materialName} (${res.thickness}mm)`, margin + 5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Chapas Necessárias: ${res.sheetsNeeded} un (2750 x 1850 mm)`, margin + 5, y + 12);
    doc.text(`Aproveitamento Médio: ${res.overallEfficiencyPercent}% | Sobra/Retalho: ${res.overallWastePercent}%`, margin + 95, y + 12);

    y += 22;
  });

  renderFooter(2, 2);

  return doc;
}
