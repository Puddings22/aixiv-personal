/**
 * Get the last working day (skips weekends)
 * Returns the most recent weekday date
 */
export const getLastWorkingDay = (): string => {
  const today = new Date();
  let date = new Date(today);
  
  // If today is Saturday (6) or Sunday (0), go back to Friday
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0) { // Sunday
    date.setDate(date.getDate() - 2); // Go back to Friday
  } else if (dayOfWeek === 6) { // Saturday
    date.setDate(date.getDate() - 1); // Go back to Friday
  } else if (dayOfWeek === 1) { // Monday
    // If it's Monday, go back to Friday (3 days)
    date.setDate(date.getDate() - 3);
  } else {
    // Tuesday-Friday, go back 1 day
    date.setDate(date.getDate() - 1);
  }
  
  return date.toISOString().split('T')[0];
};

