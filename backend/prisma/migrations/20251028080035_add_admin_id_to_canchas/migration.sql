/*
  Warnings:

  - Made the column `tipoCampo` on table `canchas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "canchas" ADD COLUMN     "admin_id" UUID,
ALTER COLUMN "tipoCampo" SET NOT NULL;

-- CreateIndex
CREATE INDEX "canchas_admin_id_idx" ON "canchas"("admin_id");

-- AddForeignKey
ALTER TABLE "canchas" ADD CONSTRAINT "canchas_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
