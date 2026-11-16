-- AIREC: permitir usuarios sin número de documento.
-- Cambio no destructivo: no elimina ni modifica valores existentes.
-- La restricción UNIQUE se conserva; PostgreSQL permite varios NULL.
ALTER TABLE public.usuarios
  ALTER COLUMN documento DROP NOT NULL;
