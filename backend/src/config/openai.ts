import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'test' ? '../../.env.test' : '../../.env';
dotenv.config({ path: path.resolve(__dirname, envFile) });

export const OPENAI_CONFIG = {
  API_KEY: process.env.OPENAI_API_KEY as string,
  MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
} as const;

// Validate required environment variables
if (!OPENAI_CONFIG.API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('Warning: OPENAI_API_KEY is not set. OpenAI features will not work.');
}

export default OPENAI_CONFIG;
