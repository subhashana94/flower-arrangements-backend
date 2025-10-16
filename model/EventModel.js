import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    event_title: {
        type: String,
        required: true,
    },
    event_subtitle: {
        type: String,
        enum: ['WEDDING CEREMONY', 'ENGAGEMENT CEREMONY', 'BIRTHDAY PARTY', 'PRIVATE PARTY', 'RELIGION CEREMONY', 'OTHERS'],
        required: true,
    },
    short_description: {
        type: String,
    },
    date_time: {
        type: Date,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['UPCOMING', 'COMPLETED', 'CANCELED'],
        default: 'COMPLETED',
    },
    images: {
        type: [String],
        required: true,
    },
    special_requirements: {
        type: String,
    },
    arrangement_crew: {
        type: String,
        required: true,
    },
    package_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
        required: true,
    }
},{
    timestamps: true
});

export default mongoose.model('Event', eventSchema);
