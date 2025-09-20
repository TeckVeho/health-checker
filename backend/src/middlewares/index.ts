// src/middlewares/index.ts
import authenticate from './authenticate';
import errorHandler from './errorHandler';
import { environmentCheck } from './environmentCheck';

export const middlewares = [errorHandler];
export const authMiddlewares = [authenticate, ...middlewares];
export const recheckMiddlewares = [environmentCheck, ...middlewares];
