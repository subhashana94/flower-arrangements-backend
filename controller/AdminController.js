import Admin from "../model/AdminModel.js";
import bcrypt from "bcrypt";
import {saveBase64Image} from "../utils/ImageHandler.js";

export const createAdministrator = async (req, res) => {
    try {
        const {full_name, contact_number, email_address, password, user_image} = req.body;

        if (!full_name || full_name.trim().length === 0) {
            return res.status(400).json({
                message: "Full name is required!",
                success: false,
            });
        }

        if (!contact_number || contact_number.trim().length === 0) {
            return res.status(400).json({
                message: "Contact number is required!",
                success: false,
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters!",
                success: false,
            });
        }

        if (!email_address || email_address.trim().length === 0) {
            return res.status(400).json({
                message: "Email address is required!",
                success: false,
            });
        }

        const adminExists = await Admin.findOne({
            email_address: email_address.trim().toLowerCase()
        });

        if (adminExists) {
            return res.status(400).json({
                message: "Email address already registered!",
                success: false,
            });
        }

        let imagePath = null;
        if (user_image) {
            try {
                imagePath = await saveBase64Image(user_image, 'admins');
            } catch (error) {
                return res.status(400).json({
                    message: "Error uploading image!",
                    success: false
                });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newAdministrator = new Admin({
            full_name: full_name.trim(),
            contact_number: contact_number.trim(),
            email_address: email_address.trim().toLowerCase(),
            password: hashPassword,
            user_image: imagePath,
        });

        await newAdministrator.save();

        return res.status(201).json({
            success: true,
            message: "Administrator successfully created!",
            administrator: {
                id: newAdministrator._id,
                full_name: newAdministrator.full_name,
                email_address: newAdministrator.email_address,
                contact_number: newAdministrator.contact_number,
                user_image: newAdministrator.user_image,
                createdAt: newAdministrator.createdAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Administrator registration failed!",
            error: error.message
        });
    }
}
