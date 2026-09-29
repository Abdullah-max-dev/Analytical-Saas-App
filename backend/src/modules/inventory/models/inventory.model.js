const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
{
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    lowStockLimit: {
        type: Number,
        default: 10
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
},
{
    timestamps: true
});

// Index
inventorySchema.index({
    organizationId: 1,
    productId: 1
});

const inventoryModel = mongoose.model('inventories', inventorySchema);

module.exports = inventoryModel;