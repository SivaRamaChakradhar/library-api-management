const Joi = require('joi');

const createMemberSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(255),
  email: Joi.string().email().required().trim().lowercase(),
  membership_number: Joi.string().required().trim().min(1).max(50)
});

const updateMemberSchema = Joi.object({
  name: Joi.string().optional().trim().min(1).max(255),
  email: Joi.string().email().optional().trim().lowercase()
}).min(1); // At least one field must be present

const memberIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createMemberSchema,
  updateMemberSchema,
  memberIdSchema
};
