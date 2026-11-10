const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

function consulta(sql, replacements = {}) {
  return sequelize.query(sql, { type: QueryTypes.SELECT, replacements });
}

const obtenerEstadisticas = async (req, res) => {
  try {
    // Este controlador es de solo lectura: no modifica estados ni registros.
    const { desde, hasta } = req.query;
    let filtro = '';
    let filtroP = '';
    const replacements = {};

    if (desde || hasta) {
      const fechaValida = (valor) =>
        typeof valor === 'string' &&
        /^\\d{4}-\\d{2}-\\d{2}$/.test(valor) &&
        !Number.isNaN(Date.parse(valor + 'T00:00:00Z')) &&
        new Date(valor + 'T00:00:00Z').toISOString().slice(0, 10) === valor;

      if (!fechaValida(desde) || !fechaValida(hasta) || desde >= hasta) {
        return res.status(400).json({
          exito: false,
          mensaje: 'El rango de fechas no es válido.',
          datos: null
        });
      }

      replacements.desde = desde;
      replacements.hasta = hasta;
      filtro = ' WHERE fecha_registro >= CAST(:desde AS DATE) AND fecha_registro < CAST(:hasta AS DATE)';
      filtroP = ' WHERE p.fecha_registro >= CAST(:desde AS DATE) AND p.fecha_registro < CAST(:hasta AS DATE)';
    }

    const resultados = await Promise.all([
      consulta(
        "SELECT count(*)::int AS total, " +
        "count(*) FILTER (WHERE estado = 'Cerrado')::int AS cerrados, " +
        "count(*) FILTER (WHERE estado = 'Vencido')::int AS vencidos, " +
        "count(*) FILTER (WHERE asignado_a IS NULL AND estado <> 'Cerrado')::int AS sin_asignar " +
        "FROM pqrs" + filtro,
        replacements
      ),
      consulta(
        "SELECT tipo AS etiqueta, count(*)::int AS total FROM pqrs" + filtro +
        " GROUP BY tipo ORDER BY total DESC",
        replacements
      ),
      consulta(
        "SELECT estado AS etiqueta, count(*)::int AS total FROM pqrs" + filtro +
        " GROUP BY estado ORDER BY total DESC",
        replacements
      ),
      consulta(
        "SELECT sede AS etiqueta, count(*)::int AS total FROM pqrs" + filtro +
        " GROUP BY sede ORDER BY total DESC",
        replacements
      ),
      consulta(
        "SELECT COALESCE(c.nombre, 'Sin categoría') AS etiqueta, count(DISTINCT p.id)::int AS total " +
        "FROM pqrs p " +
        "LEFT JOIN pqrs_categoria pc ON pc.pqrs_id = p.id " +
        "LEFT JOIN categorias c ON c.id = pc.categoria_id " +
        filtroP +
        " GROUP BY COALESCE(c.nombre, 'Sin categoría') ORDER BY total DESC",
        replacements
      ),
      consulta(
        "SELECT to_char(date_trunc('month', fecha_registro), 'YYYY-MM') AS etiqueta, count(*)::int AS total " +
        "FROM pqrs" + filtro + " GROUP BY 1 ORDER BY 1",
        replacements
      )
    ]);

    return res.status(200).json({
      exito: true,
      mensaje: 'Estadísticas obtenidas correctamente.',
      datos: {
        resumen: resultados[0][0],
        porTipo: resultados[1],
        porEstado: resultados[2],
        porSede: resultados[3],
        porCategoria: resultados[4],
        porMes: resultados[5]
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener las estadísticas.',
      datos: error.message
    });
  }
};

module.exports = { obtenerEstadisticas };
