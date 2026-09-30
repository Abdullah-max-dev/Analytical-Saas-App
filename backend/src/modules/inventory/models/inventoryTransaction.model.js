const mongoose = require("mongoose");


/**
 * @name inventoryTransactionSchema
 * @description Inventory transaction schema to track stock changes
 */
const inventoryTransactionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    event: {
      type: String,
      enum: ["PURCHASE", "SALE"],
      required: true
    },

    quantity: {
      type: Number,
      required: true,
    },

    previousQuantity: {
      type: Number,
      required: true,
    },

    newQuantity: {
      type: Number,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


inventoryTransactionSchema.index({
  organizationId: 1,
  productId: 1,
});

const inventoryTransactionModel = mongoose.model( "InventoryTransaction", inventoryTransactionSchema );

module.exports = inventoryTransactionModel;
