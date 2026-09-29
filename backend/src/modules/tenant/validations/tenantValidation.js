const Joi = require("joi");

const createTenantValidation = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.empty": "Tenant name is required",
            "string.min": "Tenant name must be at least 2 characters",
            "string.max": "Tenant name must not exceed 100 characters",
            "any.required": "Tenant name is required"
        })
});

module.exports = {
    createTenantValidation
};