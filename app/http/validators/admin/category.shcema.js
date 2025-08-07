const Joi = require("joi");
const createHttpError = require("http-errors");
const { MongoIDPattern } = require("../../../../utils/constants");

const addCategorySchema = Joi.object({
  title: Joi.string()
    .required()
    .min(3)
    .max(100)
    .error(createHttpError.BadRequest("The Persian title is not the correct category")),
  englishTitle: Joi.string()
    .required()
    .min(3)
    .max(100)
    .error(
      createHttpError.BadRequest("The English title is not the correct category")
    ),
  description: Joi.string()
    .required()
    .min(3)
    .max(200)
    .error(createHttpError.BadRequest("Category description is not correct")),
  type: Joi.string()
    .required()
    .min(3)
    .max(100)
    .valid("product", "post", "comment", "ticket")
    .error(createHttpError.BadRequest("Category type is not correct")),
  parent: Joi.string()
    .allow("")
    .pattern(MongoIDPattern)
    .error(createHttpError.BadRequest("The ID sent is not valid")),
});

const updateCategorySchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(100)
    .error(createHttpError.BadRequest("The Persian title is not the correct category")),
  englishTitle: Joi.string()
    .min(3)
    .max(100)
    .error(
      createHttpError.BadRequest("The English title is not the correct category")
    ),
  description: Joi.string()
    .required()
    .min(3)
    .max(200)
    .error(createHttpError.BadRequest("Category description is not correct")),
  type: Joi.string()
    .required()
    .min(3)
    .max(100)
    .valid("product", "post", "comment", "ticket")
    .error(createHttpError.BadRequest("Category type is not correct")),
});

module.exports = {
  addCategorySchema,
  updateCategorySchema,
};
