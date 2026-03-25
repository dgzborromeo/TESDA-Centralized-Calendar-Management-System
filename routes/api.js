const express = require('express');
const router = express.Router();

// Import Controllers
const userProfileController = require('../controllers/userProfileController');
const configController = require('../controllers/configController');
const userController = require('../controllers/userController');
const scheduleController = require('../controllers/scheduleController');
// Import Middlewares
const { auth } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const uploadSchedule = require('../middleware/uploadScheduleMiddleware');

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
router.get('/get-offices', configController.getAll);
router.get('/get-office/:id', auth, configController.getById);
router.post('/update-office/:id', auth, configController.update);
router.delete('/delete-office/:id', auth, configController.delete);

// DIVISION
router.get('/get-divisions', auth, configController.getAllDivisions);
router.post('/add-division', auth, configController.createDivision);
router.post('/update-division/:id', auth, configController.updateDivision);
router.delete('/delete-division/:id', auth, configController.deleteDivision);
router.get('/get-division/:id', auth, configController.getDivisionById);

//POSITION
// Positions Master List Endpoints
router.get('/get-positions', configController.getAllPositions);
router.post('/add-position', configController.createPosition);
router.post('/update-position/:id', configController.updatePosition);
router.delete('/delete-position/:id', configController.deletePosition);
router.get('/get-position/:id', configController.getPositionById);

//SETUP POSITIOn
// Config Positions (Assignments)
router.get('/get-config-positions', auth, configController.getAllConfigPositions);
router.post('/setup-position', auth, configController.setupPosition);
router.post('/update-config-position/:id', auth, configController.updateConfigPosition);
router.delete('/delete-config-position/:id', auth, configController.deleteConfigPosition);
router.get('/get-config-position/:id', auth, configController.getConfigPositionById);

//Category
router.post('/category', configController.createCategory);          // POST /api/categories
router.get('/categories', configController.getAllCategories);           // GET /api/categories
router.get('/category/:id', configController.getCategoryById);       // GET /api/categories/1
router.post('/category/:id', configController.updateCategory);        // PUT /api/categories/1
router.delete('/category/:id', configController.deleteCategory);
//Focal
router.post('/focal', configController.createFocal);
router.get('/focals', configController.getAllFocals);
router.get('/focal/:id', configController.getFocalById);
router.post('/focal/:id', configController.updateFocal);
router.delete('/focal/:id', configController.deleteFocal);

router.get('/clustersOffice', configController.getClusterMembers);
router.get('/clusters', configController.getClusters);

//Schedule
router.get('/schedules', configController.getAllSchedule);           // Kunin lahat
router.get('/schedule/:id', configController.getByIdSchedule);      // Kunin ang isa via ID
router.post('/schedule', uploadSchedule.single('attachment_file'), configController.createSchedule);         // Mag-add ng bago
router.post('/schedule/:id', uploadSchedule.single('attachment_file'), configController.updateSchedule);        // Mag-edit ng record
router.delete('/schedule/:id', configController.deleteSchedule);

router.get('/getSchedules', scheduleController.getAllSched);
router.get('/getSchedule/:id', scheduleController.getSchedById);
router.post('/check-schedule-conflict', scheduleController.checkConflict);
router.post('/add-schedule', auth, uploadSchedule.single('attachment_file'), scheduleController.createSched);
router.post('/update-schedule/:id', uploadSchedule.single('attachment_file'), scheduleController.updateSched);
router.delete('/delete-schedule/:id', scheduleController.deleteSched);
router.post('/renew-schedule/:id', auth, scheduleController.renewSched);

router.get('/users', auth, userController.getAllUsers);
router.post('/users', userController.createUser);
router.post('/users/:id', auth, userController.updateUser);
router.get('/users/:id', auth, userController.getUserById);
router.delete('/users/:id', auth, userController.deleteUser);

router.post('/focalship', configController.createFocalship);        // Create
router.get('/focalship', configController.getAllFocalship);         // Read All
router.get('/focalship/:id', configController.getOneFocalship);     // Read One
router.post('/focalship/:id', configController.updateFocalship);      // Update
router.delete('/focalship/:id', configController.deleteFocalship);   // Delete

router.get('/regions', configController.getAllRegions);
router.get('/provinces/:region_id', configController.getByRegion);
router.get('/provinces', configController.getAllProvinces);   
module.exports = router;