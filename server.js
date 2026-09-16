require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { probarConexion } = require('./src/config/database');
const testRoutes = require('./src/routes/test.routes');
const pqrsRoutes = require('./src/routes/pqrs.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    sistema: 'API - Sistema de Gestión de PQRS',
    empresa: 'AIREC Grupo Médico',
    estado: 'Funcionando correctamente',
  });
});

app.use('/api', testRoutes);
app.use('/api', pqrsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  await probarConexion();
});