import express from 'express';
import {authenticateToken, isAdmin, isUser} from "../middleware/authMiddleware.js";
import {createComment, searchComment, updateComment} from "../controller/CommentController.js";

const router = express.Router();

router.post("/create", authenticateToken, isUser, createComment);
router.get("/search-comment", authenticateToken, searchComment);
router.put("/update/:id", authenticateToken, isUser, updateComment);

export default {
    path: '/comment',
    router: router
};
