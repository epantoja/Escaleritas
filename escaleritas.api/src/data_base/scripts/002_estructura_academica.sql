-- =============================================================================
-- MIGRACIÓN 002: Gestión de Usuarios (Estudiantes y Docentes) y Estructura Académica
-- Grados: Jardín, Transición, 1°, 2°, 3°, 4° y 5° de Primaria
-- Motor: PostgreSQL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Docentes
CREATE TABLE IF NOT EXISTS public.docente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_docente VARCHAR(30) NOT NULL CONSTRAINT uq_docente_codigo UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(15) NOT NULL DEFAULT 'CC',
    documento VARCHAR(30) NOT NULL CONSTRAINT uq_docente_documento UNIQUE,
    email VARCHAR(120) NOT NULL CONSTRAINT uq_docente_email UNIQUE,
    telefono VARCHAR(30) NULL,
    especialidad VARCHAR(100) NOT NULL,
    titulo_academico VARCHAR(120) NULL,
    fecha_ingreso DATE NULL,
    usuario_id UUID NULL REFERENCES public.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Cursos (Jardín, Transición, 1°, 2°, 3°, 4°, 5° de Primaria)
CREATE TABLE IF NOT EXISTS public.curso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) NOT NULL CONSTRAINT uq_curso_codigo UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    grado VARCHAR(30) NOT NULL CHECK (grado IN ('JARDIN', 'TRANSICION', 'PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO')),
    orden_grado INTEGER NOT NULL DEFAULT 1,
    grupo VARCHAR(10) NOT NULL DEFAULT 'A',
    nivel VARCHAR(30) NOT NULL DEFAULT 'PRIMARIA' CHECK (nivel IN ('PREESCOLAR', 'PRIMARIA')),
    anio_lectivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    cupo_maximo INTEGER NOT NULL DEFAULT 25,
    aula VARCHAR(40) NULL,
    director_docente_id UUID NULL REFERENCES public.docente(id) ON UPDATE CASCADE ON DELETE SET NULL,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Materias / Asignaturas
CREATE TABLE IF NOT EXISTS public.materia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) NOT NULL CONSTRAINT uq_materia_codigo UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    area VARCHAR(80) NULL,
    intensidad_horaria INTEGER NOT NULL DEFAULT 4,
    descripcion VARCHAR(255) NULL,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Tabla Relacional N:M Docente - Curso - Materia
-- (Un docente imparte varias materias a varios cursos)
CREATE TABLE IF NOT EXISTS public.docente_curso_materia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docente_id UUID NOT NULL REFERENCES public.docente(id) ON UPDATE CASCADE ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.curso(id) ON UPDATE CASCADE ON DELETE CASCADE,
    materia_id UUID NOT NULL REFERENCES public.materia(id) ON UPDATE CASCADE ON DELETE CASCADE,
    intensidad_horaria INTEGER NOT NULL DEFAULT 4,
    anio_lectivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    es_titular_curso BOOLEAN NOT NULL DEFAULT FALSE,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_docente_curso_materia_anio UNIQUE (docente_id, curso_id, materia_id, anio_lectivo)
);

-- 5. Tabla de Estudiantes (Matriculados en un Curso)
CREATE TABLE IF NOT EXISTS public.estudiante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_matricula VARCHAR(30) NOT NULL CONSTRAINT uq_estudiante_codigo_matricula UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(15) NOT NULL DEFAULT 'RC',
    documento VARCHAR(30) NOT NULL CONSTRAINT uq_estudiante_documento UNIQUE,
    fecha_nacimiento DATE NULL,
    genero VARCHAR(10) NULL,
    direccion VARCHAR(150) NULL,
    eps VARCHAR(80) NULL,
    tipo_sangre VARCHAR(10) NULL,
    acudiente_nombre VARCHAR(120) NOT NULL,
    acudiente_telefono VARCHAR(30) NOT NULL,
    acudiente_email VARCHAR(120) NULL,
    acudiente_parentesco VARCHAR(40) NOT NULL DEFAULT 'Madre / Padre',
    curso_id UUID NOT NULL REFERENCES public.curso(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    fecha_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_matricula VARCHAR(30) NOT NULL DEFAULT 'MATRICULADO' CHECK (estado_matricula IN ('MATRICULADO', 'PREMATRICULADO', 'RETIRADO', 'GRADUADO')),
    observaciones VARCHAR(255) NULL,
    usuario_id UUID NULL REFERENCES public.usuario(id) ON UPDATE CASCADE ON DELETE SET NULL,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estudiante_curso_id ON public.estudiante(curso_id);
CREATE INDEX IF NOT EXISTS idx_docente_curso_materia_docente ON public.docente_curso_materia(docente_id);
CREATE INDEX IF NOT EXISTS idx_docente_curso_materia_curso ON public.docente_curso_materia(curso_id);

-- Permisos para el usuario de aplicación (postgres)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

