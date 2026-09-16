const Pqrs = require('../models/Pqrs');
const Usuario = require('../models/Usuario');

async function crearPqrs(req, res) {
  try {
    const { tipo, descripcion, fecha_evento, usuario_id } = req.body;

    if (!tipo || !descripcion || !fecha_evento || !usuario_id) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan campos obligatorios: tipo, descripcion, fecha_evento, usuario_id.',
      });
    }

    const usuarioExiste = await Usuario.findByPk(usuario_id);
    if (!usuarioExiste) {
      return res.status(404).json({
        exito: false,
        mensaje: `No existe un usuario con id ${usuario_id}.`,
      });
    }

    const nuevoPqrs = await Pqrs.create({
      radicado: 'TEMP',
      tipo,
      descripcion,
      fecha_evento,
      usuario_id,
    });

    const anio = new Date().getFullYear();
    const radicadoFinal = `PQRS-${anio}-${String(nuevoPqrs.id).padStart(4, '0')}`;
    nuevoPqrs.radicado = radicadoFinal;
    await nuevoPqrs.save();

  
    return res.status(201).json({
      exito: true,
      mensaje: 'PQRS registrado correctamente.',
      datos: nuevoPqrs,
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al registrar el PQRS.',
      detalle: error.message,
    });
  }
}

async function listarPqrs(req, res) {
  try {
    const registros = await Pqrs.findAll({
      order: [['fecha_registro', 'DESC']],
    });
    return res.json({
      exito: true,
      cantidad: registros.length,
      datos: registros,
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al consultar los PQRS.',
      detalle: error.message,
    });
  }
}

module.exports = { crearPqrs, listarPqrs };