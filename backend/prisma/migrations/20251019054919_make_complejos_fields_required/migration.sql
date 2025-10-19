/*
  Warnings:

  - Made the column `celular` on table `complejos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `otb` on table `complejos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `precioDiurnoPorHora` on table `complejos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `precioNocturnoPorHora` on table `complejos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subalcaldia` on table `complejos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "complejos" ALTER COLUMN "celular" SET NOT NULL,
ALTER COLUMN "otb" SET NOT NULL,
ALTER COLUMN "precioDiurnoPorHora" SET NOT NULL,
ALTER COLUMN "precioNocturnoPorHora" SET NOT NULL,
ALTER COLUMN "subalcaldia" SET NOT NULL;
