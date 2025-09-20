const messages = {
  SUCCESS: {
    CREATE_SUCCESS: '{0} has been successfully created.',
    READ_SUCCESS: '{0} has been successfully retrieved.',
    UPDATE_SUCCESS: '{0} has been successfully updated.',
    DELETE_SUCCESS: '{0} has been successfully deleted.',
    CREATED: '{0} has been successfully created.',
    NO_CONTENT: 'The request was successfully processed, and no content is being returned.',
    ACCEPTED: 'The request has been accepted for processing, but the processing has not been completed.',
    PARTIAL_CONTENT: 'The server is delivering only part of the resource due to a range header sent by the client.',
    FILE_UPLOAD_SUCCESS: 'File "{0}" has been uploaded successfully.',
    CHECK_SUCCESS: 'Check completed successfully.',
    FETCH_SUCCESS: 'Fetch completed successfully.',
    REVIEW_SUCCESS: 'Review completed successfully.',
    RECHECK_STARTED: 'ReCheck started successfully for {0}.',
    SETTINGS_UPDATED: 'Settings updated successfully for {0}.',
  },
  ERROR: {
    CREATE_ERROR: 'Failed to create {0}.',
    READ_ERROR: 'Failed to retrieve {0}.',
    UPDATE_ERROR: 'Failed to update {0}.',
    DELETE_ERROR: 'Failed to delete {0}.',
    NOT_FOUND: '{0} not found.',
    DUPLICATE_ERROR: '{0} name is already in use.',
    RESOURCE_ALREADY_EXISTS: 'The resource "{0}" already exists.',
    SERVER_ERROR: 'An internal server error occurred.',
    UNAUTHORIZED: 'Unauthorized access.',
    FORBIDDEN: 'You do not have permission to access this {0}.',
    INVALID_INPUT: 'Invalid input for {0}.',
    MISSING_FIELDS: 'The following fields are missing: {0}.',
    INVALID_PASSWORD_LENGTH: 'Password must be between {0} and {1} characters long.',
    INVALID_EMAIL_FORMAT: 'The provided email address is invalid.',
    WEAK_PASSWORD: 'Password strength is insufficient; please include {0}.',
    USERNAME_TAKEN: "The username '{0}' is already taken.",
    EMAIL_TAKEN: "The email '{0}' is already registered.",
    LOGIN_FAILED: 'Login failed; please check your credentials.',
    BAD_REQUEST: 'The request could not be understood by the server due to malformed syntax.',
    CONFLICT: 'The request could not be completed due to a conflict with the current state of the resource.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
    METHOD_NOT_ALLOWED: 'The HTTP method used is not supported for this endpoint.',
    UNSUPPORTED_MEDIA_TYPE: 'The media type of the request is not supported by the server.',
    NOT_ACCEPTABLE: 'The requested resource is only capable of generating content not acceptable according to the Accept headers.',
    INTERNAL_SERVER_ERROR: 'The server encountered an internal error and was unable to complete your request.',
    SERVICE_UNAVAILABLE: 'The server is currently unavailable (overloaded or down for maintenance). Please try again later.',
    INVALID_TOKEN: 'The provided authentication token is invalid.',
    TOKEN_EXPIRED: 'The authentication token has expired.',
    DEPENDENCY_ERROR: 'An error occurred while communicating with an external service.',
    TIMEOUT_ERROR: 'The request timed out. Please try again later.',
    DATA_CONFLICT: 'There is a conflict in the provided data. Please review and try again.',
    LOGOUT_FAILED: 'Failed to log out. Please try again.',
    INVALID_FILE_TYPE: 'The file type of "{0}" is not supported.',
    FILE_TOO_LARGE: 'The file "{0}" exceeds the maximum allowed size.',
    FILE_UPLOAD_ERROR: 'Failed to upload file "{0}". Please try again.',
    FILE_DELETE_ERROR: 'Failed to delete file "{0}". Please try again.',
  },
  VALIDATION: {
    REQUIRED_FIELD: '{0} is required.',
    MUST_BE_NUMBER: '{0} must be a number.',
    MUST_BE_STRING: '{0} must be a string.',
    INVALID_DATE_FORMAT: '{0} must be in the format {1}.',
    RANGE_ERROR: '{0} must be between {1} and {2}.',
    INVALID_OPTION: '{0} is not a valid option for {1}.',
    VALIDATION_FAILED: 'Validation failed for the provided data.',
  },
  AUTH: {
    LOGIN_SUCCESS: 'You have successfully logged in.',
    LOGOUT_SUCCESS: 'You have successfully logged out.',
    ACCOUNT_LOCKED: 'Your account has been locked due to too many failed login attempts.',
    ACCOUNT_DISABLED: 'Your account is disabled; contact support for assistance.',
    PASSWORD_RESET_REQUEST: 'Password reset requested; check your email.',
    PASSWORD_RESET_SUCCESS: 'Your password has been successfully reset.',
    REFRESH_TOKEN_SUCCESS: 'Your session has been refreshed successfully.',
    INVALID_TOKEN: 'The provided authentication token is invalid.',
    TOKEN_EXPIRED: 'The authentication token has expired.',
    REGISTER_SUCCESS: 'User registration successful.',
    EMAIL_AVAILABLE: 'The email "{0}" is available.',
  },
  INFO: {
    WELCOME: 'Welcome, {0}!',
    PROFILE_UPDATED: 'Your profile has been updated.',
    EMAIL_VERIFIED: 'Your email has been verified.',
    EMAIL_SENT: 'An email has been sent to {0}.',
  },
} as const;

export default function getMessage(path: string, ...args: string[]): string {
  const keys = path.split('.');
  let template: unknown = messages;

  for (const key of keys) {
    if (typeof template === 'object' && template !== null && key in template) {
      template = (template as Record<string, unknown>)[key];
    } else {
      throw new Error(`Message path "${path}" is invalid.`);
    }
  }

  if (typeof template !== 'string') {
    throw new Error(`Message at path "${path}" is not a valid string.`);
  }

  return template.replace(/{(\d+)}/g, (match, index) => args[index] || match);
}
