const Joi = require("joi");

const createSaleValidation = Joi.object({
    customerId: Joi.string().hex().length(24).allow(null).optional(),

    items: Joi.array()
        .min(1)
        .items(
            Joi.object({
                productId: Joi.string().hex().length(24).required(),
                quantity: Joi.number().integer().min(1).required()
            })
        )
        .required()
        .messages({
            "array.min": "At least one item is required",
            "any.required": "Items are required"
        })
});

module.exports = { createSaleValidation };