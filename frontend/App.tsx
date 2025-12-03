

import React, { useState, useEffect, useCallback } from 'react';
import { Paper, ClusterTheme, SearchScope, ViewMode, ArxivCategory, PaperSummaryForClustering, ArxivSortByOption } from './types';
import { PAPERS_PER_PAGE, DEFAULT_ARXIV_CATEGORY, STOP_WORDS, AVAILABLE_ARXIV_CATEGORIES } from './constants';
import { getLastWorkingDay } from './utils/dateUtils';
import Header from './components/Header';
import ControlsBar from './components/ControlsBar';
import PaperItem from './components/PaperItem';
import PaginationControls from './components/PaginationControls';
import ThemePieChart from './components/ThemePieChart';
import LoadingIndicator from './components/LoadingIndicator';
import StatusMessage from './components/StatusMessage';
import { fetchPapersFromArxiv } from './services/arxiv';
import { convertPapersToCSV, downloadCSV } from './services/csvUtils';
import { saveFavoritesToCookie, loadFavoritesFromCookie } from './utils/cookieUtils'; 

interface SearchViewCache {
  allDailyPapersForDate: Paper[]; // For daily view
  papers: Paper[]; // For global search view (current page)
  displayedPapers: Paper[];
  currentPage: number;
  totalArxivResults: number;
  totalDisplayedAfterFilter: number;
  selectedDate: string;
  searchTerm: string;
  activeFilterTerm: string | null;
  activeGlobalSearchTerm: string | null;
  globalSearchSortBy: ArxivSortByOption;
  searchScope: SearchScope;
  selectedArxivCategory: ArxivCategory;
  themeData: ClusterTheme[];
  papersCountForCurrentCluster: number | null;
  arxivError: string | null;
  geminiError: string | null;
  statusMessageText: string;
  selectedPaperIdsForExport: Set<string>;
}

