import { nanoid } from 'nanoid';
import { seedCaterers } from '../data/seed';

export const STATUS = {
  PENDING: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const hasKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

let kv = null;
if (hasKv) {
  // Lazy import so the package is never required when it isn't configured.
  // eslint-disable-next-line global-require
  kv = require('@vercel/kv').kv;
}

// ---- In-memory fallback (persists for the lifetime of the server process) ----
const g = globalThis;
if (!g.__CBK_MEMORY__) {
  g.__CBK_MEMORY__ = {
    caterers: new Map(seedCaterers.map((c) => [c.id, c])),
    ownerIndex: new Map() // email -> Set(ids)
  };
}
const mem = g.__CBK_MEMORY__;

const INDEX_KEY = 'caterers:index';

export async function listCaterers() {
  if (hasKv) {
    const ids = (await kv.smembers(INDEX_KEY)) || [];
    if (ids.length === 0) return seedCaterers; // fresh DB: show demo data
    const records = await Promise.all(ids.map((id) => kv.get(`caterer:${id}`)));
    return records.filter(Boolean);
  }
  return Array.from(mem.caterers.values());
}

export async function getCaterer(id) {
  if (hasKv) {
    return (await kv.get(`caterer:${id}`)) || seedCaterers.find((c) => c.id === id) || null;
  }
  return mem.caterers.get(id) || null;
}

export async function getCaterersByOwner(ownerEmail) {
  if (hasKv) {
    const ids = (await kv.smembers(`owner:${ownerEmail}`)) || [];
    const records = await Promise.all(ids.map((id) => kv.get(`caterer:${id}`)));
    return records.filter(Boolean);
  }
  const ids = mem.ownerIndex.get(ownerEmail) || new Set();
  return Array.from(ids)
    .map((id) => mem.caterers.get(id))
    .filter(Boolean);
}

export async function upsertCaterer(data, ownerEmail, isAdmin = false) {
  const id = data.id || nanoid(10);
  const isNew = !data.id;
  const record = {
    ...data,
    id,
    ownerEmail: data.ownerEmail || ownerEmail,
    // Every create or edit by the owner goes back to pending review - status
    // can only otherwise change via setCatererStatus() by an admin. An edit
    // made directly by an admin is self-approving and skips that queue.
    ...(isAdmin
      ? { status: STATUS.APPROVED, reviewedBy: ownerEmail, reviewedAt: new Date().toISOString(), rejectionReason: null }
      : { status: STATUS.PENDING, reviewedBy: null, reviewedAt: null, rejectionReason: null }),
    updatedAt: new Date().toISOString(),
    createdAt: isNew ? new Date().toISOString() : data.createdAt || new Date().toISOString()
  };

  if (hasKv) {
    await kv.set(`caterer:${id}`, record);
    await kv.sadd(INDEX_KEY, id);
    await kv.sadd(`owner:${record.ownerEmail}`, id);
  } else {
    mem.caterers.set(id, record);
    const set = mem.ownerIndex.get(record.ownerEmail) || new Set();
    set.add(id);
    mem.ownerIndex.set(record.ownerEmail, set);
  }
  return record;
}

// Admin-only: approve or reject a pending (or previously reviewed) listing.
export async function setCatererStatus(id, status, adminEmail, rejectionReason = null) {
  const existing = await getCaterer(id);
  if (!existing) return null;

  const record = {
    ...existing,
    status,
    reviewedBy: adminEmail,
    reviewedAt: new Date().toISOString(),
    rejectionReason: status === STATUS.REJECTED ? rejectionReason : null
  };

  if (hasKv) {
    await kv.set(`caterer:${id}`, record);
  } else {
    mem.caterers.set(id, record);
  }
  return record;
}

export async function listPendingCaterers() {
  const all = await listCaterers();
  return all.filter((c) => c.status === STATUS.PENDING);
}

export async function deleteCaterer(id, requesterEmail, isAdmin = false) {
  const existing = await getCaterer(id);
  if (!existing) return false;
  if (existing.ownerEmail !== requesterEmail && !isAdmin) return false;

  // Always clear the *actual* owner's index, not the requester's - an admin
  // deleting someone else's listing must not touch their own owner index.
  const ownerEmail = existing.ownerEmail;

  if (hasKv) {
    await kv.del(`caterer:${id}`);
    await kv.srem(INDEX_KEY, id);
    await kv.srem(`owner:${ownerEmail}`, id);
  } else {
    mem.caterers.delete(id);
    mem.ownerIndex.get(ownerEmail)?.delete(id);
  }
  return true;
}

// ---- Search / filtering ----
export async function searchCaterers(filters) {
  const all = await listCaterers();
  return all.filter((c) => matches(c, filters));
}

function matches(c, f) {
  const cDistricts = c.districts || (c.district ? [c.district] : []);
  const cKashrutLevels = c.kashrutLevels || (c.kashrut ? [c.kashrut] : []);
  const cCateringTypes = c.cateringTypes || (c.cateringType ? [c.cateringType] : []);

  if (f.keyword) {
    const kw = f.keyword.toLowerCase();
    const descText =
      typeof c.description === 'string'
        ? c.description
        : Object.values(c.description || {}).join(' ');
    const cityText = typeof c.city === 'string' ? c.city : Object.values(c.city || {}).join(' ');
    const haystack = `${c.businessName} ${cityText} ${descText}`.toLowerCase();
    if (!haystack.includes(kw)) return false;
  }
  if (f.districts?.length) {
    const ok = f.districts.some((d) => cDistricts.includes(d));
    if (!ok) return false;
  }
  if (f.kashrutLevels?.length) {
    const ok = f.kashrutLevels.some((k) => cKashrutLevels.includes(k));
    if (!ok) return false;
  }
  if (f.cateringTypes?.length) {
    const ok = f.cateringTypes.some((t) => cCateringTypes.includes(t));
    if (!ok) return false;
  }
  if (f.eventTypes?.length) {
    const ok = f.eventTypes.some((e) => (c.eventTypes || []).includes(e));
    if (!ok) return false;
  }
  if (f.minGuests && Number(c.maxGuests) < Number(f.minGuests)) return false;
  if (f.maxMinOrder) {
    const packages = c.packages || [];
    // No packages set up yet - order minimum is unknown, don't exclude the caterer.
    if (packages.length > 0) {
      const ok = packages.some((p) => !p.minGuests || Number(p.minGuests) <= Number(f.maxMinOrder));
      if (!ok) return false;
    }
  }
  if (f.menuCategories?.length) {
    const ok = f.menuCategories.every((m) => (c.menuCategories || []).includes(m));
    if (!ok) return false;
  }
  if (f.services?.length) {
    const ok = f.services.every((s) => (c.services || []).includes(s));
    if (!ok) return false;
  }
  return true;
}
