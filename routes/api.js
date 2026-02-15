const express = require('express');
const router = express.Router();

// Import Controllers
const userProfileController = require('../controllers/userProfileController');

// Import Middlewares
const { auth } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// --- USER PROFILE ROUTES ---
// Lahat ng profile routes ay dadaan sa auth middleware
router.get('/profile/me', auth, userProfileController.getMyProfile);
router.get('/profile/:userId', auth, userProfileController.getUserProfile);

// Dito dadaan ang Save/Update na may Image Upload
router.post('/profile/save', auth, upload.single('picture'), userProfileController.saveProfile);

router.delete('/profile/remove', auth, userProfileController.deleteProfile);

// --- EVENT ROUTES (Soon) ---
// router.get('/events', eventController.index);

module.exports = router;