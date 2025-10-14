import mongoose from "mongoose";

const employeeModelSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
    },
    permanent_address: {
        type: String,
        required: true,
    },
    contact_number: {
        type: String,
        required: true,
    },
    email_address: {
        type: String,
    },
    user_image: {
        type: String,
    },
    occupation: {
        type: String,
        default: "Decorator"
    },
    description: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

export default mongoose.model('Employee', employeeModelSchema);
