const database = require('../config/database');

class TransactionRepository {
  async findAll() {
    const db = database.getDb();
    return await db.all('SELECT * FROM Transactions');
  }

  async findById(id) {
    const db = database.getDb();
    return await db.get('SELECT * FROM Transactions WHERE id = ?', [id]);
  }

  async findOverdue() {
    const db = database.getDb();
    return await db.all(
      `SELECT T.id, T.book_id, T.member_id, T.borrowed_at, T.due_date, T.status,
              B.title AS book_title, M.name AS member_name
       FROM Transactions T
       JOIN Book B ON T.book_id = B.id
       JOIN Member M ON T.member_id = M.id
       WHERE T.returned_at IS NULL AND T.due_date < datetime('now')`
    );
  }

  async create(transactionData) {
    const db = database.getDb();
    const { book_id, member_id, borrowed_at, due_date } = transactionData;
    
    const result = await db.run(
      `INSERT INTO Transactions (book_id, member_id, borrowed_at, due_date, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [book_id, member_id, borrowed_at, due_date]
    );
    
    return result.lastID;
  }

  async markReturned(id, returned_at) {
    const db = database.getDb();
    await db.run(
      `UPDATE Transactions SET returned_at = ?, status = 'returned' WHERE id = ?`,
      [returned_at, id]
    );
  }

  async markOverdue() {
    const db = database.getDb();
    await db.run(
      `UPDATE Transactions SET status = 'overdue'
       WHERE returned_at IS NULL AND status = 'active' AND due_date < datetime('now')`
    );
  }
}

module.exports = new TransactionRepository();
