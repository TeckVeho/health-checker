import { Request, Response, NextFunction } from 'express';
import authenticate from '../../../src/middlewares/authenticate';
import getMessage from '../../../src/utils/message';

// Mock getMessage
jest.mock('../../../src/utils/message', () => ({
  __esModule: true,
  default: jest.fn((key: string) => `Mocked message for ${key}`),
}));

const mockGetMessage = getMessage as jest.MockedFunction<typeof getMessage>;

describe('authenticate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('when token is present', () => {
    it('should call next() when JWT token exists', () => {
      // Arrange
      mockReq.cookies = { jwt: 'valid-jwt-token' };

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('when token is missing', () => {
    it('should return 401 when no JWT token is provided', () => {
      // Arrange
      mockReq.cookies = {};

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Mocked message for ERROR.UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when cookies are undefined', () => {
      // Arrange
      mockReq.cookies = undefined;

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Mocked message for ERROR.UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when jwt cookie is empty string', () => {
      // Arrange
      mockReq.cookies = { jwt: '' };

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Mocked message for ERROR.UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when jwt cookie is null', () => {
      // Arrange
      mockReq.cookies = { jwt: null };

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Mocked message for ERROR.UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should call getMessage with correct key', () => {
      // Arrange
      mockReq.cookies = {};

      // Act
      authenticate(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockGetMessage).toHaveBeenCalledWith('ERROR.UNAUTHORIZED');
    });
  });
});
