const express = require('express');
const router = express.Router();
const { obtenerEstadisticas } = require('../controllers/estadisticas.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

// Solo personal autorizado (roles 2 y 3). La consulta no modifica la base de datos.
router.get('/estadisticas', verificarToken, verificarRol(2, 3), obtenerEstadisticas);

module.exports = router;
