import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
    package_name: {
        type: String,
        required: true,
    },
    package_features: {
        type: String,
        required: true,
    },
    general_price: {
        type: Number,
        required: true,
    },
    promotional_price: {
        type: Number,
        required: true,
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Package', packageSchema);
