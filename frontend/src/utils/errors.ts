// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  API = 'API',
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Error context interface for additional metadata
export interface ErrorContext {
  operation?: string
  url?: string
  statusCode?: number
  originalError?: Error
  [key: string]: any
}

// Custom error class with additional context
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly context: ErrorContext
  public readonly timestamp: Date

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context: ErrorContext = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.context = context
    this.timestamp = new Date()
  }
}

// Error helper functions
export const createAppError = {
  // Validation errors
  validation: (message: string, context?: ErrorContext): AppError => {
    return new AppError(message, ErrorType.VALIDATION, context)
  },

  // API errors
  api: (message: string, context?: ErrorContext): AppError => {
    return new AppError(message, ErrorType.API, context)
  },

  // Network errors
  network: (message: string, context?: ErrorContext): AppError => {
    return new AppError(message, ErrorType.NETWORK, context)
  },

  // Authentication errors
  auth: (message: string, context?: ErrorContext): AppError => {
    return new AppError(message, ErrorType.AUTH, context)
  },

  // Not found errors
  notFound: (message: string, context?: ErrorContext): AppError => {
    return new AppError(message, ErrorType.NOT_FOUND, context)
  },

  // Server errors
  server: (message: string, context?: ErrorContext): AppError => {
    return new AppError(message, ErrorType.SERVER, context)
  },

  // Unknown errors
  unknown: (message: string, context?: ErrorContext): AppError => {
    return new AppError(message, ErrorType.UNKNOWN, context)
  },

  // Wrapper for existing errors
  fromError: (error: Error, type?: ErrorType, context?: ErrorContext): AppError => {
    const appError = new AppError(
      error.message,
      type || ErrorType.UNKNOWN,
      { ...context, originalError: error }
    )
    appError.stack = error.stack
    return appError
  }
}

// Common error messages
export const errorMessages = {
  VALIDATION: {
    LIMIT_RANGE: 'Limit must be between 1 and 1000',
    INVALID_SORT: (validSorts: string[]) => `Invalid sort parameter. Must be one of: ${validSorts.join(', ')}`,
    EMPTY_ARRAY: 'Array must not be empty',
    REQUIRED_FIELD: (field: string) => `${field} is required`,
    INVALID_FORMAT: (field: string, format: string) => `${field} must be in ${format} format`
  },
  API: {
    FETCH_FAILED: (operation: string) => `Failed to fetch ${operation}`,
    REQUEST_FAILED: (operation: string) => `${operation} request failed`,
    TIMEOUT: 'Request timed out',
    RETRY_EXCEEDED: 'Maximum retry attempts exceeded'
  },
  AUTH: {
    UNAUTHORIZED: 'Unauthorized access - please login again',
    TOKEN_EXPIRED: 'Authentication token has expired',
    INVALID_CREDENTIALS: 'Invalid credentials'
  },
  NETWORK: {
    CONNECTION_FAILED: 'Failed to connect to server',
    NO_RESPONSE: 'No response received from server'
  }
} as const

// Utility function to extract error message from any error type
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

// Utility function to check if error is of specific type
export function isErrorType(error: unknown, type: ErrorType): boolean {
  return error instanceof AppError && error.type === type
}

// Utility function to log errors consistently
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)
  const prefix = context ? `[${context}]` : '[Error]'
  
  if (error instanceof AppError) {
    console.error(`${prefix} ${message}`, {
      type: error.type,
      context: error.context,
      timestamp: error.timestamp
    })
  } else {
    console.error(`${prefix} ${message}`, error)
  }
} 