const App: React.FC = () => {
  // General App State
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  
  // Search View State - Initialize with last working day
  const [selectedDate, setSelectedDate] = useState<string>(getLastWorkingDay());
  const [selectedArxivCategory, setSelectedArxivCategory] = useState<ArxivCategory>(DEFAULT_ARXIV_CATEGORY);
  
  const [allDailyPapersForDate, setAllDailyPapersForDate] = useState<Paper[]>([]); // Holds ALL papers for daily view
  const [papers, setPapers] = useState<Paper[]>([]); // Holds current page for global search
  const [displayedPapers, setDisplayedPapers] = useState<Paper[]>([]); 
  
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalArxivResults, setTotalArxivResults] = useState<number>(0); // Total from API (all for day, or all for global search)
  const [totalDisplayedAfterFilter, setTotalDisplayedAfterFilter] = useState<number>(0); // Total after client-side filter (for daily pagination)

  const [isLoadingArxiv, setIsLoadingArxiv] = useState<boolean>(false);
  const [arxivError, setArxivError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilterTerm, setActiveFilterTerm] = useState<string | null>(null); // For daily view client-side filter
  const [activeGlobalSearchTerm, setActiveGlobalSearchTerm] = useState<string | null>(null); // For global search
  const [globalSearchSortBy, setGlobalSearchSortBy] = useState<ArxivSortByOption>('relevance');
  const [searchScope, setSearchScope] = useState<SearchScope>('filter_daily_cs_ai');
  
  // Clustering State
  const [themeData, setThemeData] = useState<ClusterTheme[]>([]);
  const [papersCountForCurrentCluster, setPapersCountForCurrentCluster] = useState<number | null>(null);
  const [isLoadingArxivCategoriesCluster, setIsLoadingArxivCategoriesCluster] = useState<boolean>(false);
  const [isLoadingKeywordCluster, setIsLoadingKeywordCluster] = useState<boolean>(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{text: string, type: 'info' | 'error' | 'success'} | null>(null);

  // Favorites View State
  const [favoritePapers, setFavoritePapers] = useState<Paper[]>([]);
  const [favoriteSearchTerm, setFavoriteSearchTerm] = useState<string>('');
  const [displayedFavoritePapers, setDisplayedFavoritePapers] = useState<Paper[]>([]);

  const [lastSearchViewCache, setLastSearchViewCache] = useState<SearchViewCache | null>(null);
  const [isRestoringFromCache, setIsRestoringFromCache] = useState<boolean>(false);

  const [selectedPaperIdsForExport, setSelectedPaperIdsForExport] = useState<Set<string>>(new Set());
  const [isLoadingFullExport, setIsLoadingFullExport] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false); // Track if user has triggered search
  const [isLoadingMorePages, setIsLoadingMorePages] = useState<boolean>(false); // Track background loading


  // Track if we've initialized favorites from cookies to prevent overwriting on mount
  const [favoritesInitialized, setFavoritesInitialized] = useState<boolean>(false);

  // Load favorites from cookies on mount - will be matched with papers when they load
  useEffect(() => {
    const favoriteIds = loadFavoritesFromCookie();
    if (favoriteIds.length > 0) {
      setFavoritesInitialized(true);
    }
  }, []);

  // Save favorites to cookie whenever they change (but only after initialization)
  useEffect(() => {
    // Only save if we've initialized (loaded from cookies) or if user is actively changing favorites
    // This prevents overwriting cookies with empty array on initial page load
    if (favoritesInitialized) {
      const favoriteIds = favoritePapers.map(p => p.id);
      saveFavoritesToCookie(favoriteIds);
    }
  }, [favoritePapers, favoritesInitialized]);

   useEffect(() => {
    if (viewMode === 'favorites') {
      if (!favoriteSearchTerm) {
        setDisplayedFavoritePapers(favoritePapers);
      } else {
        const lowerCaseTerm = favoriteSearchTerm.toLowerCase();
        setDisplayedFavoritePapers(
          favoritePapers.filter(p =>
            p.title.toLowerCase().includes(lowerCaseTerm) ||
            p.summary.toLowerCase().includes(lowerCaseTerm) ||
            p.authors.some(a => a.name.toLowerCase().includes(lowerCaseTerm))
          )
        );
      }
    }
  }, [favoritePapers, favoriteSearchTerm, viewMode]);


  const toggleFavorite = (paperId: string) => {
    // Ensure favorites are initialized when user toggles
    if (!favoritesInitialized) {
      setFavoritesInitialized(true);
    }
    
    setFavoritePapers(prevFavorites => {
      const isAlreadyFavorite = prevFavorites.some(p => p.id === paperId);
      if (isAlreadyFavorite) {
        return prevFavorites.filter(p => p.id !== paperId);
      } else {
        // Find paper from all possible current sources
        const paperToToggle = 
            allDailyPapersForDate.find(p => p.id === paperId) || 
            papers.find(p => p.id === paperId) || 
            (lastSearchViewCache?.allDailyPapersForDate || []).find(p => p.id === paperId) ||
            (lastSearchViewCache?.papers || []).find(p => p.id === paperId) ||
            (viewMode === 'search' ? displayedPapers.find(p => p.id === paperId) : displayedFavoritePapers.find(p => p.id === paperId));
            
        if (paperToToggle) {
          return [...prevFavorites, paperToToggle];
        }
        console.warn("Paper to favorite not found in current lists:", paperId);
        setStatusMessage({ text: "Could not add paper to favorites: original paper data not found.", type: "error" });
        return prevFavorites;
      }
    });
  };
  
  const clearSearchStateAndSelections = (keepSelections: boolean = false) => {
    setAllDailyPapersForDate([]); setPapers([]);
    setDisplayedPapers([]);
    setTotalArxivResults(0); setTotalDisplayedAfterFilter(0);
    setArxivError(null);
    if (!keepSelections) {
      setSelectedPaperIdsForExport(new Set());
    }
  };
  
  const fetchAllPapersForDateCategoryInternal = async (
    date: string, 
    category: ArxivCategory,
    loadIncrementally: boolean = true
  ): Promise<{ papers: Paper[], totalResults: number }> => {
    const initialFetch = await fetchPapersFromArxiv('date_category', 0, 1, date, category);
    const totalForDay = initialFetch.totalResults;
    if (totalForDay === 0) return { papers: [], totalResults: 0 };

    // Load first page immediately
    const firstPageData = await fetchPapersFromArxiv('date_category', 0, PAPERS_PER_PAGE, date, category);
    let allFetchedPapers: Paper[] = firstPageData.papers;
    
    // Update state with first page immediately
    setAllDailyPapersForDate(firstPageData.papers);
    setTotalArxivResults(totalForDay);
    
    if (!loadIncrementally) {
      // If not incremental, load all pages
      const numPages = Math.ceil(totalForDay / PAPERS_PER_PAGE);
      for (let i = 1; i < numPages; i++) {
        const start = i * PAPERS_PER_PAGE;
        try {
          const pageData = await fetchPapersFromArxiv('date_category', start, PAPERS_PER_PAGE, date, category);
          allFetchedPapers = allFetchedPapers.concat(pageData.papers);
          setAllDailyPapersForDate([...allFetchedPapers]);
        } catch (error) {
          console.error(`Error fetching page ${i+1} for ${date}/${category}:`, error);
        }
      }
      return { papers: allFetchedPapers, totalResults: totalForDay };
    }

    // Incremental loading: continue loading remaining pages in background
    const numPages = Math.ceil(totalForDay / PAPERS_PER_PAGE);
    if (numPages > 1) {
      setIsLoadingMorePages(true);
      // Load remaining pages in background
      (async () => {
        for (let i = 1; i < numPages; i++) {
          const start = i * PAPERS_PER_PAGE;
          try {
            const pageData = await fetchPapersFromArxiv('date_category', start, PAPERS_PER_PAGE, date, category);
            allFetchedPapers = allFetchedPapers.concat(pageData.papers);
            // Update state as each page loads
            setAllDailyPapersForDate([...allFetchedPapers]);
          } catch (error) {
            console.error(`Error fetching page ${i+1} for ${date}/${category}:`, error);
          }
        }
        setIsLoadingMorePages(false);
      })();
    }
    
    return { papers: allFetchedPapers, totalResults: totalForDay };
  };


  const loadPapers = useCallback(async (
      pageForGlobalSearch: number, 
      currentSearchScope: SearchScope,
      currentSelectedDate: string, 
      currentSelectedArxivCategory: ArxivCategory, 
      currentActiveGlobalSearchTerm: string | null,
      currentGlobalSearchSortBy: ArxivSortByOption,
      keepSelections: boolean = false // Controls if selectedPaperIdsForExport is cleared
    ) => {
    setIsLoadingArxiv(true);
    setArxivError(null);
    setStatusMessage(null); 
    if (!keepSelections) setSelectedPaperIdsForExport(new Set());
    setThemeData([]); setPapersCountForCurrentCluster(null); setGeminiError(null);
    
    try {
      if (currentSearchScope === 'filter_daily_cs_ai') {
        setStatusMessage({text: `Fetching papers for ${currentSelectedDate}...`, type: 'info'});
        const { papers: allPapers, totalResults: totalForDay } = await fetchAllPapersForDateCategoryInternal(currentSelectedDate, currentSelectedArxivCategory, true);
        // Papers are already set incrementally in fetchAllPapersForDateCategoryInternal
        setTotalArxivResults(totalForDay);
        setCurrentPage(1);
        
        // Load favorites from cookies and match with loaded papers
        const favoriteIds = loadFavoritesFromCookie();
        if (favoriteIds.length > 0) {
          // Match favorite IDs with loaded papers
          const favoritePapersData = allPapers.filter(p => favoriteIds.includes(p.id));
          setFavoritePapers(favoritePapersData);
          setFavoritesInitialized(true);
        } else {
          // No favorites in cookie, mark as initialized so we can save new ones
          setFavoritesInitialized(true);
        } 
      } else if (currentSearchScope === 'search_all_arxiv') {
        if (!currentActiveGlobalSearchTerm || currentActiveGlobalSearchTerm.trim() === '') {
          const errorMsg = "Please enter a search term for 'Search All ArXiv'.";
          setArxivError(errorMsg); setStatusMessage({ text: errorMsg, type: 'error'});
          setPapers([]); setDisplayedPapers([]); setTotalArxivResults(0); setActiveGlobalSearchTerm(null);
          return;
        }
        // setCurrentPage(pageForGlobalSearch); // Set by caller (handlePageChange or initial load)
        const { papers: fetchedPapers, totalResults } = await fetchPapersFromArxiv(
          'global_keyword', (pageForGlobalSearch - 1) * PAPERS_PER_PAGE, PAPERS_PER_PAGE, 
          undefined, undefined, currentActiveGlobalSearchTerm, currentGlobalSearchSortBy
        );
        setPapers(fetchedPapers); 
        setDisplayedPapers(fetchedPapers); 
        setTotalArxivResults(totalResults);
        setTotalDisplayedAfterFilter(totalResults);
        
        // Load favorites from cookies and match with loaded papers
        const favoriteIds = loadFavoritesFromCookie();
        if (favoriteIds.length > 0) {
          const favoritePapersData = fetchedPapers.filter(p => favoriteIds.includes(p.id));
          // Merge with existing favorites, avoiding duplicates
          setFavoritePapers(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newFavorites = favoritePapersData.filter(p => !existingIds.has(p.id));
            const merged = [...prev, ...newFavorites];
            setFavoritesInitialized(true);
            return merged;
          });
        } else {
          // No favorites in cookie, mark as initialized so we can save new ones
          setFavoritesInitialized(true);
        } 
      }
    } catch (error) {
      console.error("Error in loadPapers:", error);
      const errorMsg = (error as Error).message || 'Failed to process paper request.';
      setArxivError(errorMsg); setStatusMessage({text: errorMsg, type: 'error'});
      setAllDailyPapersForDate([]); setPapers([]); setDisplayedPapers([]); setTotalArxivResults(0); setTotalDisplayedAfterFilter(0);
    } finally {
      setIsLoadingArxiv(false);
      setStatusMessage(null); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

 // Don't auto-load - wait for user to click search button
  // Removed auto-load useEffect - now requires explicit search action
  // isLoadingFullExport removed as it should not trigger re-loadPapers, it's a separate flow.
  // currentPage is removed from deps here. Page changes are handled by handlePageChange for global search.


  useEffect(() => { 
    if (viewMode === 'favorites' || searchScope !== 'filter_daily_cs_ai' || isLoadingArxiv || isLoadingFullExport) {
      return;
    }

    let filtered = allDailyPapersForDate;
    if (activeFilterTerm) {
      const lowerCaseSearchTerm = activeFilterTerm.toLowerCase();
      filtered = allDailyPapersForDate.filter(paper => 
        paper.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        paper.summary.toLowerCase().includes(lowerCaseSearchTerm) ||
        paper.authors.some(author => author.name.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    setTotalDisplayedAfterFilter(filtered.length);

    const startIndex = (currentPage - 1) * PAPERS_PER_PAGE;
    const endIndex = startIndex + PAPERS_PER_PAGE;
    setDisplayedPapers(filtered.slice(startIndex, endIndex));

  }, [allDailyPapersForDate, activeFilterTerm, currentPage, searchScope, viewMode, isLoadingArxiv, isLoadingFullExport]);


  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSearchTerm(''); setActiveFilterTerm(null); setCurrentPage(1); setSelectedPaperIdsForExport(new Set());
  };

  const handleCategoryChange = (category: ArxivCategory) => {
    setSelectedArxivCategory(category);
    setSearchTerm(''); setActiveFilterTerm(null); setCurrentPage(1); setSelectedPaperIdsForExport(new Set());
    setHasSearched(false); // Reset search state when category changes
  };
  
  const handleSearchScopeChange = (scope: SearchScope) => {
    setSearchScope(scope);
    setSearchTerm(''); setActiveFilterTerm(null); setActiveGlobalSearchTerm(null); 
    setThemeData([]); setPapersCountForCurrentCluster(null); setGeminiError(null); setArxivError(null); setStatusMessage(null);
    setCurrentPage(1); setSelectedPaperIdsForExport(new Set());
    setHasSearched(false); // Reset search state when scope changes
    // clearSearchStateAndSelections(false); // `loadPapers` will handle this implicitly due to deps change
    
    if (scope === 'search_all_arxiv' && !activeGlobalSearchTerm && !searchTerm.trim()) { 
        const errorMsg = "Enter a keyword and press Search for 'Search All ArXiv'.";
        setArxivError(errorMsg);
        setStatusMessage({text: errorMsg, type: 'info'});
    }
  };
   const handleGlobalSortByChange = (sortOption: ArxivSortByOption) => {
    setGlobalSearchSortBy(sortOption);
    setCurrentPage(1); 
    setSelectedPaperIdsForExport(new Set());
  };


  const handleSearchSubmit = () => {
    if (viewMode === 'favorites') return;
    setHasSearched(true);
    setCurrentPage(1); 
    setSelectedPaperIdsForExport(new Set()); // New search clears selections
    
    if (searchScope === 'filter_daily_cs_ai') {
      setActiveFilterTerm(searchTerm.trim() || null);
      // Trigger load for daily view
      loadPapers(1, searchScope, selectedDate, selectedArxivCategory, null, globalSearchSortBy, false);
    } else if (searchScope === 'search_all_arxiv') {
      const termToSearch = searchTerm.trim();
      setActiveGlobalSearchTerm(termToSearch || null); 
      if (!termToSearch) {
         const errorMsg = "Please enter a search term for 'Search All ArXiv'.";
         setArxivError(errorMsg); setStatusMessage({text: errorMsg, type: 'error'});
         setPapers([]); setDisplayedPapers([]); setTotalArxivResults(0);
      } else {
        // Trigger load for global search
        loadPapers(1, searchScope, selectedDate, selectedArxivCategory, termToSearch, globalSearchSortBy, false);
      }
    }
  };

  const handleClearFilter = () => { 
    setSearchTerm(''); setActiveFilterTerm(null); setCurrentPage(1);
    // Selections are kept for daily view if just clearing a filter.
  };

  const getPapersForClustering = (): Paper[] => {
    if (viewMode === 'favorites') {
      return displayedFavoritePapers;
    }
    if (searchScope === 'filter_daily_cs_ai') {
      if (activeFilterTerm) {
          const lowerCaseSearchTerm = activeFilterTerm.toLowerCase();
          return allDailyPapersForDate.filter(paper =>
              paper.title.toLowerCase().includes(lowerCaseSearchTerm) ||
              paper.summary.toLowerCase().includes(lowerCaseSearchTerm) ||
              paper.authors.some(author => author.name.toLowerCase().includes(lowerCaseSearchTerm))
          );
      }
      return allDailyPapersForDate; 
    } else { 
      return displayedPapers; 
    }
  };

  // Removed AI clustering feature - commonClusterLogic and handleClusterThemesAI removed

  const handleClusterByArxivCategories = () => {
    const papersToAnalyze = getPapersForClustering();
    if (papersToAnalyze.length === 0) {
        setGeminiError("No papers to cluster."); setThemeData([]); setPapersCountForCurrentCluster(0); 
        setStatusMessage({text: "No papers to cluster.", type: 'info'}); return;
    }
    setIsLoadingArxivCategoriesCluster(true); setGeminiError(null); setThemeData([]); setPapersCountForCurrentCluster(papersToAnalyze.length); 
    const categoryCounts: { [key: string]: number } = {};
    papersToAnalyze.forEach(paper => {
        paper.categories.forEach(category => {
            const cat = category.split('.')[0] === 'cs' ? category : category.split(' ')[0].split('.')[0];
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
    });
    const sortedCategories = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a).slice(0, 10); 
    const newThemeData: ClusterTheme[] = sortedCategories.map(([name, count]) => ({ name, count }));
    if (newThemeData.length === 0) {
      setGeminiError("No common ArXiv categories found.");
      setStatusMessage({text: "No common ArXiv categories found for clustering.", type: 'info'});
    }
    setThemeData(newThemeData); setIsLoadingArxivCategoriesCluster(false);
  };

  const handleClusterByKeywords = () => {
    const papersToAnalyze = getPapersForClustering();
     if (papersToAnalyze.length === 0) {
        setGeminiError("No papers to cluster."); setThemeData([]); setPapersCountForCurrentCluster(0); 
        setStatusMessage({text: "No papers to cluster.", type: 'info'}); return;
    }
    setIsLoadingKeywordCluster(true); setGeminiError(null); setThemeData([]); setPapersCountForCurrentCluster(papersToAnalyze.length); 
    const allText = papersToAnalyze.map(p => `${p.title} ${p.summary}`).join(' ').toLowerCase();
    const words = allText.match(/\b[a-z]{3,}\b/g) || []; 
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => { if (!STOP_WORDS.has(word)) wordCounts[word] = (wordCounts[word] || 0) + 1; });
    const sortedKeywords = Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 10); 
    const newThemeData: ClusterTheme[] = sortedKeywords.map(([name, occurrences]) => {
        const papersWithKeyword = papersToAnalyze.filter(p => 
            `${p.title} ${p.summary}`.toLowerCase().includes(` ${name} `) || 
            `${p.title} ${p.summary}`.toLowerCase().startsWith(`${name} `) ||
            `${p.title} ${p.summary}`.toLowerCase().endsWith(` ${name}`) 
        ).length;
        return { name: `${name} (in ${papersWithKeyword} docs)`, count: papersWithKeyword };
    }).filter(theme => theme.count > 0); 
    if (newThemeData.length === 0) {
      setGeminiError("Could not extract meaningful keywords present in multiple documents.");
      setStatusMessage({text: "Could not extract meaningful keywords for clustering.", type: 'info'});
    }
    setThemeData(newThemeData); setIsLoadingKeywordCluster(false);
  };


  const handlePageChange = (newPage: number) => {
    // Selections (selectedPaperIdsForExport) are NOT cleared on page change.
    setCurrentPage(newPage);
    if (searchScope === 'search_all_arxiv') {
        if (!activeGlobalSearchTerm) { 
            const errorMsg = "Cannot paginate without an active global search term.";
            setArxivError(errorMsg); setStatusMessage({text: errorMsg, type: 'error'});
            return; 
        }
        // Load papers for the new page, keeping existing selections.
        loadPapers(newPage, searchScope, selectedDate, selectedArxivCategory, activeGlobalSearchTerm, globalSearchSortBy, true);
    }
    // For daily view, useEffect watching currentPage will update displayedPapers from allDailyPapersForDate.
  };

  const currentStatusMessageText = useCallback(() => {
    if (isLoadingArxiv || isLoadingFullExport) return ""; 

    if (viewMode === 'search') {
        if (searchScope === 'search_all_arxiv') {
            if (activeGlobalSearchTerm) return `Showing ${displayedPapers.length} of ${totalArxivResults} papers from ArXiv matching "${activeGlobalSearchTerm}". (Page ${currentPage} of ${Math.ceil(totalArxivResults / PAPERS_PER_PAGE)})`;
            if (!activeGlobalSearchTerm && !arxivError && !statusMessage) return "Enter a keyword and press Search to query all of ArXiv.";
        } else { // filter_daily_cs_ai
            const categoryName = AVAILABLE_ARXIV_CATEGORIES.find(c => c.value === selectedArxivCategory)?.label || selectedArxivCategory;
            if (totalArxivResults === 0 && !arxivError && !statusMessage && !isLoadingArxiv) return `No ${categoryName} papers found for ${selectedDate}.`;
            
            if (!arxivError && !statusMessage && !isLoadingArxiv && totalArxivResults > 0) {
                let msg = `Showing ${displayedPapers.length} of ${totalDisplayedAfterFilter} ${activeFilterTerm ? 'filtered ' : ''}${categoryName} papers.`;
                msg += ` (${totalArxivResults} total for ${selectedDate}). Page ${currentPage} of ${Math.ceil(totalDisplayedAfterFilter / PAPERS_PER_PAGE)}.`;
                if (activeFilterTerm) msg += ` Filtered by "${activeFilterTerm}".`;
                return msg;
            }
        }
    } else if (viewMode === 'favorites') { 
        if (favoritePapers.length === 0 && !favoriteSearchTerm) return "You have no favorite papers yet. Star relevant papers or load a favorites file.";
        if (favoriteSearchTerm && displayedFavoritePapers.length === 0) return `No favorited papers match "${favoriteSearchTerm}".`;
        return `Showing ${displayedFavoritePapers.length} of ${favoritePapers.length} favorite papers ${favoriteSearchTerm ? `matching "${favoriteSearchTerm}"` : ''}.`;
    }
    return "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
      viewMode, isLoadingArxiv, isLoadingFullExport, searchScope, activeGlobalSearchTerm, 
      displayedPapers.length, totalArxivResults, totalDisplayedAfterFilter, selectedArxivCategory, selectedDate, 
      activeFilterTerm, favoritePapers.length, displayedFavoritePapers.length, favoriteSearchTerm, 
      currentPage, arxivError, statusMessage
  ]);


  const handleToggleViewMode = () => {
    const newViewMode = viewMode === 'search' ? 'favorites' : 'search';
    setArxivError(null); setGeminiError(null); setStatusMessage(null);
    
    if (newViewMode === 'favorites') { 
      setLastSearchViewCache({
        allDailyPapersForDate, papers, displayedPapers, currentPage, totalArxivResults, totalDisplayedAfterFilter,
        selectedDate, searchTerm, activeFilterTerm, activeGlobalSearchTerm, globalSearchSortBy,
        searchScope, selectedArxivCategory, themeData, papersCountForCurrentCluster, 
        arxivError, geminiError, statusMessageText: currentStatusMessageText(), selectedPaperIdsForExport
      });
      setThemeData([]); setPapersCountForCurrentCluster(null);
      setSelectedPaperIdsForExport(new Set()); // Selections are context-specific to a view/search
    } else { 
      if (lastSearchViewCache) {
        setIsRestoringFromCache(true);
        setAllDailyPapersForDate(lastSearchViewCache.allDailyPapersForDate);
        setPapers(lastSearchViewCache.papers); setDisplayedPapers(lastSearchViewCache.displayedPapers);
        setCurrentPage(lastSearchViewCache.currentPage); 
        setTotalArxivResults(lastSearchViewCache.totalArxivResults);
        setTotalDisplayedAfterFilter(lastSearchViewCache.totalDisplayedAfterFilter);
        setSelectedDate(lastSearchViewCache.selectedDate); setSearchTerm(lastSearchViewCache.searchTerm);
        setActiveFilterTerm(lastSearchViewCache.activeFilterTerm); 
        setActiveGlobalSearchTerm(lastSearchViewCache.activeGlobalSearchTerm);
        setGlobalSearchSortBy(lastSearchViewCache.globalSearchSortBy);
        setSearchScope(lastSearchViewCache.searchScope); setSelectedArxivCategory(lastSearchViewCache.selectedArxivCategory);
        setThemeData(lastSearchViewCache.themeData); setPapersCountForCurrentCluster(lastSearchViewCache.papersCountForCurrentCluster);
        setArxivError(lastSearchViewCache.arxivError); setGeminiError(lastSearchViewCache.geminiError);
        setSelectedPaperIdsForExport(lastSearchViewCache.selectedPaperIdsForExport);
      } else {
        setSelectedDate(new Date().toISOString().split('T')[0]); 
        setSelectedArxivCategory(DEFAULT_ARXIV_CATEGORY);
        setSearchScope('filter_daily_cs_ai'); 
        setGlobalSearchSortBy('relevance');
        setSearchTerm(''); setActiveFilterTerm(null); setActiveGlobalSearchTerm(null);
        setSelectedPaperIdsForExport(new Set()); 
        setThemeData([]); setPapersCountForCurrentCluster(null);
      }
    }
    setViewMode(newViewMode);
  };

  const handleTogglePaperSelection = (paperId: string) => {
    setSelectedPaperIdsForExport(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(paperId)) {
        newSelected.delete(paperId);
      } else {
        newSelected.add(paperId);
      }
      return newSelected;
    });
  };

  const isSelectAllOnPageChecked = (): boolean => {
    const papersOnPage = viewMode === 'search' ? displayedPapers : displayedFavoritePapers;
    if(papersOnPage.length === 0) return false;
    return papersOnPage.every(p => selectedPaperIdsForExport.has(p.id));
  };

  const handleToggleSelectAllOnPage = () => {
    const papersToList = viewMode === 'search' ? displayedPapers : displayedFavoritePapers;
    const allCurrentPageIds = new Set(papersToList.map(p => p.id));

    if (isSelectAllOnPageChecked()) { 
      setSelectedPaperIdsForExport(prevSelected => {
        const newSelected = new Set(prevSelected);
        allCurrentPageIds.forEach(id => newSelected.delete(id));
        return newSelected;
      });
    } else { 
      setSelectedPaperIdsForExport(prevSelected => {
        const newSelected = new Set(prevSelected);
        allCurrentPageIds.forEach(id => newSelected.add(id));
        return newSelected;
      });
    }
  };

  const fetchAllPapersForGlobalKeyword = async (
    keyword: string, 
    sortBy: ArxivSortByOption,
    totalResultsToFetch: number
  ): Promise<Paper[]> => {
    if (totalResultsToFetch === 0 || !keyword) return [];
    
    let allFetchedPapers: Paper[] = [];
    const numPages = Math.ceil(totalResultsToFetch / PAPERS_PER_PAGE);
  
    for (let i = 0; i < numPages; i++) {
      const start = i * PAPERS_PER_PAGE;
      if (numPages > 1) { 
           setStatusMessage({ text: `Fetching all papers for export (keyword: "${keyword}")... page ${i + 1} of ${numPages}`, type: "info" });
      }
      try {
        const pageData = await fetchPapersFromArxiv('global_keyword', start, PAPERS_PER_PAGE, undefined, undefined, keyword, sortBy);
        allFetchedPapers = allFetchedPapers.concat(pageData.papers);
      } catch (error) {
          console.error(`Error fetching page ${i+1} for global keyword export:`, error);
          throw new Error(`Failed to fetch all papers for global export (page ${i+1}). Review console.`);
      }
    }
    return allFetchedPapers;
  };


  const handleExportToCSV = async () => {
    let papersToExport: Paper[] = [];
    
    if (selectedPaperIdsForExport.size > 0) {
        if (viewMode === 'search') {
            if (searchScope === 'filter_daily_cs_ai') {
                // Selections are from allDailyPapersForDate
                papersToExport = allDailyPapersForDate.filter(p => selectedPaperIdsForExport.has(p.id));
            } else { // search_all_arxiv - Selections can be from any page of the global search
                if (totalArxivResults === 0 || !activeGlobalSearchTerm) {
                    setStatusMessage({ text: "Cannot export selected: No active global search.", type: "info" });
                    return;
                }
                setIsLoadingFullExport(true);
                setStatusMessage({ text: `Fetching all ${totalArxivResults} papers for global search to apply ${selectedPaperIdsForExport.size} selections...`, type: "info" });
                try {
                    const allGloballySearchedPapers = await fetchAllPapersForGlobalKeyword(activeGlobalSearchTerm, globalSearchSortBy, totalArxivResults);
                    papersToExport = allGloballySearchedPapers.filter(p => selectedPaperIdsForExport.has(p.id));
                } catch (error) {
                    console.error("Error fetching all global papers for selected export:", error);
                    setStatusMessage({ text: `Error fetching global papers for selection: ${(error as Error).message}`, type: "error" });
                    setIsLoadingFullExport(false); return;
                } finally { setIsLoadingFullExport(false); }
            }
        } else {  // favorites view
            papersToExport = favoritePapers.filter(p => selectedPaperIdsForExport.has(p.id));
        }

        if (papersToExport.length < selectedPaperIdsForExport.size) {
             setStatusMessage({ text: `Warning: Not all ${selectedPaperIdsForExport.size} selected papers could be found for export. Exporting ${papersToExport.length}. This might happen if the underlying data changed.`, type: 'info' });
        }
        if (papersToExport.length === 0 && selectedPaperIdsForExport.size > 0) {
            setStatusMessage({ text: `No selected papers could be found for export.`, type: 'info' });
            return;
        }

    } else { // No papers selected, export based on view/scope (Export All logic)
        if (viewMode === 'search') {
            if (searchScope === 'filter_daily_cs_ai') {
                if (totalArxivResults === 0) { setStatusMessage({ text: "No daily papers to export.", type: "info" }); return; }
                // allDailyPapersForDate should already contain all, no need to re-fetch usually
                papersToExport = allDailyPapersForDate; 
                 if (papersToExport.length !== totalArxivResults) { // Safety check or if there was a partial load previously
                    setIsLoadingFullExport(true);
                    setStatusMessage({ text: `Re-fetching all ${totalArxivResults} papers for daily export...`, type: "info" });
                    try {
                        const { papers: allPapers } = await fetchAllPapersForDateCategoryInternal(selectedDate, selectedArxivCategory);
                        papersToExport = allPapers;
                    } catch (error) { 
                        console.error("Error re-fetching all daily papers for export:", error);
                        setStatusMessage({ text: `Error re-fetching daily papers for export: ${(error as Error).message}`, type: "error" });
                        setIsLoadingFullExport(false); return;
                     } finally { setIsLoadingFullExport(false); }
                 }
            } else { // search_all_arxiv
                if (totalArxivResults === 0 || !activeGlobalSearchTerm) {
                    setStatusMessage({ text: "No papers to export for the current global search.", type: "info" });
                    return;
                }
                setIsLoadingFullExport(true);
                setStatusMessage({ text: `Fetching all ${totalArxivResults} papers for global search export ("${activeGlobalSearchTerm}")... This may take a moment.`, type: "info" });
                try {
                    papersToExport = await fetchAllPapersForGlobalKeyword(activeGlobalSearchTerm, globalSearchSortBy, totalArxivResults);
                } catch (error) {
                    console.error("Error fetching all papers for global export:", error);
                    setStatusMessage({ text: `Error fetching all global papers: ${(error as Error).message}`, type: "error" });
                    setIsLoadingFullExport(false); return;
                } finally { setIsLoadingFullExport(false); }
            }
        } else {  // favorites view - export ALL favorites if none selected
            if (favoritePapers.length === 0) {
                setStatusMessage({ text: "No favorite papers to export.", type: "info" });
                return;
            }
            papersToExport = favoritePapers; 
        }
    }

    if (papersToExport.length === 0) { setStatusMessage({ text: "No papers to export.", type: "info" }); return; }
    try { 
      const csvData = convertPapersToCSV(papersToExport);
      downloadCSV(csvData, `aixiv-insights-export-${new Date().toISOString().split('T')[0]}.csv`);
      setStatusMessage({ text: `Successfully exported ${papersToExport.length} papers to CSV.`, type: 'success' });
      setSelectedPaperIdsForExport(new Set()); 
     } catch(e) { 
      console.error("Error generating or downloading CSV:", e);
      setStatusMessage({ text: `Could not export to CSV: ${(e as Error).message}`, type: "error" });
     }
  };

  // Removed JSON favorites functionality - now using cookies only
  
  const displayTotalPages = Math.ceil( (searchScope === 'filter_daily_cs_ai' ? totalDisplayedAfterFilter : totalArxivResults) / PAPERS_PER_PAGE);
  const isLoadingAnything = isLoadingArxiv || isLoadingArxivCategoriesCluster || isLoadingKeywordCluster || isLoadingFullExport;

  let dynamicExportButtonText: string;
  let unselectedExportCount = 0;

  if (selectedPaperIdsForExport.size > 0) {
    dynamicExportButtonText = `Export Selected (${selectedPaperIdsForExport.size}) to CSV`;
  } else if (viewMode === 'search') {
    if (searchScope === 'filter_daily_cs_ai') {
      dynamicExportButtonText = `Export All Results (${totalArxivResults}) to CSV`; 
      unselectedExportCount = totalArxivResults;
    } else { 
      dynamicExportButtonText = `Export All Results (${totalArxivResults}) to CSV`; 
      unselectedExportCount = totalArxivResults;
    }
  } else { // favorites view
    dynamicExportButtonText = `Export All Favorites (${favoritePapers.length}) to CSV`;
    unselectedExportCount = favoritePapers.length; // All actual favorites, not just displayed.
  }
  
  const actualCanExport = selectedPaperIdsForExport.size > 0 || unselectedExportCount > 0;

  const renderPieChartSection = (forView: ViewMode): React.ReactNode => {
    if (viewMode !== forView || isLoadingFullExport) return null; 
    const isLoadingClustering = isLoadingArxivCategoriesCluster || isLoadingKeywordCluster;

    return (
      <>
        {geminiError && !isLoadingClustering && <StatusMessage message={geminiError} type="error" />}
        {themeData.length > 0 && !isLoadingClustering && (
          <div className={`my-6 p-6 bg-white shadow-xl rounded-lg border ${forView === 'search' ? 'border-green-200' : 'border-yellow-300'}`}>
            <h2 className={`text-2xl font-semibold mb-1 ${forView === 'search' ? 'text-green-700' : 'text-yellow-700'}`}>
              {forView === 'search' ? 'Paper Themes (Search Results)' : 'Paper Themes (Favorites)'}
            </h2>
            {papersCountForCurrentCluster !== null && (
              <p className="text-sm text-gray-600 mb-4">
                Themes based on {papersCountForCurrentCluster} paper(s) from the current selection.
              </p>
            )}
            <ThemePieChart data={themeData} />
          </div>
        )}
        {isLoadingClustering && 
            <div className="my-6"><LoadingIndicator message={
                isLoadingArxivCategoriesCluster ? "Clustering by ArXiv Categories..." : 
                "Clustering by Keywords..."} />
            </div>
        }
      </>
    );
  };

  const renderPaperListHeader = (count: number): React.ReactNode => (
    <div className="flex justify-between items-center mb-4 mt-6">
        <h2 className="text-xl font-semibold text-gray-700">
            {viewMode === 'search' ? 'Search Results' : 'Favorite Papers'} ({ count })
        </h2>
        { count > 0 && (
            <div className="flex items-center">
                <input 
                    type="checkbox"
                    id={`select-all-${viewMode}`}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mr-2"
                    checked={isSelectAllOnPageChecked()}
                    onChange={handleToggleSelectAllOnPage}
                    aria-label="Select all papers on this page"
                    disabled={isLoadingAnything}
                />
                <label htmlFor={`select-all-${viewMode}`} className={`text-sm text-gray-700 ${isLoadingAnything ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                    Select All (on page)
                </label>
            </div>
        )}
    </div>
  );

const oldFavoritesJSX = (
  <>
    <div className="my-6 p-6 bg-white shadow-lg rounded-xl border border-yellow-300">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-grow">
            <label htmlFor="favorite-search" className="block text-sm font-medium text-yellow-700 mb-1">
                Search Favorites
            </label>
            <input
                type="text"
                id="favorite-search"
                placeholder="Filter your saved papers..."
                value={favoriteSearchTerm}
                onChange={(e) => {setFavoriteSearchTerm(e.target.value); setSelectedPaperIdsForExport(new Set());}}
                disabled={isLoadingAnything}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm form-input-text-color"
            />
        </div>
        <button
            onClick={handleExportToCSV}
            disabled={isLoadingAnything || !actualCanExport}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-gray-300"
        >
            {dynamicExportButtonText}
        </button>
      </div>

      {/* JSON favorites removed - favorites are now stored in cookies automatically */}
       
        <div className="mt-6 pt-4 border-t border-yellow-200 flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-3">
            <button
            onClick={handleClusterByArxivCategories}
            disabled={isLoadingAnything || getPapersForClustering().length === 0}
            className="sm:w-auto px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 disabled:bg-gray-300"
            >
            {isLoadingArxivCategoriesCluster ? 'Clustering...' : 'Cluster by ArXiv Categories'}
            </button>
            <button
                onClick={handleClusterByKeywords}
                disabled={isLoadingAnything || getPapersForClustering().length === 0}
                className="sm:w-auto px-4 py-2 bg-teal-500 text-white font-semibold rounded-md shadow-md hover:bg-teal-600 disabled:bg-gray-300"
            >
                {isLoadingKeywordCluster ? 'Clustering...' : 'Cluster by Keywords'}
            </button>
        </div>
    </div>
    
    {renderPieChartSection('favorites')}
    {renderPaperListHeader(displayedFavoritePapers.length)}

    {displayedFavoritePapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2 w-full">
        {displayedFavoritePapers.map(paper => (
            <PaperItem 
            key={paper.id} 
            paper={paper}
            isFavorite={true} 
            onToggleFavorite={() => toggleFavorite(paper.id)}
            isSelected={selectedPaperIdsForExport.has(paper.id)}
            onToggleSelection={() => handleTogglePaperSelection(paper.id)}
            disabled={isLoadingAnything}
            />
        ))}
        </div>
    ) : (
        !statusMessage && !isLoadingAnything && <p className="text-center text-gray-600 py-8">
            {favoritePapers.length === 0 ? "You have no favorite papers. Star papers in search results to add them to favorites." : 
             (favoriteSearchTerm ? `No favorited papers match "${favoriteSearchTerm}".` : "You have no favorite papers yet.")
            }
        </p>
    )}
  </>
);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-100 via-yellow-50 to-green-50">
      <Header 
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        favoriteCount={favoritePapers.length}
      />
      <main className="flex-grow w-full max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'search' && (
          <ControlsBar
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            selectedArxivCategory={selectedArxivCategory}
            onCategoryChange={handleCategoryChange}
            availableCategories={AVAILABLE_ARXIV_CATEGORIES}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchSubmit={handleSearchSubmit}
            onClearFilter={handleClearFilter}
            isFilterActive={!!activeFilterTerm}
            searchScope={searchScope}
            onSearchScopeChange={handleSearchScopeChange}
            globalSearchSortBy={globalSearchSortBy}
            onGlobalSortByChange={handleGlobalSortByChange}
            onClusterByArxivCategories={handleClusterByArxivCategories}
            onClusterByKeywords={handleClusterByKeywords}
            isClusteringCategories={isLoadingArxivCategoriesCluster}
            isClusteringKeywords={isLoadingKeywordCluster}
            disabled={isLoadingArxiv || isLoadingFullExport}
            onExportToCSV={handleExportToCSV}
            exportButtonText={dynamicExportButtonText}
            canExport={actualCanExport && !isLoadingFullExport} 
            isExportingFull={isLoadingFullExport}
          />
        )}

        {statusMessage && (!isLoadingArxiv || statusMessage.text.includes("Fetching papers for export") || statusMessage.text.includes("Warning: Not all") || statusMessage.text.includes("Fetching all papers for")) && <StatusMessage message={statusMessage.text} type={statusMessage.type} />}
        
        {viewMode === 'search' && arxivError && !statusMessage && !isLoadingArxiv && !isLoadingFullExport && <StatusMessage message={arxivError} type="error" />}

        {renderPieChartSection('search')}
        
        {viewMode === 'search' && isLoadingArxiv && !isLoadingFullExport && 
          <LoadingIndicator message={
              searchScope === 'search_all_arxiv' && activeGlobalSearchTerm ? `Searching ArXiv for "${activeGlobalSearchTerm}"...` : 
              searchScope === 'filter_daily_cs_ai' ? `Fetching all papers for ${selectedDate}...` :
              `Fetching papers...`
          } />
        }
        
        {viewMode === 'search' && !isLoadingArxiv && !isLoadingFullExport && !arxivError && (!statusMessage || statusMessage.type !== 'error') && currentStatusMessageText() && (
           <StatusMessage message={currentStatusMessageText()} type={"info"} />
        )}
         {viewMode === 'favorites' && !isLoadingFullExport && (!statusMessage || statusMessage.type !== 'error') && currentStatusMessageText() && (
           <StatusMessage message={currentStatusMessageText()} type={"info"} />
        )}


        {viewMode === 'search' && !isLoadingArxiv && !isLoadingFullExport && (
            <>
                {/* Pagination Controls on Top */}
                {hasSearched && (searchScope === 'filter_daily_cs_ai' ? totalDisplayedAfterFilter : totalArxivResults) > PAPERS_PER_PAGE && displayedPapers.length > 0 && (
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={displayTotalPages}
                        onPageChange={handlePageChange}
                        disabled={isLoadingAnything}
                    />
                )}
                
                {renderPaperListHeader(searchScope === 'filter_daily_cs_ai' ? totalDisplayedAfterFilter : displayedPapers.length)}
                {displayedPapers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                    {displayedPapers.map(paper => (
                        <PaperItem 
                            key={paper.id} 
                            paper={paper} 
                            isFavorite={favoritePapers.some(fp => fp.id === paper.id)}
                            onToggleFavorite={() => toggleFavorite(paper.id)}
                            isSelected={selectedPaperIdsForExport.has(paper.id)}
                            onToggleSelection={() => handleTogglePaperSelection(paper.id)}
                            disabled={isLoadingAnything}
                        />
                    ))}
                    </div>
                ) : (
                   hasSearched && !isLoadingArxiv && !statusMessage && !currentStatusMessageText() && !arxivError && <p className="text-center text-gray-600 py-8">No papers to display for the current selection.</p>
                )}
                
                {/* Pagination Controls on Bottom */}
                {hasSearched && (searchScope === 'filter_daily_cs_ai' ? totalDisplayedAfterFilter : totalArxivResults) > PAPERS_PER_PAGE && displayedPapers.length > 0 && !isLoadingArxiv && !isLoadingFullExport && (
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={displayTotalPages}
                        onPageChange={handlePageChange}
                        disabled={isLoadingAnything}
                    />
                )}
            </>
        )}

        {viewMode === 'favorites' && oldFavoritesJSX}
      </main>
      <FullFooter />
    </div>
  );
};

const FullFooter = () => (
 <footer className="text-center py-4 bg-green-700 text-green-100">
    AIxiv Insights &copy; {new Date().getFullYear()}
  </footer>
);

export default App;
