-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('pendiente', 'cliente', 'administrador');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('pendiente', 'confirmada', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'confirmado', 'rechazado');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('reserva_creada', 'pago_confirmado', 'recordatorio');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "contraseña" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'pendiente',
    "foto_perfil" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complejos" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "ciudad" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "telefono" TEXT,
    "logotipo" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "admin_id" UUID NOT NULL,

    CONSTRAINT "complejos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canchas" (
    "id" UUID NOT NULL,
    "complejo_id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "deporte" TEXT NOT NULL,
    "superficie" TEXT,
    "precio_hora" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "canchas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" UUID NOT NULL,
    "cancha_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_items" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "horario_id" UUID NOT NULL,
    "precio" DECIMAL(10,2),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "reserva_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL,
    "reserva_id" UUID NOT NULL,
    "qr_id" UUID,
    "estado" "EstadoPago" NOT NULL DEFAULT 'pendiente',
    "fecha_pago" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qrs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "imagen_qr" TEXT NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "qrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "reserva_id" UUID,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion",
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "complejos_admin_id_idx" ON "complejos"("admin_id");

-- CreateIndex
CREATE INDEX "complejos_ciudad_idx" ON "complejos"("ciudad");

-- CreateIndex
CREATE UNIQUE INDEX "complejos_nombre_ciudad_key" ON "complejos"("nombre", "ciudad");

-- CreateIndex
CREATE INDEX "canchas_complejo_id_idx" ON "canchas"("complejo_id");

-- CreateIndex
CREATE INDEX "canchas_deporte_idx" ON "canchas"("deporte");

-- CreateIndex
CREATE UNIQUE INDEX "canchas_complejo_id_nombre_key" ON "canchas"("complejo_id", "nombre");

-- CreateIndex
CREATE INDEX "horarios_cancha_id_fecha_idx" ON "horarios"("cancha_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_cancha_id_fecha_hora_inicio_hora_fin_key" ON "horarios"("cancha_id", "fecha", "hora_inicio", "hora_fin");

-- CreateIndex
CREATE INDEX "reservas_usuario_id_idx" ON "reservas"("usuario_id");

-- CreateIndex
CREATE INDEX "reserva_items_reserva_id_idx" ON "reserva_items"("reserva_id");

-- CreateIndex
CREATE INDEX "reserva_items_horario_id_idx" ON "reserva_items"("horario_id");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_items_horario_id_key" ON "reserva_items"("horario_id");

-- CreateIndex
CREATE INDEX "pagos_reserva_id_idx" ON "pagos"("reserva_id");

-- CreateIndex
CREATE INDEX "pagos_qr_id_idx" ON "pagos"("qr_id");

-- CreateIndex
CREATE INDEX "qrs_admin_id_idx" ON "qrs"("admin_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_idx" ON "notificaciones"("usuario_id");

-- CreateIndex
CREATE INDEX "notificaciones_reserva_id_idx" ON "notificaciones"("reserva_id");

-- AddForeignKey
ALTER TABLE "complejos" ADD CONSTRAINT "complejos_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_cancha_id_fkey" FOREIGN KEY ("cancha_id") REFERENCES "canchas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_items" ADD CONSTRAINT "reserva_items_horario_id_fkey" FOREIGN KEY ("horario_id") REFERENCES "horarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_items" ADD CONSTRAINT "reserva_items_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_qr_id_fkey" FOREIGN KEY ("qr_id") REFERENCES "qrs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qrs" ADD CONSTRAINT "qrs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
