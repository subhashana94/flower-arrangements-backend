import express from 'express';
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import {createPackage, deletePackage, updatePackage, viewPackages} from "../controller/PackageController.js";

const router = express.Router();

router.post("/create", authenticateToken, isAdmin, createPackage);
router.get("/view-packages", authenticateToken, isAdmin, viewPackages);
router.put("/update/:id", authenticateToken, isAdmin, updatePackage);
router.delete("/delete/:id", authenticateToken, isAdmin, deletePackage);

export default {
    path: '/package',
    router: router
};
