import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
    subject: {
        type: String,
    },
    body: {
        type: String,
        required: true,
    },
    sent_at: {
        type: Date,
        default: Date.now,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
},{
    timestamps: true
})
