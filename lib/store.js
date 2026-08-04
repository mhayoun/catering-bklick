import { nanoid } from 'nanoid';
import { seedCaterers } from '../data/seed';
import { buildCatererHaystack, countOccurrences, countOccurrencesMulti, getCodedFields, parseKeywords } from './search';

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
  const filtered = all.filter((c) => matches(c, filters));

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

function matches(c, f) {
  const { cDistricts, cKashrutLevels, cCateringTypes } = getCodedFields(c);

  const keywordTerms = parseKeywords(f.keyword);
  if (keywordTerms.length > 0) {
    const haystack = buildCatererHaystack(c, f.locale || 'he');
    const ok = keywordTerms.some((term) => countOccurrences(haystack, term) > 0);
    if (!ok) return false;
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
    // Match if the caterer itself is tagged, OR any individual package/formula is - a caterer
    // can offer a package for an event type without tagging the whole business with it.
    const packageEventTypes = (c.packages || []).flatMap((p) => p.eventTypes || []);
    const ok = f.eventTypes.some((e) => (c.eventTypes || []).includes(e) || packageEventTypes.includes(e));
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
  if (f.alaCarteCategories?.length) {
    // Deep match, same shape as eventTypes above: an à-la-carte package's items each carry their
    // own categoryId (see ALACARTE_CATEGORIES in lib/constants.js), so this has to look inside
    // every package's addons rather than a caterer-level tag - a profile-level flag here could
    // claim a category with zero matching items actually listed.
    const itemCategoryIds = (c.packages || [])
      .filter((p) => p.type === 'a_la_carte')
      .flatMap((p) => p.addons || [])
      .map((a) => a.categoryId)
      .filter(Boolean);
    const ok = f.alaCarteCategories.some((cat) => itemCategoryIds.includes(cat));
    if (!ok) return false;
  }
  if (f.services?.length) {
    const ok = f.services.every((s) => (c.services || []).includes(s));
    if (!ok) return false;
  }
  return true;
}
