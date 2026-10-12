const Pqrs = require('../models/Pqrs');

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
      nombre_acompanante: es_mismo_paciente === false ? nombre_acompanante : null,
      parentesco_acompanante: es_mismo_paciente === false ? parentesco_acompanante : null,
      telefono_acompanante: es_mismo_paciente === false ? telefono_acompanante : null,
      descripcion,
      estado: 'Recibido'
    });

    const anio = new Date().getFullYear();
    const radicado = `PQRS-${anio}-${String(nuevoPqrs.id).padStart(4, '0')}`;

    nuevoPqrs.radicado = radicado;
    await nuevoPqrs.save();

    return res.status(201).json({
      exito: true,
      mensaje: 'PQRS radicado exitosamente.',
      datos: nuevoPqrs
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al radicar el PQRS.',
      datos: error.message
    });
  }
};

const listarPqrs = async (req, res) => {
  try {
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

    pqrs.estado = estado;
    await pqrs.save();

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

module.exports = {
  crearPqrs,
  listarPqrs,
  obtenerPqrsPorId,
  actualizarEstado
};