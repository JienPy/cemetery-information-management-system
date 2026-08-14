import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoFacilities = [
  {
    label: 'Lot Yard',
    prefix: 'LOT',
    caseNumber: 'DEMO-LOT-001',
    deceased: {
      firstName: 'Manuel',
      middleName: 'Ramos',
      lastName: 'Dela Cruz',
      age: 72,
      gender: 'Male',
      dateOfDeath: '2025-02-11',
      intermentDate: '2025-02-14',
    },
  },
  {
    label: 'Apartment A',
    prefix: 'APT',
    caseNumber: 'DEMO-APT-001',
    deceased: {
      firstName: 'Rosa',
      middleName: 'Lopez',
      lastName: 'Bautista',
      age: 68,
      gender: 'Female',
      dateOfDeath: '2024-08-18',
      intermentDate: '2024-08-21',
    },
  },
  {
    label: 'Baby Vault A',
    prefix: 'BABY',
    caseNumber: 'DEMO-BABY-001',
    deceased: {
      firstName: 'Mia',
      lastName: 'Santos',
      age: 0,
      gender: 'Female',
      dateOfDeath: '2025-11-04',
      intermentDate: '2025-11-05',
    },
  },
  {
    label: 'Bone Vault A',
    prefix: 'BV',
    caseNumber: 'DEMO-BV-001',
    deceased: {
      firstName: 'Elena',
      middleName: 'Garcia',
      lastName: 'Reyes',
      age: 81,
      gender: 'Female',
      dateOfDeath: '2017-05-09',
      intermentDate: '2017-05-12',
    },
  },
];

const statusExamples = [
  { sequence: 1, status: 'occupied', notes: 'Demo occupied unit with a linked active interment record.' },
  { sequence: 2, status: 'reserved', notes: 'Demo reservation awaiting final interment documentation.' },
  { sequence: 3, status: 'maintenance', notes: 'Demo maintenance hold for inspection and minor repairs.' },
  { sequence: 4, status: 'unavailable', notes: 'Demo administrative hold. This unit cannot be assigned.' },
];

function codeFor(prefix, sequence) {
  return `${prefix}-${String(sequence).padStart(3, '0')}`;
}

async function main() {
  const admin = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
  if (!admin) throw new Error('Seed the local database before adding demo statuses.');

  for (const facility of demoFacilities) {
    const codes = statusExamples.map(example => codeFor(facility.prefix, example.sequence));
    const plots = await prisma.plot.findMany({ where: { code: { in: codes } } });
    const byCode = new Map(plots.map(plot => [plot.code, plot]));

    if (plots.length !== statusExamples.length) {
      throw new Error(`${facility.label} is missing one or more demo units.`);
    }

    await prisma.$transaction(async tx => {
      const occupiedPlot = byCode.get(codeFor(facility.prefix, 1));
      await tx.interment.upsert({
        where: { caseNumber: facility.caseNumber },
        update: {
          plotId: occupiedPlot.id,
          createdById: admin.id,
          status: 'active',
          ...facility.deceased,
          dateOfDeath: new Date(facility.deceased.dateOfDeath),
          intermentDate: new Date(facility.deceased.intermentDate),
          address: 'Tayabas City, Quezon',
          contactPerson: 'Demo Family Contact',
          contactNumber: '09000000000',
          remarks: 'Synthetic demonstration record for interface preview.',
        },
        create: {
          caseNumber: facility.caseNumber,
          plotId: occupiedPlot.id,
          createdById: admin.id,
          status: 'active',
          ...facility.deceased,
          dateOfDeath: new Date(facility.deceased.dateOfDeath),
          intermentDate: new Date(facility.deceased.intermentDate),
          address: 'Tayabas City, Quezon',
          contactPerson: 'Demo Family Contact',
          contactNumber: '09000000000',
          remarks: 'Synthetic demonstration record for interface preview.',
        },
      });

      for (const example of statusExamples) {
        const plot = byCode.get(codeFor(facility.prefix, example.sequence));
        await tx.plot.update({
          where: { id: plot.id },
          data: { status: example.status, notes: example.notes },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: admin.id,
          entity: 'demo_seed',
          action: 'upsert',
          details: `Added status examples for ${facility.label}`,
        },
      });
    });
  }

  const statusCounts = await prisma.plot.groupBy({
    by: ['type', 'status'],
    _count: { _all: true },
    orderBy: [{ type: 'asc' }, { status: 'asc' }],
  });

  console.log('Demo status records are ready.');
  console.table(statusCounts.map(row => ({
    type: row.type,
    status: row.status,
    count: row._count._all,
  })));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
