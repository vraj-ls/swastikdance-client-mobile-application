/**
 * Formatting utilities for consistent data display
 */

/**
 * Format date to local string (DD/MM/YYYY)
 * @param {string|number|Date} dateInput - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';

  let date;
  if (typeof dateInput === 'number') {
    // Assume timestamp in seconds, convert to milliseconds
    date = new Date(dateInput * 1000);
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return '';
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-AU');
};

/**
 * Format date for display (DD/MM/YYYY)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date string
 */
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Format date for input (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export const formatDateInput = (date) => {
  if (!date || !(date instanceof Date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Format currency (cents to dollars)
 * @param {number} cents - Amount in cents
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (cents) => {
  if (typeof cents !== 'number') return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
};

/**
 * Format phone number
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
export const getInitials = (name) => {
  if (!name) return '';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format full name
 * @param {string} firstName - First name
 * @param {string} middleName - Middle name (optional)
 * @param {string} lastName - Last name
 * @returns {string} - Full name
 */
export const formatFullName = (firstName, middleName, lastName) => {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.join(' ');
};
