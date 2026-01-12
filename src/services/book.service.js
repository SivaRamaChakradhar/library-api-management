const bookRepository = require('../repositories/book.repository');
const { NotFoundError, BusinessRuleError } = require('../middleware/errorHandler');

/**
 * Book Status State Machine
 * Defines allowed state transitions for books
 */
const BOOK_STATES = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
};

const ALLOWED_TRANSITIONS = {
  [BOOK_STATES.AVAILABLE]: [BOOK_STATES.BORROWED, BOOK_STATES.RESERVED, BOOK_STATES.MAINTENANCE],
  [BOOK_STATES.BORROWED]: [BOOK_STATES.AVAILABLE, BOOK_STATES.MAINTENANCE],
  [BOOK_STATES.RESERVED]: [BOOK_STATES.AVAILABLE, BOOK_STATES.BORROWED, BOOK_STATES.MAINTENANCE],
  [BOOK_STATES.MAINTENANCE]: [BOOK_STATES.AVAILABLE]
};

class BookService {
  async getAllBooks() {
    return await bookRepository.findAll();
  }

  async getAvailableBooks() {
    return await bookRepository.findAvailable();
  }

  async getBookById(id) {
    const book = await bookRepository.findById(id);
    if (!book) {
      throw new NotFoundError('Book not found');
    }
    return book;
  }

  async createBook(bookData) {
    const bookId = await bookRepository.create(bookData);
    return await bookRepository.findById(bookId);
  }

  async updateBook(id, bookData) {
    const book = await this.getBookById(id);
    
    // Prevent direct status updates - status should be managed through state transitions
    if (bookData.status) {
      throw new BusinessRuleError(
        'Cannot directly update book status. Status is managed through borrowing/returning operations.'
      );
    }
    
    await bookRepository.update(id, bookData);
    return await bookRepository.findById(id);
  }

  async deleteBook(id) {
    await this.getBookById(id); // Verify existence
    await bookRepository.delete(id);
  }

  /**
   * Transition book state based on state machine rules
   * @param {number} bookId - Book ID
   * @param {string} newStatus - Target status
   */
  async transitionBookState(bookId, newStatus) {
    const book = await this.getBookById(bookId);
    
    const allowedStates = ALLOWED_TRANSITIONS[book.status];
    if (!allowedStates || !allowedStates.includes(newStatus)) {
      throw new BusinessRuleError(
        `Cannot transition book from '${book.status}' to '${newStatus}'`
      );
    }
    
    await bookRepository.updateStatus(bookId, newStatus);
  }

  /**
   * Decrement available copies when book is borrowed
   * Updates status to 'borrowed' if no copies remain available
   */
  async decrementAvailableCopies(bookId) {
    const book = await this.getBookById(bookId);
    
    if (book.available_copies <= 0) {
      throw new BusinessRuleError('No available copies of this book');
    }
    
    await bookRepository.updateAvailableCopies(bookId, -1);
    
    // Update status to borrowed if this was the last copy
    if (book.available_copies === 1) {
      await bookRepository.updateStatus(bookId, BOOK_STATES.BORROWED);
    }
    
    return await bookRepository.findById(bookId);
  }

  /**
   * Increment available copies when book is returned
   * Updates status to 'available' if copies become available
   */
  async incrementAvailableCopies(bookId) {
    const book = await this.getBookById(bookId);
    
    await bookRepository.updateAvailableCopies(bookId, 1);
    
    // Update status to available when a book is returned
    if (book.status === BOOK_STATES.BORROWED) {
      await bookRepository.updateStatus(bookId, BOOK_STATES.AVAILABLE);
    }
    
    return await bookRepository.findById(bookId);
  }
}

module.exports = new BookService();
