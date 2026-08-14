import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.API_PORT || 8056);

app.use(cors({ origin: true }));
app.use(express.json());

const addYears = (date, years) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

const plotCollectionMap = {
  graveyards: {
    type: 'lot',
    toDirectus: plot => ({
      id: plot.id,
      graveyard_name: plot.section || 'Lot Yard',
      tomb_number: Number(plot.number || plot.id),
      status: plot.status,
      notes: plot.notes,
    }),
  },
  apartment_stores: {
    type: 'apartment',
    toDirectus: plot => ({
      id: plot.id,
      ab_store_name: plot.code,
      apartment_block_type: plot.block || plot.section,
      status: plot.status,
      notes: plot.notes,
    }),
  },
  apartment_baby_stores: {
    type: 'baby_apartment',
    toDirectus: plot => ({
      id: plot.id,
      apartment_baby_id: plot.code,
      apartment_baby_number: Number(plot.number || plot.id),
      status: plot.status,
      notes: plot.notes,
    }),
  },
  bone_vault_stores: {
    type: 'bone_vault',
    toDirectus: plot => ({
      id: plot.id,
      bone_vault_id: plot.code,
      bone_vault_number: Number(plot.number || plot.id),
      status: plot.status,
      notes: plot.notes,
    }),
  },
};

const directusDate = value => {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
};

const daysFromRenewal = renewal => {
  if (!renewal) return { days_passed: 0, days_left: 0, year_covered: 7 };
  const today = new Date();
  const expiresAt = new Date(renewal.expiresAt);
  const daysLeft = Math.max(0, Math.floor((expiresAt - today) / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.max(0, Math.floor((today - expiresAt) / (1000 * 60 * 60 * 24)));
  return {
    days_passed: daysPassed,
    days_left: daysLeft,
    year_covered: renewal.coverageYears || 7,
  };
};

const intermentToDirectus = interment => {
  const renewal = interment.renewals?.[0];
  const payment = interment.payments?.[0];
  const plot = interment.plot;
  const calculated = daysFromRenewal(renewal);

  return {
    id: interment.id,
    first_name: interment.firstName,
    middle_name: interment.middleName,
    last_name: interment.lastName,
    age: interment.age,
    gender: interment.gender,
    indigent: interment.indigent,
    address: interment.address,
    date_of_birth: directusDate(interment.dateOfBirth),
    date_of_death: directusDate(interment.dateOfDeath),
    date_of_renewal: directusDate(interment.intermentDate),
    transfer: interment.transferNotes,
    new_user_of_burial: interment.newUserOfBurial,
    location: plot?.section || null,
    contact_person: interment.contactPerson,
    contact_number: interment.contactNumber,
    amount: payment?.amount ? Number(payment.amount) : 0,
    apartment_stores: plot?.type === 'apartment' ? plot.id : null,
    ab_stores_tomb: plot?.type === 'apartment' ? plot.id : null,
    baby_apartment_stores: plot?.type === 'baby_apartment' ? plot.id : null,
    bone_vault: plot?.type === 'bone_vault' ? plot.id : null,
    graveyard_id: plot?.type === 'lot' ? plot.id : null,
    or_number: payment?.orNumber || null,
    renew: renewal?.status || null,
    number_of_renew: Math.max(0, Math.floor(((renewal?.coverageYears || 7) - 7) / 7)),
    status: interment.status,
    ...calculated,
  };
};

const directusRecordToApiBody = body => {
  const plotId = body.plotId || body.plot_id || body.graveyard_id || body.ab_stores_tomb || body.apartment_stores || body.baby_apartment_stores || body.bone_vault || null;
  const coverageYears = body.year_covered || (7 + (Number(body.number_of_renew || 0) * 7));
  return {
    plotId,
    firstName: body.firstName || body.first_name,
    middleName: body.middleName || body.middle_name,
    lastName: body.lastName || body.last_name,
    age: body.age,
    gender: body.gender,
    indigent: body.indigent,
    address: body.address,
    dateOfBirth: body.dateOfBirth || body.date_of_birth,
    dateOfDeath: body.dateOfDeath || body.date_of_death,
    intermentDate: body.intermentDate || body.date_of_renewal,
    contactPerson: body.contactPerson || body.contact_person,
    contactNumber: body.contactNumber || body.contact_number,
    newUserOfBurial: body.newUserOfBurial || body.new_user_of_burial,
    transferNotes: body.transfer || body.transferNotes,
    amount: body.amount,
    orNumber: body.orNumber || body.or_number,
    coverageYears,
    remarks: body.remarks || body.notes,
  };
};

const nextCaseNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.interment.count({
    where: {
      caseNumber: {
        startsWith: `INT-${year}-`,
      },
    },
  });
  return `INT-${year}-${String(count + 1).padStart(5, '0')}`;
};

app.get('/api/health', async (req, res) => {
  const [plots, interments] = await Promise.all([
    prisma.plot.count(),
    prisma.interment.count(),
  ]);

  res.json({
    ok: true,
    database: 'sqlite',
    plots,
    interments,
  });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !password) {
    return res.status(401).json({ errors: [{ message: 'Invalid email or password' }] });
  }

  res.json({
    data: {
      access_token: `local-prisma-token-${user.id}`,
      refresh_token: null,
      expires: 1000 * 60 * 60 * 24,
    },
  });
});

