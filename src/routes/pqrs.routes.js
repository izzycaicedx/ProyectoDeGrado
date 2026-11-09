const express = require('express');
const router = express.Router();
const {
  crearPqrs,
  listarPqrs,
  obtenerPqrsPorId,
  consultarPorRadicado,
  actualizarEstado,
  asignarPqrs
} = require('../controllers/pqrs.controller');
const { listarResponsables } = require('../controllers/responsables.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

// Públicas (paciente)
router.post('/pqrs', crearPqrs);
router.get('/pqrs/radicado/:radicado', consultarPorRadicado);

// Solo personal (roles 2 y 3)
router.get('/responsables', verificarToken, verificarRol(2, 3), listarResponsables);
router.get('/pqrs', verificarToken, verificarRol(2, 3), listarPqrs);
router.get('/pqrs/:id', verificarToken, verificarRol(2, 3), obtenerPqrsPorId);
router.put('/pqrs/:id', verificarToken, verificarRol(2, 3), actualizarEstado);
router.put('/pqrs/:id/asignar', verificarToken, verificarRol(2, 3), asignarPqrs);

module.exports = router;