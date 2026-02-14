const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kcggra/incidents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
        resource_type: 'auto',
        transformation: [
            {width: 1200, crop: 'limit'},
            {quality: 'auto'}
        ]
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

module.exports = {
    cloudinary,
    storage,
    upload
};