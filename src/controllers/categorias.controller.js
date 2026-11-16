const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { registrarAuditoria } = require('../utils/auditoria');

const listarCategorias = async (req, res) => {
  try {
    const categorias = await sequelize.query(
      'SELECT id, nombre, descripcion FROM categorias ORDER BY id',
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json({
      exito: true,
      mensaje: 'Categorías obtenidas correctamente.',
      datos: categorias
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener las categorías.',
      datos: error.message
    });
  }
};

const listarAsignadas = async (req, res) => {
  try {
    const asignadas = await sequelize.query(
      'SELECT pqrs_id, categoria_id FROM pqrs_categoria',
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json({
      exito: true,
      mensaje: 'Clasificaciones obtenidas correctamente.',
      datos: asignadas
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener las clasificaciones.',
      datos: error.message
    });
  }
};

const asignarCategoria = async (req, res) => {
  try {
    const pqrsId = Number(req.params.id);
    const categoriaId = req.body.categoria_id ? Number(req.body.categoria_id) : null;

    if (!Number.isInteger(pqrsId)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El identificador del PQRS no es válido.',
        datos: null
      });
    }

    const pqrs = await sequelize.query(
      'SELECT id FROM pqrs WHERE id = :id',
      { replacements: { id: pqrsId }, type: QueryTypes.SELECT }
    );
    if (pqrs.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'PQRS no encontrado.',
        datos: null
      });
    }

    if (categoriaId !== null) {
      const cat = await sequelize.query(
        'SELECT id FROM categorias WHERE id = :id',
        { replacements: { id: categoriaId }, type: QueryTypes.SELECT }
      );
      if (cat.length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'La categoría no existe.',
          datos: null
        });
      }
    }

    // Una categoría por PQRS: se reemplaza la anterior
    await sequelize.transaction(async function (t) {
      const anterior = await sequelize.query(
        'SELECT categoria_id FROM pqrs_categoria WHERE pqrs_id = :p',
        { replacements: { p: pqrsId }, type: QueryTypes.SELECT, transaction: t }
      );

      await sequelize.query(
        'DELETE FROM pqrs_categoria WHERE pqrs_id = :p',
        { replacements: { p: pqrsId }, transaction: t }
      );
      if (categoriaId !== null) {
        await sequelize.query(
          'INSERT INTO pqrs_categoria (pqrs_id, categoria_id) VALUES (:p, :c)',
          { replacements: { p: pqrsId, c: categoriaId }, transaction: t }
        );
      }

      await registrarAuditoria({
        usuarioId: req.usuario?.id || null,
        pqrsId,
        accion: 'CLASIFICACION',
        detalle: {
          categoria_anterior: anterior[0]?.categoria_id || null,
          categoria_nueva: categoriaId
        },
        transaction: t
      });
    });

    return res.status(200).json({
      exito: true,
      mensaje: 'Categoría asignada correctamente.',
      datos: { pqrs_id: pqrsId, categoria_id: categoriaId }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al asignar la categoría.',
      datos: error.message
    });
  }
};

module.exports = { listarCategorias, listarAsignadas, asignarCategoria };