
export interface Author {
  name: string;
}

export interface Paper {
  id:string;
  title: string;
  summary: string;
  authors: Author[];
  publishedDate: string;
  updatedDate: string;
  pdfLink: string;
  categories: string[];
}

// For data sent to Gemini
export interface PaperSummaryForClustering {
  id: string;
  title: string;
  summary: string;
}

export interface ClusterTheme {
  name: string;
  count: number;
}

// Raw Arxiv Paper structure from parsing
export interface ArxivPaper {
    id: string;
    updated: string;
    published: string;
    title: string;
    summary: string;
    authors: { name: string }[];
    pdfLink: string;
    categories: string[];
}

// For Gemini API response structure
export interface GeminiClusterResponse {
  themes: ClusterTheme[];
}

export type SearchScope = 'filter_daily_cs_ai' | 'search_all_arxiv';
export type ViewMode = 'search' | 'favorites';

export type ArxivCategory = 'cs.AI' | 'cs.LG' | 'cs.CV' | 'cs.CL' | 'cs.RO' | 'stat.ML' | 'cs' | 'all';

export interface SelectableCategory {
  value: ArxivCategory;
  label: string;
}

export type ArxivSortByOption = 'relevance' | 'submittedDate' | 'lastUpdatedDate';

export interface ArxivSortOption {
    value: ArxivSortByOption;
    label: string;
}
