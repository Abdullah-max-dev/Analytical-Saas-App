const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {redisClient} = require("../../../config/redis.config");

const userModel = require("../../users/models/user.model");
const tenantModel = require("../../tenant/models/tenant.model");
const sessionModel = require("../models/session.model");

const registerUser = async ({
    username,
    name,
    email,
    password,
    organizationName
}) => {

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
        const error = new Error("User with this email already exists");
        error.statusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const slug = organizationName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

    // 1. Create user
    const user = await userModel.create({
        username,
        name,
        email,
        password: hashedPassword
    });

    // 2. Create tenant
    const tenant = await tenantModel.create({
        name: organizationName,
        slug,
        owner: user._id
    });

    // 3. Add organization to user
    user.organizations.push({
        organizationId: tenant._id,
        role: "owner"
    });

    await user.save();

    return {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        organization: {
            id: tenant._id,
            name: tenant.name,
            role: "owner"
        }
    };
};


const loginUser = async ({
    email,
    password,
    ip,
    userAgent
}) => {

    // 1. Find user
    const user = await userModel.findOne({ email });

    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // 2. Check password
    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // 3. Check user status
    if (!user.isActive) {
        const error = new Error("User account is inactive");
        error.statusCode = 403;
        throw error;
    }

    // 4. Check organization
    if (!user.organizations.length) {
        const error = new Error("User has no organization");
        error.statusCode = 403;
        throw error;
    }

    const organization = user.organizations[0];
//     console.log("USER ORGANIZATIONS:", user.organizations);
// console.log("ORGANIZATION:", organization);
// console.log("ORGANIZATION ID:", organization.organizationId);


    // 5. Create session
    // new() use kar rahe hain taake session._id
    // save se pehle hi available ho jaye
    const session = new sessionModel({
        userId: user._id,
        activeOrganizationId: organization.organizationId,
        ip,
        userAgent,
        expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
        revoked: false
    });

    // 6. Create refresh token
    const refreshToken = jwt.sign(
        {
            id: user._id,
            sessionId: session._id
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
        }
    );

    // 7. Hash refresh token
    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    // 8. Save refresh token hash in session
    session.refreshTokenHash = refreshTokenHash;

    // 9. Save session
    await session.save();

    // 10. Create access token
    const accessToken = jwt.sign(
        {
            id: user._id,
            sessionId: session._id
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m"
        }
    );

    // 11. Return login data
    return {
        user: {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            organization: {
                id: organization.organizationId,
                role: organization.role
            }
        },
        accessToken,
        refreshToken
    };
};


const logoutUser = async ({ userId, sessionId }) => {

    const session = await sessionModel.findOneAndUpdate(
        {
            _id: sessionId,
            userId,
            revoked: false
        },
        {
            revoked: true
        },
        {
            new: true
        }
    );

    if (!session) {
        const error = new Error(
            "Session not found or already logged out"
        );

        error.statusCode = 401;
        throw error;
    }

    return {
        message: "Logout successful"
    };
};

const refreshAccessToken = async ({ refreshToken }) => {

    if (!refreshToken) {
        const error = new Error("Refresh token is required");
        error.statusCode = 401;
        throw error;
    }

    // 1. Refresh token verify karo
    const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
    );

    if (!decoded.id || !decoded.sessionId) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
    }

    // 2. Refresh token ka hash banao
    const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    // 3. Session MongoDB se find karo
    const session = await sessionModel.findOne({
        _id: decoded.sessionId,
        userId: decoded.id,
        refreshTokenHash,
        revoked: false
    });

    if (!session) {
        const error = new Error(
            "Refresh token is invalid or revoked"
        );

        error.statusCode = 401;
        throw error;
    }

    // 4. Session expiry check
    if (session.expiresAt <= new Date()) {
        const error = new Error("Refresh session has expired");
        error.statusCode = 401;
        throw error;
    }

    // 5. New access token generate karo
    const accessToken = jwt.sign(
        {
            id: decoded.id,
            sessionId: decoded.sessionId
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m"
        }
    );

    return {
        accessToken
    };
};

const logoutAllDevices = async ({ userId }) => {

    // 1. User ki tamam active sessions find karo
    const sessions = await sessionModel.find({
        userId,
        revoked: false
    }).select("_id");

    // 2. MongoDB mein tamam sessions revoke karo
    await sessionModel.updateMany(
        {
            userId,
            revoked: false
        },
        {
            $set: {
                revoked: true
            }
        }
    );

    // 3. Redis se har session ki refresh-token key delete karo
    await Promise.all(
        sessions.map((session) =>
            redisClient.del(
                `refreshAccessToken:${session._id}`
            )
        )
    );

    return {
        message: "Logged out from all devices successfully",
        revokedSessions: sessions.length
    };
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    logoutAllDevices
};