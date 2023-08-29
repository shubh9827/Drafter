const Joi = require('joi');
const UserRegisterSchema = Joi.object({
    userName: Joi.string().required(),
    email: Joi.string().email({ tlds: { allow: false } }),
    phoneNo: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
    gender: Joi.string().valid('male', 'female').insensitive().required(),
    password: Joi.string()
                 .min(8)
                 .pattern(new RegExp(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/))
                 .required()
                 .messages({
                    'string.base': 'Password must be a string.',
                    'string.empty': 'Password is required.',
                    'string.min': 'Password must be at least 8 characters long.',
                    'any.required': 'Password is required.',
                    'string.pattern.base': 'password must contain Minimum eight characters, at least one letter, one number and one special character:'
                  }),
    key: Joi.string(),
    resetTime: Joi.string()
});
const UserPasswordsSchema = Joi.object({
    newPassword: Joi.string()
                    .min(8)
                    .pattern(new RegExp(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/))
                    .required()
                    .messages({
                      'string.base': 'Password must be a string.',
                      'string.empty': 'Password is required.',
                      'string.min': 'Password must be at least 8 characters long.',
                      'any.required': 'Password is required.',
                      'string.pattern.base': 'password must contain Minimum eight characters, at least one letter, one number and one special character:'
                    }),
    confirmPassword: Joi.string().required(),
    password: Joi.string(),
    key: Joi.string(), 
});

module.exports = {
    UserRegisterSchema,
    UserPasswordsSchema
}
