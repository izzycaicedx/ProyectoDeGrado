-- AIREC Grupo Médico
-- Primera etapa del módulo de auditoría: estructura de almacenamiento.
-- Ejecutar una sola vez en la base de datos PostgreSQL de AIREC.

CREATE TABLE IF NOT EXISTS auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    pqrs_id INTEGER NULL REFERENCES pqrs(id) ON DELETE SET NULL,
    accion VARCHAR(80) NOT NULL,
    detalle TEXT NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha
    ON auditoria (fecha_registro DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
    ON auditoria (usuario_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_pqrs
    ON auditoria (pqrs_id);
