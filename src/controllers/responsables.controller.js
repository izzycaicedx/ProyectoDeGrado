const Usuario = require('../models/Usuario');

const listarResponsables = async (req, res) => {
  try {
    const responsables = await Usuario.findAll({
      where: { rol_id: [2, 3] },
      attributes: ['id', 'nombre', 'email', 'rol_id'],
      order: [['nombre', 'ASC']]
    });
    return res.status(200).json({
      exito: true,
      mensaje: 'Responsables obtenidos correctamente.',
      datos: responsables
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener los responsables.',
      datos: error.message
    });
  }
};

module.exports = { listarResponsables };