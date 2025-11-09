-- Script para limpiar todos los datos de la base de datos
-- ADVERTENCIA: Este script eliminará TODOS los datos de forma IRREVERSIBLE

-- Deshabilitar restricciones de claves foráneas temporalmente
SET session_replication_role = 'replica';

-- Borrar datos de todas las tablas en orden inverso de dependencias
TRUNCATE TABLE notificaciones CASCADE;
TRUNCATE TABLE pagos CASCADE;
TRUNCATE TABLE qrs CASCADE;
TRUNCATE TABLE reserva_items CASCADE;
TRUNCATE TABLE reservas CASCADE;
TRUNCATE TABLE horarios CASCADE;
TRUNCATE TABLE configuraciones_horarios CASCADE;
TRUNCATE TABLE canchas CASCADE;
TRUNCATE TABLE complejos CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- Rehabilitar restricciones de claves foráneas
SET session_replication_role = 'origin';

-- Mensaje de confirmación
SELECT 'Todos los datos han sido borrados exitosamente' as mensaje;
