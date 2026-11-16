const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

async function listarUsuarios(req, res) {
  try {
    const [usuarios] = await sequelize.query(
      `SELECT id, nombre, documento, email, rol_id, creado_en
       FROM usuarios ORDER BY id ASC`
    );
    return res.json({ exito: true, datos: usuarios });
  } catch (error) {
    return res.status(500).json({ exito: false, mensaje: 'No fue posible consultar los usuarios.' });
  }
}

async function crearUsuario(req, res) {
  const { nombre, documento, email, password, rol_id } = req.body;
  const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
  const emailLimpio = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const documentoLimpio = typeof documento === 'string' && documento.trim() ? documento.trim() : null;
  const rol = Number(rol_id);

  if (!nombreLimpio || !emailLimpio || !password || !Number.isInteger(rol) || ![2, 3].includes(rol)) {
    return res.status(400).json({
      exito: false,
      mensaje: 'Nombre, correo, contraseña y un rol válido (2 o 3) son obligatorios. El documento es opcional.'
    });
  }
  if (password.length < 8) {
    return res.status(400).json({ exito: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const transaction = await sequelize.transaction();
  try {
    const [roles] = await sequelize.query(
      'SELECT id FROM roles WHERE id = :rol',
      { replacements: { rol }, transaction }
    );
    if (!roles.length) {
      await transaction.rollback();
      return res.status(400).json({ exito: false, mensaje: 'El rol indicado no existe.' });
    }

    const [existentes] = await sequelize.query(
      'SELECT id FROM usuarios WHERE LOWER(email) = LOWER(:email)',
      { replacements: { email: emailLimpio }, transaction }
    );
    if (existentes.length) {
      await transaction.rollback();
      return res.status(409).json({ exito: false, mensaje: 'Ya existe un usuario con ese correo.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const [creados] = await sequelize.query(
      `INSERT INTO usuarios (nombre, documento, email, password, rol_id)
       VALUES (:nombre, :documento, :email, :password, :rol)
       RETURNING id, nombre, documento, email, rol_id, creado_en`,
      {
        replacements: {
          nombre: nombreLimpio,
          documento: documentoLimpio,
          email: emailLimpio,
          password: hash,
          rol
        },
        transaction
      }
    );

    await registrarAuditoria({
      usuarioId: req.usuario.id,
      accion: 'CREACION_USUARIO',
      detalle: { usuario_creado_id: creados[0].id, email: emailLimpio, rol_id: rol },
      transaction
    });
    await transaction.commit();
    return res.status(201).json({ exito: true, mensaje: 'Usuario creado correctamente.', datos: creados[0] });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return res.status(500).json({ exito: false, mensaje: 'No fue posible crear el usuario.' });
  }
}

async function cambiarRolUsuario(req, res) {
  const id = Number(req.params.id);
  const rol = Number(req.body.rol_id);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(rol) || ![2, 3].includes(rol)) {
    return res.status(400).json({ exito: false, mensaje: 'Identificador o rol inválido. Solo se permiten los roles 2 y 3.' });
  }
  if (id === Number(req.usuario.id) && rol !== 3) {
    return res.status(400).json({ exito: false, mensaje: 'No puedes retirar tu propio rol de superadministradora.' });
  }

  const transaction = await sequelize.transaction();
  try {
    const [objetivos] = await sequelize.query(
      'SELECT id, rol_id FROM usuarios WHERE id = :id FOR UPDATE',
      { replacements: { id }, transaction }
    );
    if (!objetivos.length) {
      await transaction.rollback();
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    const rolAnterior = Number(objetivos[0].rol_id);
    if (rolAnterior === 3 && rol !== 3) {
      const [superadmins] = await sequelize.query(
        'SELECT COUNT(*)::int AS total FROM usuarios WHERE rol_id = 3',
        { transaction }
      );
      if (Number(superadmins[0].total) <= 1) {
        await transaction.rollback();
        return res.status(409).json({ exito: false, mensaje: 'No se puede retirar el último rol de superadministradora.' });
      }
    }

    await sequelize.query(
      'UPDATE usuarios SET rol_id = :rol WHERE id = :id',
      { replacements: { rol, id }, transaction }
    );
    await registrarAuditoria({
      usuarioId: req.usuario.id,
      accion: 'CAMBIO_ROL_USUARIO',
      detalle: { usuario_id: id, rol_anterior: rolAnterior, rol_nuevo: rol },
      transaction
    });
    await transaction.commit();
    return res.json({ exito: true, mensaje: 'Rol actualizado correctamente.' });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    return res.status(500).json({ exito: false, mensaje: 'No fue posible actualizar el rol.' });
  }
}

module.exports = { listarUsuarios, crearUsuario, cambiarRolUsuario };
