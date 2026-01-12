const bookService = require('../services/book.service');
const { asyncHandler } = require('../middleware/errorHandler');

class BookController {
  // GET /books - Get all books
  getAllBooks = asyncHandler(async (req, res) => {
    const books = await bookService.getAllBooks();
    res.json({ success: true, data: books });
  });

  // GET /books/available - Get all available books
  getAvailableBooks = asyncHandler(async (req, res) => {
    const books = await bookService.getAvailableBooks();
    res.json({ success: true, data: books });
  });

  // GET /books/:id - Get book by ID
  getBookById = asyncHandler(async (req, res) => {
    const book = await bookService.getBookById(req.params.id);
    res.json({ success: true, data: book });
  });

  // POST /books - Create new book
  createBook = asyncHandler(async (req, res) => {
    const book = await bookService.createBook(req.body);
    res.status(201).json({ success: true, data: book });
  });

  // PUT /books/:id - Update book
  updateBook = asyncHandler(async (req, res) => {
    const book = await bookService.updateBook(req.params.id, req.body);
    res.json({ success: true, data: book });
  });

  // DELETE /books/:id - Delete book
  deleteBook = asyncHandler(async (req, res) => {
    await bookService.deleteBook(req.params.id);
    res.json({ success: true, message: 'Book deleted successfully' });
  });
}

module.exports = new BookController();
