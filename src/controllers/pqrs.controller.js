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
async function obtenerPqrsPorId(req, res) {
  try {
    const { id } = req.params;
    const pqrs = await Pqrs.findByPk(id);

    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: `No se encontró ningún PQRS con el id ${id}.`,
      });
    }

    return res.json({ exito: true, datos: pqrs });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al consultar el PQRS.',
      detalle: error.message,
    });
  }
}

async function actualizarEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Recibido', 'En clasificacion', 'En tramite', 'Vencido', 'Cerrado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        exito: false,
        mensaje: `El estado debe ser uno de: ${estadosValidos.join(', ')}.`,
      });
    }

    const pqrs = await Pqrs.findByPk(id);
    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: `No se encontró ningún PQRS con el id ${id}.`,
      });
    }

    pqrs.estado = estado;
    await pqrs.save();

    return res.json({
      exito: true,
      mensaje: 'Estado actualizado correctamente.',
      datos: pqrs,
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar el estado del PQRS.',
      detalle: error.message,
    });
  }
}

module.exports = { crearPqrs, listarPqrs, obtenerPqrsPorId, actualizarEstado };