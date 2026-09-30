const inventoryModel = require("../models/inventory.model");

const inventoryTransactionModel = require("../models/inventoryTransaction.model");

const productModel = require("../../product/models/product.model");

const userModel = require("../../users/models/user.model");



// Check whether user belongs to organization

const checkOrganizationAccess = async (organizationId, userId) => {

  const user = await userModel.findOne({

    _id: userId,

    "organizations.organizationId": organizationId

  });

  if (!user) {

    const error = new Error(

      "You do not have access to this organization"

    );

    error.statusCode = 403;

    throw error;

  }

  return user;

};



// GET ALL INVENTORY
const getAllInventory = async ({ userId }) => {

  const user = await userModel
    .findById(userId)
    .select("organizations");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const organizationIds = user.organizations.map(
    (organization) => organization.organizationId
  );

  const inventories = await inventoryModel
    .find({
      organizationId: {
        $in: organizationIds
      }
    })
    .populate(
      "productId",
      "name sku price"
    )
    .sort({ updatedAt: -1 });

  const inventoryData = inventories.map((inventory) => {

    const stockStatus =
      inventory.quantity <= inventory.lowStockLimit
        ? "low_stock"
        : "in_stock";

    return {
      ...inventory.toObject(),
      stockStatus
    };
  });

  return inventoryData;
};



// GET SINGLE INVENTORY

const getInventory = async ({

  userId,

  productId

}) => {

  // Check product

  const product = await productModel.findById(productId);



  if (!product) {

    const error = new Error(

      "Product not found"

    );

    error.statusCode = 404;

    throw error;

  }



  const organizationId = product.organizationId;



  // Check organization access

  await checkOrganizationAccess(

    organizationId,

    userId

  );



  // Find inventory

  const inventory = await inventoryModel

    .findOne({

      organizationId,

      productId

    })

    .populate(

      "productId",

      "name sku price"

    );



  // Inventory record doesn't exist yet

  if (!inventory) {

    return {

      product,

      inventory: {

        organizationId,

        productId,

        quantity: 0,

        lowStockLimit: 10,

        stockStatus: "low_stock"

      }

    };

  }



  const stockStatus =

    inventory.quantity <= inventory.lowStockLimit

      ? "low_stock"

      : "in_stock";



  return {

    ...inventory.toObject(),

    stockStatus

  };

};



// UPDATE INVENTORY

const mongoose = require("mongoose");

const updateInventory = async ({
  userId,
  productId,
  quantity,
  lowStockLimit
}) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check product
    const product = await productModel.findById(productId).session(session);

    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    const organizationId = product.organizationId;

    // Check organization access
    await checkOrganizationAccess(organizationId, userId);

    // Find existing inventory
    let inventory = await inventoryModel.findOne({
      organizationId,
      productId
    }).session(session);

    // Previous quantity
    // Previous quantity
const previousQuantity = inventory ? inventory.quantity : 0;

// Quantity jo user add kar raha hai
const addedQuantity = quantity;

// Final quantity
const newQuantity = previousQuantity + addedQuantity;

// Difference
const difference = newQuantity - previousQuantity;

    // Create inventory if it doesn't exist
    if (!inventory) {
      inventory = new inventoryModel({
        organizationId,
        productId,
        quantity: 0,
        lowStockLimit: 10
      });
    }

    // Update inventory
    inventory.quantity = newQuantity;

    if (lowStockLimit !== undefined) {
      inventory.lowStockLimit = lowStockLimit;
    }

    inventory.updatedBy = userId;

    await inventory.save({ session });

    // Create transaction only if quantity changed
    if (difference !== 0) {
    await inventoryTransactionModel.create(
      [{
        organizationId,
        productId,
        type: difference > 0 ? "IN" : "OUT",
        quantity: Math.abs(difference),
        previousQuantity,
        newQuantity,
        createdBy: userId
      }],
      { session }
    );
  }

    await session.commitTransaction();

    const stockStatus =
      inventory.quantity <= inventory.lowStockLimit
        ? "low_stock"
        : "in_stock";

    return {
      inventory: {
        ...inventory.toObject(),
        stockStatus
      },
      calculation: {
        previousQuantity,
        newQuantity,
        difference,
        overallQuantity: inventory.quantity
      }
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getAllInventory,
  getInventory,
  updateInventory
};