const Rol = require('../models/Rol');

// Esta función responde cuando alguien visita GET /api/roles
async function listarRoles(req, res) {
  try {
    const roles = await Rol.findAll(); // Sequelize traduce esto a "SELECT * FROM roles"
    res.json({
      exito: true,
      cantidad: roles.length,
      datos: roles,
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al consultar los roles',
      detalle: error.message,
    });
  }
}

module.exports = { listarRoles };
