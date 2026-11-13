
const Respuesta = require('../models/Respuesta');
const Pqrs = require('../models/Pqrs');
const { sequelize } = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');
const { enviarRespuestaPQRS } = require('../utils/correo');

// Registrar una nueva respuesta
const registrarRespuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const usuarioId = req.usuario.id;

    if (!contenido || !contenido.trim()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El contenido de la respuesta es obligatorio.'
      });
    }

    const pqrs = await Pqrs.findByPk(id);

    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No se encontró la PQRS indicada.'
      });
    }

    const respuesta = await sequelize.transaction(async (transaction) => {
      const nuevaRespuesta = await Respuesta.create({
        pqrs_id: pqrs.id,
        usuario_id: usuarioId,
        contenido: contenido.trim()
      }, { transaction });

      await registrarAuditoria({
        usuarioId,
        pqrsId: pqrs.id,
        accion: 'RESPUESTA_REGISTRADA',
        detalle: {
          radicado: pqrs.radicado,
          respuesta_id: nuevaRespuesta.id
        },
        transaction
      });

      return nuevaRespuesta;
    });

    let correoEnviado = false;
    let mensajeCorreo = 'La respuesta quedó guardada, pero no se pudo enviar por correo.';

    try {
      if (!pqrs.correo_electronico) {
        throw new Error('La PQRS no tiene un correo electrónico de destino.');
      }

      await enviarRespuestaPQRS({
        destinatario: pqrs.correo_electronico,
        nombre: pqrs.nombre_solicitante,
        radicado: pqrs.radicado,
        contenido: respuesta.contenido
      });

      correoEnviado = true;
      mensajeCorreo = 'La respuesta se guardó y se envió al correo del ciudadano.';
      await registrarAuditoria({
        usuarioId,
        pqrsId: pqrs.id,
        accion: 'RESPUESTA_ENVIADA_CORREO',
        detalle: {
          radicado: pqrs.radicado,
          respuesta_id: respuesta.id,
          destinatario: pqrs.correo_electronico
        }
      });
    } catch (errorCorreo) {
      console.error('Respuesta guardada; fallo el envío del correo:', errorCorreo.message);
      mensajeCorreo = 'La respuesta quedó guardada, pero el correo no se envió: ' + errorCorreo.message;
    }

    return res.status(201).json({
      exito: true,
      mensaje: mensajeCorreo,
      correo_enviado: correoEnviado,
      datos: respuesta
    });

  } catch (error) {
    console.error('Error al registrar respuesta:', error);

    return res.status(500).json({
      exito: false,
      mensaje: 'No fue posible registrar la respuesta.',
      datos: error.message
    });
  }
};

// Consultar el historial de respuestas de una PQRS
const listarRespuestasPorPqrs = async (req, res) => {
  try {
    const { id } = req.params;

    const pqrs = await Pqrs.findByPk(id);

    if (!pqrs) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No se encontró la PQRS indicada.'
      });
    }

    const respuestas = await Respuesta.findAll({
      where: { pqrs_id: pqrs.id },
      order: [['fecha_respuesta', 'ASC']]
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Historial de respuestas obtenido correctamente.',
      datos: respuestas
    });

  } catch (error) {
    console.error('Error al consultar respuestas:', error);

    return res.status(500).json({
      exito: false,
      mensaje: 'No fue posible consultar el historial de respuestas.',
      datos: error.message
    });
  }
};

module.exports = {
  registrarRespuesta,
  listarRespuestasPorPqrs
};
