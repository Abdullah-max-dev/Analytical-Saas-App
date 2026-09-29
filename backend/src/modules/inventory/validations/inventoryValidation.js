const Joi = require("joi");

const updateInventoryValidation = Joi.object({
  quantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be a whole number",
      "number.min": "Quantity cannot be negative",
      "any.required": "Quantity is required"
    }),

  lowStockLimit: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      "number.base": "Low stock limit must be a number",
      "number.integer": "Low stock limit must be a whole number",
      "number.min": "Low stock limit cannot be negative"
    }),

  note: Joi.string()
    .trim()
    .max(500)
    .allow("", null)
    .optional()
});

module.exports = {
  updateInventoryValidation
};