import express from 'express';
import {authenticateToken, isAdmin, isUser} from "../middleware/authMiddleware.js";
import {
    createComment,
    deleteCommentAdmin,
    deleteCommentUser,
    searchComment,
    updateComment
} from "../controller/CommentController.js";
import {deletePackage} from "../controller/PackageController.js";

const router = express.Router();

router.post("/create", authenticateToken, isUser, createComment);
router.get("/search-comment", authenticateToken, searchComment);
router.put("/update/:id", authenticateToken, isUser, updateComment);
router.delete("/delete/:id", authenticateToken, isUser, deleteCommentUser);
router.delete("/admin/delete/:id", authenticateToken, isAdmin, deleteCommentAdmin);

export default {
    path: '/comment',
    router: router
};
