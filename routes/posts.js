const express = require("express");
const multer = require('multer');
const isAuth = require('../middlewares/auth');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.mimetype.split('/')[1];
    const filename = file.originalname.replace(/\.[^/.]+$/, "") + '-' + uniqueSuffix + '.' + fileExtension;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  cb(file.mimetype.startsWith('image/') ? null : new Error('Only image files are allowed!'), file.mimetype.startsWith('image/'));
};

const upload = multer({ 
  storage,
  fileFilter
});

const router = express.Router();

router.put('/post-image', isAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided.' });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({ message: 'File stored.', filePath: req.file.path });
});

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

module.exports = router;
