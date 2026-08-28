import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { httpErrors } from '../../lib/http.js';
import { str, optStr, num, dateIso } from '../../lib/validate.js';
import { recordAudit } from '../../lib/audit.js';
import { facilityScope } from '../../lib/scope.js';
import type { Guards } from '../../lib/guards.js';

/**
 * Fixed assets (spec §39) — the facility asset register with straight-line
 * depreciation. Assets are facility-tagged, scoped through the facility
 * relation for regional/district users and the facilityId for facility
 * users (facilityScope). Book value is DERIVED at read time — an edit to
 * cost / life / salvage recomputes the whole schedule, never stores it.
 *
 * Permissions: viewing the register needs finance or facility-management
 * access; creating/editing/disposing is a facility-management action.
 */

const ASSET_CATEGORIES = ['BUILDING', 'VEHICLE', 'IT', 'MEDICAL', 'PLANT', 'FURNITURE', 'OTHER'];
const ASSET_STATUSES = ['ACTIVE', 'IN_STORAGE', 'DISPOSED'];

interface DepreciationInput {
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  acquisitionDate: Date;
  status: string;
}

/**
 * Straight-line depreciation as of a date. Disposed assets are fully written
 * down (book value 0). A future acquisition date yields no depreciation yet.
 */
function depreciate(a: DepreciationInput, asOf = new Date()): {
  accumulatedDepreciation: number;
  currentValue: number;
  annualDepreciation: number;
  depreciationPct: number;
} {
  const base = Math.max(0, a.purchaseCost - Math.max(0, a.salvageValue));
  const years = Math.max(1, a.usefulLifeYears);
  const annualDepreciation = Math.round((base / years) * 100) / 100;
  if (a.status === 'DISPOSED') {
    return { accumulatedDepreciation: Math.round(base * 100) / 100, currentValue: 0, annualDepreciation, depreciationPct: 100 };
  }
  const ageYears = Math.max(0, (asOf.getTime() - a.acquisitionDate.getTime()) / (365.25 * 24 * 3600 * 1000));
  const accumulated = Math.min(base, Math.round((ageYears / years) * base * 100) / 100);
  return {
    accumulatedDepreciation: accumulated,
    currentValue: Math.round((a.purchaseCost - accumulated) * 100) / 100,
    annualDepreciation,
    depreciationPct: base > 0 ? Math.min(100, Math.round((accumulated / base) * 100)) : 0,
  };
}

function toAssetPayload(a: {
  id: string;
  assetNumber: string;
  name: string;
  category: string;
  description: string | null;
  serialNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  acquisitionDate: Date;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  location: string | null;
  custodianName: string | null;
  status: string;
  disposedAt: Date | null;
  disposalNote: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  facility?: { id: string; code: string; name: string } | null;
}) {
  return {
    id: a.id,
    assetNumber: a.assetNumber,
    name: a.name,
    category: a.category,
    description: a.description,
    serialNumber: a.serialNumber,
    manufacturer: a.manufacturer,
    model: a.model,
    acquisitionDate: a.acquisitionDate,
    purchaseCost: a.purchaseCost,
    salvageValue: a.salvageValue,
    usefulLifeYears: a.usefulLifeYears,
    location: a.location,
    custodianName: a.custodianName,
    status: a.status,
    disposedAt: a.disposedAt,
    disposalNote: a.disposalNote,
    notes: a.notes,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    facility: a.facility ?? null,
    ...depreciate(a),
  };
}

/** Throws unless the caller may manage assets of the given facility. */
function assertFacilityScope(u: { scope: string; regionId?: string | null; districtId?: string | null; facilityId?: string | null }, facility: { id: string; regionId: string; districtId: string }): void {
  if (u.scope === 'FACILITY' && u.facilityId !== facility.id) throw httpErrors.forbidden('You can only manage assets of your own facility');
  if (u.scope === 'REGIONAL' && u.regionId !== facility.regionId) throw httpErrors.forbidden('You can only manage assets of facilities in your region');
  if (u.scope === 'DISTRICT' && u.districtId !== facility.districtId) throw httpErrors.forbidden('You can only manage assets of facilities in your district');
}

