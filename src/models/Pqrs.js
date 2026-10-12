const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pqrs = sequelize.define('Pqrs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  radicado: {
    type: DataTypes.STRING,
    unique: true
  },
  sede: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Sede Principal - Cali', 'Sede Norte', 'Sede Sur']]
    }
  },
  fecha_evento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  medio: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Formulario Web', 'Presencial', 'Correo Electrónico', 'Teléfono']]
    }
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Petición', 'Queja', 'Reclamo', 'Sugerencia']]
    }
  },
  tipo_documento: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['CC', 'CE', 'TI', 'Pasaporte', 'Otro']]
    }
  },
  numero_documento: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nombre_solicitante: {
    type: DataTypes.STRING,
    allowNull: false
  },
  celular: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono_fijo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  correo_electronico: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  es_mismo_paciente: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  nombre_acompanante: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentesco_acompanante: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [[null, 'Padre', 'Madre', 'Cónyuge', 'Hijo(a)', 'Hermano(a)', 'Otro']]
    }
  },
  telefono_acompanante: {
    type: DataTypes.STRING,
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'Recibido'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'pqrs',
  createdAt: 'fecha_registro',
  updatedAt: false
});

module.exports = Pqrs;