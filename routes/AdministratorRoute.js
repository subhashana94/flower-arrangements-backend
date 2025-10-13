import express from 'express';
import {loginAdministrator, registerAdministrator, updateAdministrator} from "../controller/AdminController.js";
import { createRefreshTokenController, createLogoutController } from "../service/AuthService.js";

import Admin from "../model/AdminModel.js";

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

router.post("/register", registerAdministrator);
router.post("/login", loginAdministrator);
router.put("/update/:id", updateAdministrator);


router.post("/logout", createLogoutController(
    Admin,
    'refresh_token'
));

export default {
    path: '/admin',
    router: router
};
