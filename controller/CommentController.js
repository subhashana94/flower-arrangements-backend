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

// SEARCH COMMENT
export const searchComment = async (req, res) => {
    try {
        const { search } = req.query;

        const sanitizedSearch = search ? search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

        const comments = await Comments.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user_info'
                }
            },
            {
                $lookup: {
                    from: 'events',
                    localField: 'event_id',
                    foreignField: '_id',
                    as: 'event_info'
                }
            },
            {
                $unwind: {
                    path: '$user_info',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$event_info',
                    preserveNullAndEmptyArrays: true
                }
            },
            ...(sanitizedSearch ? [{
                $match: {
                    $or: [
                        { comment: { $regex: sanitizedSearch, $options: 'i' } },
                        { 'user_info.full_name': { $regex: sanitizedSearch, $options: 'i' } },
                        { 'event_info.event_title': { $regex: sanitizedSearch, $options: 'i' } }
                    ]
                }
            }] : []),
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    _id: 1,
                    comment: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    user_id: {
                        _id: '$user_info._id',
                        full_name: '$user_info.full_name',
                        email_address: '$user_info.email_address',
                        user_image: '$user_info.user_image'
                    },
                    event_id: {
                        _id: '$event_info._id',
                        event_title: '$event_info.event_title',
                        event_subtitle: '$event_info.event_subtitle',
                        date_time: '$event_info.date_time',
                        location: '$event_info.location',
                        status: '$event_info.status'
                    }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            count: comments.length,
            search_term: sanitizedSearch || null,
            comments: comments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching comments!",
            error: error.message
        });
    }
};

// UPDATE COMMENT
export const updateComment = async (req, res) => {
    try {
        const { comment } = req.body;
        const { id } = req.params;
        const userId = req.user.id;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                message: "Comment is required!",
                success: false
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment ID format!",
                success: false
            });
        }

        const existingComment = await Comments.findById(id);

        if (!existingComment) {
            return res.status(404).json({
                message: "Comment not found!",
                success: false
            });
        }

        if (existingComment.user_id.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to update this comment!",
                success: false
            });
        }

        const updateData = {
            comment: comment.trim()
        };

        const updatedComment = await Comments.findByIdAndUpdate( id, updateData, { new: true } )
            .populate('user_id', 'full_name email_address user_image')
            .populate('event_id', 'event_title event_subtitle date_time location status');

        return res.status(200).json({
            success: true,
            message: "Comment successfully updated!",
            comment: {
                id: updatedComment._id,
                comment: updatedComment.comment,
                user_id: updatedComment.user_id,
                event_id: updatedComment.event_id,
                createdAt: updatedComment.createdAt,
                updatedAt: updatedComment.updatedAt,
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating comment!",
            error: error.message,
        });
    }
}

// DELETE COMMENT BY USER
export const deleteCommentUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment ID format!",
                success: false
            });
        }

        const existingComment = await Comments.findById(id);

        if (!existingComment) {
            return res.status(404).json({
                message: "Comment not found!",
                success: false
            });
        }

        if (existingComment.user_id.toString() !== userId) {
            return res.status(403).json({
                message: "You can only delete your own comments!",
                success: false
            });
        }

        await Comments.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Comment successfully deleted!",
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error deleting comment!",
            success: false,
            error: error.message
        });
    }
}

// DELETE COMMENT BY ADMIN
export const deleteCommentAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment ID format!",
                success: false
            });
        }

        const existingComment = await Comments.findById(id);

        if (!existingComment) {
            return res.status(404).json({
                message: "Comment not found!",
                success: false
            });
        }

        await Comments.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Comment successfully deleted!",
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error deleting comment!",
            success: false,
            error: error.message
        });
    }
}

