const database = require('../config/database');
const transactionRepository = require('../repositories/transaction.repository');
const fineRepository = require('../repositories/fine.repository');
const bookService = require('./book.service');
const memberService = require('./member.service');
const { NotFoundError, BusinessRuleError } = require('../middleware/errorHandler');

/**
 * Transaction Service
 * Handles borrowing and returning books with all business rules
 * Uses database transactions to ensure atomicity
 */
class TransactionService {
  /**
   * Business Rule: Standard loan period is 14 days
   */
  static LOAN_PERIOD_DAYS = 14;

  /**
   * Business Rule: Overdue fine is $0.50 per day
   */
  static FINE_PER_DAY = 0.50;

  /**
   * Borrow a book - wrapped in database transaction for atomicity
   * Enforces all business rules:
   * - Member must be active and eligible to borrow
   * - Book must be available
   * - Updates book availability and transaction records atomically
   */
  async borrowBook(memberId, bookId) {
    return await database.runInTransaction(async (db) => {
      // Business Rule: Validate member eligibility
      await memberService.canBorrow(memberId);
      
      // Business Rule: Validate book availability
      const book = await bookService.getBookById(bookId);
      if (book.available_copies <= 0 || book.status !== 'available') {
        throw new BusinessRuleError('Book is not available for borrowing');
      }
      
      // Calculate loan dates
      const borrowed_at = new Date().toISOString();
      const due_date = new Date();
      due_date.setDate(due_date.getDate() + TransactionService.LOAN_PERIOD_DAYS);
      
      // Create transaction record
      const transactionId = await transactionRepository.create({
        book_id: bookId,
        member_id: memberId,
        borrowed_at,
        due_date: due_date.toISOString()
      });
      
      // Update book availability (state machine managed)
      await bookService.decrementAvailableCopies(bookId);
      
      return await transactionRepository.findById(transactionId);
    });
  }

  /**
   * Return a book - wrapped in database transaction for atomicity
   * Calculates overdue fines, updates book status, checks member suspension
   */
  async returnBook(transactionId) {
    return await database.runInTransaction(async (db) => {
      const transaction = await transactionRepository.findById(transactionId);
      
      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }
      
      if (transaction.returned_at) {
        throw new BusinessRuleError('Book has already been returned');
      }
      
      const returned_at = new Date();
      const dueDate = new Date(transaction.due_date);
      
      // Calculate overdue fine
      let fine = null;
      const diffTime = returned_at - dueDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        const fineAmount = diffDays * TransactionService.FINE_PER_DAY;
        
        // Create fine record
        const fineId = await fineRepository.create({
          member_id: transaction.member_id,
          transaction_id: transactionId,
          amount: fineAmount
        });
        
        fine = await fineRepository.findById(fineId);
      }
      
      // Mark transaction as returned
      await transactionRepository.markReturned(transactionId, returned_at.toISOString());
      
      // Update book availability (state machine managed)
      await bookService.incrementAvailableCopies(transaction.book_id);
      
      // Business Rule: Check if member should be suspended (3+ overdue books)
      const suspended = await memberService.checkAndSuspendForOverdue(transaction.member_id);
      
      return {
        transaction: await transactionRepository.findById(transactionId),
        fine,
        memberSuspended: suspended
      };
    });
  }

  /**
   * Get all overdue transactions
   * Updates transaction status to 'overdue' for active transactions past due date
   */
  async getOverdueTransactions() {
    // Mark overdue transactions
    await transactionRepository.markOverdue();
    
    // Return all overdue transactions
    return await transactionRepository.findOverdue();
  }

  async getAllTransactions() {
    return await transactionRepository.findAll();
  }

  async getTransactionById(id) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }
    return transaction;
  }
}

module.exports = new TransactionService();
