-- CreateEnum
CREATE TYPE "AssignmentSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "Congregation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "overseer" TEXT NOT NULL,
    "contactPrimary" TEXT NOT NULL,
    "contactAlternate" TEXT,
    "meetingDays" INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Congregation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "assignmentWindowDays" INTEGER NOT NULL DEFAULT 30,
    "assignmentsPerDay" INTEGER NOT NULL DEFAULT 1,
    "weekStartsOn" INTEGER NOT NULL DEFAULT 1,
    "avoidConsecutiveDays" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "slot" INTEGER NOT NULL DEFAULT 0,
    "source" "AssignmentSource" NOT NULL DEFAULT 'AUTO',
    "notes" TEXT,
    "congregationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Congregation_name_key" ON "Congregation"("name");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_createdAt_idx" ON "AuditLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "Assignment_congregationId_date_idx" ON "Assignment"("congregationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_date_slot_key" ON "Assignment"("date", "slot");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_congregationId_fkey" FOREIGN KEY ("congregationId") REFERENCES "Congregation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
