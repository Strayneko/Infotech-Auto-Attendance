-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userGroupId" INTEGER,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "infotechUserId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceData" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "locationName" TEXT NOT NULL,
    "latitude" TEXT NOT NULL,
    "longitude" TEXT NOT NULL,
    "remarks" TEXT,
    "timeZone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_slug_key" ON "UserGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceData_userId_key" ON "AttendanceData"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userGroupId_fkey" FOREIGN KEY ("userGroupId") REFERENCES "UserGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceData" ADD CONSTRAINT "AttendanceData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
