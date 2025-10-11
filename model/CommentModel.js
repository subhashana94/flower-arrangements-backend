import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{
    timestamps: true
})
