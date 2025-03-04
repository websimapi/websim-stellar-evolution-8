// Format a number with appropriate suffixes (K, M, B, T)
export const formatNumber = (number) => {
  if (typeof number !== 'number') return 'N/A';
  
  if (number === 0) return '0';
  
  const absNumber = Math.abs(number);
  
  if (absNumber < 1000) {
    return number.toFixed(0);
  } else if (absNumber < 1000000) {
    return (number / 1000).toFixed(1) + 'K';
  } else if (absNumber < 1000000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (absNumber < 1000000000000) {
    return (number / 1000000000).toFixed(1) + 'B';
  } else {
    return (number / 1000000000000).toFixed(1) + 'T';
  }
};

// Format a date/time
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleString();
};

