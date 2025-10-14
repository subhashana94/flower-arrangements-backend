import express from 'express';
import {authenticateToken, isAdmin} from "../middleware/authMiddleware.js";
import {registerEmployee, searchEmployee, updateEmployee} from "../controller/EmployerController.js";

const router = express.Router();

router.post("/register", authenticateToken, isAdmin, registerEmployee);
router.get("/search-employee", authenticateToken, isAdmin, searchEmployee);
router.put("/update/:id", authenticateToken, isAdmin, updateEmployee);

export default {
    path: '/employee',
    router: router
};
