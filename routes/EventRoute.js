import express from 'express';
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import {createEvent} from "../controller/EventController.js";

const router = express.Router();

router.post("/create", authenticateToken, isAdmin, createEvent);

export default {
    path: '/event',
    router: router
};
