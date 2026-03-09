import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'austina.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS okrs (
    id TEXT PRIMARY KEY,
    buName TEXT NOT NULL UNIQUE,
    quarter TEXT NOT NULL,
    objective TEXT NOT NULL,
    owners TEXT,
    keyResults TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS vms (
    id TEXT PRIMARY KEY,
    metricName TEXT NOT NULL,
    description TEXT NOT NULL,
    bu TEXT NOT NULL,
    selectedBU TEXT,
    selectedOKR TEXT,
    okrRationale TEXT,
    status TEXT NOT NULL,
    strategicCompassAnalysis TEXT,
    decisionMakerAnalysis TEXT,
    larkRecordId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT
  );
`);

console.log('✅ Database initialized');

export default db;
