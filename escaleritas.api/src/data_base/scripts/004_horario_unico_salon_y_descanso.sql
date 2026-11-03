-- =============================================================================
-- MIGRACIÓN 004: Parametrización de Horario Único por Salón, Jornada por Grado
-- (Jardín/Transición 07:30-12:00, 1° a 5° 07:00-13:00) y Descanso Parametrizable
-- Motor: PostgreSQL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.configuracion_salon (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL CONSTRAINT uq_configuracion_salon_curso UNIQUE REFERENCES public.curso(id) ON UPDATE CASCADE ON DELETE CASCADE,
    hora_entrada VARCHAR(10) NOT NULL DEFAULT '07:00',
    hora_salida VARCHAR(10) NOT NULL DEFAULT '13:00',
    hora_inicio_descanso VARCHAR(10) NOT NULL DEFAULT '10:00',
    hora_fin_descanso VARCHAR(10) NOT NULL DEFAULT '10:30',
    tipo_calificacion VARCHAR(20) NOT NULL DEFAULT 'NUMERICA' CHECK (tipo_calificacion IN ('CARITAS', 'NUMERICA')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice único en horario_clase por salón, día y hora de inicio activa
CREATE UNIQUE INDEX IF NOT EXISTS uq_horario_unico_salon_dia_hora
ON public.horario_clase (curso_id, dia_semana, hora_inicio)
WHERE estado = 1;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
