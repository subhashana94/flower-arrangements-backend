import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
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
    },
    release_date: {
        type: String,
        required: true,
    },
    registered_date: {
        type: String,
    },
    description: {
        type: String,
    }
},{
    timestamps: true,
})
