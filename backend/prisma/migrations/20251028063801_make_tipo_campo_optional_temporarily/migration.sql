/*
  Warnings:

  - The values [FUT7,SINTETICO,CESPED,PARQUET,TIERRA] on the enum `TipoCancha` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('SINTETICO', 'TIERRA', 'CESPED');

-- AlterEnum
BEGIN;
CREATE TYPE "TipoCancha_new" AS ENUM ('FUT5', 'FUT6', 'FUT8', 'FUT11');
ALTER TABLE "canchas" ALTER COLUMN "tipoCancha" TYPE "TipoCancha_new" USING ("tipoCancha"::text::"TipoCancha_new");
ALTER TYPE "TipoCancha" RENAME TO "TipoCancha_old";
ALTER TYPE "TipoCancha_new" RENAME TO "TipoCancha";
DROP TYPE "public"."TipoCancha_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."canchas" DROP CONSTRAINT "canchas_complejo_id_fkey";

-- AlterTable
ALTER TABLE "canchas" ADD COLUMN     "celular" TEXT,
ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "diasDisponibles" "DiaSemana"[],
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "lat" DECIMAL(9,6),
ADD COLUMN     "lng" DECIMAL(9,6),
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "otb" TEXT,
ADD COLUMN     "qrUrl" TEXT,
ADD COLUMN     "subalcaldia" TEXT,
ADD COLUMN     "tipoCampo" "TipoCampo",
ALTER COLUMN "complejo_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "canchas_ciudad_idx" ON "canchas"("ciudad");

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
