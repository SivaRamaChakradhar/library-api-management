const database = require('../config/database');

class FineRepository {
  async findAll() {
    const db = database.getDb();
    return await db.all('SELECT * FROM Fine');
  }

  async findById(id) {
    const db = database.getDb();
    return await db.get('SELECT * FROM Fine WHERE id = ?', [id]);
  }

  async findByMember(memberId) {
    const db = database.getDb();
    return await db.all('SELECT * FROM Fine WHERE member_id = ?', [memberId]);
  }

  async create(fineData) {
    const db = database.getDb();
    const { member_id, transaction_id, amount } = fineData;
    
    const result = await db.run(
      `INSERT INTO Fine (member_id, transaction_id, amount)
       VALUES (?, ?, ?)`,
      [member_id, transaction_id, amount]
    );
    
    return result.lastID;
  }

  async markPaid(id) {
    const db = database.getDb();
    await db.run(
      `UPDATE Fine SET paid_at = datetime('now') WHERE id = ?`,
      [id]
    );
  }
}

module.exports = new FineRepository();
