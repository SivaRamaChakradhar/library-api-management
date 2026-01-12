const memberService = require('../services/member.service');
const { asyncHandler } = require('../middleware/errorHandler');

class MemberController {
  // GET /members - Get all members
  getAllMembers = asyncHandler(async (req, res) => {
    const members = await memberService.getAllMembers();
    res.json({ success: true, data: members });
  });

  // GET /members/:id - Get member by ID
  getMemberById = asyncHandler(async (req, res) => {
    const member = await memberService.getMemberById(req.params.id);
    res.json({ success: true, data: member });
  });

  // GET /members/:id/borrowed - Get books currently borrowed by member
  getBorrowedBooks = asyncHandler(async (req, res) => {
    const books = await memberService.getBorrowedBooks(req.params.id);
    res.json({ success: true, data: books });
  });

  // POST /members - Create new member
  createMember = asyncHandler(async (req, res) => {
    const member = await memberService.createMember(req.body);
    res.status(201).json({ success: true, data: member });
  });

  // PUT /members/:id - Update member
  updateMember = asyncHandler(async (req, res) => {
    const member = await memberService.updateMember(req.params.id, req.body);
    res.json({ success: true, data: member });
  });

  // DELETE /members/:id - Delete member
  deleteMember = asyncHandler(async (req, res) => {
    await memberService.deleteMember(req.params.id);
    res.json({ success: true, message: 'Member deleted successfully' });
  });
}

module.exports = new MemberController();
