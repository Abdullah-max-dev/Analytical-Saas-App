const express = require("express");

const inventoryRouter = express.Router();

const authMiddleware = require("../../auth/middlewares/authMiddleware");

const validate = require("../../../middlewares/validateMiddleware");
const { updateInventoryValidation } = require("../validations/inventoryValidation");

const {
  getAllInventoryController,
  getInventoryController,
  updateInventoryController
} = require("../controllers/inventoryController");

inventoryRouter.get("/", authMiddleware, getAllInventoryController);

inventoryRouter.get("/:organizationId/:productId", authMiddleware, getInventoryController);

inventoryRouter.patch("/:productId", authMiddleware, validate(updateInventoryValidation), updateInventoryController);

module.exports = inventoryRouter;