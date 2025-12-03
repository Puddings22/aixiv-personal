/**
 * Cookie utilities for storing favorites
 * Cookies expire after 2 years if not renewed
 * Should be renewed every 7 days
 */

const FAVORITES_COOKIE_NAME = 'aixiv_favorites';
const COOKIE_EXPIRY_DAYS = 730; // 2 years
const RENEWAL_INTERVAL_DAYS = 7; // Renew every 7 days

/**
 * Set a cookie with expiration
 */
const setCookie = (name: string, value: string, days: number): void => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

/**
 * Get a cookie value
 */
const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

/**
 * Delete a cookie
 */
const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Save favorite paper IDs to cookie
 */
export const saveFavoritesToCookie = (paperIds: string[]): void => {
  const jsonValue = JSON.stringify(paperIds);
  setCookie(FAVORITES_COOKIE_NAME, jsonValue, COOKIE_EXPIRY_DAYS);
};

/**
 * Load favorite paper IDs from cookie
 */
export const loadFavoritesFromCookie = (): string[] => {
  const cookieValue = getCookie(FAVORITES_COOKIE_NAME);
  if (!cookieValue) return [];
  
  try {
    const paperIds = JSON.parse(cookieValue);
    if (Array.isArray(paperIds)) {
      // Renew cookie if it's been more than renewal interval
      const lastRenewal = getCookie(`${FAVORITES_COOKIE_NAME}_renewal`);
      if (!lastRenewal) {
        // First time loading, set renewal date
        const renewalDate = new Date();
        renewalDate.setTime(renewalDate.getTime() + (RENEWAL_INTERVAL_DAYS * 24 * 60 * 60 * 1000));
        setCookie(`${FAVORITES_COOKIE_NAME}_renewal`, renewalDate.toISOString(), COOKIE_EXPIRY_DAYS);
      } else {
        const renewalDate = new Date(lastRenewal);
        const now = new Date();
        if (now > renewalDate) {
          // Time to renew - refresh the cookie
          saveFavoritesToCookie(paperIds);
          const nextRenewal = new Date();
          nextRenewal.setTime(nextRenewal.getTime() + (RENEWAL_INTERVAL_DAYS * 24 * 60 * 60 * 1000));
          setCookie(`${FAVORITES_COOKIE_NAME}_renewal`, nextRenewal.toISOString(), COOKIE_EXPIRY_DAYS);
        }
      }
      return paperIds;
    }
  } catch (e) {
    console.error('Error parsing favorites cookie:', e);
    deleteCookie(FAVORITES_COOKIE_NAME);
  }
  return [];
};

/**
 * Clear favorites cookie
 */
export const clearFavoritesCookie = (): void => {
  deleteCookie(FAVORITES_COOKIE_NAME);
  deleteCookie(`${FAVORITES_COOKIE_NAME}_renewal`);
};

