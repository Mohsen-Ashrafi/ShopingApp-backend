const router = require("express").Router();
const expressAsyncHandler = require("express-async-handler");

const {
  ProductController,
} = require("../../http/controllers/admin/product/product.controller");

// const {
//   uploadProductImage,
// } = require("../../http/middlewares/upload.middleware");

const {
  uploadProductImages,
} = require("../../http/middlewares/upload.middleware");

// router.post(
//   "/add",
//   uploadProductImage,
//   expressAsyncHandler(ProductController.addNewProduct)
// );
router.post(
  "/add",
  uploadProductImages,
  expressAsyncHandler(ProductController.addNewProduct)
);

router.delete(
  "/remove/:id",
  expressAsyncHandler(ProductController.removeProduct)
);

// router.patch(
//   "/update/:id",
//   uploadProductImage,
//   expressAsyncHandler(ProductController.updateProduct)
// );
router.patch(
  "/update/:id",
  uploadProductImages,
  expressAsyncHandler(ProductController.updateProduct)
);

router.patch(
  "/change-discount/:id",
  expressAsyncHandler(ProductController.changeProductDiscountStatus)
);

module.exports = {
  productsAdminRoutes: router,
};
