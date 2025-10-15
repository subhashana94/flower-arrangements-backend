import { verifyAccessToken } from '../utils/jwtHelper.js';

/**
 * Middleware to verify access token
 */
export const authenticateToken = (req, res, next) => {
    try {
        // Get token from Authorization header: "Bearer TOKEN"
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: "Access token is required!",
                success: false
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Add user info to request object
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired access token!",
            success: false,
            error: error.message
        });
    }
};

/**
 * Middleware to check if user is admin
 */
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            message: "Admin access required!",
            success: false
        });
    }
};

/**
 * Middleware to check if user is user
 */
export const isUser = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
        next();
    } else {
        return res.status(403).json({
            message: "User access required!",
            success: false
        });
    }
};
