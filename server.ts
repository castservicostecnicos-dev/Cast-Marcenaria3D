import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = process.env.PORT || 3000;

// Gemini client initialization (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 1. API: Project furniture from natural language prompt
app.post('/api/ai/project', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt é obrigatório.' });
  }

  if (!ai) {
    return res.json({
      useLocalFallback: true,
      message: 'Chave Gemini API não configurada no servidor, utilizando motor semântico local.'
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Você é um engenheiro sênior de projetos de marcenaria sob medida e CAD/CAM paramétrico no Brasil.
Analise a seguinte descrição de um cliente ou marceneiro e elabore a projeção técnica e arquitetônica completa do móvel:

Descrição: "${prompt}"

Extraia com exatidão as dimensões, módulos internos, portas, gavetas, prateleiras, cabideiros e materiais.
Retorne ESTRITAMENTE um JSON com as seguintes propriedades:
- name: nome descritivo do móvel (ex: "Armário de Cozinha 4 Módulos")
- type: tipo do móvel ("cozinha_aereo" | "cozinha_balcao" | "armario_quarto" | "closet" | "rack_sala" | "banheiro" | "escritorio" | "nicho_livre")
- width: largura total em milímetros (ex: 2400)
- height: altura total em milímetros (ex: 850 ou 2200)
- depth: profundidade em milímetros (ex: 600 ou 450)
- numModules: quantidade de módulos verticais (1 a 6)
- doorsCount: número total de portas
- drawersCount: número total de gavetas
- shelvesCount: número total de prateleiras internas
- carcaseMaterialName: nome do material da carcaça (ex: "MDF Branco TX 18mm")
- frontMaterialName: nome do material das frentes (ex: "MDF Louro Freijó 18mm")
- hasPlinth: se possui rodapé inferior (boolean)
- hasClothesRail: se possui cabideiro metálico (boolean)
- hasBackPanel: se possui fundo de 6mm (boolean)
- rawExplanation: descrição detalhada e técnica da projeção arquitetônica e decisões estruturais (em português)
- modules: array de módulos com {
    name: string,
    numShelves: number,
    shelfType: "adjustable" | "fixed",
    numDrawers: number,
    drawerType: "external" | "internal",
    doorsType: "none" | "single_left" | "single_right" | "double",
    hasClothesRail?: boolean
  }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            width: { type: Type.NUMBER },
            height: { type: Type.NUMBER },
            depth: { type: Type.NUMBER },
            numModules: { type: Type.INTEGER },
            doorsCount: { type: Type.INTEGER },
            drawersCount: { type: Type.INTEGER },
            shelvesCount: { type: Type.INTEGER },
            carcaseMaterialName: { type: Type.STRING },
            frontMaterialName: { type: Type.STRING },
            hasPlinth: { type: Type.BOOLEAN },
            hasClothesRail: { type: Type.BOOLEAN },
            hasBackPanel: { type: Type.BOOLEAN },
            rawExplanation: { type: Type.STRING },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  numShelves: { type: Type.INTEGER },
                  shelfType: { type: Type.STRING },
                  numDrawers: { type: Type.INTEGER },
                  drawerType: { type: Type.STRING },
                  doorsType: { type: Type.STRING },
                  hasClothesRail: { type: Type.BOOLEAN }
                },
                required: ['name', 'numShelves', 'shelfType', 'numDrawers', 'drawerType', 'doorsType']
              }
            }
          },
          required: [
            'name', 'type', 'width', 'height', 'depth', 'numModules',
            'doorsCount', 'drawersCount', 'shelvesCount', 'hasPlinth', 'rawExplanation'
          ]
        }
      }
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err: any) {
    console.error('Erro na chamada Gemini:', err);
    res.status(500).json({
      error: 'Falha ao processar com Gemini',
      message: err.message,
      useLocalFallback: true
    });
  }
});

// 2. API: Parse arbitrary list of pieces (Excel, Corte Cloud, text) with AI
app.post('/api/ai/parse-pieces', async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json({ error: 'Texto da lista de peças é obrigatório.' });
  }

  if (!ai) {
    return res.json({ useLocalFallback: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Você é um especialista em software de marcenaria (Corte Cloud, Promob, Lepton).
Converta a seguinte lista bruta de peças de marcenaria (copiada do Excel, CSV, PDF ou WhatsApp) em uma lista padronizada de peças:

Texto:
"""
${rawText}
"""

Retorne ESTRITAMENTE um JSON no formato:
{
  "pieces": [
    {
      "name": "Nome da peça (ex: Lateral Esquerda, Porta, Base)",
      "type": "lateral_left" | "lateral_right" | "base" | "top" | "divider_vertical" | "shelf_fixed" | "shelf_adjustable" | "door" | "drawer_front" | "drawer_side" | "drawer_subfront" | "drawer_back" | "drawer_bottom" | "back" | "plinth",
      "length": número em mm (comprimento/altura),
      "width": número em mm (largura/profundidade),
      "thickness": 15 ou 18 ou 6,
      "quantity": quantidade inteira,
      "edgeTop": boolean,
      "edgeBottom": boolean,
      "edgeLeft": boolean,
      "edgeRight": boolean
    }
  ]
}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{"pieces":[]}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Erro ao interpretar peças com Gemini:', err);
    res.status(500).json({ error: err.message, useLocalFallback: true });
  }
});

// Mounting Vite in development or static dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`MarcenariaCAD Pro rodando em http://localhost:${port}`);
  });
}

startServer();
