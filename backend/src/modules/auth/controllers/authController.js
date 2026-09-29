const authService = require("../services/authService");
const authValidation  = require("../validations/authValidation");

const registerController = async (req, res, next) => {
    try {

        const { error } = authValidation.registerValidation.validate(req.body);

        if (error) {
            const validationError = new Error(
                error.details[0].message
            );

            validationError.statusCode = 400;

            return next(validationError);
        }

        const result = await authService.registerUser(req.body);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
};

const loginController = async (req, res, next) => {
    try {

        const { error } = authValidation.loginValidation.validate(req.body);

        if (error) {
            const validationError = new Error(
                error.details[0].message
            );

            validationError.statusCode = 400;

            return next(validationError);
        }

        const result = await authService.loginUser({
            email: req.body.email,
            password: req.body.password,
            ip: req.ip,
            userAgent: req.get("User-Agent")
        });

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: result.user,
                accessToken: result.accessToken
            }
        });

    } catch (error) {
        next(error);
    }
};

const logoutController = async (req, res, next) => {
    try {

        const accessToken = req.headers.authorization?.split(" ")[1];

        await authService.logoutUser({
            userId: req.user._id,
            sessionId: req.session._id,
            accessToken
        });

        res.clearCookie("refreshToken");

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {
        next(error);
    }
};

const refreshTokenController = async (req, res, next) => {
    try {

        const refreshToken = req.cookies.refreshToken;

        const result = await authService.refreshAccessToken({
            refreshToken
        });

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            data: {
                accessToken: result.accessToken
            }
        });

    } catch (error) {
        next(error);
    }
};

const logoutAllDevicesController = async (req, res, next) => {
    try {
        const result = await authService.logoutAllDevices({
            userId: req.user._id
        });

        // Current device ki refresh-token cookie clear karo
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: {
                revokedSessions: result.revokedSessions
            }
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    registerController,
    loginController,
    logoutController,
    refreshTokenController,
    logoutAllDevicesController
};