const express = require("express");

const authRoute = express.Router();

const authController = require("../controllers/authController");
const { registerValidation, loginValidation } = require("../validations/authValidation");
const validate = require("../../../middlewares/validateMiddleware");
const authMiddleware = require("../middlewares/authmiddleware");

authRoute.post("/register", validate(registerValidation), authController.registerController);
authRoute.post("/login", validate(loginValidation), authController.loginController);
authRoute.post("/logout", authMiddleware, authController.logoutController);
authRoute.post( "/logout-all", authMiddleware, authController.logoutAllDevicesController);

module.exports = authRoute;