app.get('/users/me', async (req, res) => {
  const user = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
  res.json({
    data: {
      id: user?.id || 1,
      email: user?.email || 'admin@example.com',
      first_name: user?.name?.split(' ')[0] || 'Admin',
      last_name: user?.name?.split(' ').slice(1).join(' ') || 'User',
      title: user?.role || 'administrator',
      avatar: null,
    },
  });
});

app.get('/items/:collection', async (req, res, next) => {
  try {
    const { collection } = req.params;

    if (plotCollectionMap[collection]) {
      const config = plotCollectionMap[collection];
      const plots = await prisma.plot.findMany({
        where: { type: config.type },
        orderBy: { code: 'asc' },
      });
      return res.json({ data: plots.map(config.toDirectus) });
    }

    if (collection === 'cemeteries') {
      const rows = await prisma.cemetery.findMany({ orderBy: { id: 'asc' } });
      return res.json({
        data: rows.map(row => ({
          id: row.id,
          cemetery_name: row.name,
          address: row.address,
          status: row.status,
          notes: row.notes,
        })),
      });
    }

    if (collection === 'burial_records') {
      const rows = await prisma.interment.findMany({
        include: {
          plot: true,
          payments: true,
          renewals: { orderBy: { expiresAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ data: rows.map(intermentToDirectus) });
    }

    return res.json({ data: [] });
  } catch (error) {
    next(error);
  }
});

app.post('/items/:collection', async (req, res, next) => {
  try {
    if (req.params.collection !== 'burial_records') {
      return res.status(400).json({ error: `Create is not implemented for ${req.params.collection}` });
    }

    const created = await createInterment(directusRecordToApiBody(req.body));
    res.status(201).json({ data: intermentToDirectus(created) });
  } catch (error) {
    next(error);
  }
});

app.patch('/items/:collection/:id', async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    if (plotCollectionMap[collection]) {
      const plot = await prisma.plot.update({
        where: { id: Number(id) },
        data: {
          status: req.body.status,
          notes: req.body.notes,
        },
      });
      return res.json({ data: plotCollectionMap[collection].toDirectus(plot) });
    }

    if (collection !== 'burial_records') {
      return res.status(400).json({ error: `Update is not implemented for ${collection}` });
    }

    const body = directusRecordToApiBody(req.body);
    const existing = await prisma.interment.findUnique({ where: { id: Number(id) }, include: { plot: true } });
    const oldPlotId = existing?.plotId;
    const newPlotId = body.plotId ? Number(body.plotId) : null;

    const updated = await prisma.$transaction(async tx => {
      if (oldPlotId && oldPlotId !== newPlotId) {
        await tx.plot.update({ where: { id: oldPlotId }, data: { status: 'available' } });
      }
      if (newPlotId && oldPlotId !== newPlotId) {
        await tx.plot.update({ where: { id: newPlotId }, data: { status: 'occupied' } });
      }

      return tx.interment.update({
        where: { id: Number(id) },
        data: {
          plotId: newPlotId,
          firstName: body.firstName,
          middleName: body.middleName || null,
          lastName: body.lastName,
          age: body.age ? Number(body.age) : null,
          gender: body.gender || null,
          indigent: body.indigent || null,
          address: body.address || null,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          dateOfDeath: body.dateOfDeath ? new Date(body.dateOfDeath) : undefined,
          intermentDate: body.intermentDate ? new Date(body.intermentDate) : null,
          contactPerson: body.contactPerson || null,
          contactNumber: body.contactNumber || null,
          newUserOfBurial: body.newUserOfBurial || null,
          transferNotes: body.transferNotes || null,
        },
        include: {
          plot: true,
          payments: true,
          renewals: { orderBy: { expiresAt: 'desc' }, take: 1 },
        },
      });
    });

    res.json({ data: intermentToDirectus(updated) });
  } catch (error) {
    next(error);
  }
});

app.delete('/items/:collection/:id', async (req, res, next) => {
  try {
    if (req.params.collection !== 'burial_records') {
      return res.status(400).json({ error: `Delete is not implemented for ${req.params.collection}` });
    }

    const existing = await prisma.interment.findUnique({ where: { id: Number(req.params.id) } });
    await prisma.$transaction(async tx => {
      await tx.interment.delete({ where: { id: Number(req.params.id) } });
      if (existing?.plotId) {
        await tx.plot.update({ where: { id: existing.plotId }, data: { status: 'available' } });
      }
    });

    res.json({ data: existing });
  } catch (error) {
    next(error);
  }
});

const plotTypes = ['lot', 'apartment', 'baby_apartment', 'bone_vault'];
const plotStatuses = ['available', 'occupied', 'reserved', 'maintenance', 'unavailable'];
const resolvePlotCoordinates = (body, existing = { latitude: null, longitude: null }) => {
  const hasLatitude = Object.prototype.hasOwnProperty.call(body, 'latitude');
  const hasLongitude = Object.prototype.hasOwnProperty.call(body, 'longitude');

  if (!hasLatitude && !hasLongitude) {
    return { latitude: existing.latitude, longitude: existing.longitude };
  }
  if (!hasLatitude || !hasLongitude) {
    throw new Error('Latitude and longitude must be saved together.');
  }
  if (body.latitude === null && body.longitude === null) {
    return { latitude: null, longitude: null };
  }

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Enter a valid latitude.');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Enter a valid longitude.');
  }

  return { latitude, longitude };
};
const plotInclude = {
  cemetery: true,
  interments: {
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: {
      renewals: { orderBy: { expiresAt: 'desc' }, take: 1 },
    },
  },
};

