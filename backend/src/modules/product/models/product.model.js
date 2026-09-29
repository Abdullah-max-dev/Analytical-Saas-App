const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
{
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",   // ✅ fixed (Organization → Tenant)
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        required: true
    },
    // category: {
    //     type: String,
    //     default: null
    // },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    costPrice: {
        type: Number,
        min: 0,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
},
{
    timestamps: true
});

// Compound unique index — SKU unique per organization, not globally
productSchema.index({
    organizationId: 1,
    sku: 1
}, { unique: true }); 

productSchema.index({
    organizationId: 1,
    createdAt: -1
});

const productModel = mongoose.model('Product', productSchema);

module.exports = productModel;