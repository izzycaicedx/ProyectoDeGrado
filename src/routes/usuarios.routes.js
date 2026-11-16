const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const {
  listarUsuarios,
  crearUsuario,
  cambiarRolUsuario
} = require('../controllers/usuarios.controller');

// Administración de cuentas reservada exclusivamente al rol 3.
router.get('/usuarios', verificarToken, verificarRol(3), listarUsuarios);
router.post('/usuarios', verificarToken, verificarRol(3), crearUsuario);
router.patch('/usuarios/:id/rol', verificarToken, verificarRol(3), cambiarRolUsuario);

module.exports = router;
