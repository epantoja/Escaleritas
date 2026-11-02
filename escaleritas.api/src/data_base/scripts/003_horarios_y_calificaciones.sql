-- =============================================================================
-- MIGRACIÓN 003: Horarios de Clase por Materia/Docente y Calificaciones
-- Motor: PostgreSQL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Horarios Semanales por Asignación (Docente + Curso + Materia)
CREATE TABLE IF NOT EXISTS public.horario_clase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asignacion_id UUID NOT NULL REFERENCES public.docente_curso_materia(id) ON UPDATE CASCADE ON DELETE CASCADE,
    docente_id UUID NOT NULL REFERENCES public.docente(id) ON UPDATE CASCADE ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.curso(id) ON UPDATE CASCADE ON DELETE CASCADE,
    materia_id UUID NOT NULL REFERENCES public.materia(id) ON UPDATE CASCADE ON DELETE CASCADE,
    dia_semana VARCHAR(15) NOT NULL CHECK (dia_semana IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES')),
    hora_inicio VARCHAR(10) NOT NULL,
    hora_fin VARCHAR(10) NOT NULL,
    aula VARCHAR(50) NULL,
    estado INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Calificaciones / Notas por Estudiante y Materia
CREATE TABLE IF NOT EXISTS public.calificacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID NOT NULL REFERENCES public.estudiante(id) ON UPDATE CASCADE ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES public.curso(id) ON UPDATE CASCADE ON DELETE CASCADE,
    materia_id UUID NOT NULL REFERENCES public.materia(id) ON UPDATE CASCADE ON DELETE CASCADE,
    docente_id UUID NULL REFERENCES public.docente(id) ON UPDATE CASCADE ON DELETE SET NULL,
    nota_p1 NUMERIC(3, 1) NULL,
    nota_p2 NUMERIC(3, 1) NULL,
    nota_p3 NUMERIC(3, 1) NULL,
    nota_p4 NUMERIC(3, 1) NULL,
    nota_definitiva NUMERIC(3, 1) NULL,
    observacion VARCHAR(255) NULL,
    anio_lectivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_calificacion_estudiante_materia_anio UNIQUE (estudiante_id, materia_id, anio_lectivo)
);

CREATE INDEX IF NOT EXISTS idx_horario_docente ON public.horario_clase(docente_id);
CREATE INDEX IF NOT EXISTS idx_horario_curso ON public.horario_clase(curso_id);
CREATE INDEX IF NOT EXISTS idx_calificacion_estudiante ON public.calificacion(estudiante_id);

-- Permisos para el usuario postgres
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

