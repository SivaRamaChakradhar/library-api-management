const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    if (this.db) return this.db;

    const dbPath = path.join(__dirname, '../../library.db');
    
    try {
      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Enable foreign keys
      await this.db.run('PRAGMA foreign_keys = ON');

      // Create tables if they don't exist
      await this.createSchema();

      return this.db;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database schema if tables don't exist
   */
  async createSchema() {
    try {
      // Check if Book table exists
      const tableCheck = await this.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Book'"
      );

      if (!tableCheck) {
        console.log('Creating database schema...');
        
        await this.db.exec(`
          CREATE TABLE IF NOT EXISTS Book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            isbn TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            category TEXT,
            status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'borrowed', 'reserved', 'maintenance')),
            total_copies INTEGER DEFAULT 1,
            available_copies INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS Member (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            membership_number TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS Transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            member_id INTEGER NOT NULL,
            borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            due_date DATETIME NOT NULL,
            returned_at DATETIME,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'returned', 'overdue')),
            FOREIGN KEY(book_id) REFERENCES Book(id) ON DELETE CASCADE,
            FOREIGN KEY(member_id) REFERENCES Member(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS Fine (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            transaction_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            paid_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(member_id) REFERENCES Member(id) ON DELETE CASCADE,
            FOREIGN KEY(transaction_id) REFERENCES Transactions(id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_book_status ON Book(status);
          CREATE INDEX IF NOT EXISTS idx_member_status ON Member(status);
          CREATE INDEX IF NOT EXISTS idx_transaction_status ON Transactions(status);
          CREATE INDEX IF NOT EXISTS idx_transaction_member ON Transactions(member_id);
          CREATE INDEX IF NOT EXISTS idx_transaction_book ON Transactions(book_id);
          CREATE INDEX IF NOT EXISTS idx_fine_member ON Fine(member_id);
          CREATE INDEX IF NOT EXISTS idx_fine_paid ON Fine(paid_at);
        `);

        console.log('Database schema created successfully');
      }
    } catch (error) {
      console.error('Schema creation error:', error);
      throw error;
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Execute multiple operations within a transaction
   * Ensures atomicity - all operations succeed or all fail
   * @param {Function} operations - Async function containing DB operations
   * @returns {Promise<any>} Result of the operations
   */
  async runInTransaction(operations) {
    const db = this.getDb();
    
    try {
      await db.run('BEGIN TRANSACTION');
      const result = await operations(db);
      await db.run('COMMIT');
      return result;
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}

module.exports = new Database();
