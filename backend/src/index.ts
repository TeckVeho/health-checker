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
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
}))


app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
