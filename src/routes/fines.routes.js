const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fine.controller');
const { validate } = require('../middleware/errorHandler');
const { fineIdSchema } = require('../validators/fine.validator');

// GET /fines - Get all fines
router.get('/', fineController.getAllFines);

// GET /fines/:id - Get fine by ID
router.get('/:id', validate(fineIdSchema, 'params'), fineController.getFineById);

// POST /fines/:id/pay - Pay a fine
router.post('/:id/pay', validate(fineIdSchema, 'params'), fineController.payFine);

module.exports = router;
