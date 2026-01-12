const memberRepository = require('../repositories/member.repository');
const { NotFoundError, BusinessRuleError } = require('../middleware/errorHandler');

/**
 * Member Status State Machine
 */
const MEMBER_STATES = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
};

class MemberService {
  async getAllMembers() {
    return await memberRepository.findAll();
  }

  async getMemberById(id) {
    const member = await memberRepository.findById(id);
    if (!member) {
      throw new NotFoundError('Member not found');
    }
    return member;
  }

  async getBorrowedBooks(id) {
    await this.getMemberById(id); // Verify member exists
    return await memberRepository.getBorrowedBooks(id);
  }

  async createMember(memberData) {
    const memberId = await memberRepository.create(memberData);
    return await memberRepository.findById(memberId);
  }

  async updateMember(id, memberData) {
    await this.getMemberById(id); // Verify existence
    await memberRepository.update(id, memberData);
    return await memberRepository.findById(id);
  }

  async deleteMember(id) {
    await this.getMemberById(id); // Verify existence
    await memberRepository.delete(id);
  }

  /**
   * Business Rule: Check if member can borrow books
   * A member cannot borrow if:
   * 1. They are suspended
   * 2. They have unpaid fines
   * 3. They have reached the borrowing limit (3 books)
   */
  async canBorrow(memberId) {
    const member = await this.getMemberById(memberId);
    
    if (member.status === MEMBER_STATES.SUSPENDED) {
      throw new BusinessRuleError('Member is suspended and cannot borrow books');
    }
    
    const unpaidFines = await memberRepository.getUnpaidFinesCount(memberId);
    if (unpaidFines > 0) {
      throw new BusinessRuleError('Cannot borrow books with unpaid fines. Please clear all fines first.');
    }
    
    const activeBorrows = await memberRepository.getActiveBorrowsCount(memberId);
    if (activeBorrows >= 3) {
      throw new BusinessRuleError('Borrowing limit exceeded. Maximum 3 books can be borrowed at once.');
    }
    
    return true;
  }

  /**
   * Business Rule: Suspend member if they have 3 or more overdue books
   */
  async checkAndSuspendForOverdue(memberId) {
    const overdueCount = await memberRepository.getOverdueBorrowsCount(memberId);
    
    if (overdueCount >= 3) {
      await memberRepository.updateStatus(memberId, MEMBER_STATES.SUSPENDED);
      return true;
    }
    
    return false;
  }

  /**
   * Reactivate a suspended member
   * Typically called after fines are paid and overdue books returned
   */
  async reactivateMember(memberId) {
    const member = await this.getMemberById(memberId);
    
    if (member.status !== MEMBER_STATES.SUSPENDED) {
      throw new BusinessRuleError('Member is not suspended');
    }
    
    const unpaidFines = await memberRepository.getUnpaidFinesCount(memberId);
    if (unpaidFines > 0) {
      throw new BusinessRuleError('Cannot reactivate member with unpaid fines');
    }
    
    const overdueCount = await memberRepository.getOverdueBorrowsCount(memberId);
    if (overdueCount >= 3) {
      throw new BusinessRuleError('Cannot reactivate member with 3 or more overdue books');
    }
    
    await memberRepository.updateStatus(memberId, MEMBER_STATES.ACTIVE);
    return await memberRepository.findById(memberId);
  }
}

module.exports = new MemberService();
