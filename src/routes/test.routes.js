// ============================================================
// CAPA: Rutas (parte de la "V"/entrada de la arquitectura MVC
// del lado del servidor — define qué URL activa qué controlador)
// ============================================================

const express = require('express');
const router = express.Router();
const { listarRoles } = require('../controllers/test.controller');

// GET /api/roles -> devuelve todos los roles guardados en PostgreSQL
router.get('/roles', listarRoles);

module.exports = router;
