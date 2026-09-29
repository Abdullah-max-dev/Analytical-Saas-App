const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            const validationError = new Error(
                error.details[0].message
            );

            validationError.statusCode = 400;

            return next(validationError);
        }

        next();
    };
};

module.exports = validate;