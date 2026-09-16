const Pqrs = require('../models/Pqrs');

async function crearPqrs(req, res) {
  try {
    const {
      sede,
      fecha_evento,
      medio,
      tipo,
      tipo_documento,
      numero_documento,
      nombre_solicitante,
      celular,
      telefono_fijo,
      correo_electronico,
      es_mismo_paciente,
      descripcion,
      usuario_id,
    } = req.body;

    const camposObligatorios = {
      sede, fecha_evento, medio, tipo, tipo_documento,
      numero_documento, nombre_solicitante, celular,
      correo_electronico, descripcion,
    };

    for (const [campo, valor] of Object.entries(camposObligatorios)) {
      if (!valor) {
        return res.status(400).json({
          exito: false,
          mensaje: `El campo '${campo}' es obligatorio.`,
        });
      }
    }

    if (es_mismo_paciente === undefined || es_mismo_paciente === null) {
      return res.status(400).json({
        exito: false,
        mensaje: `El campo 'es_mismo_paciente' es obligatorio.`,
      });
    }

    const nuevoPqrs = await Pqrs.create({
      radicado: 'TEMP',
      sede,
      fecha_evento,
      medio,
      tipo,
      tipo_documento,
      numero_documento,
      nombre_solicitante,
      celular,
      telefono_fijo,
      correo_electronico,
      es_mismo_paciente,
      descripcion,
      usuario_id: usuario_id || null,
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