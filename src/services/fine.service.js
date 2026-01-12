const fineRepository = require('../repositories/fine.repository');
const { NotFoundError, BusinessRuleError } = require('../middleware/errorHandler');

class FineService {
  async getAllFines() {
    return await fineRepository.findAll();
  }

  async getFineById(id) {
    const fine = await fineRepository.findById(id);
    if (!fine) {
      throw new NotFoundError('Fine not found');
    }
    return fine;
  }

  async getFinesByMember(memberId) {
    return await fineRepository.findByMember(memberId);
  }

  /**
   * Mark a fine as paid
   * Business Rule: Cannot pay an already paid fine
   */
  async payFine(id) {
    const fine = await this.getFineById(id);
    
    if (fine.paid_at) {
      throw new BusinessRuleError('Fine has already been paid');
    }
    
    await fineRepository.markPaid(id);
    return await fineRepository.findById(id);
  }
}

module.exports = new FineService();
