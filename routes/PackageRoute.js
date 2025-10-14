import express from 'express';
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import {createPackage} from "../controller/PackageController.js";

const router = express.Router();

router.post("/create", authenticateToken, isAdmin, createPackage);

export default {
    path: '/package',
    router: router
};
