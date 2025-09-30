/*
  Warnings:

  - Added the required column `admin_id` to the `complejos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apellidos` to the `usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ci` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."complejos" ADD COLUMN     "admin_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."usuarios" ADD COLUMN     "apellidos" TEXT NOT NULL,
ADD COLUMN     "ci" TEXT NOT NULL,
ALTER COLUMN "rol" SET DEFAULT 'cliente';

-- CreateIndex
CREATE INDEX "complejos_admin_id_idx" ON "public"."complejos"("admin_id");

-- AddForeignKey
ALTER TABLE "public"."complejos" ADD CONSTRAINT "complejos_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
