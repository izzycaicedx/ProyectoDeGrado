const { sequelize } = require('../config/database');

async function registrarAuditoria({ usuarioId = null, pqrsId = null, accion, detalle, transaction = null }) {
  try {
    await sequelize.query(
      `INSERT INTO auditoria (usuario_id, pqrs_id, accion, detalle)
       VALUES (:usuario_id, :pqrs_id, :accion, :detalle)`,
      {
        replacements: {
          usuario_id: usuarioId,
          pqrs_id: pqrsId,
          accion,
          detalle: typeof detalle === 'string' ? detalle : JSON.stringify(detalle || {})
        },
        transaction
      }
    );
    return true;
  } catch (error) {
    console.error('No fue posible registrar la actividad de auditoría:', error);
    return false;
  }
}

module.exports = { registrarAuditoria };
