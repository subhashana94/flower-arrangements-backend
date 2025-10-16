import express from 'express';
import {authenticateToken, isAdmin, isUser} from "../middleware/authMiddleware.js";
import {createEvent, deleteEvent, searchEvent, updateEvent} from "../controller/EventController.js";

const router = express.Router();

router.post("/create", authenticateToken, isAdmin, createEvent);
router.get("/search-event", authenticateToken, searchEvent);
router.put("/update/:id", authenticateToken, isAdmin, updateEvent);
router.delete("/delete/:id", authenticateToken, isAdmin, deleteEvent);

export default {
    path: '/event',
    router: router
};
