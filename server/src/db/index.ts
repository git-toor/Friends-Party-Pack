import Database from 'better-sqlite3';
import { config } from '../config.js';
import { CREATE_TABLES, MIGRATIONS } from './schema.js';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(CREATE_TABLES);
    for (const migration of MIGRATIONS) {
      try { db.exec(migration); } catch {}
    }
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
