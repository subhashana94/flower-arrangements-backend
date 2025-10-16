import Event from "../model/EventModel.js";
import Package from "../model/PackageModel.js";
import {
    deleteImage,
    deleteImageFolder,
    getFolderPathFromImages,
    saveMultipleImagesInCustomFolder
} from "../utils/ImageHandler.js";
import mongoose from "mongoose";

// CREATE EVENT
export const createEvent = async (req, res) => {
    try {
        const {
            event_title,
            event_subtitle,
            short_description,
            date_time,
            location,
            status,
            images,
            special_requirements,
            arrangement_crew,
            package_id
        } = req.body;

        if (!event_title || event_title.trim().length === 0) {
            return res.status(400).json({
                message: "Event title is required!",
                success: false
            });
        }

        if (!event_subtitle || event_subtitle.trim().length === 0) {
            return res.status(400).json({
                message: "Event subtitle is required!",
                success: false
            });
        }

        if (!date_time) {
            return res.status(400).json({
                message: "Date and time is required!",
                success: false
            });
        }

        const eventDate = new Date(date_time);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format!",
                success: false
            });
        }

        if (!location || location.trim().length === 0) {
            return res.status(400).json({
                message: "Location is required!",
                success: false
            });
        }

        if (!arrangement_crew || arrangement_crew.trim().length === 0) {
            return res.status(400).json({
                message: "Arrangement crew is required!",
                success: false
            });
        }

        if (!package_id || package_id.trim().length === 0) {
            return res.status(400).json({
                message: "Package is required!",
                success: false
            });
        }

        if (!mongoose.Types.ObjectId.isValid(package_id)) {
            return res.status(400).json({
                message: "Invalid package ID!",
                success: false
            });
        }

        const packageExists = await Package.findById(package_id);
        if (!packageExists) {
            return res.status(404).json({
                message: "Package not found!",
                success: false
            });
        }

        if (status && !['UPCOMING', 'COMPLETED', 'CANCELED'].includes(status)) {
            return res.status(400).json({
                message: "Invalid status! Must be 'upcoming', 'completed', or 'canceled'",
                success: false
            });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                message: "At least one event image is required!",
                success: false
            });
        }

        const eventExist = await Event.findOne({
            event_title: event_title.trim(),
            date_time: eventDate,
            location: location.trim(),
        });

        if (eventExist) {
            return res.status(400).json({
                message: "Event with same title, date, and location already exists!",
                success: false
            });
        }

        const dateString = eventDate.toISOString().split('T')[0]; // 2024-12-15
        const customFolderName = `${event_title.trim()}-${dateString}`;

        let imagePaths = [];
        try {
            imagePaths = await saveMultipleImagesInCustomFolder(
                images,
                'events',
                customFolderName
            );
        } catch (error) {
            return res.status(400).json({
                message: "Error uploading images!",
                success: false,
                error: error.message
            });
        }

        const newEvent = new Event({
            event_title: event_title.trim(),
            event_subtitle: event_subtitle.trim(),
            short_description: short_description ? short_description.trim() : undefined,
            date_time: eventDate,
            location: location.trim(),
            status: status ? status.trim() : 'completed',
            images: imagePaths,
            special_requirements: special_requirements ? special_requirements.trim() : undefined,
            arrangement_crew: arrangement_crew.trim(),
            package_id: package_id,
        });

        await newEvent.save();

        return res.status(201).json({
            success: true,
            message: "Event successfully created!",
            event: {
                id: newEvent._id,
                event_title: newEvent.event_title,
                event_subtitle: newEvent.event_subtitle,
                short_description: newEvent.short_description,
                date_time: newEvent.date_time,
                location: newEvent.location,
                status: newEvent.status,
                images: newEvent.images,
                images_count: newEvent.images.length,
                special_requirements: newEvent.special_requirements,
                arrangement_crew: newEvent.arrangement_crew,
                package_id: newEvent.package_id,
                createdAt: newEvent.createdAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Event creation failed!",
            error: error.message,
        });
    }
}

// SEARCH EVENT
export const searchEvent = async (req, res) => {
    try {
        const { search } = req.query;

        const sanitizedSearch = search ? search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

        let query = {};
        if (sanitizedSearch) {
            const dateSearch = new Date(sanitizedSearch);
            const isValidDate = !isNaN(dateSearch.getTime());

            query = {
                $or: [
                    { event_title: { $regex: sanitizedSearch, $options: 'i' } },
                    { event_subtitle: { $regex: sanitizedSearch, $options: 'i' } },
                    { location: { $regex: sanitizedSearch, $options: 'i' } },
                    { status: { $regex: sanitizedSearch, $options: 'i' } },
                    { arrangement_crew: { $regex: sanitizedSearch, $options: 'i' } }
                ]
            };

            if (isValidDate) {
                query.$or.push({
                    date_time: {
                        $gte: new Date(dateSearch.setHours(0, 0, 0, 0)),
                        $lte: new Date(dateSearch.setHours(23, 59, 59, 999))
                    }
                });
            }
        }

        const events = await Event.find(query)
            .select('-__v')
            .populate('package_id', 'package_name price')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: events.length,
            search_term: sanitizedSearch || null,
            events: events
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching events!",
            error: error.message
        });
    }
};

