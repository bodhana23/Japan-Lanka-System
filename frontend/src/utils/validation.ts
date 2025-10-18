// Utility functions for input validation and sanitization

export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Must contain @ symbol (specific requirement)
  if (!email.includes('@')) return false;
  
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Check length constraints
  if (email.length > 254) return false;
  
  // Check for consecutive dots
  if (email.includes('..')) return false;
  
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all spaces, dashes, and parentheses for validation
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Must be exactly 10 digits (specific requirement)
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(cleanPhone);
};

export const validatePassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') return false;
  
  // Enhanced password validation
  if (password.length < 6) return false;
  if (password.length > 128) return false; // Prevent extremely long passwords
  
  // Check for at least one non-whitespace character
  return /\S/.test(password);
};

export const validateStrongPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .substring(0, 1000); // Limit length to prevent DoS
};

export const validateRequired = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;
  return value.trim().length > 0;
};

export const validateNumeric = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= 0;
};

export const validatePositiveNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rs. 0.00';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString || typeof dateString !== 'string') return 'Invalid Date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const capitalizeFirst = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Validation error message helpers
export const getEmailValidationError = (email: string): string | null => {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return 'Email is required';
  }
  
  if (!email.includes('@')) {
    return 'Email must contain @ symbol';
  }
  
  if (!validateEmail(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

export const getPhoneValidationError = (phone: string): string | null => {
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return 'Phone number is required';
  }
  
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  if (cleanPhone.length !== 10) {
    return 'Phone number must be exactly 10 digits';
  }
  
  if (!/^\d+$/.test(cleanPhone)) {
    return 'Phone number must contain only digits';
  }
  
  return null;
};