
const express = require('express');
const router = express.Router();
const { listarRoles } = require('../controllers/test.controller');

// GET /api/roles -> devuelve todos los roles guardados en PostgreSQL
router.get('/roles', listarRoles);

module.exports = router;
