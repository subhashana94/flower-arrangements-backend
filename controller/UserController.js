import User from "../model/UserModel.js";
import {deleteImage, saveBase64Image, updateImage} from "../utils/ImageHandler.js";
import {hashPassword, loginWithToken} from "../service/AuthService.js";

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

// LOGIN USER
export const loginUser = async (req, res) => {
    const {email_address, password} = req.body;

    if (!email_address || email_address.trim().length === 0) {
        return res.status(400).json({message: "Email address is required!", success: false});
    }

    if (!password || password.trim().length === 0) {
        return res.status(400).json({message: "Password is required!", success: false});
    }

    const buildUserTokenPayload = (user) => ({
        id: user._id,
        email: user.email_address,
        role: 'user'
    });

    const result = await loginWithToken(
        User,
        'email_address',
        email_address,
        'password',
        password,
        'refresh_token',
        buildUserTokenPayload
    );

    if (!result.success) {
        return res.status(result.status).json({
            success: result.success,
            message: result.message,
            error: result.error
        });
    }

    return res.status(result.status).json({
        success: result.success,
        message: result.message,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
            id: result.user._id,
            full_name: result.user.full_name,
            email_address: result.user.email_address,
            contact_number: result.user.contact_number,
            user_image: result.user.user_image,
            createdAt: result.user.createdAt
        }
    });
};

// VIEW USER PROFILE
export const viewUser = async (req, res) => {
    try {
        const id = req.user.id;

        const user = await User.findById(id).select('-password -__v -refresh_token');

        if (!user) {
            return res.status(404).json({
                message: "User not found!",
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                full_name: user.full_name,
                email_address: user.email_address,
                contact_number: user.contact_number,
                user_image: user.user_image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error viewing user!",
            error: error.message
        });
    }
};

// SEARCH USER
export const searchUser = async (req, res) => {
    try {
        const { search } = req.query;

        const sanitizedSearch = search ? search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

        let query = {};
        if (sanitizedSearch) {
            query = {
                $or: [
                    { full_name: { $regex: sanitizedSearch, $options: 'i' } },
                    { contact_number: { $regex: sanitizedSearch, $options: 'i' } },
                    { email_address: { $regex: sanitizedSearch, $options: 'i' } }
                ]
            };
        }

        const totalUsers = await User.countDocuments(query);

        const users = await User.find(query)
            .select('-password -refresh_token -__v')
            .sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            count: users.length,
            total: totalUsers,
            search_term: sanitizedSearch || null,
            users: users
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching users!",
            error: error.message
        });
    }
}

// UPDATE USER
export const updateUser = async (req, res) => {
    try {
        const {full_name, contact_number, email_address, password, user_image} = req.body;

        const id = req.user.id;

        const existingUser = await User.findById(id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found!",
                success: false
            });
        }

        const updateData = {};

        if (full_name !== undefined) {
            if (!full_name || full_name.trim().length === 0) {
                return res.status(400).json({
                    message: "Full name cannot be empty!",
                    success: false
                });
            }
            updateData.full_name = full_name.trim();
        }

        if (contact_number !== undefined) {
            if (!contact_number || contact_number.trim().length === 0) {
                return res.status(400).json({
                    message: "Contact number cannot be empty!",
                    success: false
                });
            }
            updateData.contact_number = contact_number.trim();
        }

        if (email_address !== undefined) {
            if (!email_address || email_address.trim().length === 0) {
                return res.status(400).json({
                    message: "Email address cannot be empty!",
                    success: false
                });
            }

            if (email_address.trim().toLowerCase() !== existingUser.email_address) {
                const emailExists = await User.findOne({
                    email_address: email_address.trim().toLowerCase(),
                    _id: {$ne: id}
                });

                if (emailExists) {
                    return res.status(400).json({
                        message: "Email address already in use by another user!",
                        success: false
                    });
                }
            }
            updateData.email_address = email_address.trim().toLowerCase();
        }

        if (user_image) {
            try {
                updateData.user_image = await updateImage(
                    existingUser.user_image,
                    user_image,
                    'users'
                );
            } catch (error) {
                return res.status(400).json({
                    message: "Error uploading image!",
                    success: false,
                    error: error.message
                });
            }
        }

        if (password !== undefined) {
            if (!password || password.trim().length === 0) {
                return res.status(400).json({
                    message: "Password cannot be empty!",
                    success: false
                });
            }
            if (password.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters!",
                    success: false
                });
            }
            updateData.password = await hashPassword(password);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No fields to update!",
                success: false
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            {new: true, runValidators: true}
        ).select('-password -refresh_token -__v');

        return res.status(200).json({
            success: true,
            message: "User successfully updated!",
            user: {
                id: updatedUser._id,
                full_name: updatedUser.full_name,
                email_address: updatedUser.email_address,
                contact_number: updatedUser.contact_number,
                user_image: updatedUser.user_image,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating user!",
            error: error.message
        });
    }
}

// DELETE USER
export const deleteUser = async (req, res) => {
    try {
        const id = req.user.id;

        const existingUser = await User.findById(id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found!",
                success: false
            });
        }

        await User.findByIdAndDelete(id);

        if (existingUser.user_image) {
            try {
                await deleteImage(existingUser.user_image);
            } catch (imageError) {
                return res.status(200).json({
                    message: "Error deleting image:", imageError,
                    success: true,
                });
            }
        }

        return res.status(200).json({
            message: `${existingUser.full_name} successfully deleted!`,
            success: true,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error deleting user!",
            success: false,
            error: error.message
        });
    }
}
