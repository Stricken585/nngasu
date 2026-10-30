ALTER TABLE "Grade" ALTER COLUMN "value" DROP NOT NULL,
ADD COLUMN "date" DATE,
ADD COLUMN "status" TEXT,
ADD COLUMN "comment" TEXT;

UPDATE "Grade" SET "date" = "createdAt"::date;

ALTER TABLE "Grade" ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Grade_disciplineId_date_idx" ON "Grade"("disciplineId", "date");

CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attendance_studentId_disciplineId_date_key" ON "Attendance"("studentId", "disciplineId", "date");
CREATE INDEX "Attendance_disciplineId_date_idx" ON "Attendance"("disciplineId", "date");

ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
