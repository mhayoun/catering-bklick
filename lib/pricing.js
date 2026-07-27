// Package-based price estimation, modeled on the per-guest pricing sheets
// caterers use (price/guest x guest count, with a per-package order minimum).
// A caterer's `packages` array is optional - callers must handle `null`/`[]`
// for caterers that only set the legacy flat `priceFrom` field.

export function estimatePackageTotal(pkg, guestCount) {
  const guests = Number(guestCount);
  const pricePerGuest = Number(pkg?.pricePerGuest);
  if (!guests || guests <= 0 || !pricePerGuest) return null;

  const minGuests = Number(pkg?.minGuests) || 0;
  const belowMinimum = guests < minGuests;
  // Caterers bill at least their minimum order even for smaller parties.
  const billedGuests = Math.max(guests, minGuests);

  // Add-ons (e.g. a "full event" upgrade) are optional extras the customer
  // chooses separately - they're surfaced for reference but never folded
  // into the headline total, since nothing here indicates they were picked.
  const availableAddons = (pkg?.addons || [])
    .filter((addon) => Number(addon?.amount))
    .map((addon) => ({
      ...addon,
      estimatedAmount: addon.priceType === 'per_guest' ? Number(addon.amount) * billedGuests : Number(addon.amount)
    }));

  return {
    total: pricePerGuest * billedGuests,
    billedGuests,
    belowMinimum,
    availableAddons
  };
}

// Returns { pkg, ...estimate } for the cheapest package that can serve
// guestCount, or null if the caterer has no packages / no valid guest count.
export function cheapestPackageEstimate(caterer, guestCount) {
  const packages = caterer?.packages || [];
  const estimates = packages
    .map((pkg) => {
      const estimate = estimatePackageTotal(pkg, guestCount);
      return estimate && { pkg, ...estimate };
    })
    .filter(Boolean);

  if (estimates.length === 0) return null;
  return estimates.reduce((cheapest, e) => (e.total < cheapest.total ? e : cheapest));
}
