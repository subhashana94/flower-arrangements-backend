import express from 'express';
import {authenticateToken, isAdmin} from "../middleware/authMiddleware.js";
import {viewEmployeeHistory} from "../controller/EmployerHistoryController.js";

const router = express.Router();

router.get("/employee-history", authenticateToken, isAdmin, viewEmployeeHistory);

export default {
    path: '/history',
    router: router
};
