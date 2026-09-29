const Joi = require("joi");

const createProductValidation = (data) => {

    const schema = Joi.object({

        organizationId: Joi.string()
            .required()
            .messages({
                "string.empty": "Organization ID is required",
                "any.required": "Organization ID is required"
            }),

        name: Joi.string()
            .trim()
            .min(2)
            .max(150)
            .required()
            .messages({
                "string.empty": "Product name is required",
                "string.min": "Product name must be at least 2 characters",
                "string.max": "Product name must not exceed 150 characters",
                "any.required": "Product name is required"
            }),

        sku: Joi.string()
            .trim()
            .min(1)
            .max(100)
            .required()
            .messages({
                "string.empty": "SKU is required",
                "any.required": "SKU is required"
            }),

        price: Joi.number()
            .min(0)
            .required()
            .messages({
                "number.base": "Price must be a number",
                "number.min": "Price cannot be negative",
                "any.required": "Price is required"
            }),

        costPrice: Joi.number()
            .min(0)
            .allow(null)
            .default(null)
            .messages({
                "number.base": "Cost price must be a number",
                "number.min": "Cost price cannot be negative"
            })
    });

    return schema.validate(data);
};


module.exports = {
    createProductValidation
};