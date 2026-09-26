import { HardwareItem } from '../types/furniture';

export const DEFAULT_HARDWARE_CATALOG: HardwareItem[] = [
  {
    id: 'hd_dobradica_reta_amortecedor',
    code: 'DOB-RET-AM',
    name: 'Dobradiça Reta 35mm com Amortecedor Clip-on',
    category: 'hinge',
    manufacturer: 'Blum / FGV',
    model: 'Clip Top Blumotion 110°',
    specs: 'Caneco 35mm, calço com regulagem 3D, amortecimento integrado silencioso',
    quantity: 1,
    unitPrice: 16.50,
    mountingRules: {
      system32Compliant: true,
      clearanceNeeded: 2,
      drillingDiameter: 35,
      drillingDistance: 21.5
    }
  },
  {
    id: 'hd_dobradica_curva_amortecedor',
    code: 'DOB-CUR-AM',
    name: 'Dobradiça Curva 35mm com Amortecedor Clip-on',
    category: 'hinge',
    manufacturer: 'Blum / FGV',
    model: 'Clip Top Blumotion Meio-Cobrecravo',
    specs: 'Para divisórias com duas portas compartilhando montante',
    quantity: 1,
    unitPrice: 17.80,
    mountingRules: {
      system32Compliant: true,
      clearanceNeeded: 9,
      drillingDiameter: 35,
      drillingDistance: 21.5
    }
  },
  {
    id: 'hd_corredica_telescopica_500',
    code: 'COR-TEL-500',
    name: 'Corrediça Telescópica 500mm 45kg Amortecedor',
    category: 'slide',
    manufacturer: 'FGV / TN',
    model: 'Slowmove H45 Soft-Close',
    specs: 'Abertura total, rolamentos esferas de aço, freio amortecedor hidráulico',
    quantity: 1,
    unitPrice: 42.00,
    mountingRules: {
      system32Compliant: true,
      clearanceNeeded: 12.7, // 12.7mm de cada lado = ~26mm
      drillingDiameter: 5
    }
  },
  {
    id: 'hd_corredica_oculta_500',
    code: 'COR-OCU-500',
    name: 'Corrediça Oculta 500mm com Amortecedor',
    category: 'slide',
    manufacturer: 'Häfele / Blum',
    model: 'Movento / Quadro V6',
    specs: 'Montagem sob o fundo da gaveta, extração total, amortecedor embutido',
    quantity: 1,
    unitPrice: 88.00,
    mountingRules: {
      system32Compliant: true,
      clearanceNeeded: 21,
      drillingDiameter: 6
    }
  },
  {
    id: 'hd_minifix_conjunto',
    code: 'UNI-MIN-15',
    name: 'Dispositivo Minifix Tambor 15mm + Pino + Bucha',
    category: 'connector',
    manufacturer: 'Häfele',
    model: 'Minifix 15',
    specs: 'Tambor zamak 15mm altura 12mm + pino de união rosca euro',
    quantity: 1,
    unitPrice: 2.80,
    mountingRules: {
      system32Compliant: true,
      drillingDiameter: 15
    }
  },
  {
    id: 'hd_cavilha_madeira_8x30',
    code: 'UNI-CAV-830',
    name: 'Cavilha de Madeira Ranhurada 8 x 30 mm',
    category: 'connector',
    manufacturer: 'Geral',
    model: 'Eucalipto selecionado',
    specs: 'Chanfrada nas pontas para facilitar inserção e colagem',
    quantity: 1,
    unitPrice: 0.15,
    mountingRules: {
      system32Compliant: true,
      drillingDiameter: 8
    }
  },
  {
    id: 'hd_parafuso_confirmat_7x50',
    code: 'PAR-CON-750',
    name: 'Parafuso Confirmat 7.0 x 50 mm Zincado',
    category: 'connector',
    manufacturer: 'Ciser',
    model: 'Confirmat Cabeça Chata',
    specs: 'Rosca grossa ideal para MDF e MDP, furação escalonada',
    quantity: 1,
    unitPrice: 0.65,
    mountingRules: {
      system32Compliant: true,
      drillingDiameter: 5
    }
  },
  {
    id: 'hd_puxador_perfil_gola_preto',
    code: 'PUX-GOL-PRE',
    name: 'Puxador Perfil Gola Alumínio Preto Fosco',
    category: 'handle',
    manufacturer: 'Rometal',
    model: 'Perfil RM-027',
    specs: 'Encaixe superior ou lateral em cava com tampas laterais de acabamento',
    quantity: 1,
    unitPrice: 38.00
  },
  {
    id: 'hd_puxador_barra_slim_preto',
    code: 'PUX-BAR-160',
    name: 'Puxador Alça Barra Tubular 160mm Preto Fosco',
    category: 'handle',
    manufacturer: 'Torralba',
    model: 'Slim 160 mm',
    specs: 'Furação entre furos 160mm, parafusos M4 inclusos',
    quantity: 1,
    unitPrice: 24.50,
    mountingRules: {
      drillingDiameter: 4
    }
  },
  {
    id: 'hd_puxador_ponto_cilindrico',
    code: 'PUX-PON-INOX',
    name: 'Puxador Ponto Cilíndrico Aço Escovado',
    category: 'handle',
    manufacturer: 'Zen Design',
    model: 'Ponto 25mm',
    specs: 'Diâmetro 25mm, parafuso passante M4',
    quantity: 1,
    unitPrice: 18.00
  },
  {
    id: 'hd_suporte_prateleira_pino5',
    code: 'SUP-PRA-5MM',
    name: 'Suporte para Prateleira com Pino 5mm Niquelado',
    category: 'shelf_pin',
    manufacturer: 'Häfele',
    model: 'Pino com anel de apoio',
    specs: 'Encaixe direto na linha 32 mm, capacidade 50kg/conjunto de 4',
    quantity: 4,
    unitPrice: 0.75,
    mountingRules: {
      system32Compliant: true,
      drillingDiameter: 5
    }
  },
  {
    id: 'hd_pe_plastico_nivelador_100',
    code: 'PE-NIV-100',
    name: 'Pé Plástico Nivelador 100mm a 130mm Preto com Clip',
    category: 'foot',
    manufacturer: 'Citterio / FGV',
    model: 'Nivelador Rosca M10',
    specs: 'Resiste a umidade, clip de fixação para rodapé removível em MDF',
    quantity: 1,
    unitPrice: 5.50
  },
  {
    id: 'hd_tubo_cabideiro_oval',
    code: 'TUB-CAB-OVA',
    name: 'Tubo Cabideiro Oval Cromado com Suportes Laterais',
    category: 'hanger',
    manufacturer: 'Häfele',
    model: 'Tubo 30x15mm',
    specs: 'Aço cromado reforçado com suportes para parafusamento sistema 32',
    quantity: 1,
    unitPrice: 32.00
  }
];
