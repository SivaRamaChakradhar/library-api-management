const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'library.db')
let db = null

// Function to initialize database connection and start the server
const initializeDBAndServer = async () => {
  // 1. Open a connection to the SQLite database
  // - filename: path to the database file (goodreads.db)
  // - driver: tells SQLite to use the sqlite3 engine
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    // 2. If database connection is successful, start the Express server
    // - listen() binds the app to port 3000
    // - the callback runs once the server starts successfully
    app.listen(3000, () => {
      console.log('Server is runing at http://localhost:3000')
    })
  } catch (e) {
    // 3. If something goes wrong (DB connection or server start),
    //    log the error message
    console.log(`db error ${e.message}`)
    // 4. Exit the Node.js process with status code 1 (means failure)
    process.exit(1)
  }
}

initializeDBAndServer()

app.get('/books/', async (request, response) => {
  const getBooksQuery = `
    SELECT * FROM books;
  `
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
});