import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function range(count, mapper) {
  return Array.from({ length: count }, (_, index) => mapper(index + 1));
}

const newPublicBoundary = [
  [14.0194894, 121.5858938],
  [14.0199492, 121.5861732],
  [14.0205111, 121.5850762],
  [14.0204089, 121.5845569],
  [14.0202805, 121.5844615],
];

const romanCatholicBoundary = [
  [14.0212210, 121.5873536],
  [14.0216770, 121.5866372],
  [14.0218661, 121.5864559],
  [14.0219437, 121.5860857],
  [14.0218709, 121.5859061],
  [14.0218870, 121.5849017],
  [14.0225878, 121.5851138],
  [14.0226416, 121.5850075],
  [14.0230562, 121.5851781],
  [14.0229156, 121.5857199],
  [14.0229799, 121.5858444],
  [14.0227803, 121.5863637],
  [14.0228272, 121.5865461],
  [14.0227231, 121.5867284],
  [14.0226190, 121.5867284],
  [14.0224056, 121.5871522],
  [14.0222925, 121.5873051],
  [14.0220794, 121.5877772],
  [14.0218981, 121.5876744],
  [14.0214355, 121.5874565],
  [14.0213012, 121.5873921],
];

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'administrator',
    },
  });

  const cemetery = await prisma.cemetery.upsert({
    where: { id: 1 },
    update: {
      code: 'new-public',
      name: 'New Public Cemetery',
      address: 'Brgy. Baguio, Tayabas City, Quezon',
      latitude: 14.0200,
      longitude: 121.58532,
      boundaryJson: JSON.stringify(newPublicBoundary),
      notes: 'Tayabas City public cemetery plot registry',
    },
    create: {
      code: 'new-public',
      name: 'New Public Cemetery',
      address: 'Brgy. Baguio, Tayabas City, Quezon',
      status: 'active',
      latitude: 14.0200,
      longitude: 121.58532,
      boundaryJson: JSON.stringify(newPublicBoundary),
      notes: 'Tayabas City public cemetery plot registry',
    },
  });

  await prisma.cemetery.upsert({
    where: { code: 'roman-catholic' },
    update: {
      name: 'Roman Catholic Cemetery',
      address: 'Brgy. Baguio, Tayabas City, Quezon',
      latitude: 14.02217,
      longitude: 121.58631,
      boundaryJson: JSON.stringify(romanCatholicBoundary),
    },
    create: {
      code: 'roman-catholic',
      name: 'Roman Catholic Cemetery',
      address: 'Brgy. Baguio, Tayabas City, Quezon',
      status: 'active',
      latitude: 14.02217,
      longitude: 121.58631,
      boundaryJson: JSON.stringify(romanCatholicBoundary),
      notes: 'Roman Catholic cemetery plot registry',
    },
  });

  const plotRows = [
    ...range(40, number => ({
      cemeteryId: cemetery.id,
      type: 'lot',
      code: `LOT-${String(number).padStart(3, '0')}`,
      section: 'Lot Yard',
      number: String(number),
      status: 'available',
    })),
    ...range(24, number => ({
      cemeteryId: cemetery.id,
      type: 'apartment',
      code: `APT-${String(number).padStart(3, '0')}`,
      section: 'Apartment Tomb',
      block: 'Apartment A',
      number: String(number),
      status: 'available',
    })),
    ...range(20, number => ({
      cemeteryId: cemetery.id,
      type: 'baby_apartment',
      code: `BABY-${String(number).padStart(3, '0')}`,
      section: 'Baby Apartment Tomb',
      block: 'Baby Vault A',
      number: String(number),
      status: 'available',
    })),
    ...range(30, number => ({
      cemeteryId: cemetery.id,
      type: 'bone_vault',
      code: `BV-${String(number).padStart(3, '0')}`,
      section: 'Bone Vault',
      block: 'Bone Vault A',
      number: String(number),
      status: 'available',
    })),
  ];

  for (const plot of plotRows) {
    await prisma.plot.upsert({
      where: {
        cemeteryId_code: {
          cemeteryId: plot.cemeteryId,
          code: plot.code,
        },
      },
      update: {},
      create: plot,
    });
  }

  console.log(`Seed complete: ${admin.email}, ${plotRows.length} plots`);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
