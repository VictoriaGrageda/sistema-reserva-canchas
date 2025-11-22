-- CreateEnum
CREATE TYPE "EstadoMensualidad" AS ENUM ('activa', 'cancelada', 'finalizada');

-- CreateTable
CREATE TABLE "mensualidades" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cancha_id" UUID NOT NULL,
    "tipo_plan" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "sesiones" INTEGER NOT NULL,
    "monto_total" DECIMAL(12,2) NOT NULL,
    "rangos" JSONB NOT NULL,
    "estado" "EstadoMensualidad" NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "mensualidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mensualidades_reserva_id_key" ON "mensualidades"("reserva_id");

-- CreateIndex
CREATE INDEX "mensualidades_usuario_id_idx" ON "mensualidades"("usuario_id");

-- CreateIndex
CREATE INDEX "mensualidades_cancha_id_idx" ON "mensualidades"("cancha_id");

-- AddForeignKey
ALTER TABLE "mensualidades" ADD CONSTRAINT "mensualidades_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensualidades" ADD CONSTRAINT "mensualidades_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensualidades" ADD CONSTRAINT "mensualidades_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