export function registerAssetRoutes(app: FastifyInstance, db: PrismaClient, guards: Guards): void {
  // ------------------------------------------------------------ list
  app.get(
    '/assets',
    { preHandler: guards.requirePermission('view_financial', 'manage_facility'), schema: { summary: 'Fixed-asset register (scoped, filterable by category/status/facility)', tags: ['assets'] } },
    async (request) => {
      const u = request.user!;
      const q = request.query as Record<string, unknown>;
      const where: Record<string, unknown> = { ...facilityScope(u) };
      const category = optStr(q.category)?.toUpperCase();
      if (category) {
        if (!ASSET_CATEGORIES.includes(category)) throw httpErrors.badRequest(`Category must be one of: ${ASSET_CATEGORIES.join(', ')}`);
        where.category = category;
      }
      const status = optStr(q.status)?.toUpperCase();
      if (status) {
        if (!ASSET_STATUSES.includes(status)) throw httpErrors.badRequest(`Status must be one of: ${ASSET_STATUSES.join(', ')}`);
        where.status = status;
      }
      // The facilityId filter must never widen the caller's scope.
      const facilityId = optStr(q.facilityId);
      if (facilityId) {
        const requested = await db.facility.findUnique({ where: { id: facilityId } });
        if (!requested) throw httpErrors.notFound('Facility not found');
        assertFacilityScope(u, requested);
        where.facilityId = facilityId;
      }
      // The list is capped for the response, but the summary must reflect the
      // FULL scoped register — never the truncated rows (same discipline as
      // the staff directory). The authoritative /assets/summary stays the
      // canonical breakdown; this is a per-filter convenience.
      const [assets, summaryRows] = await Promise.all([
        db.asset.findMany({
          where,
          include: { facility: { select: { id: true, code: true, name: true } } },
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
          take: 1000,
        }),
        db.asset.findMany({ where, select: { status: true, purchaseCost: true, salvageValue: true, usefulLifeYears: true, acquisitionDate: true } }),
      ]);
      const rows = assets.map(toAssetPayload);
      let bookValue = 0;
      let replacementCost = 0;
      let annualDepreciation = 0;
      for (const r of summaryRows) {
        if (r.status === 'DISPOSED') continue;
        const d = depreciate(r);
        bookValue += d.currentValue;
        replacementCost += r.purchaseCost;
        annualDepreciation += d.annualDepreciation;
      }
      const summary = {
        total: summaryRows.length,
        active: summaryRows.filter((r) => r.status === 'ACTIVE').length,
        inStorage: summaryRows.filter((r) => r.status === 'IN_STORAGE').length,
        disposed: summaryRows.filter((r) => r.status === 'DISPOSED').length,
        bookValue: Math.round(bookValue * 100) / 100,
        replacementCost: Math.round(replacementCost * 100) / 100,
        annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      };
      return { assets: rows, summary };
    },
  );

  // ---------------------------------------------------------- summary
  app.get(
    '/assets/summary',
    { preHandler: guards.requirePermission('view_financial', 'manage_facility'), schema: { summary: 'Asset book-value summary by category (scoped)', tags: ['assets'] } },
    async (request) => {
      const u = request.user!;
      const where = { ...facilityScope(u) } as Record<string, unknown>;
      const assets = await db.asset.findMany({
        where,
        select: { category: true, status: true, purchaseCost: true, salvageValue: true, usefulLifeYears: true, acquisitionDate: true },
      });
      const byCategory = new Map<string, { category: string; count: number; replacementCost: number; bookValue: number }>();
      const byStatus: Record<string, number> = {};
      let bookValue = 0;
      let replacementCost = 0;
      let annualDepreciation = 0;
      for (const a of assets) {
        const d = depreciate(a);
        // Category cards reflect the LIVE register: written-off assets count
        // only in the byStatus/disposed totals, never in a category's count
        // or value.
        if (a.status !== 'DISPOSED') {
          const entry = byCategory.get(a.category) ?? { category: a.category, count: 0, replacementCost: 0, bookValue: 0 };
          entry.count++;
          entry.replacementCost += a.purchaseCost;
          entry.bookValue += d.currentValue;
          byCategory.set(a.category, entry);
          bookValue += d.currentValue;
          replacementCost += a.purchaseCost;
          annualDepreciation += d.annualDepreciation;
        }
        byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      }
      return {
        totals: {
          assets: assets.length,
          active: byStatus.ACTIVE ?? 0,
          inStorage: byStatus.IN_STORAGE ?? 0,
          disposed: byStatus.DISPOSED ?? 0,
          bookValue: Math.round(bookValue * 100) / 100,
          replacementCost: Math.round(replacementCost * 100) / 100,
          annualDepreciation: Math.round(annualDepreciation * 100) / 100,
        },
        byCategory: [...byCategory.values()].map((c) => ({ ...c, bookValue: Math.round(c.bookValue * 100) / 100, replacementCost: Math.round(c.replacementCost * 100) / 100 })).sort((a, b) => b.replacementCost - a.replacementCost),
        byStatus,
      };
    },
  );

  // ---------------------------------------------------------- create
  app.post(
    '/assets',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Register a fixed asset', tags: ['assets'] } },
    async (request) => {
      const u = request.user!;
      const body = (request.body ?? {}) as Record<string, unknown>;
      const facilityId = str(body.facilityId, 'facilityId', { required: true });
      const facility = await db.facility.findUnique({ where: { id: facilityId } });
      if (!facility) throw httpErrors.notFound('Facility not found');
      assertFacilityScope(u, facility);
      const assetNumber = str(body.assetNumber, 'assetNumber', { required: true, max: 40 }).trim().toUpperCase();
      if (assetNumber.length < 2) throw httpErrors.badRequest('Asset number is too short');
      const dup = await db.asset.findFirst({ where: { facilityId, assetNumber } });
      if (dup) throw httpErrors.conflict(`An asset with number ${assetNumber} already exists at this facility`);
      const name = str(body.name, 'name', { required: true, max: 160 }).trim();
      if (name.length < 2) throw httpErrors.badRequest('Asset name is too short');
      const category = (optStr(body.category) ?? 'OTHER').toUpperCase();
      if (!ASSET_CATEGORIES.includes(category)) throw httpErrors.badRequest(`Category must be one of: ${ASSET_CATEGORIES.join(', ')}`);
      const purchaseCost = num(body.purchaseCost, 'purchaseCost', { required: true, min: 0 }) ?? 0;
      if (purchaseCost <= 0) throw httpErrors.badRequest('purchaseCost must be greater than zero');
      const salvageValue = num(body.salvageValue, 'salvageValue', { min: 0 }) ?? 0;
      if (salvageValue > purchaseCost) throw httpErrors.badRequest('salvageValue cannot exceed purchaseCost');
      const usefulLifeYears = num(body.usefulLifeYears, 'usefulLifeYears', { min: 1, max: 100 }) ?? 5;
      const asset = await db.asset.create({
        data: {
          facilityId,
          assetNumber,
          name,
          category,
          description: optStr(body.description),
          serialNumber: optStr(body.serialNumber),
          manufacturer: optStr(body.manufacturer),
          model: optStr(body.model),
          acquisitionDate: body.acquisitionDate ? (dateIso(body.acquisitionDate, 'acquisitionDate') ?? new Date()) : new Date(),
          purchaseCost,
          salvageValue,
          usefulLifeYears,
          location: optStr(body.location),
          custodianName: optStr(body.custodianName),
          status: 'ACTIVE',
          notes: optStr(body.notes),
        },
        include: { facility: { select: { id: true, code: true, name: true } } },
      });
      recordAudit(db, request, {
        action: 'asset.create',
        entityType: 'asset',
        entityId: asset.id,
        after: { facilityCode: facility.code, assetNumber, name, category, purchaseCost, usefulLifeYears },
      });
      return { asset: toAssetPayload(asset) };
    },
  );

  // ---------------------------------------------------------- update
  app.put(
    '/assets/:id',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Edit an asset (details or purchase facts — book value recomputed)', tags: ['assets'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const asset = await db.asset.findFirst({
        where: { id: params.id, ...facilityScope(u) },
        include: { facility: { select: { id: true, code: true, name: true } } },
      });
      if (!asset) throw httpErrors.notFound('Asset not found in scope');
      const data: Record<string, unknown> = {};
      const notes: string[] = [];
      const name = optStr(body.name);
      if (name !== undefined) {
        if (name.trim().length < 2) throw httpErrors.badRequest('Asset name is too short');
        data.name = name.trim();
        notes.push(`name → ${data.name}`);
      }
      const category = optStr(body.category)?.toUpperCase();
      if (category !== undefined) {
        if (!ASSET_CATEGORIES.includes(category)) throw httpErrors.badRequest(`Category must be one of: ${ASSET_CATEGORIES.join(', ')}`);
        data.category = category;
        notes.push(`category → ${category}`);
      }
      const strField = (key: string, label: string, max: number) => {
        if (body[key] === undefined) return;
        const v = optStr(body[key]);
        if (v === undefined) {
          data[key] = null;
          notes.push(`${key} → (cleared)`);
          return;
        }
        if (v.length > max) throw httpErrors.badRequest(`${label} is too long`);
        data[key] = v;
        notes.push(`${key} → ${data[key]}`);
      };
      strField('description', 'Description', 400);
      strField('serialNumber', 'Serial number', 120);
      strField('manufacturer', 'Manufacturer', 160);
      strField('model', 'Model', 160);
      strField('location', 'Location', 160);
      strField('custodianName', 'Custodian', 160);
      strField('notes', 'Notes', 500);
      const status = optStr(body.status)?.toUpperCase();
      if (status !== undefined) {
        if (!ASSET_STATUSES.includes(status)) throw httpErrors.badRequest(`Status must be one of: ${ASSET_STATUSES.join(', ')}`);
        if (status === 'DISPOSED') throw httpErrors.badRequest('Use the dispose action to write an asset off');
        data.status = status;
        notes.push(`status → ${status}`);
      }
      // Purchase facts — edits recompute the derived depreciation schedule.
      const purchaseCost = body.purchaseCost === undefined || body.purchaseCost === null || body.purchaseCost === '' ? undefined : (num(body.purchaseCost, 'purchaseCost', { min: 0 }) ?? undefined);
      if (purchaseCost !== undefined) {
        if (purchaseCost <= 0) throw httpErrors.badRequest('purchaseCost must be greater than zero');
        data.purchaseCost = purchaseCost;
        notes.push(`purchaseCost → ${purchaseCost}`);
      }
      const salvageValue = body.salvageValue === undefined || body.salvageValue === null || body.salvageValue === '' ? undefined : (num(body.salvageValue, 'salvageValue', { min: 0 }) ?? undefined);
      if (salvageValue !== undefined) {
        const effectiveCost = (data.purchaseCost as number | undefined) ?? asset.purchaseCost;
        if (salvageValue > effectiveCost) throw httpErrors.badRequest('salvageValue cannot exceed purchaseCost');
        data.salvageValue = salvageValue;
        notes.push(`salvageValue → ${salvageValue}`);
      }
      const usefulLifeYears = body.usefulLifeYears === undefined || body.usefulLifeYears === null || body.usefulLifeYears === '' ? undefined : (num(body.usefulLifeYears, 'usefulLifeYears', { min: 1, max: 100 }) ?? undefined);
      if (usefulLifeYears !== undefined) {
        data.usefulLifeYears = usefulLifeYears;
        notes.push(`usefulLifeYears → ${usefulLifeYears}`);
      }
      if (body.acquisitionDate !== undefined) data.acquisitionDate = body.acquisitionDate === '' || body.acquisitionDate === null ? asset.acquisitionDate : (dateIso(body.acquisitionDate, 'acquisitionDate') ?? asset.acquisitionDate);
      if (Object.keys(data).length === 0) throw httpErrors.badRequest('Nothing to update');
      const updated = await db.asset.update({
        where: { id: asset.id },
        data,
        include: { facility: { select: { id: true, code: true, name: true } } },
      });
      recordAudit(db, request, {
        action: 'asset.update',
        entityType: 'asset',
        entityId: asset.id,
        after: { assetNumber: asset.assetNumber, facilityCode: asset.facility.code, changes: notes },
      });
      return { asset: toAssetPayload(updated) };
    },
  );

  // --------------------------------------------------------- dispose
  app.post(
    '/assets/:id/dispose',
    { preHandler: guards.requirePermission('manage_facility'), schema: { summary: 'Write an asset off (disposal)', tags: ['assets'] } },
    async (request) => {
      const u = request.user!;
      const params = request.params as { id: string };
      const body = (request.body ?? {}) as Record<string, unknown>;
      const asset = await db.asset.findFirst({
        where: { id: params.id, ...facilityScope(u) },
        include: { facility: { select: { id: true, code: true, name: true } } },
      });
      if (!asset) throw httpErrors.notFound('Asset not found in scope');
      if (asset.status === 'DISPOSED') throw httpErrors.badRequest('Asset is already disposed');
      const updated = await db.asset.update({
        where: { id: asset.id },
        data: { status: 'DISPOSED', disposedAt: new Date(), disposalNote: optStr(body.note) ?? optStr(body.disposalNote) ?? null },
        include: { facility: { select: { id: true, code: true, name: true } } },
      });
      recordAudit(db, request, {
        action: 'asset.dispose',
        entityType: 'asset',
        entityId: asset.id,
        after: { assetNumber: asset.assetNumber, facilityCode: asset.facility.code, name: asset.name, note: updated.disposalNote },
      });
      return { asset: toAssetPayload(updated) };
    },
  );
}
