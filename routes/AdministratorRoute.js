import express from 'express';
import Admin from "../model/AdminModel.js";
import {
    deleteAdministrator,
    loginAdministrator,
    registerAdministrator,
    updateAdministrator,
    viewAdministrator,
} from "../controller/AdminController.js";
import {createRefreshTokenController, createLogoutController} from "../service/AuthService.js";
import {authenticateToken, isAdmin} from "../middleware/authMiddleware.js";

const router = express.Router();

const buildAdminTokenPayload = (admin) => ({
    id: admin._id,
    email: admin.email_address,
    role: 'admin'
});

router.post("/refresh-token", createRefreshTokenController(
    Admin,
    'refresh_token',
    buildAdminTokenPayload
));

router.post("/register", authenticateToken, isAdmin, registerAdministrator);
router.post("/login", loginAdministrator);
router.post("/logout", createLogoutController(Admin, 'refresh_token'));
router.get("/profile", authenticateToken, isAdmin, viewAdministrator);
router.put("/update/:id", authenticateToken, isAdmin, updateAdministrator);
router.delete("/delete/:id", authenticateToken, isAdmin, deleteAdministrator);

export default {
    path: '/admin',
    router: router
};
