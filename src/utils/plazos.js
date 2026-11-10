const { Op } = require('sequelize');
const Pqrs = require('../models/Pqrs');

// Días hábiles de plazo por tipo. Ajústalos según tu Marco Legal.
const PLAZOS_DIAS_HABILES = {
  Peticion: 15,
  Queja: 15,
  Reclamo: 15,
  Sugerencia: 15
};
const PLAZO_POR_DEFECTO = 15;

// Fecha local en formato YYYY-MM-DD (evita desfases por zona horaria)
function fechaLocalISO(fecha) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return a + '-' + m + '-' + d;
}

// Suma días hábiles (lunes a viernes). No contempla festivos.
function sumarDiasHabiles(desde, dias) {
  const f = new Date(desde);
  let contados = 0;
  while (contados < dias) {
    f.setDate(f.getDate() + 1);
    const dia = f.getDay();
    if (dia !== 0 && dia !== 6) contados++;
  }
  return fechaLocalISO(f);
}

function calcularFechaLimite(tipo) {
  const dias = PLAZOS_DIAS_HABILES[tipo] || PLAZO_POR_DEFECTO;
  return sumarDiasHabiles(new Date(), dias);
}

// Pasa a "Vencido" los PQRS cuya fecha límite ya pasó y que no están cerrados
async function marcarVencidos() {
  const hoy = fechaLocalISO(new Date());
  await Pqrs.update(
    { estado: 'Vencido' },
    {
      where: {
        fecha_limite: { [Op.lt]: hoy },
        estado: { [Op.notIn]: ['Cerrado', 'Vencido'] }
      }
    }
  );
}

module.exports = { calcularFechaLimite, marcarVencidos };