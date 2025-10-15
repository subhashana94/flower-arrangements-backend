import express from 'express';
import User from "../model/UserModel.js";
import { createRefreshTokenController, createLogoutController } from "../service/AuthService.js";
import {authenticateToken, isAdmin, isUser} from "../middleware/authMiddleware.js";
import {deleteUser, loginUser, registerUser, searchUser, updateUser, viewUser} from "../controller/UserController.js";

const router = express.Router();

const buildUserTokenPayload = (user) => ({
    id: user._id,
    email: user.email_address,
    role: 'user'
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", createRefreshTokenController(User, 'refresh_token', buildUserTokenPayload));
router.post("/logout", authenticateToken, createLogoutController(User, 'refresh_token'));
router.get("/profile", authenticateToken, isUser, viewUser);
router.get("/search-user", authenticateToken, isAdmin, searchUser);
router.put("/update", authenticateToken, isUser, updateUser);
router.delete("/delete", authenticateToken, isUser, deleteUser);

export default {
    path: '/user',
    router: router
};
