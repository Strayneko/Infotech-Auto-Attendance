/*
  Warnings:

  - You are about to alter the column `isActive` on the `AttendanceData` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.

*/
-- AlterTable
ALTER TABLE "AttendanceData" ALTER COLUMN "isActive" SET DATA TYPE SMALLINT;
