import express from 'express';

import User from "../model/UserModel.js";

import { createRefreshTokenController, createLogoutController } from "../service/AuthService.js";
import {authenticateToken, isAdmin, isUser} from "../middleware/authMiddleware.js";
import {registerUser} from "../controller/UserController.js";

const router = express.Router();

const buildUserTokenPayload = (user) => ({
    id: user._id,
    email: user.email_address,
    role: 'user'
});

router.post("/register", registerUser);

export default {
    path: '/user',
    router: router
};
