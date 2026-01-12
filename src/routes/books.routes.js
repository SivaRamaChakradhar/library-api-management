const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { validate } = require('../middleware/errorHandler');
const { createBookSchema, updateBookSchema, bookIdSchema } = require('../validators/book.validator');

// GET /books - Get all books
router.get('/', bookController.getAllBooks);

// GET /books/available - Get available books (must be before /:id route)
router.get('/available', bookController.getAvailableBooks);

// GET /books/:id - Get book by ID
router.get('/:id', validate(bookIdSchema, 'params'), bookController.getBookById);

// POST /books - Create new book
router.post('/', validate(createBookSchema), bookController.createBook);

// PUT /books/:id - Update book
router.put(
  '/:id',
  validate(bookIdSchema, 'params'),
  validate(updateBookSchema, 'body'),
  bookController.updateBook
);

// DELETE /books/:id - Delete book
router.delete('/:id', validate(bookIdSchema, 'params'), bookController.deleteBook);

module.exports = router;
