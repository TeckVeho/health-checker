// src/__tests__/getMessage.test.ts

import getMessage from '@utils/message';
describe('getMessage Function', () => {
  // Test case for SUCCESS.CREATE_SUCCESS with one argument
  it('should return correct success message with one argument', () => {
    const message = getMessage('SUCCESS.CREATE_SUCCESS', 'User');
    expect(message).toBe('User has been successfully created.');
  });

  // Test case for ERROR.NOT_FOUND with one argument
  it('should return correct error message with one argument', () => {
    const message = getMessage('ERROR.NOT_FOUND', 'Resource');
    expect(message).toBe('Resource not found.');
  });

  // Test case for ERROR.INVALID_PASSWORD_LENGTH with two arguments
  it('should return correct error message with multiple arguments', () => {
    const message = getMessage('ERROR.INVALID_PASSWORD_LENGTH', '8', '16');
    expect(message).toBe('Password must be between 8 and 16 characters long.');
  });

  // Test case for AUTH.LOGIN_SUCCESS without any arguments
  it('should return correct authentication success message without arguments', () => {
    const message = getMessage('AUTH.LOGIN_SUCCESS');
    expect(message).toBe('You have successfully logged in.');
  });

  // Test case for INFO.WELCOME with one argument
  it('should return correct info welcome message with one argument', () => {
    const message = getMessage('INFO.WELCOME', 'Alice');
    expect(message).toBe('Welcome, Alice!');
  });

  // Test case for VALIDATION.MISSING_FIELDS with one argument
  it('should return correct validation missing fields message with one argument', () => {
    const message = getMessage('ERROR.MISSING_FIELDS', 'username, password');
    expect(message).toBe('The following fields are missing: username, password.');
  });

  // Test case for messages without placeholders
  it('should return the message as-is when there are no placeholders', () => {
    const message = getMessage('AUTH.LOGOUT_SUCCESS');
    expect(message).toBe('You have successfully logged out.');
  });

  // Test case for message with non-existing path
  it('should throw an error for invalid message path', () => {
    expect(() => getMessage('NONEXISTENT.KEY')).toThrowError(
      'Message path "NONEXISTENT.KEY" is invalid.'
    );
  });

  // Test case for placeholders without corresponding arguments
  it('should leave placeholders intact if arguments are missing', () => {
    const message = getMessage('ERROR.INVALID_PASSWORD_LENGTH', '8','20');
    expect(message).toBe('Password must be between 8 and 20 characters long.');
  });

  // Test case for multiple usages
  it('should handle multiple message retrievals correctly', () => {
    const createSuccess = getMessage('SUCCESS.CREATE_SUCCESS', 'Order');
    const deleteSuccess = getMessage('SUCCESS.DELETE_SUCCESS', 'Order');
    const loginFailed = getMessage('ERROR.LOGIN_FAILED');

    expect(createSuccess).toBe('Order has been successfully created.');
    expect(deleteSuccess).toBe('Order has been successfully deleted.');
    expect(loginFailed).toBe('Login failed; please check your credentials.');
  });

  // Test case for USERNAME_TAKEN with one argument containing quotes
  it('should handle arguments with quotes correctly', () => {
    const message = getMessage('ERROR.USERNAME_TAKEN', 'john_doe');
    expect(message).toBe("The username 'john_doe' is already taken.");
  });

  // Test case for EMAIL_TAKEN with one argument containing quotes
  it('should handle email taken message correctly', () => {
    const message = getMessage('ERROR.EMAIL_TAKEN', 'user@example.com');
    expect(message).toBe("The email 'user@example.com' is already registered.");
  });

  // New test case: All arguments provided
  it('should replace all placeholders when all arguments are provided', () => {
    const message = getMessage('VALIDATION.INVALID_DATE_FORMAT', 'Start Date', 'YYYY-MM-DD');
    expect(message).toBe('Start Date must be in the format YYYY-MM-DD.');
  });
});
