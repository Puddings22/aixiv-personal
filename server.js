/* Simple Express server to serve static files and proxy Gemini API requests securely */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const API_KEY = process.env.API_KEY;

app.use(express.json({ limit: '1mb' }));

// Healthcheck
app.get('/health', (_req, res) => {
  res.type('text/plain').send('healthy\n');
});

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Proxy endpoint for Gemini themes
app.post('/api/gemini/themes', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server is not configured with API_KEY' });
    }
    const { papers, modelName } = req.body || {};
    if (!Array.isArray(papers)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
      Given the following list of AI preprint titles and summaries:
      ${JSON.stringify(papers, null, 2)}

      Please perform the following tasks:
      1. Identify the main research themes present in these preprints. Aim for 5-7 distinct themes.
      2. For each identified theme, provide a short, descriptive name.
      3. Count how many papers fall under each theme.

      Return the result ONLY as a valid JSON object with the following structure:
      {
        "themes": [
          { "name": "Theme Name 1", "count": number_of_papers_in_theme_1 },
          { "name": "Theme Name 2", "count": number_of_papers_in_theme_2 }
        ]
      }

      Ensure the theme names are concise and accurately represent the content. Focus on the core topics.
      If there are very few papers or they are too diverse to form meaningful clusters, return an empty themes array or a JSON with "themes": [].
      Do not include any explanatory text before or after the JSON object.
    `;

    const selectedModel = (typeof modelName === 'string' && modelName.trim().length > 0) ? modelName : DEFAULT_MODEL;
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    let text = (response && typeof response.text === 'function') ? response.text() : '';
    if (text && typeof text.then === 'function') {
      text = await text;
    }
    let jsonStr = (text || '').toString().trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    const parsed = JSON.parse(jsonStr || '{"themes": []}');
    return res.json({ themes: Array.isArray(parsed.themes) ? parsed.themes : [] });
  } catch (err) {
    console.error('Gemini server error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// Serve static files from dist
const distDir = path.resolve(__dirname, 'dist');
app.use(express.static(distDir));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});


