import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_IMAGE_TYPES = ['png', 'jpg', 'jpeg'];

const isValidImageType = (imageType) => {
    return ALLOWED_IMAGE_TYPES.includes(imageType.toLowerCase());
};

export const saveBase64Image = async (base64String, folder) => {
    try {
        if (!base64String || base64String.trim().length === 0) {
            return null;
        }

        let imageType = null;

        if (base64String.includes('data:image/')) {
            const matches = base64String.match(/data:image\/(\w+);base64,/);
            if (matches && matches[1]) {
                imageType = matches[1].toLowerCase();
            }
        }

        if (!imageType || !isValidImageType(imageType)) {
            throw new Error(`Invalid image format. Only PNG, JPG, and JPEG are allowed. Received: ${imageType || 'unknown'}`);
        }

        if (imageType === 'jpeg') {
            imageType = 'jpg';
        }

        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');

        const fileName = `${uuidv4()}.${imageType}`;

        const uploadDir = path.join(__dirname, '..', 'uploads', folder);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);

        const imageBuffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, imageBuffer);

        console.log(`✅ Image saved: /uploads/${folder}/${fileName}`);

        return `/uploads/${folder}/${fileName}`;

    } catch (error) {
        throw new Error(`Error saving image: ${error.message}`);
    }
};

export const deleteImage = (imagePath) => {
    try {
        if (imagePath) {
            const fullPath = path.join(__dirname, '..', imagePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`✅ Image deleted: ${imagePath}`);
            }
        }
    } catch (error) {
        console.error(`Error deleting image: ${error.message}`);
    }
};

export const updateImage = async (oldImagePath, newBase64Image, folder) => {
    try {
        if (oldImagePath) {
            deleteImage(oldImagePath);
        }

        if (newBase64Image) {
            return await saveBase64Image(newBase64Image, folder);
        }

        return null;
    } catch (error) {
        throw new Error(`Error updating image: ${error.message}`);
    }
};

