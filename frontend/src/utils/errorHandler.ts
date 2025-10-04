// Centralized error handling utilities

interface ErrorDetails {
  message: string;
  code?: string | number;
  context?: string;
  timestamp?: string;
}

export class AppError extends Error {
  public readonly code: string | number;
  public readonly context: string;
  public readonly timestamp: string;

  constructor(message: string, code?: string | number, context?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code || 'UNKNOWN_ERROR';
    this.context = context || 'Unknown context';
    this.timestamp = new Date().toISOString();
  }
}

export const ErrorHandler = {
  // Handle localStorage errors
  handleStorageError: (error: unknown, operation: 'get' | 'set' | 'remove'): void => {
    console.error(`LocalStorage ${operation} error:`, error);
    
    if (error instanceof DOMException) {
      switch (error.code) {
        case 22: // QUOTA_EXCEEDED_ERR
          console.warn('Storage quota exceeded');
          break;
        case 11: // INVALID_STATE_ERR
          console.warn('Storage in invalid state');
          break;
        default:
          console.warn('Unknown storage error:', error.message);
      }
    }
  },

  // Handle network/API errors
  handleNetworkError: (error: unknown): string => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection.';
    }
    
    if (error instanceof AppError) {
      return error.message;
    }
    
    console.error('Network error:', error);
    return 'An unexpected network error occurred. Please try again.';
  },

  // Handle validation errors
  handleValidationError: (field: string, rule: string): string => {
    const validationMessages: Record<string, Record<string, string>> = {
      email: {
        required: 'Email address is required',
        invalid: 'Please enter a valid email address',
        format: 'Email format is invalid'
      },
      password: {
        required: 'Password is required',
        minLength: 'Password must be at least 6 characters long',
        weak: 'Password is too weak'
      },
      username: {
        required: 'Username is required',
        minLength: 'Username must be at least 3 characters long',
        maxLength: 'Username cannot exceed 50 characters'
      },
      general: {
        required: 'This field is required',
        invalid: 'Invalid input provided'
      }
    };

    return validationMessages[field]?.[rule] || validationMessages.general[rule] || 'Validation error occurred';
  },

  // Log errors for debugging
  logError: (error: unknown, context?: string): void => {
    const errorDetails: ErrorDetails = {
      message: error instanceof Error ? error.message : String(error),
      context: context || 'Unknown',
      timestamp: new Date().toISOString()
    };

    if (error instanceof AppError) {
      errorDetails.code = error.code;
      errorDetails.context = error.context;
    }

    console.error('Application Error:', errorDetails);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
      // errorReportingService.captureError(errorDetails);
    }
  },

  // Safe JSON parsing
  safeJsonParse: <T>(jsonString: string, fallback: T): T => {
    try {
      const parsed = JSON.parse(jsonString);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (error) {
      ErrorHandler.logError(error, 'JSON_PARSE');
      return fallback;
    }
  },

  // Safe localStorage operations
  safeLocalStorage: {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        ErrorHandler.handleStorageError(error, 'get');
        return null;
      }
    },

    setItem: (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        ErrorHandler.handleStorageError(error, 'set');
        return false;
      }
    },

    removeItem: (key: string): boolean => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        ErrorHandler.handleStorageError(error, 'remove');
        return false;
      }
    }
  },

  // Create user-friendly error messages
  getUserFriendlyMessage: (error: unknown): string => {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      // Convert technical errors to user-friendly messages
      const technicalToFriendly: Record<string, string> = {
        'Network request failed': 'Please check your internet connection and try again.',
        'JSON.parse': 'Data format error. Please refresh the page.',
        'TypeError: Failed to fetch': 'Unable to connect to the server. Please try again later.',
        'ReferenceError': 'A technical error occurred. Please refresh the page.',
        'SyntaxError': 'Data processing error. Please try again.'
      };

      for (const [tech, friendly] of Object.entries(technicalToFriendly)) {
        if (error.message.includes(tech)) {
          return friendly;
        }
      }

      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }

    return 'An unknown error occurred. Please try again.';
  }
};

export default ErrorHandler;