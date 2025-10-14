/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Rol" AS ENUM ('cliente', 'administrador');

-- CreateEnum
CREATE TYPE "public"."EstadoReserva" AS ENUM ('pendiente', 'confirmada', 'cancelada');

-- CreateEnum
CREATE TYPE "public"."EstadoPago" AS ENUM ('pendiente', 'confirmado', 'rechazado');

-- CreateEnum
CREATE TYPE "public"."TipoNotificacion" AS ENUM ('reserva_creada', 'pago_confirmado', 'recordatorio');

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "contraseña" TEXT NOT NULL,
    "rol" "public"."Rol" NOT NULL,
    "foto_perfil" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."complejos" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "logotipo" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "complejos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."canchas" (
    "id" UUID NOT NULL,
    "complejo_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "deporte" TEXT NOT NULL,
    "superficie" TEXT,
    "precio_hora" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horarios" (
    "id" UUID NOT NULL,
    "cancha_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservas" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "estado" "public"."EstadoReserva" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reserva_items" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "horario_id" UUID NOT NULL,
    "precio" DECIMAL(10,2),

    CONSTRAINT "reserva_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pagos" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "qr_id" UUID,
    "estado" "public"."EstadoPago" NOT NULL DEFAULT 'pendiente',
    "fecha_pago" TIMESTAMP(6),

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."qrs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "imagen_qr" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notificaciones" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "reserva_id" UUID,
    "mensaje" TEXT NOT NULL,
    "tipo" "public"."TipoNotificacion",
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "public"."usuarios"("correo");

-- CreateIndex
CREATE INDEX "canchas_complejo_id_idx" ON "public"."canchas"("complejo_id");

-- CreateIndex
CREATE INDEX "horarios_cancha_id_idx" ON "public"."horarios"("cancha_id");

-- CreateIndex
CREATE INDEX "reservas_usuario_id_idx" ON "public"."reservas"("usuario_id");

-- CreateIndex
CREATE INDEX "reserva_items_reserva_id_idx" ON "public"."reserva_items"("reserva_id");

-- CreateIndex
CREATE INDEX "reserva_items_horario_id_idx" ON "public"."reserva_items"("horario_id");

-- CreateIndex
CREATE INDEX "pagos_reserva_id_idx" ON "public"."pagos"("reserva_id");

-- CreateIndex
CREATE INDEX "pagos_qr_id_idx" ON "public"."pagos"("qr_id");

-- CreateIndex
CREATE INDEX "qrs_admin_id_idx" ON "public"."qrs"("admin_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_idx" ON "public"."notificaciones"("usuario_id");

-- CreateIndex
CREATE INDEX "notificaciones_reserva_id_idx" ON "public"."notificaciones"("reserva_id");

-- AddForeignKey
ALTER TABLE "public"."canchas" ADD CONSTRAINT "canchas_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "public"."complejos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."horarios" ADD CONSTRAINT "horarios_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "public"."canchas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reserva_items" ADD CONSTRAINT "reserva_items_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "public"."horarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reserva_items" ADD CONSTRAINT "reserva_items_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "public"."reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagos" ADD CONSTRAINT "pagos_qr_id_fkey" FOREIGN KEY ("qr_id") REFERENCES "public"."qrs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pagos" ADD CONSTRAINT "pagos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "public"."reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."qrs" ADD CONSTRAINT "qrs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificaciones" ADD CONSTRAINT "notificaciones_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "public"."reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
