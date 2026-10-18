import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import fs from 'fs';
import path from 'path';
import { env } from '../env.js';
import * as schema from './schema.js';

// Ensure data folder exists
const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Convert relative path to file URL for libsql client
const fileUrl = dbPath.startsWith('file:') 
  ? dbPath 
  : `file:${dbPath.replace(/\\/g, '/')}`;

export const sqliteClient = createClient({
  url: fileUrl,
});

export const db = drizzle(sqliteClient, { schema });
