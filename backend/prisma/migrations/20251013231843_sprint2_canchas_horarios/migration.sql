/*
  Warnings:

  - A unique constraint covering the columns `[complejo_id,nombre]` on the table `canchas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre,ciudad]` on the table `complejos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cancha_id,fecha,hora_inicio,hora_fin]` on the table `horarios` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[horario_id]` on the table `reserva_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `horarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `notificaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `pagos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `qrs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `reserva_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `reservas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- DropForeignKey
ALTER TABLE "public"."canchas" DROP CONSTRAINT "canchas_complejo_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."horarios" DROP CONSTRAINT "horarios_cancha_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."notificaciones" DROP CONSTRAINT "notificaciones_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."pagos" DROP CONSTRAINT "pagos_reserva_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reserva_items" DROP CONSTRAINT "reserva_items_reserva_id_fkey";

-- DropIndex
DROP INDEX "public"."horarios_cancha_id_idx";

-- AlterTable
ALTER TABLE "canchas" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "complejos" ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "lat" DECIMAL(10,7),
ADD COLUMN     "lng" DECIMAL(10,7);

-- AlterTable
ALTER TABLE "horarios" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "qrs" ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "reserva_items" ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL;

-- AlterTable
ALTER TABLE "reservas" ADD COLUMN     "updated_at" TIMESTAMP(6) NOT NULL;

-- CreateIndex
CREATE INDEX "canchas_deporte_idx" ON "canchas"("deporte");

-- CreateIndex
CREATE UNIQUE INDEX "canchas_complejo_id_nombre_key" ON "canchas"("complejo_id", "nombre");

-- CreateIndex
CREATE INDEX "complejos_ciudad_idx" ON "complejos"("ciudad");

-- CreateIndex
CREATE UNIQUE INDEX "complejos_nombre_ciudad_key" ON "complejos"("nombre", "ciudad");

-- CreateIndex
CREATE INDEX "horarios_cancha_id_fecha_idx" ON "horarios"("cancha_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_cancha_id_fecha_hora_inicio_hora_fin_key" ON "horarios"("cancha_id", "fecha", "hora_inicio", "hora_fin");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_items_horario_id_key" ON "reserva_items"("horario_id");

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_items" ADD CONSTRAINT "reserva_items_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
