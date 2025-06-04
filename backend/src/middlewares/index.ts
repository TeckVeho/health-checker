// src/middlewares/index.ts
import authenticate from './authenticate';
import errorHandler from './errorHandler';

export const middlewares = [errorHandler];
export const authMiddlewares = [authenticate, ...middlewares];
