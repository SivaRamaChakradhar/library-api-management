const fineService = require('../services/fine.service');
const { asyncHandler } = require('../middleware/errorHandler');

class FineController {
  // GET /fines - Get all fines
  getAllFines = asyncHandler(async (req, res) => {
    const fines = await fineService.getAllFines();
    res.json({ success: true, data: fines });
  });

  // GET /fines/:id - Get fine by ID
  getFineById = asyncHandler(async (req, res) => {
    const fine = await fineService.getFineById(req.params.id);
    res.json({ success: true, data: fine });
  });

  // POST /fines/:id/pay - Pay a fine
  payFine = asyncHandler(async (req, res) => {
    const fine = await fineService.payFine(req.params.id);
    res.json({ 
      success: true, 
      message: 'Fine paid successfully',
      data: fine 
    });
  });
}

module.exports = new FineController();
