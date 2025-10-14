import Admin from "../model/AdminModel.js";
import EmployeeHistoryModel from "../model/EmployeeHistoryModel.js";
import { saveBase64Image, updateImage, deleteImage } from "../utils/ImageHandler.js";
import { loginWithToken, hashPassword } from "../service/AuthService.js";

// REGISTER ADMINISTRATOR
export const registerAdministrator = async (req, res) => {
    try {
        const { full_name, contact_number, email_address, password, user_image } = req.body;

        if (!full_name || full_name.trim().length === 0) {
            return res.status(400).json({ message: "Full name is required!", success: false });
        }

        if (!contact_number || contact_number.trim().length === 0) {
            return res.status(400).json({ message: "Contact number is required!", success: false });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters!", success: false });
        }

        if (!email_address || email_address.trim().length === 0) {
            return res.status(400).json({ message: "Email address is required!", success: false });
        }

        const adminExists = await Admin.findOne({
            email_address: email_address.trim().toLowerCase()
        });

        if (adminExists) {
            return res.status(400).json({ message: "Email address already registered!", success: false });
        }

        let imagePath = null;
        if (user_image) {
            try {
                imagePath = await saveBase64Image(user_image, 'admins');
            } catch (error) {
                return res.status(400).json({ message: "Error uploading image!", success: false });
            }
        }

        const hashedPassword = await hashPassword(password);

        const newAdministrator = new Admin({
            full_name: full_name.trim(),
            contact_number: contact_number.trim(),
            email_address: email_address.trim().toLowerCase(),
            password: hashedPassword,
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

// LOGIN ADMINISTRATOR
export const loginAdministrator = async (req, res) => {
    const { email_address, password } = req.body;

    if (!email_address || email_address.trim().length === 0) {
        return res.status(400).json({ message: "Email address is required!", success: false });
    }

    if (!password || password.trim().length === 0) {
        return res.status(400).json({ message: "Password is required!", success: false });
    }

    const buildAdminTokenPayload = (admin) => ({
        id: admin._id,
        email: admin.email_address,
        role: 'admin'
    });

    const result = await loginWithToken(
        Admin,
        'email_address',
        email_address,
        'password',
        password,
        'refresh_token',
        buildAdminTokenPayload
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
        administrator: {
            id: result.user._id,
            full_name: result.user.full_name,
            email_address: result.user.email_address,
            contact_number: result.user.contact_number,
            user_image: result.user.user_image,
            createdAt: result.user.createdAt
        }
    });
};

// VIEW ADMINISTRATOR PROFILE
export const viewAdministrator = async (req, res) => {
    try {
        const id = req.user.id;

        const admin = await Admin.findById(id).select('-password -__v -refresh_token');

        if (!admin) {
            return res.status(404).json({
                message: "Administrator not found!",
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            administrator: {
                id: admin._id,
                full_name: admin.full_name,
                email_address: admin.email_address,
                contact_number: admin.contact_number,
                user_image: admin.user_image,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error viewing administrator!",
            error: error.message
        });
    }
};

// UPDATE ADMINISTRATOR
export const updateAdministrator = async (req, res) => {
    try {
        const { full_name, contact_number, email_address, password, user_image } = req.body;
        const { id } = req.params;

        const existingAdmin = await Admin.findById(id);

        if (!existingAdmin) {
            return res.status(404).json({
                message: "Administrator not found!",
                success: false
            });
        }

        if (!full_name || full_name.trim().length === 0) {
            return res.status(400).json({ message: "Full name is required!", success: false });
        }

        if (!contact_number || contact_number.trim().length === 0) {
            return res.status(400).json({ message: "Contact number is required!", success: false });
        }

        if (!email_address || email_address.trim().length === 0) {
            return res.status(400).json({ message: "Email address is required!", success: false });
        }

        if (email_address.trim().toLowerCase() !== existingAdmin.email_address) {
            const emailExists = await Admin.findOne({
                email_address: email_address.trim().toLowerCase(),
                _id: { $ne: id }
            });

            if (emailExists) {
                return res.status(400).json({
                    message: "Email address already in use by another administrator!",
                    success: false
                });
            }
        }

        const updateData = {
            full_name: full_name.trim(),
            contact_number: contact_number.trim(),
            email_address: email_address.trim().toLowerCase()
        };

        if (user_image) {
            try {
                updateData.user_image = await updateImage(
                    existingAdmin.user_image,
                    user_image,
                    'admins'
                );
            } catch (error) {
                return res.status(400).json({
                    message: "Error uploading image!",
                    success: false,
                    error: error.message
                });
            }
        }

        if (password && password.trim().length > 0) {
            if (password.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters!",
                    success: false
                });
            }
            updateData.password = await hashPassword(password);
        }

        const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, { new: true });

        return res.status(200).json({
            success: true,
            message: "Administrator successfully updated!",
            administrator: {
                id: updatedAdmin._id,
                full_name: updatedAdmin.full_name,
                email_address: updatedAdmin.email_address,
                contact_number: updatedAdmin.contact_number,
                user_image: updatedAdmin.user_image,
                updatedAt: updatedAdmin.updatedAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating administrator!",
            error: error.message
        });
    }
};

// DELETE ADMINISTRATOR
export const deleteAdministrator = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, occupation } = req.body;

        const existingAdmin = await Admin.findById(id);

        if (!existingAdmin) {
            return res.status(404).json({
                message: "Administrator not found!",
                success: false
            });
        }

        const employeeHistory = new EmployeeHistoryModel({
            full_name: existingAdmin.full_name,
            contact_number: existingAdmin.contact_number,
            email_address: existingAdmin.email_address,
            user_image: existingAdmin.user_image,
            registered_date: existingAdmin.createdAt,
            release_date: new Date(),
            occupation: occupation || "Administrator",
            description: description || "Admin account deleted",
            admin_id: existingAdmin._id
        });

        await employeeHistory.save();
        await Admin.findByIdAndDelete(id);

        if (existingAdmin.user_image) {
            deleteImage(existingAdmin.user_image);
        }

        return res.status(200).json({
            message: `${existingAdmin.full_name} successfully deleted!`,
            success: true,
            history: {
                id: employeeHistory._id,
                full_name: employeeHistory.full_name,
                email_address: employeeHistory.email_address,
                occupation: employeeHistory.occupation,
                description: employeeHistory.description,
                release_date: employeeHistory.release_date
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error deleting administrator!",
            success: false,
            error: error.message
        });
    }
};

// SEARCH ADMINISTRATORS
export const searchAdministrators = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim().length === 0) {
            const allAdmins = await Admin.find().select('-password -refresh_token').sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                count: allAdmins.length,
                administrators: allAdmins
            });
        }

        const administrators = await Admin.find({
            $or: [
                { full_name: { $regex: search, $options: 'i' } },
                { contact_number: { $regex: search, $options: 'i' } },
                { email_address: { $regex: search, $options: 'i' } }
            ]
        }).select('-password -refresh_token').sort({ createdAt: -1 });

        if (administrators.length === 0) {
            return res.status(404).json({
                message: `No administrator found matching "${search}"`,
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            count: administrators.length,
            search_term: search,
            administrators: administrators
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching administrators!",
            error: error.message
        });
    }
};

// SEARCH EMPLOYEE HISTORY
export const viewEmployeeHistory = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim().length === 0) {
            const allHistory = await EmployeeHistoryModel.find()
                .select('-__v')
                .sort({ release_date: -1 });

            return res.status(200).json({
                success: true,
                count: allHistory.length,
                employees: allHistory
            });
        }

        const employeeHistory = await EmployeeHistoryModel.find({
            $or: [
                { full_name: { $regex: search, $options: 'i' } },
                { contact_number: { $regex: search, $options: 'i' } },
                { email_address: { $regex: search, $options: 'i' } },
                { occupation: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        })
            .select('-__v')
            .sort({ release_date: -1 });

        if (employeeHistory.length === 0) {
            return res.status(404).json({
                message: `No employee found matching "${search}"`,
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            count: employeeHistory.length,
            search_term: search,
            employees: employeeHistory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching employee history!",
            error: error.message
        });
    }
};
