-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_asset_id_fkey";

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "maintenance_request_id" TEXT,
ALTER COLUMN "asset_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Attachment_maintenance_request_id_idx" ON "Attachment"("maintenance_request_id");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Asset"("asset_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_maintenance_request_id_fkey" FOREIGN KEY ("maintenance_request_id") REFERENCES "MaintenanceRequest"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;
