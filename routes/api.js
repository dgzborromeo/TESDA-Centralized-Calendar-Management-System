const express = require('express');
const router = express.Router();

// Import Controllers
const userProfileController = require('../controllers/userProfileController');
const configController = require('../controllers/configController');

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

// -----CONFIGURATIONS API HERE -----
// OFFICE
router.post('/add-office', auth, configController.create);
router.get('/get-offices', auth, configController.getAll);
router.get('/get-office/:id', auth, configController.getById);
router.post('/update-office/:id', auth, configController.update);
router.delete('/delete-office/:id', auth, configController.delete);

// DIVISION
router.get('/get-divisions', auth, configController.getAllDivisions);
router.post('/add-division', auth, configController.createDivision);
router.post('/update-division/:id', auth, configController.updateDivision);
router.delete('/delete-division/:id', auth, configController.deleteDivision);
router.get('/get-division/:id', auth, configController.getDivisionById);

module.exports = router;