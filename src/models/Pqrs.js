const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pqrs = sequelize.define(
  'Pqrs',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    radicado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['Peticion', 'Queja', 'Reclamo', 'Sugerencia']],
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha_evento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'Recibido',
      validate: {
        isIn: [['Recibido', 'En clasificacion', 'En tramite', 'Vencido', 'Cerrado']],
      },
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'pqrs',
    createdAt: 'fecha_registro',
    updatedAt: false,
  }
);

module.exports = Pqrs;