const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { validate } = require('../middleware/errorHandler');
const { borrowBookSchema, transactionIdSchema } = require('../validators/transaction.validator');

// GET /transactions/overdue - Get overdue transactions (must be before /:id route)
router.get('/overdue', transactionController.getOverdueTransactions);

// GET /transactions - Get all transactions
router.get('/', transactionController.getAllTransactions);

// GET /transactions/:id - Get transaction by ID
router.get('/:id', validate(transactionIdSchema, 'params'), transactionController.getTransactionById);

// POST /transactions/borrow - Borrow a book
router.post('/borrow', validate(borrowBookSchema), transactionController.borrowBook);

// PATCH /transactions/:id/return - Return a book (using PATCH instead of POST for RESTful compliance)
router.patch('/:id/return', validate(transactionIdSchema, 'params'), transactionController.returnBook);

module.exports = router;
