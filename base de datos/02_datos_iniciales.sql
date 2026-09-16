-- ============================================================
-- Sistema de Gestión de PQRS — AIREC Grupo Médico
-- Script de datos iniciales (seed)
-- Ejecutar DESPUÉS de 01_crear_tablas_pqrs.sql
-- ============================================================
-- Sin estos datos base, no hay roles ni categorías para
-- relacionar con los PQRS y usuarios que se creen.
-- ============================================================

-- Roles básicos del sistema (soporta OE5)
INSERT INTO roles (nombre) VALUES
  ('paciente'),
  ('administrativo'),
  ('coordinador_calidad'),
  ('direccion');

-- Categorías iniciales de la taxonomía (soporta OE2)
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Atencion al usuario', 'Quejas o comentarios sobre el trato recibido'),
  ('Tiempos de espera', 'Relacionado con demoras en la atención'),
  ('Procesos clinicos de cardiologia', 'Relacionado con procedimientos o consultas de cardiología'),
  ('Facturacion', 'Relacionado con cobros, facturas o pagos'),
  ('Otros', 'No clasificable en las categorías anteriores');

-- Un usuario de prueba, para poder probar el registro de PQRS
-- IMPORTANTE: la contraseña aquí es texto plano SOLO para pruebas.
-- En el Sprint 6 (seguridad) se reemplaza por contraseñas encriptadas.
INSERT INTO usuarios (nombre, documento, email, password, rol_id) VALUES
  ('Usuario de Prueba', '1000000000', 'prueba@airec.com', 'temporal123',
   (SELECT id FROM roles WHERE nombre = 'paciente'));

-- Verificación rápida de lo insertado
SELECT * FROM roles;
SELECT * FROM categorias;
SELECT * FROM usuarios;
