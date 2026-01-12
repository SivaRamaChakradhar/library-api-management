const database = require('../config/database');

class BookRepository {
  async findAll() {
    const db = database.getDb();
    return await db.all('SELECT * FROM Book');
  }

  async findById(id) {
    const db = database.getDb();
    return await db.get('SELECT * FROM Book WHERE id = ?', [id]);
  }

  async findAvailable() {
    const db = database.getDb();
    return await db.all(
      'SELECT * FROM Book WHERE available_copies > 0 AND status = ?',
      ['available']
    );
  }

  async create(bookData) {
    const db = database.getDb();
    const { isbn, title, author, category, total_copies } = bookData;
    const available_copies = bookData.available_copies || total_copies;
    
    const result = await db.run(
      `INSERT INTO Book (isbn, title, author, category, total_copies, available_copies, status)
       VALUES (?, ?, ?, ?, ?, ?, 'available')`,
      [isbn, title, author, category, total_copies, available_copies]
    );
    
    return result.lastID;
  }

  async update(id, bookData) {
    const db = database.getDb();
    const { isbn, title, author, category, total_copies } = bookData;
    
    const updates = [];
    const values = [];
    
    if (isbn !== undefined) {
      updates.push('isbn = ?');
      values.push(isbn);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (author !== undefined) {
      updates.push('author = ?');
      values.push(author);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (total_copies !== undefined) {
      updates.push('total_copies = ?');
      values.push(total_copies);
    }
    
    values.push(id);
    
    await db.run(
      `UPDATE Book SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async updateStatus(id, status) {
    const db = database.getDb();
    await db.run('UPDATE Book SET status = ? WHERE id = ?', [status, id]);
  }

  async updateAvailableCopies(id, delta) {
    const db = database.getDb();
    await db.run(
      `UPDATE Book SET available_copies = available_copies + ? WHERE id = ?`,
      [delta, id]
    );
  }

  async delete(id) {
    const db = database.getDb();
    await db.run('DELETE FROM Book WHERE id = ?', [id]);
  }
}

module.exports = new BookRepository();
