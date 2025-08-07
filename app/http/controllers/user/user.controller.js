const Controller = require("../controller");
const {
  generateRandomNumber,
  toPersianDigits,
  setAccessToken,
  setRefreshToken,
  verifyRefreshToken,
  getUserCartDetail,
} = require("../../../../utils/functions");
const createError = require("http-errors");
const { UserModel } = require("../../../models/user");
const { StatusCodes: HttpStatus } = require("http-status-codes");
const path = require("path");
const { ROLES } = require("../../../../utils/constants");
const {
  checkOtpSchema,
  completeProfileSchema,
  updateProfileSchema,
} = require("../../validators/user/user.schema");
const { PaymentModel } = require("../../../models/payment");

const ADMIN_PHONE = "09123456789";
const CODE_EXPIRES = 90 * 1000; //90 seconds in miliseconds

class userAuthController extends Controller {
  constructor() {
    super();
    this.code = 0;
    this.phoneNumber = null;
  }
  async getOtp(req, res) {
    let { phoneNumber } = req.body;

    if (!phoneNumber)
      throw createError.BadRequest("Enter a valid mobile number");

    phoneNumber = phoneNumber.trim();
    this.phoneNumber = phoneNumber;
    this.code = generateRandomNumber(6);

    const isAdmin = phoneNumber === ADMIN_PHONE;

    const result = await this.saveUser(phoneNumber, isAdmin);
    if (!result) throw createError.Unauthorized("Your login failed.");

    return res.status(HttpStatus.OK).send({
      statusCode: HttpStatus.OK,
      data: {
        message: `Verification code generated for number ${phoneNumber}`,
        otp: this.code,
        expiresIn: CODE_EXPIRES,
        phoneNumber,
        role: isAdmin ? ROLES.ADMIN : ROLES.USER,
      },
    });
  }
  async checkOtp(req, res) {
    await checkOtpSchema.validateAsync(req.body);
    const { otp: code, phoneNumber } = req.body;

    const user = await UserModel.findOne({ phoneNumber }); // 👈 همه‌ی فیلدها

    if (!user)
      throw createError.NotFound("No user with these specifications found");

    if (user.otp.code != code)
      throw createError.BadRequest("The code sent is not valid");

    if (new Date(user.otp.expiresIn).getTime() < Date.now())
      throw createError.BadRequest("The verification code has expired");

    const isAdmin = phoneNumber === ADMIN_PHONE;
    user.role = isAdmin ? ROLES.ADMIN : user.role;

    user.isVerifiedPhoneNumber = true;
    await user.save();

    await setAccessToken(res, user);
    await setRefreshToken(res, user);

    let WELLCOME_MESSAGE =
      "Verification complete. Enjoy your experience with us!";
    if (!user.isActive)
      WELLCOME_MESSAGE = `Code confirmed, please complete your information`;

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: WELLCOME_MESSAGE,
        user,
      },
    });
  }
  async saveUser(phoneNumber, isAdmin) {
    return await UserModel.findOneAndUpdate(
      { phoneNumber },
      {
        $set: {
          phoneNumber,
          role: isAdmin ? "ADMIN" : "USER",
          isVerifiedPhoneNumber: false,
          isActive: false,
          otp: {
            code: this.code,
            expiresIn: Date.now() + CODE_EXPIRES * 1000,
          },
        },
      },
      { upsert: true, new: true }
    );
  }
  async checkUserExist(phoneNumber) {
    const user = await UserModel.findOne({ phoneNumber });
    return user;
  }
  async updateUser(phoneNumber, objectData = {}) {
    const updateFields = {};

    if (objectData.otp) updateFields.otp = objectData.otp;
    if (objectData.role) updateFields.role = objectData.role;

    const updatedResult = await UserModel.updateOne(
      { phoneNumber },
      { $set: updateFields }
    );

    return !!updatedResult.modifiedCount;
  }
  sendOTP(phoneNumber, res) {
    const kaveNegarApi = Kavenegar.KavenegarApi({
      apikey: `${process.env.KAVENEGAR_API_KEY}`,
    });
    kaveNegarApi.VerifyLookup(
      {
        receptor: phoneNumber,
        token: this.code,
        template: "registerVerify",
      },
      (response, status) => {
        console.log("kavenegar message status", status);

        if (response && status === 200) {
          return res.status(HttpStatus.OK).send({
            statusCode: HttpStatus.OK,
            data: {
              message: `Verification code sent to mobile number ${toPersianDigits(
                phoneNumber
              )}`,
              expiresIn: CODE_EXPIRES,
              phoneNumber,
            },
          });
        }
        const validStatus =
          typeof status === "number" && status >= 100 && status < 600
            ? status
            : 500;

        return res.status(validStatus).send({
          statusCode: validStatus,
          message: "Verification code not sent",
        });
      }
    );
  }
  async completeProfile(req, res) {
    await completeProfileSchema.validateAsync(req.body);
    const { user } = req;
    const { name, email } = req.body;

    if (!user.isVerifiedPhoneNumber)
      throw createError.Forbidden("Verify your mobile number.");

    const duplicateUser = await UserModel.findOne({ email });

    if (duplicateUser)
      throw createError.BadRequest(
        "A user with this email address has already registered."
      );

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id },
      { $set: { name, email, isActive: true } },
      { new: true }
    );
    // await setAuthCookie(res, updatedUser);
    await setAccessToken(res, updatedUser);
    await setRefreshToken(res, updatedUser);

    return res.status(HttpStatus.OK).send({
      statusCode: HttpStatus.OK,
      data: {
        message: "Your information has been successfully completed",
        user: updatedUser,
      },
    });
  }
  async updateProfile(req, res) {
    const { _id: userId } = req.user;
    await updateProfileSchema.validateAsync(req.body);
    const { name, email, biography, phoneNumber } = req.body;

    const updateResult = await UserModel.updateOne(
      { _id: userId },
      {
        $set: { name, email, biography, phoneNumber },
      }
    );
    if (!updateResult.modifiedCount === 0)
      throw createError.BadRequest("Information could not be edited");
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message: "Information updated successfully",
      },
    });
  }
  async refreshToken(req, res) {
    const userId = await verifyRefreshToken(req);
    const user = await UserModel.findById(userId);
    await setAccessToken(res, user);
    await setRefreshToken(res, user);
    return res.status(HttpStatus.OK).json({
      StatusCode: HttpStatus.OK,
      data: {
        user,
      },
    });
  }
  async getUserProfile(req, res) {
    const { _id: userId } = req.user;
    const user = await UserModel.findById(userId, { otp: 0 });
    const cart = (await getUserCartDetail(userId))?.[0];
    const payments = await PaymentModel.find({ user: userId });

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        user,
        payments,
        cart,
      },
    });
  }
  logout(req, res) {
    const cookieOptions = {
      maxAge: 1,
      expires: Date.now(),
      httpOnly: true,
      signed: true,
      sameSite: "Lax",
      secure: true,
      path: "/",
      domain: process.env.DOMAIN,
      // process.env.NODE_ENV === "development" ? "localhost" : ".folan.ir",
    };
    res.cookie("accessToken", null, cookieOptions);
    res.cookie("refreshToken", null, cookieOptions);

    return res.status(HttpStatus.OK).json({
      StatusCode: HttpStatus.OK,
      roles: null,
      auth: false,
    });
  }
}

module.exports = {
  UserAuthController: new userAuthController(),
};
