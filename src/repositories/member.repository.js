const database = require('../config/database');

class MemberRepository {
  async findAll() {
    const db = database.getDb();
    return await db.all('SELECT * FROM Member');
  }

  async findById(id) {
    const db = database.getDb();
    return await db.get('SELECT * FROM Member WHERE id = ?', [id]);
  }

  async create(memberData) {
    const db = database.getDb();
    const { name, email, membership_number } = memberData;
    
    const result = await db.run(
      `INSERT INTO Member (name, email, membership_number, status)
       VALUES (?, ?, ?, 'active')`,
      [name, email, membership_number]
    );
    
    return result.lastID;
  }

  async update(id, memberData) {
    const db = database.getDb();
    const { name, email } = memberData;
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    
    values.push(id);
    
    await db.run(
      `UPDATE Member SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async updateStatus(id, status) {
    const db = database.getDb();
    await db.run('UPDATE Member SET status = ? WHERE id = ?', [status, id]);
  }

  async delete(id) {
    const db = database.getDb();
    await db.run('DELETE FROM Member WHERE id = ?', [id]);
  }

  async getUnpaidFinesCount(memberId) {
    const db = database.getDb();
    const result = await db.get(
      'SELECT COUNT(*) AS count FROM Fine WHERE member_id = ? AND paid_at IS NULL',
      [memberId]
    );
    return result.count;
  }

  async getActiveBorrowsCount(memberId) {
    const db = database.getDb();
    const result = await db.get(
      'SELECT COUNT(*) AS count FROM Transactions WHERE member_id = ? AND returned_at IS NULL',
      [memberId]
    );
    return result.count;
  }

  async getOverdueBorrowsCount(memberId) {
    const db = database.getDb();
    const result = await db.get(
      `SELECT COUNT(*) AS count FROM Transactions 
       WHERE member_id = ? AND returned_at IS NULL AND due_date < datetime('now')`,
      [memberId]
    );
    return result.count;
  }

  async getBorrowedBooks(memberId) {
    const db = database.getDb();
    return await db.all(
      `SELECT T.id as transaction_id, T.borrowed_at, T.due_date, T.status,
              B.id as book_id, B.title, B.author, B.isbn
       FROM Transactions T
       JOIN Book B ON T.book_id = B.id
       WHERE T.member_id = ? AND T.returned_at IS NULL`,
      [memberId]
    );
  }
}

module.exports = new MemberRepository();
