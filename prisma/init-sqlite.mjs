import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const statements = [
  `PRAGMA foreign_keys = ON`,
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'officer',
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE TABLE IF NOT EXISTS "Cemetery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "latitude" REAL,
    "longitude" REAL,
    "boundaryJson" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Cemetery_code_key" ON "Cemetery"("code")`,
  `CREATE TABLE IF NOT EXISTS "Plot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cemeteryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "section" TEXT,
    "block" TEXT,
    "number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "latitude" REAL,
    "longitude" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plot_cemeteryId_fkey" FOREIGN KEY ("cemeteryId") REFERENCES "Cemetery" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Plot_cemeteryId_code_key" ON "Plot"("cemeteryId", "code")`,
  `CREATE INDEX IF NOT EXISTS "Plot_type_status_idx" ON "Plot"("type", "status")`,
  `CREATE TABLE IF NOT EXISTS "Interment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseNumber" TEXT NOT NULL,
    "plotId" INTEGER,
    "createdById" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "indigent" TEXT,
    "address" TEXT,
    "dateOfBirth" DATETIME,
    "dateOfDeath" DATETIME NOT NULL,
    "intermentDate" DATETIME,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "newUserOfBurial" TEXT,
    "transferNotes" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interment_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Interment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Interment_caseNumber_key" ON "Interment"("caseNumber")`,
  `CREATE INDEX IF NOT EXISTS "Interment_lastName_firstName_idx" ON "Interment"("lastName", "firstName")`,
  `CREATE INDEX IF NOT EXISTS "Interment_status_idx" ON "Interment"("status")`,
  `CREATE INDEX IF NOT EXISTS "Interment_dateOfDeath_idx" ON "Interment"("dateOfDeath")`,
  `CREATE TABLE IF NOT EXISTS "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "intermentId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "orNumber" TEXT,
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_intermentId_fkey" FOREIGN KEY ("intermentId") REFERENCES "Interment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Payment_orNumber_idx" ON "Payment"("orNumber")`,
  `CREATE TABLE IF NOT EXISTS "Renewal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "intermentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "coverageYears" INTEGER NOT NULL DEFAULT 7,
    "startsAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "renewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Renewal_intermentId_fkey" FOREIGN KEY ("intermentId") REFERENCES "Interment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "Renewal_status_expiresAt_idx" ON "Renewal"("status", "expiresAt")`,
  `CREATE TABLE IF NOT EXISTS "Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "intermentId" INTEGER NOT NULL,
    "fromPlotId" INTEGER,
    "toPlotId" INTEGER,
    "reason" TEXT,
    "transferredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transfer_intermentId_fkey" FOREIGN KEY ("intermentId") REFERENCES "Interment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromPlotId_fkey" FOREIGN KEY ("fromPlotId") REFERENCES "Plot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toPlotId_fkey" FOREIGN KEY ("toPlotId") REFERENCES "Plot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId")`,
];

try {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log('SQLite schema initialized.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
