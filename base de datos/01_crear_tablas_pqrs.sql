-- ============================================================
-- Sistema de Gestión de PQRS — AIREC Grupo Médico
-- Script DDL: creación de tablas en PostgreSQL
-- Sprint 1 — Modelado de Base de Datos
-- ============================================================
-- Orden de creación: primero las tablas "independientes"
-- (ROLES, PERMISOS, CATEGORIAS), luego las que dependen de ellas
-- mediante llaves foráneas (FK).
-- ============================================================


-- ============================================================
-- TABLA: ROLES
-- Define los roles del sistema (ej. paciente, administrativo,
-- coordinador de calidad, dirección). Soporta OE5.
-- ============================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,          -- se autoincrementa solo (1, 2, 3...)
    nombre      VARCHAR(50) NOT NULL UNIQUE  -- ej. 'paciente', 'administrador'
);


-- ============================================================
-- TABLA: PERMISOS
-- Define las acciones puntuales que se pueden autorizar
-- (ej. 'crear_pqrs', 'ver_dashboard'). Soporta OE5.
-- ============================================================
CREATE TABLE permisos (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE
);


-- ============================================================
-- TABLA: ROL_PERMISO
-- Tabla intermedia: conecta ROLES con PERMISOS.
-- Un rol puede tener muchos permisos, y un permiso puede
-- pertenecer a muchos roles (relación muchos a muchos).
-- ============================================================
CREATE TABLE rol_permiso (
    rol_id      INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id  INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)  -- la combinación no se puede repetir
);


-- ============================================================
-- TABLA: USUARIOS
-- Todas las personas que usan el sistema: pacientes,
-- administrativos, coordinadores, dirección.
-- ============================================================
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    documento   VARCHAR(30)  NOT NULL UNIQUE,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,        -- se guardará encriptada, nunca en texto plano
    rol_id      INTEGER NOT NULL REFERENCES roles(id),
    creado_en   TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TABLA: CATEGORIAS
-- Taxonomía parametrizable de clasificación de PQRS. Soporta OE2.
-- ============================================================
CREATE TABLE categorias (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);


-- ============================================================
-- TABLA: PQRS
-- Tabla central del sistema: cada registro es una Petición,
-- Queja, Reclamo o Sugerencia. Soporta OE1.
-- ============================================================
CREATE TABLE pqrs (
    id              SERIAL PRIMARY KEY,
    radicado        VARCHAR(30) NOT NULL UNIQUE,   -- generado por el sistema, ej. 'PQRS-2026-0001'
    tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('Peticion','Queja','Reclamo','Sugerencia')),
    descripcion     TEXT NOT NULL,
    fecha_evento    DATE NOT NULL,
    estado          VARCHAR(30) NOT NULL DEFAULT 'Recibido'
                    CHECK (estado IN ('Recibido','En clasificacion','En tramite','Vencido','Cerrado')),
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_registro  TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TABLA: PQRS_CATEGORIA
-- Tabla intermedia: un PQRS puede tener varias categorías,
-- y una categoría puede aplicar a varios PQRS.
-- ============================================================
CREATE TABLE pqrs_categoria (
    pqrs_id       INTEGER NOT NULL REFERENCES pqrs(id) ON DELETE CASCADE,
    categoria_id  INTEGER NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    PRIMARY KEY (pqrs_id, categoria_id)
);


-- ============================================================
-- TABLA: ALERTAS
-- Registra las alertas automáticas generadas por vencimiento
-- de plazos. Soporta OE3.
-- ============================================================
CREATE TABLE alertas (
    id              SERIAL PRIMARY KEY,
    pqrs_id         INTEGER NOT NULL REFERENCES pqrs(id) ON DELETE CASCADE,
    fecha_generada  TIMESTAMP NOT NULL DEFAULT NOW(),
    tipo_alerta     VARCHAR(30) NOT NULL
                    CHECK (tipo_alerta IN ('Proxima a vencer','Vencida')),
    estado          VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
                    CHECK (estado IN ('Pendiente','Notificada'))
);


-- ============================================================
-- TABLA: RESPUESTAS
-- Registra la resolución/respuesta dada a cada PQRS.
-- Es el insumo para los dashboards (OE4).
-- ============================================================
CREATE TABLE respuestas (
    id              SERIAL PRIMARY KEY,
    pqrs_id         INTEGER NOT NULL REFERENCES pqrs(id) ON DELETE CASCADE,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),  -- quién respondió
    contenido       TEXT NOT NULL,
    fecha_respuesta TIMESTAMP NOT NULL DEFAULT NOW()
);


-- ============================================================
-- Fin del script.
-- Siguiente paso sugerido: insertar datos iniciales (roles
-- básicos y categorías) con un script 02_datos_iniciales.sql
-- ============================================================
