/*
  Warnings:

  - The `isActive` column on the `AttendanceData` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AttendanceData" DROP COLUMN "isActive",
ADD COLUMN     "isActive" SMALLINT NOT NULL DEFAULT 1;
