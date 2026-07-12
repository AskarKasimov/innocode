-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'TESTING', 'ANALYZING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "AiCategory" AS ENUM ('LOW_RISK', 'NEEDS_REVIEW', 'INSUFFICIENT_EVIDENCE');

-- CreateEnum
CREATE TYPE "TeacherDecision" AS ENUM ('NONE', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "FlagVerdict" AS ENUM ('OK', 'VIOLATION', 'INSUFFICIENT_EVIDENCE');

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" INTEGER NOT NULL,
    "criteria" JSONB NOT NULL,
    "tests" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "testResults" JSONB,
    "aiCategory" "AiCategory",
    "teacherDecision" "TeacherDecision" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "verdict" "FlagVerdict" NOT NULL,
    "codeSnippet" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
