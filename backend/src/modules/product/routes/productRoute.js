const express = require("express");

const productRouter = express.Router();

const authMiddleware = require("../../auth/middlewares/authMiddleware");

const {
    createProductController,
    getProductsController,
    getProductController,
    updateProductController,
    deleteProductController
} = require("../controllers/productController");


// CREATE PRODUCT
productRouter.post("/", authMiddleware, createProductController);


// GET ALL PRODUCTS
productRouter.get("/:organizationId", authMiddleware, getProductsController);


// GET SINGLE PRODUCT
productRouter.get("/:organizationId/:productId", authMiddleware, getProductController);


// UPDATE PRODUCT
productRouter.patch("/:organizationId/:productId", authMiddleware, updateProductController);


// DELETE PRODUCT
productRouter.delete("/:organizationId/:productId", authMiddleware, deleteProductController);


module.exports = productRouter;