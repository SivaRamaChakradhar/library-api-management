const Joi = require('joi');

const bookStatuses = ['available', 'borrowed', 'reserved', 'maintenance'];

const createBookSchema = Joi.object({
  isbn: Joi.string().required().trim().min(10).max(13),
  title: Joi.string().required().trim().min(1).max(255),
  author: Joi.string().required().trim().min(1).max(255),
  category: Joi.string().optional().trim().max(100),
  total_copies: Joi.number().integer().min(1).required(),
  available_copies: Joi.number().integer().min(0).optional()
});

const updateBookSchema = Joi.object({
  isbn: Joi.string().optional().trim().min(10).max(13),
  title: Joi.string().optional().trim().min(1).max(255),
  author: Joi.string().optional().trim().min(1).max(255),
  category: Joi.string().optional().trim().max(100),
  total_copies: Joi.number().integer().min(1).optional()
}).min(1); // At least one field must be present

const bookIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  bookIdSchema
};
