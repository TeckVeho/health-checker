import express from 'express';
import dotenv from 'dotenv';
import routes from './router';
import setupSwagger from '@config/swagger';
import cookieParser from 'cookie-parser';
import errorHandler from '@middlewares/errorHandler';
import path from 'path';
import cors from 'cors';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 3000;
// CORS設定を追加
app.use(cors({
  origin: 'http://localhost:3001', // NuxtのフロントエンドURL
  credentials: true,               // Cookieなどを使う場合
}))


app.use(express.json());
app.use('/api', routes);
setupSwagger(app);
app.use(errorHandler);

// サーバーの起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
