import { FurnitureModel } from '../types/furniture';
import { createParametricFurniture } from '../engine/parametricEngine';

export interface FurnitureTemplate {
  id: string;
  name: string;
  category: 'Cozinha' | 'Dormitório' | 'Sala' | 'Banheiro' | 'Escritório';
  description: string;
  thumbnail: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  create: () => FurnitureModel;
}

export const FURNITURE_TEMPLATES: FurnitureTemplate[] = [
  {
    id: 'tmpl_cozinha_balcao_4mod',
    name: 'Balcão de Cozinha 4 Módulos',
    category: 'Cozinha',
    description: 'Balcão de 2400 mm com 2 portas de abrir, 3 gavetas com amortecedor, prateleiras reguláveis e rodapé.',
    thumbnail: 'cozinha_balcao',
    dimensions: { width: 2400, height: 850, depth: 600 },
    create: () => createParametricFurniture({
      name: 'Balcão de Cozinha 2400mm',
      type: 'cozinha_balcao',
      width: 2400,
      height: 850,
      depth: 600,
      carcaseMaterialId: 'mat_mdf_branco_tx_18',
      frontMaterialId: 'mat_mdf_louro_freijo_18',
      backMaterialId: 'mat_mdf_branco_tx_6',
      edgeTapeId: 'tape_pvc_freijo_1mm',
      carcaseThickness: 18,
      frontThickness: 18,
      backThickness: 6,
      plinthHeight: 100,
      modules: [
        {
          id: 'mod_1',
          name: 'Módulo 1 - Portas',
          width: 600,
          height: 714,
          depth: 600,
          offsetX: 18,
          numShelves: 1,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'single_left',
          hasBackPanel: true,
          hasPlinth: true
        },
        {
          id: 'mod_2',
          name: 'Módulo 2 - Gaveteiro',
          width: 600,
          height: 714,
          depth: 600,
          offsetX: 636,
          numShelves: 0,
          shelfType: 'adjustable',
          numDrawers: 3,
          drawerType: 'external',
          doorsType: 'none',
          hasBackPanel: true,
          hasPlinth: true
        },
        {
          id: 'mod_3',
          name: 'Módulo 3 - Prateleiras',
          width: 600,
          height: 714,
          depth: 600,
          offsetX: 1254,
          numShelves: 2,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'none',
          hasBackPanel: true,
          hasPlinth: true
        },
        {
          id: 'mod_4',
          name: 'Módulo 4 - Porta Direita',
          width: 600,
          height: 714,
          depth: 600,
          offsetX: 1872,
          numShelves: 1,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'single_right',
          hasBackPanel: true,
          hasPlinth: true
        }
      ]
    })
  },
  {
    id: 'tmpl_armario_aereo_cozinha',
    name: 'Armário Aéreo Basculante e Portas',
    category: 'Cozinha',
    description: 'Armário aéreo suspenso 1800 x 700 x 350 mm com portas e nicho inferior.',
    thumbnail: 'armario_aereo',
    dimensions: { width: 1800, height: 700, depth: 350 },
    create: () => createParametricFurniture({
      name: 'Armário Aéreo 1800mm',
      type: 'cozinha_aereo',
      width: 1800,
      height: 700,
      depth: 350,
      carcaseMaterialId: 'mat_mdf_branco_tx_18',
      frontMaterialId: 'mat_mdf_grafite_silk_18',
      backMaterialId: 'mat_mdf_branco_tx_6',
      edgeTapeId: 'tape_pvc_grafite_1mm',
      carcaseThickness: 18,
      frontThickness: 18,
      backThickness: 6,
      plinthHeight: 0,
      modules: [
        {
          id: 'mod_aereo_1',
          name: 'Módulo 1 - Porta Dupla',
          width: 900,
          height: 664,
          depth: 350,
          offsetX: 18,
          numShelves: 1,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'double',
          hasBackPanel: true,
          hasPlinth: false
        },
        {
          id: 'mod_aereo_2',
          name: 'Módulo 2 - Porta Dupla',
          width: 900,
          height: 664,
          depth: 350,
          offsetX: 918,
          numShelves: 1,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'double',
          hasBackPanel: true,
          hasPlinth: false
        }
      ]
    })
  },
  {
    id: 'tmpl_guarda_roupa_closet',
    name: 'Guarda-Roupa Casal 3 Módulos',
    category: 'Dormitório',
    description: 'Guarda-roupa 2700 x 2400 x 600 mm com maleiro superior, 4 gavetas internas, 2 cabideiros e prateleiras.',
    thumbnail: 'guarda_roupa',
    dimensions: { width: 2700, height: 2400, depth: 600 },
    create: () => createParametricFurniture({
      name: 'Guarda-Roupa Casal 2700mm',
      type: 'armario_quarto',
      width: 2700,
      height: 2400,
      depth: 600,
      carcaseMaterialId: 'mat_mdf_branco_tx_18',
      frontMaterialId: 'mat_mdf_carvalho_malva_18',
      backMaterialId: 'mat_mdf_branco_tx_6',
      edgeTapeId: 'tape_pvc_carvalho_1mm',
      carcaseThickness: 18,
      frontThickness: 18,
      backThickness: 6,
      plinthHeight: 80,
      modules: [
        {
          id: 'mod_wardrobe_1',
          name: 'Módulo 1 - Cabideiro Longo',
          width: 900,
          height: 2284,
          depth: 600,
          offsetX: 18,
          numShelves: 1,
          shelfType: 'fixed',
          numDrawers: 0,
          drawerType: 'internal',
          doorsType: 'single_left',
          hasBackPanel: true,
          hasPlinth: true,
          hasClothesRail: true
        },
        {
          id: 'mod_wardrobe_2',
          name: 'Módulo 2 - Gaveteiro e Prateleiras',
          width: 900,
          height: 2284,
          depth: 600,
          offsetX: 918,
          numShelves: 3,
          shelfType: 'adjustable',
          numDrawers: 4,
          drawerType: 'external',
          doorsType: 'none',
          hasBackPanel: true,
          hasPlinth: true
        },
        {
          id: 'mod_wardrobe_3',
          name: 'Módulo 3 - Cabideiro Duplo',
          width: 900,
          height: 2284,
          depth: 600,
          offsetX: 1818,
          numShelves: 2,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'single_right',
          hasBackPanel: true,
          hasPlinth: true,
          hasClothesRail: true
        }
      ]
    })
  },
  {
    id: 'tmpl_rack_tv_painel',
    name: 'Home Theater Rack com Painel',
    category: 'Sala',
    description: 'Rack baixo suspenso 2200 x 550 x 450 mm com portas basculantes e gavetões.',
    thumbnail: 'rack_tv',
    dimensions: { width: 2200, height: 550, depth: 450 },
    create: () => createParametricFurniture({
      name: 'Rack TV Sala 2200mm',
      type: 'rack_sala',
      width: 2200,
      height: 550,
      depth: 450,
      carcaseMaterialId: 'mat_mdf_grafite_silk_18',
      frontMaterialId: 'mat_mdf_louro_freijo_18',
      backMaterialId: 'mat_mdf_branco_tx_6',
      edgeTapeId: 'tape_pvc_freijo_1mm',
      carcaseThickness: 18,
      frontThickness: 18,
      backThickness: 6,
      plinthHeight: 0,
      modules: [
        {
          id: 'mod_rack_1',
          name: 'Módulo 1 - Gavetão',
          width: 700,
          height: 514,
          depth: 450,
          offsetX: 18,
          numShelves: 0,
          shelfType: 'adjustable',
          numDrawers: 2,
          drawerType: 'external',
          doorsType: 'none',
          hasBackPanel: true,
          hasPlinth: false
        },
        {
          id: 'mod_rack_2',
          name: 'Módulo 2 - Nicho Equipamentos',
          width: 800,
          height: 514,
          depth: 450,
          offsetX: 736,
          numShelves: 1,
          shelfType: 'adjustable',
          numDrawers: 0,
          drawerType: 'external',
          doorsType: 'none',
          hasBackPanel: true,
          hasPlinth: false
        },
        {
          id: 'mod_rack_3',
          name: 'Módulo 3 - Porta Basculante',
          width: 700,
          height: 514,
          depth: 450,
          offsetX: 1554,
          numShelves: 0,
          shelfType: 'adjustable',
          numDrawers: 2,
          drawerType: 'external',
          doorsType: 'none',
          hasBackPanel: true,
          hasPlinth: false
        }
      ]
    })
  },
  {
    id: 'tmpl_gabinete_banheiro',
    name: 'Gabinete de Banheiro Suspenso',
    category: 'Banheiro',
    description: 'Gabinete para cuba 1000 x 600 x 500 mm com 2 gavetões e recorte para sifão.',
    thumbnail: 'banheiro',
    dimensions: { width: 1000, height: 600, depth: 500 },
    create: () => createParametricFurniture({
      name: 'Gabinete Banheiro 1000mm',
      type: 'banheiro',
      width: 1000,
      height: 600,
      depth: 500,
      carcaseMaterialId: 'mat_mdf_branco_tx_18',
      frontMaterialId: 'mat_mdf_verde_floresta_18',
      backMaterialId: 'mat_mdf_branco_tx_6',
      edgeTapeId: 'tape_pvc_branco_1mm',
      carcaseThickness: 18,
      frontThickness: 18,
      backThickness: 6,
      plinthHeight: 0,
      modules: [
        {
          id: 'mod_banh_1',
          name: 'Módulo Gavetões',
          width: 964,
          height: 564,
          depth: 500,
          offsetX: 18,
          numShelves: 0,
          shelfType: 'adjustable',
          numDrawers: 2,
          drawerType: 'external',
          doorsType: 'none',
          hasBackPanel: false, // para hidráulica
          hasPlinth: false
        }
      ]
    })
  }
];
