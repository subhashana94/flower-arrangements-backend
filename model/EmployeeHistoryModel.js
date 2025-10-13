import mongoose from "mongoose";

const employeeHistoryModelSchema = new mongoose.Schema({
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
    registered_date: {
        type: Date,
        required: true,
    },
    release_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        default: "Admin account deleted"
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    }
}, {
    timestamps: true,
});

export default mongoose.model('EmployeeHistory', employeeHistoryModelSchema);
