import Package from '../model/PackageModel.js';
import {deleteImage} from "../utils/ImageHandler.js";

// CREATE PACKAGE
export const createPackage = async (req, res) => {
    try {
        const {package_name, package_features, general_price, promotional_price, is_active} = req.body;

        if (!package_name || package_name.trim().length === 0) {
            return res.status(400).json({ message: "Package name is required!", success: false });
        }

        if (!package_features || package_features.trim().length === 0) {
            return res.status(400).json({ message: "Package features are required!", success: false });
        }

        if (!general_price || isNaN(general_price) || general_price <= 0) {
            return res.status(400).json({ message: "Valid general price is required!", success: false });
        }

        if (promotional_price && (isNaN(promotional_price) || promotional_price < 0)) {
            return res.status(400).json({ message: "Promotional price must be a valid number!", success: false });
        }

        const packageExists = await Package.findOne({
            package_name: package_name.trim().toUpperCase(),
        });

        if (packageExists) {
            return res.status(400).json({
                message: "Package with this name already exists!",
                success: false
            });
        }

        const newPackage = new Package({
            package_name: package_name.trim().toUpperCase(),
            package_features: package_features.trim(),
            general_price: Number(general_price),
            promotional_price: promotional_price ? Number(promotional_price) : Number(general_price),
            is_active: is_active !== undefined ? Boolean(is_active) : true,
        });

        await newPackage.save();

        return res.status(201).json({
            success: true,
            message: "Package successfully created!",
            package: {
                id: newPackage._id,
                package_name: newPackage.package_name,
                package_features: newPackage.package_features,
                general_price: newPackage.general_price,
                promotional_price: newPackage.promotional_price,
                is_active: newPackage.is_active,
                createdAt: newPackage.createdAt
            }
        });

    } catch (error) {
        return res.status(500).send({
            success: false,
            message: "Package creation failed!",
            error: error.message,
        })
    }
}

// VIEW ALL PACKAGES
export const viewPackages = async (req, res) => {
    try {
        const packageData = await Package.find().select('-__v').sort({ createdAt: -1 });

        if (!packageData || packageData.length === 0) {
            return res.status(404).json({
                message: "No packages found!",
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            count: packageData.length,
            packages: packageData
        });

    } catch (error) {
        return res.status(500).send({
            success: false,
            message: "Error fetching packages!",
            error: error.message,
        });
    }
}

// UPDATE PACKAGE
export const updatePackage = async (req, res) => {
    try {
        const {package_name, package_features, general_price, promotional_price, is_active} = req.body;
        const { id } = req.params;

        const existingPackage = await Package.findById(id);

        if (!existingPackage) {
            return res.status(404).json({
                message: "Package is not found!",
                success: false
            });
        }

        if (!package_name || package_name.trim().length === 0) {
            return res.status(400).json({ message: "Package name is required!", success: false });
        }

        if (!package_features || package_features.trim().length === 0) {
            return res.status(400).json({ message: "Package features are required!", success: false });
        }

        if (!general_price || isNaN(general_price) || general_price <= 0) {
            return res.status(400).json({ message: "Valid general price is required!", success: false });
        }

        if (promotional_price && (isNaN(promotional_price) || promotional_price < 0)) {
            return res.status(400).json({ message: "Promotional price must be a valid number!", success: false });
        }

        if (package_name.trim().toUpperCase() !== existingPackage.package_name.toUpperCase()) {
            const packageExists = await Package.findOne({
                package_name: package_name.trim().toUpperCase(),
                _id: { $ne: id }
            });

            if (packageExists) {
                return res.status(400).json({
                    message: "Package name already in use by another package!",
                    success: false
                });
            }
        }

        const updateData = {
            package_name: package_name.trim(),
            package_features: package_features.trim(),
            general_price: Number(general_price),
            promotional_price: promotional_price ? Number(promotional_price) : Number(general_price),
            is_active: is_active !== undefined ? Boolean(is_active) : existingPackage.is_active,
        };

        const updatedPackage = await Package.findByIdAndUpdate(id, updateData, { new: true });

        return res.status(200).json({
            success: true,
            message: "Package successfully updated!",
            package: {
                id: updatedPackage._id,
                package_name: updatedPackage.package_name,
                package_features: updatedPackage.package_features,
                general_price: updatedPackage.general_price,
                promotional_price: updatedPackage.promotional_price,
                is_active: updatedPackage.is_active,
                updatedAt: updatedPackage.updatedAt,
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error updating package!",
            error: error.message,
        });
    }
}

// DELETE PACKAGE
export const deletePackage = async (req, res) => {
    try {
        const { id } = req.params;

        const existingPackage = await Package.findById(id);

        if (!existingPackage) {
            return res.status(404).json({
                message: "Package not found!",
                success: false
            });
        }
        await Package.findByIdAndDelete(id);

        return res.status(200).json({
            message: `${existingPackage.package_name} package successfully deleted!`,
            success: true
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error deleting package!",
            success: false,
            error: error.message
        });
    }
}
