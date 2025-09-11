import express from 'express';
import dotenv from 'dotenv';
import routes from './router';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler';
import path from 'path';
import cors from 'cors';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

app.use(cookieParser());
// CORS configuration from environment variables
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:23001', 'http://localhost:3000', 'https://repocheck.vw-dev.com']; // Default fallback

console.log('🔧 CORS Origins:', corsOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log(`🔍 CORS Debug: Request from origin: "${origin}"`);
    console.log(`🔍 CORS Debug: NODE_ENV: "${process.env.NODE_ENV}"`);
    console.log(`🔍 CORS Debug: Allowed origins list:`, corsOrigins);
    console.log(`🔍 CORS Debug: Origin type: ${typeof origin}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log(`✅ CORS: Allowing request with no origin`);
      return callback(null, true);
    }
    
    // Check if origin is in our allowed list
    const isAllowed = corsOrigins.includes(origin);
    console.log(`🔍 CORS Debug: Is "${origin}" in allowed list? ${isAllowed}`);
    
    if (isAllowed) {
      console.log(`✅ CORS: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // In development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      console.log(`⚠️  CORS: Allowing origin in development: ${origin}`);
      return callback(null, true);
    }
    
    console.log(`❌ CORS: Rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);


export default app;
