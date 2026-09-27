const express = require('express');
const router = express.Router();
const { crearPqrs, listarPqrs, obtenerPqrsPorId, actualizarEstado } = require('../controllers/pqrs.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.post('/pqrs', crearPqrs);
router.get('/pqrs', listarPqrs);
router.get('/pqrs/:id', obtenerPqrsPorId);
router.put('/pqrs/:id', verificarToken, verificarRol(2, 3), actualizarEstado);

module.exports = router;