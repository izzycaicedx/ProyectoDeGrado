const bcrypt = require('bcryptjs');
const { QueryTypes } = require('sequelize');
const Usuario = require('../models/Usuario');
const { sequelize } = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

const consultarAuditoria = async (req, res) => {
  try {
    const { password } = req.body;
    if (typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ exito: false, mensaje: 'Debes ingresar tu contraseña.', datos: null });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(401).json({ exito: false, mensaje: 'No se pudo validar el usuario.', datos: null });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ exito: false, mensaje: 'La contraseña no es correcta.', datos: null });
    }

    const registros = await sequelize.query(
      `SELECT a.id, a.accion, a.detalle, a.fecha_registro,
              u.nombre AS usuario_nombre,
              p.radicado
       FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN pqrs p ON p.id = a.pqrs_id
       ORDER BY a.fecha_registro DESC
       LIMIT 200`,
      { type: QueryTypes.SELECT }
    );

    await registrarAuditoria({
      usuarioId: req.usuario.id,
      accion: 'CONSULTA_AUDITORIA',
      detalle: { cantidad_resultados: registros.length }
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Historial de auditoría consultado correctamente.',
      datos: registros
    });
  } catch (error) {
    console.error('Error al consultar auditoría:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'No fue posible consultar el historial de auditoría.',
      datos: null
    });
  }
};

module.exports = { consultarAuditoria };
