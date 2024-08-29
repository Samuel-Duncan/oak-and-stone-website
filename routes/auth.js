const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// Create User
router.get('/sign-up', authController.signUpGET);
router.post('/sign-up', authController.signUpPOST);

// Sign in
router.get('/sign-in', authController.signInGET);
router.post('/sign-in', authController.signInPOST);

// Sign out
router.get('/sign-out', authController.signOut);

module.exports = router;
