-- AlterTable
ALTER TABLE "AttendanceData" ADD COLUMN     "isImmediate" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "isSubscribeMail" SMALLINT NOT NULL DEFAULT 1;
