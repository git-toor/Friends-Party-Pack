import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: parseInt(process.env.PORT || '3131', 10),
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', '..', 'game.db'),
  cors: { origin: process.env.CORS_ORIGIN || '*' },
};
