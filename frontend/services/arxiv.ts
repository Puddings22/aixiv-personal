
import { Paper, ArxivSortByOption } from '../types';
import { ARXIV_API_BASE_URL } from '../constants';

const parseArxivXML = (xmlText: string): { papers: Paper[], totalResults: number } => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  const errorNode = xmlDoc.querySelector("parsererror");
  if (errorNode) {
    console.error("Error parsing XML:", errorNode.textContent);
    throw new Error("Failed to parse arXiv API response.");
  }
  
  const totalResultsNode = xmlDoc.getElementsByTagName('opensearch:totalResults')[0];
  const totalResults = totalResultsNode ? parseInt(totalResultsNode.textContent || '0', 10) : 0;

  const entries = Array.from(xmlDoc.getElementsByTagName('entry'));
  const papers: Paper[] = entries.map(entry => {
    const id = entry.getElementsByTagName('id')[0]?.textContent || '';
    const updated = entry.getElementsByTagName('updated')[0]?.textContent || new Date().toISOString();
    const published = entry.getElementsByTagName('published')[0]?.textContent || new Date().toISOString();
    const title = entry.getElementsByTagName('title')[0]?.textContent || 'No title';
    const summary = entry.getElementsByTagName('summary')[0]?.textContent?.trim().replace(/\n/g, " ") || 'No summary';
    
    const authors = Array.from(entry.getElementsByTagName('author')).map(authorNode => ({
      name: authorNode.getElementsByTagName('name')[0]?.textContent || 'Unknown Author'
    }));
    
    let pdfLink = '';
    const links = Array.from(entry.getElementsByTagName('link'));
    const pdfLinkNode = links.find(link => link.getAttribute('title') === 'pdf');
    if (pdfLinkNode) {
      pdfLink = pdfLinkNode.getAttribute('href') || '';
    } else { 
        const appPdfLinkNode = links.find(link => link.getAttribute('type') === 'application/pdf');
        if(appPdfLinkNode) pdfLink = appPdfLinkNode.getAttribute('href') || '';
        else { 
            const genericPdfLinkNode = links.find(link => link.getAttribute('href')?.endsWith('.pdf'));
            if(genericPdfLinkNode) pdfLink = genericPdfLinkNode.getAttribute('href') || '';
        }
    }
    if (!pdfLink) { 
        const absLinkNode = links.find(link => link.getAttribute('rel') === 'alternate' && link.getAttribute('type') === 'text/html');
        pdfLink = absLinkNode?.getAttribute('href') || id; 
    }

    const categories = Array.from(entry.getElementsByTagName('category')).map(catNode => catNode.getAttribute('term') || '');

    return { id, updatedDate: updated, publishedDate: published, title, summary, authors, pdfLink, categories };
  });

  return { papers, totalResults };
};

export const fetchPapersFromArxiv = async (
  searchType: 'date_category' | 'global_keyword',
  start: number,
  maxResults: number,
  date?: string, 
  category?: string, 
  keyword?: string,
  sortBy: ArxivSortByOption = 'relevance' // Default to relevance
): Promise<{ papers: Paper[], totalResults: number }> => {
  
  let searchQueryValue = '';
  let effectiveSortBy = sortBy;
  let sortOrderValue = 'descending'; // Default for date-based sorts

  if (searchType === 'date_category') {
    if (!date || !category) {
      throw new Error("Date and category are required for 'date_category' search type.");
    }
    const formattedDate = date.replace(/-/g, ''); 
    const dateQuery = `submittedDate:[${formattedDate}000000 TO ${formattedDate}235959]`;
    // If category is 'all', don't add category filter
    if (category === 'all') {
      searchQueryValue = dateQuery;
    } else {
      searchQueryValue = `(${dateQuery}) AND cat:${category}`;
    }
    effectiveSortBy = 'submittedDate'; // Daily view is always sorted by submittedDate
  } else if (searchType === 'global_keyword') {
    if (!keyword || keyword.trim() === '') {
      throw new Error("Keyword is required for 'global_keyword' search type.");
    }
    searchQueryValue = `all:"${keyword.trim()}"`; 
    if (effectiveSortBy === 'relevance') { // For relevance, arXiv might not use sortOrder or prefer a specific one.
        sortOrderValue = 'descending'; // Or based on arXiv recommendation for relevance
    }
  } else {
    throw new Error("Invalid search type specified.");
  }
  
  const queryParams = new URLSearchParams({
    search_query: searchQueryValue,
    sortBy: effectiveSortBy,
    sortOrder: sortOrderValue,
    start: start.toString(),
    max_results: maxResults.toString(),
  });

  const url = `${ARXIV_API_BASE_URL}?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`arXiv API error ${response.status} for URL ${url}: ${errorText}`);
      throw new Error(`arXiv API request failed: ${response.status} - Check console for details.`);
    }
    const xmlText = await response.text();
    return parseArxivXML(xmlText);
  } catch (error) {
    console.error('Error fetching or parsing arXiv data:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching arXiv data.');
  }
};
