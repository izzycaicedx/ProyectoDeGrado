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
    sede: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['Principal', 'Terapias', 'Clinicas']] },
    },
    fecha_evento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    medio: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: { isIn: [['Verbal', 'Telefonica', 'Buzon', 'Pagina web', 'Correo electronico']] },
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { isIn: [['Peticion', 'Queja', 'Reclamo', 'Sugerencia']] },
    },
    tipo_documento: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: [['CC', 'CE', 'Otro']] },
    },
    numero_documento: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    nombre_solicitante: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    celular: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    telefono_fijo: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    correo_electronico: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    es_mismo_paciente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'Recibido',
      validate: { isIn: [['Recibido', 'En clasificacion', 'En tramite', 'Vencido', 'Cerrado']] },
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'pqrs',
    createdAt: 'fecha_registro',
    updatedAt: false,
  }
);

module.exports = Pqrs;