const cemeteryToApi = cemetery => {
  let boundary = [];
  try {
    boundary = cemetery.boundaryJson ? JSON.parse(cemetery.boundaryJson) : [];
  } catch {
    boundary = [];
  }

  return {
    id: cemetery.id,
    code: cemetery.code,
    name: cemetery.name,
    address: cemetery.address,
    status: cemetery.status,
    latitude: cemetery.latitude,
    longitude: cemetery.longitude,
    boundary,
    notes: cemetery.notes,
  };
};

app.get('/api/cemeteries', async (req, res, next) => {
  try {
    const cemeteries = await prisma.cemetery.findMany({
      where: { status: 'active' },
      orderBy: { id: 'asc' },
    });
    res.json({ data: cemeteries.map(cemeteryToApi) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/plots', async (req, res, next) => {
  try {
    const { type, status, cemeteryId } = req.query;
    const plots = await prisma.plot.findMany({
      where: {
        ...(type ? { type: String(type) } : {}),
        ...(status ? { status: String(status) } : {}),
        ...(cemeteryId ? { cemeteryId: Number(cemeteryId) } : {}),
      },
      include: plotInclude,
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
    res.json({ data: plots });
  } catch (error) {
    next(error);
  }
});

app.post('/api/plots', async (req, res, next) => {
  try {
    const body = req.body;
    const type = String(body.type || '').trim();
    const code = String(body.code || '').trim().toUpperCase();
    const status = String(body.status || 'available').trim();
    const coordinates = resolvePlotCoordinates(body);

    if (!plotTypes.includes(type)) {
      return res.status(400).json({ error: 'Select a valid plot type.' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Plot code is required.' });
    }
    if (!plotStatuses.includes(status) || status === 'occupied') {
      return res.status(400).json({ error: 'A new plot cannot be created as occupied.' });
    }

    const cemetery = body.cemeteryId
      ? await prisma.cemetery.findUnique({ where: { id: Number(body.cemeteryId) } })
      : await prisma.cemetery.findFirst({ orderBy: { id: 'asc' } });
    if (!cemetery) {
      return res.status(400).json({ error: 'Create a cemetery record before adding plots.' });
    }

    const duplicate = await prisma.plot.findFirst({
      where: { cemeteryId: cemetery.id, code },
    });
    if (duplicate) {
      return res.status(409).json({ error: `Plot code ${code} already exists.` });
    }

    const created = await prisma.$transaction(async tx => {
      const plot = await tx.plot.create({
        data: {
          cemeteryId: cemetery.id,
          type,
          code,
          section: body.section ? String(body.section).trim() : null,
          block: body.block ? String(body.block).trim() : null,
          number: body.number ? String(body.number).trim() : null,
          status,
          ...coordinates,
          notes: body.notes ? String(body.notes).trim() : null,
        },
        include: plotInclude,
      });
      await tx.auditLog.create({
        data: {
          entity: 'plot',
          entityId: plot.id,
          action: 'create',
          details: `Created ${plot.code}`,
        },
      });
      return plot;
    });

    res.status(201).json({ data: created });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/plots/:id', async (req, res, next) => {
  try {
    const plotId = Number(req.params.id);
    const body = req.body;
    const existing = await prisma.plot.findUnique({
      where: { id: plotId },
      include: { interments: { where: { status: 'active' }, take: 1 } },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Plot record was not found.' });
    }

    const type = body.type === undefined ? existing.type : String(body.type).trim();
    const code = body.code === undefined ? existing.code : String(body.code).trim().toUpperCase();
    const status = body.status === undefined ? existing.status : String(body.status).trim();
    const hasOccupant = existing.interments.length > 0;
    const cemeteryId = body.cemeteryId === undefined ? existing.cemeteryId : Number(body.cemeteryId);
    const cemeteryChanged = cemeteryId !== existing.cemeteryId;
    const hasCoordinateUpdate = Object.prototype.hasOwnProperty.call(body, 'latitude')
      || Object.prototype.hasOwnProperty.call(body, 'longitude');
    const coordinates = cemeteryChanged && !hasCoordinateUpdate
      ? { latitude: null, longitude: null }
      : resolvePlotCoordinates(body, existing);

    if (!plotTypes.includes(type)) {
      return res.status(400).json({ error: 'Select a valid plot type.' });
    }
    if (!code) {
      return res.status(400).json({ error: 'Plot code is required.' });
    }
    if (!plotStatuses.includes(status)) {
      return res.status(400).json({ error: 'Select a valid plot status.' });
    }
    if (hasOccupant && status !== 'occupied') {
      return res.status(409).json({ error: 'This plot has an active interment and must remain occupied.' });
    }
    if (!hasOccupant && status === 'occupied') {
      return res.status(409).json({ error: 'Assign an interment record before marking a plot occupied.' });
    }
    if (hasOccupant && type !== existing.type) {
      return res.status(409).json({ error: 'The type of an occupied plot cannot be changed.' });
    }
    if (!Number.isInteger(cemeteryId)) {
      return res.status(400).json({ error: 'Select a valid cemetery.' });
    }
    if (hasOccupant && cemeteryId !== existing.cemeteryId) {
      return res.status(409).json({ error: 'An occupied plot cannot be moved to another cemetery.' });
    }

    const cemetery = await prisma.cemetery.findUnique({ where: { id: cemeteryId } });
    if (!cemetery) {
      return res.status(400).json({ error: 'Selected cemetery was not found.' });
    }

    const duplicate = await prisma.plot.findFirst({
      where: {
        cemeteryId,
        code,
        NOT: { id: plotId },
      },
    });
    if (duplicate) {
      return res.status(409).json({ error: `Plot code ${code} already exists.` });
    }

    const updated = await prisma.$transaction(async tx => {
      const plot = await tx.plot.update({
        where: { id: plotId },
        data: {
          cemeteryId,
          type,
          code,
          section: body.section === undefined ? existing.section : (body.section ? String(body.section).trim() : null),
          block: body.block === undefined ? existing.block : (body.block ? String(body.block).trim() : null),
          number: body.number === undefined ? existing.number : (body.number ? String(body.number).trim() : null),
          status,
          ...coordinates,
          notes: body.notes === undefined ? existing.notes : (body.notes ? String(body.notes).trim() : null),
        },
        include: plotInclude,
      });
      await tx.auditLog.create({
        data: {
          entity: 'plot',
          entityId: plot.id,
          action: 'update',
          details: `Updated ${plot.code}`,
        },
      });
      return plot;
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

app.get('/api/interments', async (req, res, next) => {
  try {
    const interments = await prisma.interment.findMany({
      include: {
        plot: true,
        payments: true,
        renewals: {
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: interments });
  } catch (error) {
    next(error);
  }
});

const createInterment = async body => {
    const dateOfDeath = new Date(body.dateOfDeath);
    const coverageYears = Number(body.coverageYears || 7);
    const expiresAt = addYears(dateOfDeath, coverageYears);
    const amount = body.amount === undefined || body.amount === '' ? 0 : Number(body.amount);

    return prisma.$transaction(async tx => {
      if (body.plotId) {
        const plot = await tx.plot.findUnique({ where: { id: Number(body.plotId) } });
        if (!plot) throw new Error('Selected plot was not found.');
        if (plot.status !== 'available') throw new Error('Selected plot is not available.');
      }

      const created = await tx.interment.create({
        data: {
          caseNumber: body.caseNumber || await nextCaseNumber(),
          plotId: body.plotId ? Number(body.plotId) : null,
          status: 'active',
          firstName: body.firstName,
          middleName: body.middleName || null,
          lastName: body.lastName,
          age: body.age ? Number(body.age) : null,
          gender: body.gender || null,
          indigent: body.indigent || null,
          address: body.address || null,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          dateOfDeath,
          intermentDate: body.intermentDate ? new Date(body.intermentDate) : null,
          contactPerson: body.contactPerson || null,
          contactNumber: body.contactNumber || null,
          newUserOfBurial: body.newUserOfBurial || null,
          transferNotes: body.transferNotes || null,
          remarks: body.remarks || null,
          payments: {
            create: {
              amount,
              orNumber: body.orNumber || null,
              paidAt: body.paidAt ? new Date(body.paidAt) : null,
            },
          },
          renewals: {
            create: {
              status: 'active',
              coverageYears,
              startsAt: dateOfDeath,
              expiresAt,
            },
          },
        },
        include: {
          plot: true,
          payments: true,
          renewals: true,
        },
      });

      if (body.plotId) {
        await tx.plot.update({
          where: { id: Number(body.plotId) },
          data: { status: 'occupied' },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: 'interment',
          entityId: created.id,
          action: 'create',
          details: `Created ${created.caseNumber}`,
        },
      });

      return tx.interment.findUnique({
        where: { id: created.id },
        include: {
          plot: true,
          payments: true,
          renewals: true,
        },
      });
    });
};

app.post('/api/interments', async (req, res, next) => {
  try {
    const interment = await createInterment(req.body);
    res.status(201).json({ data: interment });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/interments/:id', async (req, res, next) => {
  try {
    const intermentId = Number(req.params.id);
    const body = req.body;
    const existing = await prisma.interment.findUnique({
      where: { id: intermentId },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        renewals: { orderBy: { expiresAt: 'desc' }, take: 1 },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Interment record was not found.' });
    }

    const oldPlotId = existing.plotId;
    const newPlotId = body.plotId ? Number(body.plotId) : null;
    const dateOfDeath = body.dateOfDeath ? new Date(body.dateOfDeath) : existing.dateOfDeath;
    const coverageYears = Number(body.coverageYears || existing.renewals[0]?.coverageYears || 7);
    const expiresAt = addYears(dateOfDeath, coverageYears);

    const updated = await prisma.$transaction(async tx => {
      if (newPlotId && newPlotId !== oldPlotId) {
        const selectedPlot = await tx.plot.findUnique({ where: { id: newPlotId } });
        if (!selectedPlot) throw new Error('Selected plot was not found.');
        if (selectedPlot.status !== 'available') throw new Error('Selected plot is not available.');
      }

      if (oldPlotId && oldPlotId !== newPlotId) {
        await tx.plot.update({ where: { id: oldPlotId }, data: { status: 'available' } });
      }
      if (newPlotId && oldPlotId !== newPlotId) {
        await tx.plot.update({ where: { id: newPlotId }, data: { status: 'occupied' } });
      }

      await tx.interment.update({
        where: { id: intermentId },
        data: {
          plotId: newPlotId,
          firstName: body.firstName,
          middleName: body.middleName || null,
          lastName: body.lastName,
          age: body.age === null || body.age === '' ? null : Number(body.age),
          gender: body.gender || null,
          indigent: body.indigent || null,
          address: body.address || null,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          dateOfDeath,
          intermentDate: body.intermentDate ? new Date(body.intermentDate) : null,
          contactPerson: body.contactPerson || null,
          contactNumber: body.contactNumber || null,
          newUserOfBurial: body.newUserOfBurial || null,
          transferNotes: body.transferNotes || null,
          remarks: body.remarks || null,
        },
      });

      if (existing.payments[0]) {
        await tx.payment.update({
          where: { id: existing.payments[0].id },
          data: {
            amount: body.amount === null || body.amount === '' ? 0 : Number(body.amount || 0),
            orNumber: body.orNumber || null,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            intermentId,
            amount: body.amount === null || body.amount === '' ? 0 : Number(body.amount || 0),
            orNumber: body.orNumber || null,
          },
        });
      }

      if (existing.renewals[0]) {
        await tx.renewal.update({
          where: { id: existing.renewals[0].id },
          data: {
            coverageYears,
            startsAt: dateOfDeath,
            expiresAt,
          },
        });
      } else {
        await tx.renewal.create({
          data: {
            intermentId,
            status: 'active',
            coverageYears,
            startsAt: dateOfDeath,
            expiresAt,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: 'interment',
          entityId: intermentId,
          action: 'update',
          details: `Updated ${existing.caseNumber}`,
        },
      });

      return tx.interment.findUnique({
        where: { id: intermentId },
        include: {
          plot: true,
          payments: true,
          renewals: { orderBy: { expiresAt: 'desc' }, take: 1 },
        },
      });
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/interments/:id', async (req, res, next) => {
  try {
    const intermentId = Number(req.params.id);
    const existing = await prisma.interment.findUnique({ where: { id: intermentId } });

    if (!existing) {
      return res.status(404).json({ error: 'Interment record was not found.' });
    }

    await prisma.$transaction(async tx => {
      await tx.interment.delete({ where: { id: intermentId } });
      if (existing.plotId) {
        await tx.plot.update({ where: { id: existing.plotId }, data: { status: 'available' } });
      }
      await tx.auditLog.create({
        data: {
          entity: 'interment',
          entityId: intermentId,
          action: 'delete',
          details: `Deleted ${existing.caseNumber}`,
        },
      });
    });

    res.json({ data: existing });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(400).json({
    error: error.message || 'Unexpected API error',
  });
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Cemetery Prisma API running at http://localhost:${port}`);
});
