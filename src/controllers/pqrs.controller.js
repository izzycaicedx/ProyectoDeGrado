const Pqrs = require('../models/Pqrs');
const { calcularFechaLimite, marcarVencidos } = require('../utils/plazos');
const { registrarAuditoria } = require('../utils/auditoria');

const crearPqrs = async (req, res) => {
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
      nombre_acompanante,
      parentesco_acompanante,
      telefono_acompanante,
      descripcion
    } = req.body;

    if (!sede || !fecha_evento || !medio || !tipo || !tipo_documento ||
        !numero_documento || !nombre_solicitante || !celular ||
        !correo_electronico || es_mismo_paciente === undefined || !descripcion) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Faltan campos obligatorios por diligenciar.',
        datos: null
      });
    }

    if (es_mismo_paciente === false && !nombre_acompanante) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debe indicar el nombre completo del acompañante.',
        datos: null
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
      telefono_fijo: telefono_fijo || null,
      correo_electronico,
      es_mismo_paciente,
      nombre_acompanante: es_mismo_paciente === false ? (nombre_acompanante || null) : null,
      parentesco_acompanante: es_mismo_paciente === false ? (parentesco_acompanante || null) : null,
      telefono_acompanante: es_mismo_paciente === false ? (telefono_acompanante || null) : null,
      descripcion,
      estado: 'Recibido',
      fecha_limite: calcularFechaLimite(tipo)
    });

    const anio = new Date().getFullYear();
    const radicado = `PQRS-${anio}-${String(nuevoPqrs.id).padStart(4, '0')}`;

    nuevoPqrs.radicado = radicado;
    await nuevoPqrs.save();

    await registrarAuditoria({
      usuarioId: req.usuario?.id || null,
      pqrsId: nuevoPqrs.id,
      accion: 'RADICACION',
      detalle: { radicado, tipo, sede, origen: 'Formulario público' }
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'PQRS radicado exitosamente.',
      datos: nuevoPqrs
    });

  } catch (error) {
    console.error(error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Hay datos con un valor no permitido.',
        datos: error.errors.map(e => ({ campo: e.path, valor: e.value, detalle: e.message }))
      });
    }

    return res.status(500).json({
      exito: false,
      mensaje: 'Error al radicar el PQRS.',
      datos: error.message
    });
  }
};

const listarPqrs = async (req, res) => {
  try {
    await marcarVencidos();
    const pqrsList = await Pqrs.findAll({ order: [['fecha_registro', 'DESC']] });
    return res.status(200).json({
      exito: true,
      mensaje: 'Listado de PQRS obtenido correctamente.',
      datos: pqrsList
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener el listado de PQRS.',
      datos: error.message
    });
  }
};

const obtenerPqrsPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const pqrs = await Pqrs.findByPk(id);

    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: 'PQRS no encontrado.',
        datos: null
      });
    }

    return res.status(200).json({
      exito: true,
      mensaje: 'PQRS obtenido correctamente.',
      datos: pqrs
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener el PQRS.',
      datos: error.message
    });
  }
};

const consultarPorRadicado = async (req, res) => {
  try {
    const { radicado } = req.params;

    // Consulta pública: solo se devuelven campos no sensibles
    const pqrs = await Pqrs.findOne({
      where: { radicado: radicado.trim().toUpperCase() },
      attributes: ['radicado', 'tipo', 'sede', 'estado', 'fecha_evento', 'fecha_registro']
    });

    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No se encontró un PQRS con ese número de radicado.',
        datos: null
      });
    }

    return res.status(200).json({
      exito: true,
      mensaje: 'PQRS encontrado.',
      datos: pqrs
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al consultar el PQRS.',
      datos: error.message
    });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pqrs = await Pqrs.findByPk(id);

    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: 'PQRS no encontrado.',
        datos: null
      });
    }

    const estadoAnterior = pqrs.estado;
    const usuarioId = req.usuario?.id || null;

    // El cambio y su registro de auditoría se guardan juntos.
    // Si falla el registro, también se revierte la actualización del estado.
    const { sequelize } = require('../config/database');

    await sequelize.transaction(async (transaction) => {
      pqrs.estado = estado;
      await pqrs.save({ transaction });

      await sequelize.query(
        `INSERT INTO auditoria (usuario_id, pqrs_id, accion, detalle)
         VALUES (:usuario_id, :pqrs_id, :accion, :detalle)`,
        {
          replacements: {
            usuario_id: usuarioId,
            pqrs_id: pqrs.id,
            accion: 'CAMBIO_ESTADO',
            detalle: JSON.stringify({
              estado_anterior: estadoAnterior,
              estado_nuevo: estado
            })
          },
          transaction
        }
      );
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Estado del PQRS actualizado correctamente.',
      datos: pqrs
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar el estado del PQRS.',
      datos: error.message
    });
  }
};

const asignarPqrs = async (req, res) => {
  try {
    const { id } = req.params;
    const { asignado_a } = req.body;

    const pqrs = await Pqrs.findByPk(id);

    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: 'PQRS no encontrado.',
        datos: null
      });
    }

    const responsableAnterior = pqrs.asignado_a;
    const estadoAnterior = pqrs.estado;
    pqrs.asignado_a = asignado_a || null;

    // Al asignarlo por primera vez, pasa de "Recibido" a "En clasificacion"
    if (asignado_a && pqrs.estado === 'Recibido') {
      pqrs.estado = 'En clasificacion';
    }

    await pqrs.save();

    await registrarAuditoria({
      usuarioId: req.usuario?.id || null,
      pqrsId: pqrs.id,
      accion: 'ASIGNACION',
      detalle: {
        responsable_anterior: responsableAnterior,
        responsable_nuevo: pqrs.asignado_a,
        estado_anterior: estadoAnterior,
        estado_nuevo: pqrs.estado
      }
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'PQRS asignado correctamente.',
      datos: pqrs
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al asignar el PQRS.',
      datos: error.message
    });
  }
};

module.exports = {
  crearPqrs,
  listarPqrs,
  obtenerPqrsPorId,
  consultarPorRadicado,
  actualizarEstado,
  asignarPqrs
};