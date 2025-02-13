const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve static files from the current directory and uploads directory
app.use(express.static(__dirname));
app.use('/uploads', express.static('uploads'));
app.use(express.json());

// Store gallery items in memory (replace with a database in production)
let galleryItems = [];

// Get all gallery items
app.get('/api/gallery', (req, res) => {
    res.json(galleryItems);
});

// Add new gallery item
app.post('/api/gallery', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const newItem = {
        id: Date.now(),
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        src: `/uploads/${req.file.filename}`,
        name: req.body.name || 'Anonymous',
        message: req.body.message || ''
    };

    galleryItems.push(newItem);
    res.json(newItem);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});