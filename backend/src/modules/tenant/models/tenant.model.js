const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    subscription: {
        plan: {
            type: String,
            enum: ["free", "pro", "enterprise"],
            default: "free"
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    }
},
{
    timestamps: true
});


const tenantModel = mongoose.model("Tenant",tenantSchema);

module.exports = tenantModel;