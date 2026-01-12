const Joi = require('joi');

const fineIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  fineIdSchema
};
