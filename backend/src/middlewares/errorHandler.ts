import { Request, Response, NextFunction } from 'express';

interface ICustomError extends Error {
  status?: number;
}

const errorHandler = (err: ICustomError, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