export const saveMultipleImages = async (base64Images, folder) => {
    try {
        if (!Array.isArray(base64Images) || base64Images.length === 0) {
            return [];
        }

        const imagePaths = [];
        const errors = [];

        for (let i = 0; i < base64Images.length; i++) {
            const base64Image = base64Images[i];
            if (base64Image && base64Image.trim().length > 0) {
                try {
                    const path = await saveBase64Image(base64Image, folder);
                    imagePaths.push(path);
                } catch (error) {
                    errors.push(`Image ${i + 1}: ${error.message}`);
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(`Failed to upload some images: ${errors.join(', ')}`);
        }

        return imagePaths;
    } catch (error) {
        throw new Error(`Error saving multiple images: ${error.message}`);
    }
};

export const deleteMultipleImages = (imagePaths) => {
    try {
        if (Array.isArray(imagePaths)) {
            imagePaths.forEach(imagePath => {
                deleteImage(imagePath);
            });
        }
    } catch (error) {
        console.error(`Error deleting multiple images: ${error.message}`);
    }
};

// Sanitize folder name
const sanitizeFolderName = (name) => {
    return name
        .replace(/[^a-zA-Z0-9-\s]/g, '')     // Remove special characters except dash and space
        .replace(/\s+/g, '-')                 // Replace spaces with dashes
        .replace(/--+/g, '-')                 // Replace multiple dashes with single dash
        .replace(/^-|-$/g, '')                // Remove leading/trailing dashes
        .toLowerCase()                        // Convert to lowercase
        .substring(0, 100);                   // Limit length to 100 characters
};

// Save multiple images in custom subfolder
export const saveMultipleImagesInCustomFolder = async (base64Images, mainFolder, customFolderName) => {
    try {
        if (!Array.isArray(base64Images) || base64Images.length === 0) {
            throw new Error('No images provided');
        }

        // Sanitize the custom folder name
        const sanitizedFolderName = sanitizeFolderName(customFolderName);

        if (!sanitizedFolderName || sanitizedFolderName.length === 0) {
            throw new Error('Invalid folder name after sanitization');
        }

        // Create the full folder path: uploads/events/event-name-2024-12-15/
        const uploadDir = path.join(__dirname, '..', 'uploads', mainFolder, sanitizedFolderName);

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`✅ Created folder: ${uploadDir}`);
        }

        const imagePaths = [];
        const errors = [];

        // Loop through all images and save them
        for (let i = 0; i < base64Images.length; i++) {
            const base64Image = base64Images[i];

            if (!base64Image || base64Image.trim().length === 0) {
                errors.push(`Image ${i + 1}: Empty image data`);
                continue;
            }

            try {
                // Validate image type
                let imageType = null;
                if (base64Image.includes('data:image/')) {
                    const matches = base64Image.match(/data:image\/(\w+);base64,/);
                    if (matches && matches[1]) {
                        imageType = matches[1].toLowerCase();
                    }
                }

                if (!imageType || !isValidImageType(imageType)) {
                    errors.push(`Image ${i + 1}: Invalid format. Only PNG, JPG, and JPEG are allowed`);
                    continue;
                }

                if (imageType === 'jpeg') {
                    imageType = 'jpg';
                }

                // Extract base64 data
                const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

                // Generate unique filename
                const fileName = `${uuidv4()}.${imageType}`;
                const filePath = path.join(uploadDir, fileName);

                // Save image
                const imageBuffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(filePath, imageBuffer);

                // Store relative path: /uploads/events/event-name-2024-12-15/uuid.jpg
                const relativePath = `/uploads/${mainFolder}/${sanitizedFolderName}/${fileName}`;
                imagePaths.push(relativePath);

                console.log(`Image ${i + 1} saved: ${relativePath}`);

            } catch (error) {
                errors.push(`Image ${i + 1}: ${error.message}`);
            }
        }

        // If all images failed, throw error
        if (imagePaths.length === 0) {
            // Clean up empty folder
            if (fs.existsSync(uploadDir)) {
                fs.rmdirSync(uploadDir);
            }
            throw new Error(`Failed to upload all images: ${errors.join(', ')}`);
        }

        // If some images failed, log warning but continue
        if (errors.length > 0) {
            console.warn(`Some images failed to upload: ${errors.join(', ')}`);
        }

        return imagePaths;

    } catch (error) {
        throw new Error(`Error saving images in custom folder: ${error.message}`);
    }
};

// Delete entire folder with all images
export const deleteImageFolder = (folderPath) => {
    try {
        if (!folderPath || folderPath.trim().length === 0) {
            return false;
        }

        // Remove leading slash if present
        const cleanPath = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;

        const fullPath = path.join(__dirname, '..', cleanPath);

        if (fs.existsSync(fullPath)) {
            // Check if it's a directory
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                // Delete folder and all contents recursively
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log(`✅ Folder deleted: ${folderPath}`);
                return true;
            } else {
                console.warn(`Path is not a directory: ${folderPath}`);
                return false;
            }
        } else {
            console.warn(`Folder not found: ${folderPath}`);
            return false;
        }
    } catch (error) {
        console.error(`Error deleting folder: ${error.message}`);
        return false;
    }
};

// Get folder path from image paths
export const getFolderPathFromImages = (imagePaths) => {
    try {
        if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
            return null;
        }

        // Get first image path
        const firstImagePath = imagePaths[0];

        // Extract folder path (everything except the filename)
        // Example: /uploads/events/event-name-2024-12-15/image.jpg
        // Returns: uploads/events/event-name-2024-12-15
        const pathParts = firstImagePath.split('/');
        pathParts.pop(); // Remove filename
        const folderPath = pathParts.join('/');

        return folderPath;
    } catch (error) {
        console.error(`Error extracting folder path: ${error.message}`);
        return null;
    }
};
