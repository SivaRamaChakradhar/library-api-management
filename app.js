const express = require('express')
const { open } = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'library.db')
let db = null

// Initialize DB & Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    await db.run('PRAGMA foreign_keys = ON;')

    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

/* =====================
   BOOKS CRUD
===================== */

// Get all books
app.get('/books', async (req, res) => {
  const data = await db.all(`SELECT * FROM Book;`)
  res.json(data)
})

// Get book by id
app.get('/books/:id', async (req, res) => {
  const { id } = req.params
  const book = await db.get(`SELECT * FROM Book WHERE id = ?;`, [id])
  if (!book) return res.status(404).send('Book not found')
  res.json(book)
})

// Add book
app.post('/books', async (req, res) => {
  const { isbn, title, author, category, total_copies } = req.body
  const available_copies = total_copies
  await db.run(
    `INSERT INTO Book (isbn, title, author, category, total_copies, available_copies, status)
     VALUES (?, ?, ?, ?, ?, ?, 'available');`,
    [isbn, title, author, category, total_copies, available_copies]
  )
  res.send('Book added successfully')
})

// Update book
app.put('/books/:id', async (req, res) => {
  const { id } = req.params
  const { title, author, status } = req.body
  await db.run(
    `UPDATE Book SET title=?, author=?, status=? WHERE id=?;`,
    [title, author, status, id]
  )
  res.send('Book updated successfully')
})

// Delete book
app.delete('/books/:id', async (req, res) => {
  const { id } = req.params
  await db.run(`DELETE FROM Book WHERE id=?;`, [id])
  res.send('Book deleted successfully')
})

/* =====================
   MEMBERS CRUD
===================== */

app.get('/members', async (req, res) => {
  res.json(await db.all(`SELECT * FROM Member;`))
})

app.get('/members/:id', async (req, res) => {
  const { id } = req.params
  const member = await db.get(`SELECT * FROM Member WHERE id = ?;`, [id])
  if (!member) return res.status(404).send('Member not found')
  res.json(member)
})

app.post('/members', async (req, res) => {
  const { name, email, membership_number } = req.body
  await db.run(
    `INSERT INTO Member (name, email, membership_number, status)
     VALUES (?, ?, ?, 'active');`,
    [name, email, membership_number]
  )
  res.send('Member added successfully')
})

app.put('/members/:id', async (req, res) => {
  const { id } = req.params
  const { name, email } = req.body
  await db.run(`UPDATE Member SET name=?, email=? WHERE id=?;`, [name, email, id])
  res.send('Member updated successfully')
})

app.delete('/members/:id', async (req, res) => {
  const { id } = req.params
  await db.run(`DELETE FROM Member WHERE id=?;`, [id])
  res.send('Member deleted successfully')
})

/* =====================
   TRANSACTIONS (BORROW / RETURN)
===================== */

// Borrow a book
app.post('/transactions/borrow', async (req, res) => {
  const { member_id, book_id } = req.body

  // 1. Check member status
  const member = await db.get(`SELECT * FROM Member WHERE id=?;`, [member_id])
  if (!member || member.status !== 'active') {
    return res.status(400).send('Member is suspended or does not exist')
  }

  // 2. Check unpaid fines
  const unpaid = await db.get(
    `SELECT COUNT(*) AS count FROM Fine WHERE member_id=? AND paid_at IS NULL;`,
    [member_id]
  )
  if (unpaid.count > 0) {
    return res.status(400).send('Clear unpaid fines before borrowing')
  }

  // 3. Max 3 active borrows
  const activeBorrows = await db.get(
    `SELECT COUNT(*) AS count FROM Transactions
     WHERE member_id=? AND returned_at IS NULL;`,
    [member_id]
  )
  if (activeBorrows.count >= 3) {
    return res.status(400).send('Borrow limit exceeded (max 3 books)')
  }

  // 4. Book availability
  const book = await db.get(`SELECT * FROM Book WHERE id=?;`, [book_id])
  if (!book || book.available_copies <= 0 || book.status !== 'available') {
    return res.status(400).send('Book is not available')
  }

  // 5. Borrow (14-day loan)
  const borrowedAt = new Date().toISOString()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  await db.run(
    `INSERT INTO Transactions (book_id, member_id, borrowed_at, due_date, status)
     VALUES (?, ?, ?, ?, 'active');`,
    [book_id, member_id, borrowedAt, dueDate.toISOString()]
  )

  await db.run(
    `UPDATE Book SET available_copies = available_copies - 1,
                     status = CASE WHEN available_copies-1=0 THEN 'borrowed' ELSE 'available' END
     WHERE id=?;`,
    [book_id]
  )

  res.send('Book borrowed successfully')
})

// Return book
app.post('/transactions/:id/return', async (req, res) => {
  const { id } = req.params
  const txn = await db.get(`SELECT * FROM Transactions WHERE id=?;`, [id])
  if (!txn || txn.returned_at) {
    return res.status(400).send('No active borrow record found')
  }

  const returnedAt = new Date()
  let fine = 0
  const dueDate = new Date(txn.due_date)
  const diffDays = Math.floor((returnedAt - dueDate) / (1000 * 60 * 60 * 24))

  if (diffDays > 0) {
    fine = diffDays * 0.5
    await db.run(
      `INSERT INTO Fine (member_id, transaction_id, amount)
       VALUES (?, ?, ?);`,
      [txn.member_id, txn.id, fine]
    )
  }

  await db.run(
    `UPDATE Transactions SET returned_at=?, status='returned' WHERE id=?;`,
    [returnedAt.toISOString(), id]
  )

  await db.run(
    `UPDATE Book SET available_copies = available_copies + 1,
                     status = 'available'
     WHERE id=?;`,
    [txn.book_id]
  )

  // Suspension check
  const overdue = await db.get(
    `SELECT COUNT(*) AS count FROM Transactions
     WHERE member_id=? AND returned_at IS NULL AND due_date < ?;`,
    [txn.member_id, new Date().toISOString()]
  )
  if (overdue.count >= 3) {
    await db.run(`UPDATE Member SET status='suspended' WHERE id=?;`, [txn.member_id])
  }

  res.json({ message: 'Book returned successfully', fine })
})

// GET /transactions/overdue
app.get('/transactions/overdue', async (req, res) => {
  try {
    // Mark overdue transactions
    await db.run(`
      UPDATE Transactions
      SET status = 'overdue'
      WHERE returned_at IS NULL AND status = 'active' AND due_date < datetime('now')
    `)

    // Fetch overdue transactions
    const overdueTransactions = await db.all(`
      SELECT T.id, T.book_id, T.member_id, T.borrowed_at, T.due_date, T.status,
             B.title AS book_title, M.name AS member_name
      FROM Transactions T
      JOIN Book B ON T.book_id = B.id
      JOIN Member M ON T.member_id = M.id
      WHERE T.status = 'overdue' AND T.returned_at IS NULL
    `)

    res.json(overdueTransactions)
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})

// POST /fines/:id/pay
app.post('/fines/:id/pay', async (req, res) => {
  try {
    const { id } = req.params

    const fine = await db.get(`SELECT * FROM Fine WHERE id = ?`, [id])
    if (!fine) return res.status(404).send('Fine not found')
    if (fine.paid_at) return res.status(400).send('Fine already paid')

    await db.run(`
      UPDATE Fine
      SET paid_at = datetime('now')
      WHERE id = ?
    `, [id])

    const updatedFine = await db.get(`SELECT * FROM Fine WHERE id = ?`, [id])
    res.json(updatedFine)
  } catch (e) {
    res.status(500).send({ error: e.message })
  }
})