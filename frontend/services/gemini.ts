import { PaperSummaryForClustering, ClusterTheme } from '../types';

// Use proxy server in development to avoid CORS issues
// In production (Docker), use relative URLs so nginx can proxy them
const IS_PRODUCTION = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
const PROXY_PORT = import.meta.env.VITE_PROXY_PORT || '5000';
const USE_PROXY = import.meta.env.VITE_USE_PROXY !== 'false'; // Default to true unless explicitly disabled
const GEMINI_API_URL = IS_PRODUCTION
  ? '/api/gemini/themes' // Relative URL for nginx proxy in production
  : USE_PROXY 
    ? `http://localhost:${PROXY_PORT}/api/gemini/themes` // Development proxy
    : '/api/gemini/themes'; // Fallback (shouldn't be used in dev)

export const getPaperThemesFromGemini = async (
  papers: PaperSummaryForClustering[],
  modelName: string
): Promise<ClusterTheme[]> => {
  if (papers.length === 0) {
    return [];
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ papers, modelName })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.themes)) {
    return [];
  }
  return data.themes as ClusterTheme[];
};
