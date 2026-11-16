const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');

// El registro público se mantiene deshabilitado para evitar que
// una persona pueda crear una cuenta o asignarse un rol sin autorización.
// La creación de usuarios deberá habilitarse mediante un flujo protegido.
router.post('/auth/login', login);

module.exports = router;
