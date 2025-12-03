
import React from 'react';
import { SearchScope, ArxivCategory, SelectableCategory, ArxivSortByOption, ArxivSortOption } from '../types';
import { ARXIV_SORT_OPTIONS } from '../constants';


interface ControlsBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedArxivCategory: ArxivCategory;
  onCategoryChange: (category: ArxivCategory) => void;
  availableCategories: SelectableCategory[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit: () => void;
  onClearFilter: () => void;
  isFilterActive: boolean;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  globalSearchSortBy: ArxivSortByOption;
  onGlobalSortByChange: (sortBy: ArxivSortByOption) => void;
  onClusterByArxivCategories: () => void;
  onClusterByKeywords: () => void;
  isClusteringCategories: boolean;
  isClusteringKeywords: boolean;
  disabled?: boolean;
  onExportToCSV: () => void;
  exportButtonText: string;
  canExport: boolean;
  isExportingFull?: boolean; 
}

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


const ControlsBar: React.FC<ControlsBarProps> = ({
  selectedDate,
  onDateChange,
  selectedArxivCategory,
  onCategoryChange,
  availableCategories,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onClearFilter,
  isFilterActive,
  searchScope,
  onSearchScopeChange,
  globalSearchSortBy,
  onGlobalSortByChange,
  onClusterByArxivCategories,
  onClusterByKeywords,
  isClusteringCategories,
  isClusteringKeywords,
  disabled,
  onExportToCSV,
  exportButtonText,
  canExport,
  isExportingFull
}) => {
  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearchSubmit();
    }
  };
  
  const anyClusteringInProgress = isClusteringCategories || isClusteringKeywords;
  const globallyDisabled = disabled || isExportingFull;
  const isDailyScope = searchScope === 'filter_daily_cs_ai';
  const isGlobalScope = searchScope === 'search_all_arxiv';

  return (
    <div className="my-6 p-6 bg-white shadow-lg rounded-xl border border-yellow-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-4 items-end">
        {/* Date Picker */}
        <div className="flex flex-col">
          <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={globallyDisabled || anyClusteringInProgress || !isDailyScope}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed form-input-text-color"
          />
           {!isDailyScope && (
            <p className="text-xs text-gray-500 mt-1 h-4">Date not applicable.</p>
          )}
          {isDailyScope && <div className="h-4 mt-1"></div>} {/* Placeholder for alignment */}
        </div>

        {/* Category Selector */}
         <div className="flex flex-col">
          <label htmlFor="category-selector" className="block text-sm font-medium text-gray-700 mb-1">
            ArXiv Category
          </label>
          <select
            id="category-selector"
            value={selectedArxivCategory}
            onChange={(e) => onCategoryChange(e.target.value as ArxivCategory)}
            disabled={globallyDisabled || anyClusteringInProgress || !isDailyScope}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 form-input-text-color"
          >
            {availableCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {!isDailyScope && (
            <p className="text-xs text-gray-500 mt-1 h-4">Category not applicable.</p>
          )}
           {isDailyScope && <div className="h-4 mt-1"></div>} {/* Placeholder for alignment */}
        </div>


        {/* Search Scope Dropdown */}
        <div className="flex flex-col">
          <label htmlFor="search-scope" className="block text-sm font-medium text-gray-700 mb-1">
            Search Scope
          </label>
          <select
            id="search-scope"
            value={searchScope}
            onChange={(e) => onSearchScopeChange(e.target.value as SearchScope)}
            disabled={globallyDisabled || anyClusteringInProgress}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 form-input-text-color"
          >
             <option value="filter_daily_cs_ai">Filter Current Date's Papers</option>
             <option value="search_all_arxiv">Search All ArXiv (Keyword)</option>
          </select>
          <div className="h-4 mt-1"></div> {/* Placeholder for alignment */}
        </div>
        
        {/* Search Term Input */}
        <div className="flex flex-col">
          <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">
            {isDailyScope ? "Filter by Keyword" : "Keyword for Global Search"}
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              id="search-term"
              placeholder={isDailyScope ? "Filter current papers..." : "Search all ArXiv..."}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              disabled={globallyDisabled || anyClusteringInProgress}
              className="block w-full px-3 py-2 pl-10 pr-16 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100 form-input-text-color"
            />
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <SearchIcon className="text-gray-400" />
            </div>
            {isDailyScope && isFilterActive && (
                 <button
                    type="button"
                    onClick={onClearFilter}
                    className="absolute inset-y-0 right-8 flex items-center pr-2 text-gray-400 hover:text-red-600 disabled:hover:text-gray-400"
                    aria-label="Clear filter"
                    title="Clear filter"
                    disabled={globallyDisabled || anyClusteringInProgress}
                >
                    <XCircleIcon className="w-5 h-5" />
                </button>
            )}
            <button
              type="button"
              onClick={onSearchSubmit}
              disabled={globallyDisabled || anyClusteringInProgress || (!isDailyScope && !searchTerm.trim())}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-green-600 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
              aria-label={isDailyScope ? "Apply filter" : "Submit global search"}
              title={isDailyScope ? "Apply filter" : "Submit global search"}
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
          {isGlobalScope && (
            <div className="mt-1">
                 <label htmlFor="global-sort-by" className="sr-only">Sort Global Search By</label>
                 <select
                    id="global-sort-by"
                    value={globalSearchSortBy}
                    onChange={(e) => onGlobalSortByChange(e.target.value as ArxivSortByOption)}
                    disabled={globallyDisabled || anyClusteringInProgress}
                    className="text-xs w-full py-1 px-2 border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 form-input-text-color disabled:bg-gray-100"
                >
                    {ARXIV_SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
          )}
          {!isGlobalScope && <div className="h-4 mt-1"></div>} {/* Placeholder for alignment */}
        </div>
        
        {/* Search/Apply Button */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1 opacity-0 pointer-events-none">
            Action
          </label>
          <button
            type="button"
            onClick={onSearchSubmit}
            disabled={globallyDisabled || anyClusteringInProgress || (!isDailyScope && !searchTerm.trim())}
            className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title={isDailyScope ? "Fetch papers for selected date and category" : "Search ArXiv"}
          >
            <SearchIcon className="w-5 h-5" />
            {isDailyScope ? "Fetch Papers" : "Search"}
          </button>
          <div className="h-4 mt-1"></div> {/* Placeholder for alignment */}
        </div>
      </div>
      
      {/* Action Buttons Row */}
      <div className="mt-6 pt-6 border-t border-yellow-200 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between items-center gap-3">
        {/* Export Button */}
        <button
            onClick={onExportToCSV}
            disabled={globallyDisabled || anyClusteringInProgress || !canExport || isExportingFull}
            className="sm:w-auto order-first sm:order-none px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-gray-300 flex items-center gap-2"
        >
            <DownloadIcon className="w-5 h-5" />
            {isExportingFull ? 'Exporting All...' : exportButtonText}
        </button>

        {/* Clustering Buttons Group */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-3">
            <button
            onClick={onClusterByArxivCategories}
            disabled={globallyDisabled || anyClusteringInProgress}
            className="sm:w-auto px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-gray-300"
            >
            {isClusteringCategories ? 'Clustering...' : 'Cluster by ArXiv Categories'}
            </button>
            <button
            onClick={onClusterByKeywords}
            disabled={globallyDisabled || anyClusteringInProgress}
            className="sm:w-auto px-4 py-2 bg-teal-500 text-white font-semibold rounded-md shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-gray-300"
            >
            {isClusteringKeywords ? 'Clustering...' : 'Cluster by Top Keywords'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ControlsBar;
