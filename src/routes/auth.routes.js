const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/auth.controller');

router.post('/auth/registro', registrar);
router.post('/auth/login', login);

module.exports = router;