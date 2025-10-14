import express from 'express';
import {authenticateToken, isAdmin} from "../middleware/authMiddleware.js";
import {registerEmployee} from "../controller/EmployerController.js";

const router = express.Router();

router.post("/register", authenticateToken, isAdmin, registerEmployee);

export default {
    path: '/employee',
    router: router
};
