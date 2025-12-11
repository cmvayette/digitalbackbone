import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    server: {
        port: process.env.PORT ? parseInt(process.env.PORT) : 3333,
        env: process.env.NODE_ENV || 'development',
    },
    auth: {
        mode: (process.env.AUTH_MODE || 'apikey') as 'apikey' | 'gateway',
        opaUrl: process.env.OPA_URL || 'http://localhost:8181/v1/data/som/authz/allow',
    },
    db: {
        type: (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgres',
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/som?schema=public',
        path: process.env.DB_PATH || path.resolve(__dirname, '../som.db'),
    },
};
