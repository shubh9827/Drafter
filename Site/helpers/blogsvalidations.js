const Joi = require('joi');

const BlogSchema = Joi.object({
    title : Joi.string().required(),
    description : Joi.string().required(),
    tags : Joi.array().required()
})
module.exports = {
    BlogSchema
}