// ============================================================
// CAPA: Modelo (la "M" de MVC)
// Este archivo representa la tabla "roles" de PostgreSQL como
// un objeto de JavaScript. Es el primer modelo que creamos,
// como ejemplo — en el Sprint 2 y siguientes crearemos los
// modelos de Usuario, Pqrs, Categoria, etc., siguiendo este
// mismo patrón.
// ============================================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rol = sequelize.define(
  'Rol',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'roles', // le decimos a Sequelize el nombre exacto de la tabla ya creada en PostgreSQL
    timestamps: false,  // la tabla roles no tiene columnas de fecha de creación/actualización
  }
);

module.exports = Rol;
