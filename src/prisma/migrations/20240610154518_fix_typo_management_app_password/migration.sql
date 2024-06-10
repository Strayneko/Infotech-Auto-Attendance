/*
  Warnings:

  - You are about to drop the column `managemenAppPassword` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "managemenAppPassword",
ADD COLUMN     "managementAppPassword" TEXT NOT NULL DEFAULT '$2b$10$0XB8wXg/6koR40tqi/JeMuB2fz3O3i7mpnUWUsVBoljeGdnKm4hza';
