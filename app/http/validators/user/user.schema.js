const Joi = require("joi");
const createHttpError = require("http-errors");

const phoneNumberSchema = Joi.string()
  .pattern(/^(?:\+|0)[1-9]\d{9,14}$/)
  .error(
    createHttpError.BadRequest("The mobile number entered is not correct")
  );

const getOtpSchema = Joi.object({
  phoneNumber: phoneNumberSchema,
});

const checkOtpSchema = Joi.object({
  otp: Joi.string()
    .min(5)
    .max(6)
    .error(createHttpError.BadRequest("The code sent is not valid")),
  phoneNumber: phoneNumberSchema,
});

const completeProfileSchema = Joi.object({
  name: Joi.string()
    .min(5)
    .max(100)
    .error(createHttpError.BadRequest("The username entered is not correct")),
  email: Joi.string()
    .email()
    .error(createHttpError.BadRequest("The email entered is not valid")),
});

const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(5)
    .max(50)
    .required()
    .error(createHttpError.BadRequest("The username entered is not correct")),
  email: Joi.string()
    .required()
    .email()
    .error(createHttpError.BadRequest("The email entered is not valid")),
  phoneNumber: phoneNumberSchema,
  biography: Joi.string()
    .max(30)
    .allow("")
    .error(
      createHttpError.BadRequest("The field of expertise is not correct.")
    ),
});

module.exports = {
  getOtpSchema,
  completeProfileSchema,
  checkOtpSchema,
  updateProfileSchema,
};
