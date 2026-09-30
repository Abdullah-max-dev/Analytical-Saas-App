const mongoose = require("mongoose");


const saleSchema = new mongoose.Schema(
{
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
        required: true
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },

            quantity: {
                type: Number,
                min: 1,
                required: true
            },

            price: {
                type: Number,
                required: true
            },

            total: {
                type: Number,
                required: true
            }
        }
    ],

    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    saleDate: {
        type: Date,
        default: Date.now
    }
},
{
    timestamps: true
});


saleSchema.index({
    organizationId: 1,
    saleDate: -1
});

saleSchema.index({
    organizationId: 1,
    "items.productId": 1
});


const saleModel = mongoose.model( "Sale", saleSchema );

module.exports = saleModel;