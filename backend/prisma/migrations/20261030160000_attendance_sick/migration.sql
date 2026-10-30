CREATE TYPE "AttendanceStatus" AS ENUM ('ABSENT', 'SICK');

ALTER TABLE "Attendance" ADD COLUMN "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT';
