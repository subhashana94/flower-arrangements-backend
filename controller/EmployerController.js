import Employee from "../model/EmployeeModel.js";
import {saveBase64Image, updateImage} from "../utils/ImageHandler.js";

// REGISTER EMPLOYEE
export const registerEmployee = async (req, res) => {
    try {
        const { full_name, permanent_address, contact_number, email_address, user_image, occupation, description } = req.body;

        if (!full_name || full_name.trim().length === 0) {
            return res.status(400).json({message: "Full name is required!", success: false});
        }

        if (!permanent_address || permanent_address.trim().length === 0) {
            return res.status(400).json({message: "Permanent address is required!", success: false});
        }

        if (!contact_number || contact_number.trim().length === 0) {
            return res.status(400).json({message: "Contact number is required!", success: false});
        }

        if (!occupation || occupation.trim().length === 0) {
            return res.status(400).json({message: "Occupation is required!", success: false});
        }

        if (!description || description.trim().length === 0) {
            return res.status(400).json({message: "Description is required!", success: false});
        }

        const employeeExistByContact = await Employee.findOne({
            contact_number: contact_number.trim()
        });

        if (employeeExistByContact) {
            return res.status(400).json({message: "Contact number already registered!", success: false});
        }

        if (email_address && email_address.trim().length > 0) {
            const employeeExistByEmail = await Employee.findOne({
                email_address: email_address.trim().toLowerCase()
            });

            if (employeeExistByEmail) {
                return res.status(400).json({message: "Email address already registered!", success: false});
            }
        }

        let imagePath = null;
        if (user_image) {
            try {
                imagePath = await saveBase64Image(user_image, 'employees');
            } catch (error) {
                return res.status(400).json({
                    message: "Error uploading image!",
                    success: false,
                    error: error.message
                });
            }
        }

        const newEmployee = new Employee({
            full_name: full_name.trim(),
            permanent_address: permanent_address.trim(),
            contact_number: contact_number.trim(),
            email_address: email_address ? email_address.trim().toLowerCase() : undefined,
            user_image: imagePath,
            occupation: occupation.trim(),
            description: description.trim(),
        });

        await newEmployee.save();

        return res.status(201).json({
            success: true,
            message: "Employee successfully registered!",
            employee: {
                id: newEmployee._id,
                full_name: newEmployee.full_name,
                permanent_address: newEmployee.permanent_address,
                contact_number: newEmployee.contact_number,
                email_address: newEmployee.email_address,
                user_image: newEmployee.user_image,
                occupation: newEmployee.occupation,
                description: newEmployee.description,
                createdAt: newEmployee.createdAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Employee registration failed!",
            error: error.message
        });
    }
}

// SEARCH EMPLOYEE
export const searchEmployee = async (req, res) => {
    try {
        const {search} = req.query;

        if (!search || search.trim().length === 0) {
            const allEmployee = await Employee.find()
                .select('-__v')
                .sort({createdAt: -1});

            return res.status(200).json({
                success: true,
                count: allEmployee.length,
                employees: allEmployee
            });
        }

        const employee = await Employee.find({
            $or: [
                {full_name: {$regex: search, $options: 'i'}},
                {contact_number: {$regex: search, $options: 'i'}},
                {email_address: {$regex: search, $options: 'i'}},
                {occupation: {$regex: search, $options: 'i'}},
                {permanent_address: {$regex: search, $options: 'i'}}
            ]
        }).select('-__v').sort({createdAt: -1});

        if (employee.length === 0) {
            return res.status(404).json({
                message: `No employee found matching "${search}"`,
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            count: employee.length,
            search_term: search,
            employees: employee
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching employee!",
            error: error.message
        });
    }
};

// UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
    try {
        const { full_name, permanent_address, contact_number, email_address, user_image, occupation, description } = req.body;
        const {id} = req.params;

        const existingEmployee = await Employee.findById(id);

        if (!existingEmployee) {
            return res.status(404).json({
                message: "Employee not found!",
                success: false
            });
        }

        if (!full_name || full_name.trim().length === 0) {
            return res.status(400).json({message: "Full name is required!", success: false});
        }

        if (!permanent_address || permanent_address.trim().length === 0) {
            return res.status(400).json({message: "Permanent address is required!", success: false});
        }

        if (!contact_number || contact_number.trim().length === 0) {
            return res.status(400).json({message: "Contact number is required!", success: false});
        }

        if (!occupation || occupation.trim().length === 0) {
            return res.status(400).json({message: "Occupation is required!", success: false});
        }

        if (!description || description.trim().length === 0) {
            return res.status(400).json({message: "Description is required!", success: false});
        }

        if (contact_number.trim() !== existingEmployee.contact_number) {
            const contactNumberExist = await Employee.findOne({
                contact_number: contact_number.trim(),
                _id: {$ne: id}
            });

            if (contactNumberExist) {
                return res.status(400).json({
                    message: "Contact number already in use by another employee!",
                    success: false
                });
            }
        }

        if (email_address && email_address.trim().length > 0) {
            if (email_address.trim().toLowerCase() !== existingEmployee.email_address?.toLowerCase()) {
                const emailExists = await Employee.findOne({
                    email_address: email_address.trim().toLowerCase(),
                    _id: {$ne: id}
                });

                if (emailExists) {
                    return res.status(400).json({
                        message: "Email address already in use by another employee!",
                        success: false
                    });
                }
            }
        }

        const updateData = {
            full_name: full_name.trim(),
            permanent_address: permanent_address.trim(),
            contact_number: contact_number.trim(),
            email_address: email_address ? email_address.trim().toLowerCase() : existingEmployee.email_address,
            occupation: occupation.trim(),
            description: description.trim(),
        };

        if (user_image) {
            try {
                updateData.user_image = await updateImage(
                    existingEmployee.user_image,
                    user_image,
                    'employees'
                );
            } catch (error) {
                return res.status(400).json({
                    message: "Error uploading image!",
                    success: false,
                    error: error.message
                });
            }
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, {new: true});

        return res.status(200).json({
            success: true,
            message: "Employee successfully updated!",
            employee: {
                id: updatedEmployee._id,
                full_name: updatedEmployee.full_name,
                permanent_address: updatedEmployee.permanent_address,
                email_address: updatedEmployee.email_address,
                contact_number: updatedEmployee.contact_number,
                user_image: updatedEmployee.user_image,
                occupation: updatedEmployee.occupation,
                description: updatedEmployee.description,
                updatedAt: updatedEmployee.updatedAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating employee!",
            error: error.message
        });
    }
}
