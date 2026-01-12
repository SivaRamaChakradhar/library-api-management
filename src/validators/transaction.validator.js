const Joi = require('joi');

const borrowBookSchema = Joi.object({
  member_id: Joi.number().integer().positive().required(),
  book_id: Joi.number().integer().positive().required()
});

const transactionIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  borrowBookSchema,
  transactionIdSchema
};
