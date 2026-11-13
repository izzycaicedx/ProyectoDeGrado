const express = require('express');
const router = express.Router();
const { consultarAuditoria } = require('../controllers/auditoria.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

// La consulta exige sesión, rol autorizado y confirmación de contraseña.
router.post('/auditoria/consultar', verificarToken, verificarRol(2, 3), consultarAuditoria);

module.exports = router;
