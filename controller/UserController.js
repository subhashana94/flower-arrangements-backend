import User from "../model/UserModel.js";
import {saveBase64Image} from "../utils/ImageHandler.js";
import {hashPassword} from "../service/AuthService.js";

// REGISTER USER
export const registerUser = async (req, res) => {
    try {
        const {full_name, contact_number, email_address, password, user_image} = req.body;

        if (!full_name || full_name.trim().length === 0) {
            return res.status(400).json({message: "Full name is required!", success: false});
        }

        if (!contact_number || contact_number.trim().length === 0) {
            return res.status(400).json({message: "Contact number is required!", success: false});
        }

        if (!password || password.length < 6) {
            return res.status(400).json({message: "Password must be at least 6 characters!", success: false});
        }

        if (!email_address || email_address.trim().length === 0) {
            return res.status(400).json({message: "Email address is required!", success: false});
        }

        const userExists = await User.findOne({
            email_address: email_address.trim().toLowerCase()
        });

        if (userExists) {
            return res.status(400).json({message: "Email address already registered!", success: false});
        }

        let imagePath = null;
        if (user_image) {
            try {
                imagePath = await saveBase64Image(user_image, 'users');
            } catch (error) {
                return res.status(400).json({message: "Error uploading image!", success: false});
            }
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            full_name: full_name.trim(),
            contact_number: contact_number.trim(),
            email_address: email_address.trim().toLowerCase(),
            password: hashedPassword,
            user_image: imagePath,
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User successfully created!",
            user: {
                id: newUser._id,
                full_name: newUser.full_name,
                email_address: newUser.email_address,
                contact_number: newUser.contact_number,
                user_image: newUser.user_image,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User registration failed!",
            error: error.message
        });
    }
}
