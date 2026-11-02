const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        totalSales: {
            type: Number,
            default: 0
        },
        
        processedSales:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Sale"
            }
        ],

        totalRevenue: {
            type: Number,
            default: 0
        },

        totalOrders: {
            type: Number,
            default: 0
        },

        topProducts: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product"
                },

                quantitySold: {
                    type: Number,
                    default: 0
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

// Index for fast queries
analyticsSchema.index({ organizationId: 1, date: -1 });

const analyticsModel = mongoose.model("Analytics", analyticsSchema);

module.exports = analyticsModel;