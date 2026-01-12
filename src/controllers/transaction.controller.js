const transactionService = require('../services/transaction.service');
const { asyncHandler } = require('../middleware/errorHandler');

class TransactionController {
  // GET /transactions - Get all transactions
  getAllTransactions = asyncHandler(async (req, res) => {
    const transactions = await transactionService.getAllTransactions();
    res.json({ success: true, data: transactions });
  });

  // GET /transactions/:id - Get transaction by ID
  getTransactionById = asyncHandler(async (req, res) => {
    const transaction = await transactionService.getTransactionById(req.params.id);
    res.json({ success: true, data: transaction });
  });

  // GET /transactions/overdue - Get all overdue transactions
  getOverdueTransactions = asyncHandler(async (req, res) => {
    const transactions = await transactionService.getOverdueTransactions();
    res.json({ success: true, data: transactions });
  });

  // POST /transactions/borrow - Borrow a book
  borrowBook = asyncHandler(async (req, res) => {
    const { member_id, book_id } = req.body;
    const transaction = await transactionService.borrowBook(member_id, book_id);
    res.status(201).json({ 
      success: true, 
      message: 'Book borrowed successfully',
      data: transaction 
    });
  });

  // PATCH /transactions/:id/return - Return a book
  returnBook = asyncHandler(async (req, res) => {
    const result = await transactionService.returnBook(req.params.id);
    
    const response = {
      success: true,
      message: 'Book returned successfully',
      data: result.transaction
    };
    
    if (result.fine) {
      response.fine = result.fine;
      response.message += `. Fine of $${result.fine.amount} has been applied.`;
    }
    
    if (result.memberSuspended) {
      response.warning = 'Member has been suspended due to 3 or more overdue books';
    }
    
    res.json(response);
  });
}

module.exports = new TransactionController();
