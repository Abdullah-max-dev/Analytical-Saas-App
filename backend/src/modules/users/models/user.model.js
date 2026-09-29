const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    //    Personal Info 
    username: {
        type: String,
        unique: true,
        required: [true, "Username is required"],
        trim: true,
        minlength: [3, "Username must be at least 3 characters"],
        maxlength: [30, "Username cannot exceed 30 characters"]
    },
    
    name: {
        type: String,
        trim: true,
        minlength: [3, "Name must be at least 3 characters"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"]
    },

    verified: {
        type: Boolean,
        default: false
    },

    // role: {
    //     type: String,
    //     enum: ['admin', 'owner', 'employee'],
    //     default: 'employee'
    // },
    
    permissions: {
        type: [String],
        default: []
    },

    organizations: [
        {
            organizationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tenant",
                required: true
            },

            role: {
                type: String,
                enum: [
                    "owner",
                    "admin",
                    "employee"
                ],
                default: "employee"
            }
        }
    ],

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

// ─── Indexes
// userSchema.index({ organizationId: 1, email: 1 });


const userModel = mongoose.model('User', userSchema);

module.exports = userModel;