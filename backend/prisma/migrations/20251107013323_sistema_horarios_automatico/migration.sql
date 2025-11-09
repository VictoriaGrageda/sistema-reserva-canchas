-- CreateEnum
CREATE TYPE "TipoReserva" AS ENUM ('diaria', 'mensual', 'recurrente');

-- AlterTable
ALTER TABLE "canchas" ADD COLUMN     "horaCorte" TEXT DEFAULT '18:00';

-- AlterTable
ALTER TABLE "horarios" ADD COLUMN     "es_diurno" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "precio" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "reservas" ADD COLUMN     "recurrencia_dia_semana" "DiaSemana",
ADD COLUMN     "recurrencia_hora" TEXT,
ADD COLUMN     "tipo_reserva" "TipoReserva" NOT NULL DEFAULT 'diaria';

-- CreateTable
CREATE TABLE "configuraciones_horarios" (
    "id" UUID NOT NULL,
    "cancha_id" UUID NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "configuraciones_horarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "configuraciones_horarios_cancha_id_idx" ON "configuraciones_horarios"("cancha_id");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_horarios_cancha_id_dia_semana_hora_inicio_h_key" ON "configuraciones_horarios"("cancha_id", "dia_semana", "hora_inicio", "hora_fin");

-- CreateIndex
CREATE INDEX "horarios_cancha_id_fecha_disponible_idx" ON "horarios"("cancha_id", "fecha", "disponible");

-- CreateIndex
CREATE INDEX "reservas_tipo_reserva_idx" ON "reservas"("tipo_reserva");

-- AddForeignKey
ALTER TABLE "configuraciones_horarios" ADD CONSTRAINT "configuraciones_horarios_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
