import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'jemput_aman_secret_key_2026',
  DEFAULT_SCHOOL_ID: process.env.DEFAULT_SCHOOL_ID || '1001-tk-ceria-salatiga',
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send',
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN || ''
};
