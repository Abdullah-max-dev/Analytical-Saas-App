const express = require("express");
const salesRoute = express.Router();

const authMiddleware = require("../../auth/middlewares/authMiddleware");
const validate = require("../../../middlewares/validateMiddleware");
const { createSaleValidation } = require("../validation/salesValidation");

const {
    createSaleController,
    getSalesController,
    getSaleController
} = require("../controllers/salesController");

salesRoute.post("/", authMiddleware, validate(createSaleValidation), createSaleController);
salesRoute.get("/", authMiddleware, getSalesController);
salesRoute.get("/:saleId", authMiddleware, getSaleController);

module.exports = salesRoute;