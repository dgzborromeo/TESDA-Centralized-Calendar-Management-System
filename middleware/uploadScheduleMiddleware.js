const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Siguraduhin na ang path ay absolute mula sa root ng project
const uploadDir = path.resolve(__dirname, '../uploads/schedules');

// Gawa folder kung wala pa
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadSchedule = multer({ 
  storage: storage,
  // ... (fileFilter and limits stay the same)
});

module.exports = uploadSchedule;