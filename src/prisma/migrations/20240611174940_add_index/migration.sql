-- CreateIndex
CREATE INDEX "AttendanceData_userId_id_idx" ON "AttendanceData"("userId", "id");

-- CreateIndex
CREATE INDEX "User_id_email_userToken_idx" ON "User"("id", "email", "userToken");
