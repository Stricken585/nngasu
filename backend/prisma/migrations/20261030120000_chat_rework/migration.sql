-- Групповой чат теперь «группа + преподаватель». Старые сообщения группы без
-- преподавателя (teacherId IS NULL) остаются в БД, но ни в одном чате не видны.
ALTER TABLE "Message" ADD COLUMN "teacherId" TEXT,
ADD COLUMN "editedAt" TIMESTAMP(3),
ADD COLUMN "pinnedAt" TIMESTAMP(3),
ADD COLUMN "forwardedFromName" TEXT;

CREATE INDEX "Message_groupId_teacherId_createdAt_idx" ON "Message"("groupId", "teacherId", "createdAt");

ALTER TABLE "Message" ADD CONSTRAINT "Message_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Пересланное вложение — новая строка на тот же файл на диске.
DROP INDEX "Attachment_storageName_key";
