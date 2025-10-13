import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtHelper.js';

/**
 * Generic login with JWT tokens
 */
export const loginWithToken = async (
    Model,
    emailFieldName,
    emailValue,
    passwordFieldName,
    passwordValue,
    refreshTokenFieldName,
    buildTokenPayload
) => {
    try {
        const query = {};
        query[emailFieldName] = emailValue.trim().toLowerCase();

        const user = await Model.findOne(query);

        if (!user) {
            return {
                success: false,
                status: 404,
                message: "Account not found!"
            };
        }

        const isPasswordValid = await bcrypt.compare(passwordValue, user[passwordFieldName]);

        if (!isPasswordValid) {
            return {
                success: false,
                status: 401,
                message: "Invalid password!"
            };
        }

        const tokenPayload = buildTokenPayload(user);

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        user[refreshTokenFieldName] = refreshToken;
        await user.save();

        return {
            success: true,
            status: 200,
            message: "Login successful!",
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: user
        };

    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Login failed!",
            error: error.message
        };
    }
};

/**
 * Generic refresh token service
 */
export const refreshTokenService = async (
    Model,
    refreshTokenFieldName,
    refreshTokenValue,
    buildTokenPayload
) => {
    try {
        if (!refreshTokenValue) {
            return {
                success: false,
                status: 400,
                message: "Refresh token is required!"
            };
        }

        const decoded = verifyRefreshToken(refreshTokenValue);

        const user = await Model.findById(decoded.id);

        if (!user || user[refreshTokenFieldName] !== refreshTokenValue) {
            return {
                success: false,
                status: 403,
                message: "Invalid refresh token!"
            };
        }

        const tokenPayload = buildTokenPayload(user);

        const newAccessToken = generateAccessToken(tokenPayload);

        return {
            success: true,
            status: 200,
            message: "Access token refreshed!",
            accessToken: newAccessToken
        };

    } catch (error) {
        return {
            success: false,
            status: 403,
            message: "Invalid or expired refresh token!",
            error: error.message
        };
    }
};

/**
 * Generic logout service
 */
export const logoutService = async (
    Model,
    refreshTokenFieldName,
    refreshTokenValue
) => {
    try {
        if (!refreshTokenValue) {
            return {
                success: false,
                status: 400,
                message: "Refresh token is required!"
            };
        }

        const query = {};
        query[refreshTokenFieldName] = refreshTokenValue;

        const user = await Model.findOne(query);

        if (user) {
            user[refreshTokenFieldName] = null;
            await user.save();
        }

        return {
            success: true,
            status: 200,
            message: "Logged out successfully!"
        };

    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Logout failed!",
            error: error.message
        };
    }
};

/**
 * Hash password
 */
export const hashPassword = async (password, saltRounds = 10) => {
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
};

// ===== CONTROLLER FACTORIES =====

/**
 * Create a reusable refresh token controller
 * Returns an Express middleware function
 */
export const createRefreshTokenController = (Model, refreshTokenFieldName, buildTokenPayload) => {
    return async (req, res) => {
        const { refreshToken } = req.body;

        const result = await refreshTokenService(
            Model,
            refreshTokenFieldName,
            refreshToken,
            buildTokenPayload
        );

        return res.status(result.status).json({
            success: result.success,
            message: result.message,
            accessToken: result.accessToken,
            error: result.error
        });
    };
};

/**
 * Create a reusable logout controller
 * Returns an Express middleware function
 */
export const createLogoutController = (Model, refreshTokenFieldName) => {
    return async (req, res) => {
        const { refreshToken } = req.body;

        const result = await logoutService(
            Model,
            refreshTokenFieldName,
            refreshToken
        );

        return res.status(result.status).json({
            success: result.success,
            message: result.message,
            error: result.error
        });
    };
};
