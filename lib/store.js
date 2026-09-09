import { nanoid } from 'nanoid';
import { seedCaterers } from '../data/seed';
import { buildCatererHaystack, countOccurrencesMulti, matchesFilters, parseKeywords } from './search';

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

// Redis Sets (kv.smembers) have no guaranteed iteration order - it can change between calls
// even with no writes in between. Every function below that reads one sorts its records by
// createdAt afterwards so the list order a user sees stays stable instead of visibly reshuffling
// (which reads as items randomly vanishing/reappearing if you're not scanning the whole list).
function byCreatedAt(a, b) {
  return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
}

export async function listCaterers() {
  if (hasKv) {
    const ids = (await kv.smembers(INDEX_KEY)) || [];
    if (ids.length === 0) return seedCaterers; // fresh DB: show demo data
    const records = await Promise.all(ids.map((id) => kv.get(`caterer:${id}`)));
    return records.filter(Boolean).sort(byCreatedAt);
  }
  return Array.from(mem.caterers.values()).sort(byCreatedAt);
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
    return records.filter(Boolean).sort(byCreatedAt);
  }
  const ids = mem.ownerIndex.get(ownerEmail) || new Set();
  return Array.from(ids)
    .map((id) => mem.caterers.get(id))
    .filter(Boolean)
    .sort(byCreatedAt);
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
  const filtered = all.filter((c) => matchesFilters(c, filters));

  // With a keyword search active (one or more terms, comma/space separated), rank results by
  // how many times ANY of the terms appears across the caterer's own fields and all of its
  // packages - the more matches, the more relevant. Scoped to the visitor's display locale
  // (filters.locale) so the count always matches what can actually be highlighted for them.
  const terms = parseKeywords(filters.keyword);
  if (terms.length === 0) return filtered;
  const locale = filters.locale || 'he';
  return filtered
    .map((c) => ({ ...c, matchCount: countOccurrencesMulti(buildCatererHaystack(c, locale), terms) }))
    .sort((a, b) => b.matchCount - a.matchCount);
}
