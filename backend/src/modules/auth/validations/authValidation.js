const Joi = require("joi");

const registerValidation = Joi.object({
    username: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .required(),

    name: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required(),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required(),

    password: Joi.string()
        .min(6)
        .max(72)
        .required(),

    organizationName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
});

const loginValidation = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required(),

    password: Joi.string()
        .required()
});

module.exports = {
    registerValidation,
    loginValidation
};