// UPDATE EVENT
export const updateEvent = async (req, res) => {
    try {
        const {
            event_title,
            event_subtitle,
            short_description,
            date_time,
            location,
            status,
            images,
            special_requirements,
            arrangement_crew,
            package_id
        } = req.body;

        const {id} = req.params;

        const existingEvent = await Event.findById(id);

        if (!existingEvent) {
            return res.status(404).json({
                message: "Event not found!",
                success: false
            });
        }

        if (!event_title || event_title.trim().length === 0) {
            return res.status(400).json({
                message: "Event title is required!",
                success: false
            });
        }

        if (!event_subtitle || event_subtitle.trim().length === 0) {
            return res.status(400).json({
                message: "Event subtitle is required!",
                success: false
            });
        }

        if (!date_time) {
            return res.status(400).json({
                message: "Date and time is required!",
                success: false
            });
        }

        const eventDate = new Date(date_time);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format!",
                success: false
            });
        }

        if (!location || location.trim().length === 0) {
            return res.status(400).json({
                message: "Location is required!",
                success: false
            });
        }

        if (!arrangement_crew || arrangement_crew.trim().length === 0) {
            return res.status(400).json({
                message: "Arrangement crew is required!",
                success: false
            });
        }

        if (!package_id || package_id.trim().length === 0) {
            return res.status(400).json({
                message: "Package is required!",
                success: false
            });
        }

        if (!mongoose.Types.ObjectId.isValid(package_id)) {
            return res.status(400).json({
                message: "Invalid package ID!",
                success: false
            });
        }

        const packageExists = await Package.findById(package_id);
        if (!packageExists) {
            return res.status(404).json({
                message: "Package not found!",
                success: false
            });
        }

        if (status && !['UPCOMING', 'COMPLETED', 'CANCELED'].includes(status)) {
            return res.status(400).json({
                message: "Invalid status! Must be 'UPCOMING', 'COMPLETED', or 'CANCELED'",
                success: false
            });
        }

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                message: "At least one event image is required!",
                success: false
            });
        }

        const eventExist = await Event.findOne({
            event_title: event_title.trim(),
            date_time: eventDate,
            location: location.trim(),
            _id: {$ne: id}
        });

        if (eventExist) {
            return res.status(400).json({
                message: "Event with same title, date, and location already exists!",
                success: false
            });
        }

        if (existingEvent.images && existingEvent.images.length > 0) {
            const oldFolderPath = getFolderPathFromImages(existingEvent.images);
            if (oldFolderPath) {
                deleteImageFolder(oldFolderPath);
            }
        }

        const dateString = eventDate.toISOString().split('T')[0]; // 2024-12-15
        const customFolderName = `${event_title.trim()}-${dateString}`;

        let imagePaths = [];
        try {
            imagePaths = await saveMultipleImagesInCustomFolder(
                images,
                'events',
                customFolderName
            );
        } catch (error) {
            return res.status(400).json({
                message: "Error uploading images!",
                success: false,
                error: error.message
            });
        }

        const updateData = {
            event_title: event_title.trim(),
            event_subtitle: event_subtitle.trim().toUpperCase(),
            short_description: short_description ? short_description.trim() : undefined,
            date_time: eventDate,
            location: location.trim(),
            status: status ? status.trim().toUpperCase() : 'COMPLETED',
            images: imagePaths,
            special_requirements: special_requirements ? special_requirements.trim() : undefined,
            arrangement_crew: arrangement_crew.trim(),
            package_id: package_id,
        };

        const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {new: true});

        return res.status(200).json({
            success: true,
            message: "Event successfully updated!",
            event: {
                id: updatedEvent._id,
                event_title: updatedEvent.event_title,
                event_subtitle: updatedEvent.event_subtitle,
                short_description: updatedEvent.short_description,
                date_time: updatedEvent.date_time,
                location: updatedEvent.location,
                status: updatedEvent.status,
                images: updatedEvent.images,
                images_count: updatedEvent.images.length,
                special_requirements: updatedEvent.special_requirements,
                arrangement_crew: updatedEvent.arrangement_crew,
                package_id: updatedEvent.package_id,
                createdAt: updatedEvent.createdAt,
                updatedAt: updatedEvent.updatedAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating event!",
            error: error.message
        });
    }
}

// DELETE EVENT
export const deleteEvent = async (req, res) => {
    try {
        const {id} = req.params;

        const existingEvent = await Event.findById(id);

        if (!existingEvent) {
            return res.status(404).json({
                message: "Event not found!",
                success: false
            });
        }

        await Event.findByIdAndDelete(id);

        if (existingEvent.user_image) {
            deleteImage(existingEvent.user_image);
        }

        return res.status(200).json({
            message: `${existingEvent.event_title} - ${existingEvent.event_subtitle} successfully deleted!`,
            success: true,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error deleting event!",
            success: false,
            error: error.message
        });
    }
};

