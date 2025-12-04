
import { ArxivCategory, SelectableCategory, ArxivSortOption } from './types';

// Use proxy server in development to avoid CORS issues
// In production (Docker), use relative URLs so nginx can proxy them
// Set VITE_USE_PROXY=false to use direct API, or VITE_PROXY_PORT to change port
const IS_PRODUCTION = import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
const PROXY_PORT = import.meta.env.VITE_PROXY_PORT || '5000';
const USE_PROXY = import.meta.env.VITE_USE_PROXY !== 'false'; // Default to true unless explicitly disabled

export const ARXIV_API_BASE_URL = IS_PRODUCTION
  ? '/api/arxiv/query' // Relative URL for nginx proxy in production
  : USE_PROXY 
    ? `http://localhost:${PROXY_PORT}/api/arxiv/query` // Development proxy
    : 'https://export.arxiv.org/api/query'; // Direct API (not recommended due to CORS)
export const PAPERS_PER_PAGE = 15;

export const DEFAULT_ARXIV_CATEGORY: ArxivCategory = 'all';

export const AVAILABLE_ARXIV_CATEGORIES: SelectableCategory[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'cs.AI', label: 'AI (cs.AI)' },
  { value: 'cs.LG', label: 'Machine Learning (cs.LG)' },
  { value: 'cs.CV', label: 'Computer Vision (cs.CV)' },
  { value: 'cs.CL', label: 'Computation & Language (cs.CL)' },
  { value: 'cs.RO', label: 'Robotics (cs.RO)' },
  { value: 'stat.ML', label: 'Statistics - ML (stat.ML)' },
  { value: 'cs', label: 'Computer Science (all cs)' },
];

export const ARXIV_SORT_OPTIONS: ArxivSortOption[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'submittedDate', label: 'Submitted Date (Newest)' },
    { value: 'lastUpdatedDate', label: 'Last Updated Date (Newest)' },
];


// Gemini Models - now configured via GEMINI_MODEL environment variable

// Recharts PieChart colors
export const PIE_CHART_COLORS = [
  '#10B981', // Green 500
  '#F59E0B', // Yellow 500
  '#3B82F6', // Blue 500
  '#6366F1', // Indigo 500
  '#EC4899', // Pink 500
  '#8B5CF6', // Violet 500
  '#06B6D4', // Cyan 500
  '#D946EF', // Fuchsia 500
  '#F472B6', // Rose 500
  '#84CC16', // Lime 500
];

// Basic English Stop Words List
export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Arxiv/Research specific common words that might not be useful for clustering
  'paper', 'papers', 'study', 'studies', 'results', 'result', 'based', 'method', 'methods', 'approach', 'approaches',
  'model', 'models', 'data', 'dataset', 'datasets', 'analysis', 'research', 'algorithm', 'algorithms', 'system', 'systems',
  'propose', 'proposed', 'evaluate', 'evaluated', 'show', 'shown', 'demonstrate', 'demonstrated', 'discuss', 'discussed',
  'abstract', 'introduction', 'conclusion', 'conclusions', 'related', 'work', 'figure', 'table', 'arxiv', 'preprint',
  'et', 'al', 'also', 'however', 'therefore', 'thus', 'hence', 'within', 'without', 'via', 'using', 'non', 'well', 'doc', 'docs'
]);
