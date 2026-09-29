const express = require("express");

const tenantRouter = express.Router();

const authMiddleware = require("../../auth/middlewares/authMiddleware");

const {
    createTenantController, switchOrganizationController, updateTenantController, deleteTenantController
} = require("../controllers/tenantController");


tenantRouter.post("/", authMiddleware, createTenantController);
tenantRouter.post("/switch-organization", authMiddleware, switchOrganizationController);
tenantRouter.patch("/:slug", authMiddleware, updateTenantController);
tenantRouter.delete("/:slug", authMiddleware, deleteTenantController);

module.exports = tenantRouter;