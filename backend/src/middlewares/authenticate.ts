// src/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import getMessage from '../utils/message';

interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string };
}

const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
 
  
  const token = req.cookies?.jwt;

  if (!token) {
    return res.status(401).json({ error: getMessage('ERROR.UNAUTHORIZED') });
  }
  
  return  next();
  /*
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; email: string };
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: getMessage('ERROR.UNAUTHORIZED') });
    }

    req.user = { id: user.id!, email: user.email };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: getMessage('ERROR.INVALID_TOKEN') });
  }
    */
};
export default authenticate;
//export { authenticate, AuthenticatedRequest };
