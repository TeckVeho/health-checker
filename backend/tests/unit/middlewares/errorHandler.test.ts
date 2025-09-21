import { Request, Response, NextFunction } from 'express';
import errorHandler from '../../../src/middlewares/errorHandler';

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when handling errors', () => {
    it('should handle error with custom status code', () => {
      // Arrange
      const error = new Error('Custom error') as any;
      error.status = 400;
      error.stack = 'Error stack trace';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(console.error).toHaveBeenCalledWith(error.stack);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Custom error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle error without status code', () => {
      // Arrange
      const error = new Error('Internal server error');
      error.stack = 'Error stack trace';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(console.error).toHaveBeenCalledWith(error.stack);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });

    it('should handle error without message', () => {
      // Arrange
      const error = {} as any;
      error.status = 404;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(console.error).toHaveBeenCalledWith(error.stack);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
      });
    });

    it('should include stack trace in development environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Development error');
      error.stack = 'Development stack trace';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Development error',
        stack: 'Development stack trace',
      });

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production environment', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Production error');
      error.stack = 'Production stack trace';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Production error',
      });

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle error with undefined stack', () => {
      // Arrange
      const error = new Error('Error without stack');
      delete error.stack;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(console.error).toHaveBeenCalledWith(undefined);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error without stack',
      });
    });

    it('should handle null error', () => {
      // Arrange
      const error = null as any;

      // Act & Assert
      expect(() => errorHandler(error, mockReq as Request, mockRes as Response, mockNext)).toThrow();
    });

    it('should handle undefined error', () => {
      // Arrange
      const error = undefined as any;

      // Act & Assert
      expect(() => errorHandler(error, mockReq as Request, mockRes as Response, mockNext)).toThrow();
    });
  });
});
