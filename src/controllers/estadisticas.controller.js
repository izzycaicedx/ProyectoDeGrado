const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { marcarVencidos } = require('../utils/plazos');

function consulta(sql) {
  return sequelize.query(sql, { type: QueryTypes.SELECT });
}

const obtenerEstadisticas = async (req, res) => {
  try {
    // Así los "Vencidos" salen al día
    await marcarVencidos();

    const resultados = await Promise.all([
      consulta(
        "SELECT count(*)::int AS total, " +
        "count(*) FILTER (WHERE estado = 'Cerrado')::int AS cerrados, " +
        "count(*) FILTER (WHERE estado = 'Vencido')::int AS vencidos, " +
        "count(*) FILTER (WHERE asignado_a IS NULL AND estado <> 'Cerrado')::int AS sin_asignar " +
        "FROM pqrs"
      ),
      consulta("SELECT tipo AS etiqueta, count(*)::int AS total FROM pqrs GROUP BY tipo ORDER BY total DESC"),
      consulta("SELECT estado AS etiqueta, count(*)::int AS total FROM pqrs GROUP BY estado ORDER BY total DESC"),
      consulta("SELECT sede AS etiqueta, count(*)::int AS total FROM pqrs GROUP BY sede ORDER BY total DESC"),
      consulta(
        "SELECT COALESCE(c.nombre, 'Sin categoría') AS etiqueta, count(*)::int AS total " +
        "FROM pqrs p " +
        "LEFT JOIN pqrs_categoria pc ON pc.pqrs_id = p.id " +
        "LEFT JOIN categorias c ON c.id = pc.categoria_id " +
        "GROUP BY COALESCE(c.nombre, 'Sin categoría') ORDER BY total DESC"
      ),
      consulta(
        "SELECT to_char(date_trunc('month', fecha_registro), 'YYYY-MM') AS etiqueta, count(*)::int AS total " +
        "FROM pqrs GROUP BY 1 ORDER BY 1"
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
    console.error(error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener las estadísticas.',
      datos: error.message
    });
  }
};

module.exports = { obtenerEstadisticas };