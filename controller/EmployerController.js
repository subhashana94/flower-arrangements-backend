import Employee from "../model/EmployeeModel.js";
import { saveBase64Image } from "../utils/ImageHandler.js";

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
