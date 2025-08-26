const createError = require("http-errors");
const Joi = require("joi");
const { MongoIDPattern } = require("../../../../utils/constants");

const addProductSchema = Joi.object({
  title: Joi.string()
    .required()
    .min(3)
    .max(30)
    .error(createError.BadRequest("The product title is incorrect.")),

  description: Joi.string()
    .required()
    .error(createError.BadRequest("The description sent is not correct.")),

  slug: Joi.string()
    .required()
    .error(createError.BadRequest("The slug sent is not valid.")),

  brand: Joi.string()
    .required()
    .error(createError.BadRequest("The product brand is not correct.")),

  countInStock: Joi.number()
    .required()
    .error(createError.BadRequest("The product stock is invalid.")),

  // imageLink: Joi.string()
  //   .optional()
  //   .allow("")
  //   .error(createError.BadRequest("The product image link is not correct.")),
  imageLinks: Joi.array()
    .items(Joi.string())
    .required()
    .error(createError.BadRequest("The product image link is not correct.")),

  tags: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .error(createError.BadRequest("The labels are not correct.")),

  category: Joi.string()
    .required()
    .regex(MongoIDPattern)
    .error(createError.BadRequest("The requested category is not correct.")),

  offPrice: Joi.number().error(
    createError.BadRequest("The discounted price is not correct.")
  ),

  price: Joi.number()
    .required()
    .error(createError.BadRequest("The price entered is not correct.")),

  discount: Joi.number()
    .allow(0)
    .error(createError.BadRequest("The discount entered is not correct.")),
});

const changeCourseDiscountSchema = Joi.object({
  offPrice: Joi.number()
    .required()
    .error(createError.BadRequest("The price entered is not correct.")),
  discount: Joi.number()
    .required()
    .allow(0)
    .error(createError.BadRequest("The discount entered is not correct.")),
});

module.exports = {
  addProductSchema,
  changeCourseDiscountSchema,
};
