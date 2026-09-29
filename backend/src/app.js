const express = require("express");
require("dotenv").config();


const app = express();
app.use(express.json());

// all routes variables
const authRoute = require("./modules/auth/routes/authRoute");
const tenantRoute = require("./modules/tenant/routes/tenantRoute");
const productRoute = require("./modules/product/routes/productRoute");
const inventoryRoute = require("./modules/inventory/routes/inventoryRoutes");

// all routes here
app.use("/api/tenant", tenantRoute);
app.use("/api/auth", authRoute);
app.use("/api/product", productRoute);
app.use("/api/inventory", inventoryRoute);

module.exports = app;