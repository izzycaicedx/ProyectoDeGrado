
const express = require('express');
const router = express.Router();

const {
  registrarRespuesta,
  listarRespuestasPorPqrs
} = require('../controllers/respuestas.controller');

const {
  verificarToken,
  verificarRol
} = require('../middlewares/auth.middleware');

// Solo personal autorizado (roles 2 y 3)

// Registrar una respuesta
router.post(
  '/pqrs/:id/respuestas',
  verificarToken,
  verificarRol(2, 3),
  registrarRespuesta
);

// Consultar historial de respuestas
router.get(
  '/pqrs/:id/respuestas',
  verificarToken,
  verificarRol(2, 3),
  listarRespuestasPorPqrs
);

module.exports = router;
