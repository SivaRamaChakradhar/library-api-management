const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { validate } = require('../middleware/errorHandler');
const { createMemberSchema, updateMemberSchema, memberIdSchema } = require('../validators/member.validator');

// GET /members - Get all members
router.get('/', memberController.getAllMembers);

// GET /members/:id - Get member by ID
router.get('/:id', validate(memberIdSchema, 'params'), memberController.getMemberById);

// GET /members/:id/borrowed - Get books borrowed by member
router.get('/:id/borrowed', validate(memberIdSchema, 'params'), memberController.getBorrowedBooks);

// POST /members - Create new member
router.post('/', validate(createMemberSchema), memberController.createMember);

// PUT /members/:id - Update member
router.put(
  '/:id',
  validate(memberIdSchema, 'params'),
  validate(updateMemberSchema, 'body'),
  memberController.updateMember
);

// DELETE /members/:id - Delete member
router.delete('/:id', validate(memberIdSchema, 'params'), memberController.deleteMember);

module.exports = router;
