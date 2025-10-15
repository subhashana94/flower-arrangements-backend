import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
    },
    contact_number: {
        type: String,
        required: true,
    },
    email_address: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    user_image: {
        type: String,
        default: null,
    },
    refresh_token: {
        type: String,
        default: null,
    }
},{
    timestamps: true
})

export default mongoose.model('User', UserSchema);
