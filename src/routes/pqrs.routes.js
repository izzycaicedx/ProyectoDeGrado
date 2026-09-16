const express = require('express');
const router = express.Router();
const { crearPqrs, listarPqrs } = require('../controllers/pqrs.controller');

router.post('/pqrs', crearPqrs);
router.get('/pqrs', listarPqrs);

module.exports = router;