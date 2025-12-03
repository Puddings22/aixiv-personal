/**
 * Favorites storage utilities
 * Uses localStorage for storing full paper data
 * Warning: localStorage can be cleared by browser, so export functionality is recommended
 */

import { Paper } from '../types';

const FAVORITES_STORAGE_KEY = 'aixiv_favorites_papers';

/**
 * Save favorites to localStorage
 */
export const saveFavorites = (papers: Paper[]): void => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(papers));
  } catch (e) {
    console.error('Error saving favorites to localStorage:', e);
  }
};

/**
 * Load favorites from localStorage
 */
export const loadFavorites = (): Paper[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      const papers = JSON.parse(stored) as Paper[];
      if (Array.isArray(papers)) {
        return papers;
      }
    }
    return [];
  } catch (e) {
    console.error('Error loading favorites from localStorage:', e);
    return [];
  }
};

/**
 * Clear all favorites
 */
export const clearFavorites = (): void => {
  localStorage.removeItem(FAVORITES_STORAGE_KEY);
};

/**
 * Check if there are any favorites stored
 */
export const hasFavorites = (): boolean => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      const papers = JSON.parse(stored) as Paper[];
      return Array.isArray(papers) && papers.length > 0;
    }
    return false;
  } catch {
    return false;
  }
};
