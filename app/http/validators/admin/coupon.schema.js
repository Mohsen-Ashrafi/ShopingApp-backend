const Joi = require("joi");
const createHttpError = require("http-errors");
const { MongoIDPattern } = require("../../../../utils/constants");

const addCouponSchema = Joi.object({
  code: Joi.string()
    .required()
    .min(5)
    .max(30)
    .error(createHttpError.BadRequest("Discount code is not valid")),
  type: Joi.string()
    .required()
    .valid("fixedProduct", "percent")
    .error(createHttpError.BadRequest("Enter the discount code type correctly")),
  amount: Joi.number()
    .required()
    .error(createHttpError.BadRequest("Enter the discount code amount correctly")),
  expireDate: Joi.date()
    .allow()
    .error(createHttpError.BadRequest("Enter the discount code amount correctly")),
  usageLimit: Joi.number()
    .required()
    .error(createHttpError.BadRequest("Enter the discount code capacity correctly")),
  productIds: Joi.array()
    .items(Joi.string().required().regex(MongoIDPattern))
    .error(createHttpError.BadRequest("Product ID is not valid")),
});

module.exports = {
  addCouponSchema,
};
