-- AlterTable
ALTER TABLE "complejos" ALTER COLUMN "diasDisponibles" SET DEFAULT ARRAY[]::"DiaSemana"[],
ALTER COLUMN "precioDiurnoPorHora" DROP NOT NULL,
ALTER COLUMN "precioNocturnoPorHora" DROP NOT NULL;
