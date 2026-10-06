const jwt = require("jsonwebtoken");

const userModel = require("../../users/models/user.model");
const sessionModel = require("../models/session.model");

const authMiddleware = async (req, res, next) => {
    try {

        // 1. Access token get karo
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        const accessToken = authHeader.split(" ")[1];

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "Access token is required"
            });
        }

        // 2. JWT verify karo
        const decoded = jwt.verify(
            accessToken,
            process.env.JWT_ACCESS_SECRET
        );

        if (!decoded.id || !decoded.sessionId) {
            return res.status(401).json({
                success: false,
                message: "Invalid access token payload"
            });
        }
        // console.log("Decoded Token:", decoded);
        // const sessionById = await sessionModel.findById(decoded.sessionId);

        // console.log("SESSION BY ID:", sessionById);
        // 3. Session check karo
        const session = await sessionModel.findOne({
            _id: decoded.sessionId,
            userId: decoded.id,
            revoked: false
        });
        // console.log("Session Found:", session);

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Session is invalid or revoked"
            });
        }

        // 4. Session expiry check
        if (session.expiresAt <= new Date()) {
            return res.status(401).json({
                success: false,
                message: "Session has expired"
            });
        }

        // 5. User check karo
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        // 6. Request mein authentication data save karo
        req.user = user;
        req.session = session;
        req.organizationId = session.activeOrganizationId;

        // console.log("AUTH USER:", req.user._id);
        // console.log("AUTH SESSION:", req.session._id);

        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token has expired"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid access token"
            });
        }

        console.error("Auth Middleware Error:", error);

        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

module.exports = authMiddleware;