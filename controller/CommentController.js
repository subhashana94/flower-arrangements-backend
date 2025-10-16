import Comments from "../model/CommentModel.js";
import Event from "../model/EventModel.js";
import mongoose from "mongoose";

// CREATE COMMENT
export const createComment = async (req, res) => {
    try {
        const {comment, event_id} = req.body;
        const id = req.user.id;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                message: "Comment is required!",
                success: false
            });
        }

        if (!event_id || event_id.trim().length === 0) {
            return res.status(400).json({
                message: "Event Id is required!",
                success: false
            });
        }

        if (!mongoose.Types.ObjectId.isValid(event_id)) {
            return res.status(400).json({
                message: "Invalid event ID format!",
                success: false
            });
        }

        const eventExists = await Event.findById(event_id);
        if (!eventExists) {
            return res.status(404).json({
                message: "Event not found!",
                success: false
            });
        }

        const newComment = new Comments({
            comment: comment.trim(),
            user_id: id,
            event_id: event_id,
        });

        await newComment.save();

        return res.status(201).json({
            success: true,
            message: "Comment successfully created!",
            comment: {
                id: newComment._id,
                comment: newComment.comment,
                user_id: newComment.user_id,
                event_id: newComment.event_id,
                createdAt: newComment.createdAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Comment creation failed!",
            error: error.message,
        });
    }
}
