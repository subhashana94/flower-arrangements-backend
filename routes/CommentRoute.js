import express from 'express';
import {authenticateToken, isAdmin, isUser} from "../middleware/authMiddleware.js";
import {createComment} from "../controller/CommentController.js";

const router = express.Router();

router.post("/create", authenticateToken, isUser, createComment);

export default {
    path: '/comment',
    router: router
};
