const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { redisClient } = require("../config/redis.config");

const refreshTokenMiddleware = async (req, res, next) => {
    try {

        // 1. Cookie se refresh token lo
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        // 2. Refresh token verify karo
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        if (!decoded.id || !decoded.sessionId) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        // 3. Refresh token ka hash banao
        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // 4. Redis key
        const redisKey = `refreshAccessToken:${decoded.sessionId}`;

        // 5. Redis se stored hash lo
        const storedHash = await redisClient.get(redisKey);

        if (!storedHash) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is invalid or expired"
            });
        }

        // 6. Hash compare
        if (storedHash !== refreshTokenHash) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is invalid"
            });
        }

        // 7. Controller ke liye data save karo
        req.refreshToken = refreshToken;
        req.refreshTokenData = decoded;
        req.refreshTokenHash = refreshTokenHash;

        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Refresh token has expired"
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        console.error("Refresh Token Middleware Error:", error);

        return res.status(500).json({
            success: false,
            message: "Refresh token validation failed"
        });
    }
};

module.exports = refreshTokenMiddleware;