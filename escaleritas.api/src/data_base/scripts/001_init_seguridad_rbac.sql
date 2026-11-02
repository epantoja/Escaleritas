-- =============================================================================
-- MIGRACIÓN 001: Módulo de Seguridad RBAC (Usuarios, Roles y Permisos)
-- Proyecto: ERP Educativo Escaleritas (Jardín a 5° de Primaria)
-- Motor: PostgreSQL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Roles (ADMIN, DOCENTE, PADRE_ESTUDIANTE)
CREATE TABLE IF NOT EXISTS public.rol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(40) NOT NULL CONSTRAINT uq_rol_codigo UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(255) NULL,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Permisos
CREATE TABLE IF NOT EXISTS public.permiso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(60) NOT NULL CONSTRAINT uq_permiso_codigo UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    modulo VARCHAR(60) NOT NULL,
    descripcion VARCHAR(255) NULL,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Tabla Intermedia Rol - Permiso (Relación N:M)
CREATE TABLE IF NOT EXISTS public.rol_permiso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol_id UUID NOT NULL REFERENCES public.rol(id) ON UPDATE CASCADE ON DELETE CASCADE,
    permiso_id UUID NOT NULL REFERENCES public.permiso(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rol_permiso UNIQUE (rol_id, permiso_id)
);

-- 4. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS public.usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NULL,
    "codUsuario" VARCHAR(30) NOT NULL CONSTRAINT uq_usuario_cod_usuario UNIQUE,
    email VARCHAR(120) NULL CONSTRAINT uq_usuario_email UNIQUE,
    documento VARCHAR(30) NULL,
    clave VARCHAR(255) NOT NULL,
    rol_id UUID NOT NULL REFERENCES public.rol(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuario_rol_id ON public.usuario(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuario_cod_usuario ON public.usuario(UPPER("codUsuario"));

-- 5. Permisos para el usuario de aplicación (postgres)
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO postgres;


