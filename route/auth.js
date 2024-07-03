const express = require('express');
const router = express.Router();

const authController = require('../controller/auth');

router.post('/signUp', authController.signUp);

router.post('/signIn', authController.signIn);

module.exports = router;
