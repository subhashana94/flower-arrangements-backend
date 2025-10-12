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
