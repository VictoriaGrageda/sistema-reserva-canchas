/*
  Warnings:

  - You are about to drop the column `deporte` on the `canchas` table. All the data in the column will be lost.
  - You are about to drop the column `precio_hora` on the `canchas` table. All the data in the column will be lost.
  - You are about to drop the column `superficie` on the `canchas` table. All the data in the column will be lost.
  - You are about to alter the column `lat` on the `complejos` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,7)` to `Decimal(9,6)`.
  - You are about to alter the column `lng` on the `complejos` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,7)` to `Decimal(9,6)`.
  - Added the required column `tipoCancha` to the `canchas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoCancha" AS ENUM ('FUT5', 'FUT7', 'FUT11', 'SINTETICO', 'CESPED', 'PARQUET', 'TIERRA');

-- DropIndex
DROP INDEX "public"."canchas_deporte_idx";

-- AlterTable
ALTER TABLE "canchas" DROP COLUMN "deporte",
DROP COLUMN "precio_hora",
DROP COLUMN "superficie",
ADD COLUMN     "precioDiurnoPorHora" DECIMAL(10,2),
ADD COLUMN     "precioNocturnoPorHora" DECIMAL(10,2),
ADD COLUMN     "tipoCancha" "TipoCancha" NOT NULL;

-- AlterTable
ALTER TABLE "complejos" ADD COLUMN     "celular" TEXT,
ADD COLUMN     "diasDisponibles" "DiaSemana"[],
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "otb" TEXT,
ADD COLUMN     "precioDiurnoPorHora" DECIMAL(10,2),
ADD COLUMN     "precioNocturnoPorHora" DECIMAL(10,2),
ADD COLUMN     "qrUrl" TEXT,
ADD COLUMN     "subalcaldia" TEXT,
ALTER COLUMN "lat" SET DATA TYPE DECIMAL(9,6),
ALTER COLUMN "lng" SET DATA TYPE DECIMAL(9,6);

-- CreateIndex
CREATE INDEX "canchas_tipoCancha_idx" ON "canchas"("tipoCancha");

-- CreateIndex
CREATE INDEX "complejos_ciudad_nombre_idx" ON "complejos"("ciudad", "nombre");
