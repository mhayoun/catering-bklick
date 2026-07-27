// Single source of truth for every criterion used by BOTH the search UI
// and the caterer registration form, per the product requirement that
// "the caterer registration form must use exactly the same criteria as
// the search system."

export const DISTRICTS = [
  'jerusalem',
  'center',
  'telaviv',
  'north',
  'haifa',
  'south',
  'judea_samaria'
];

export const KASHRUT_LEVELS = ['rabbanut', 'badatz', 'mehadrin', 'none'];

export const CATERING_TYPES = ['dairy', 'meat'];

export const EVENT_TYPES = [
  'brit', // Circumcision / Brit Milah
  'bar_mitzvah',
  'engagement',
  'wedding',
  'henna', // Henna ceremony (pre-wedding Mizrahi/Sephardi tradition)
  'shabbat_chatan', // "Shabbat Groom" (Shabbat Chatan)
  'celebration',
  'memorial' // Memorial / Anniversary (Yahrzeit)
];

export const MENU_CATEGORIES = [
  'salads',
  'starters',
  'main_courses',
  'hot_sides',
  'breads',
  'desserts',
  'beverages_non_alcoholic',
  'beverages_alcoholic'
];

export const ADDITIONAL_SERVICES = [
  'elegant_tableware',
  'disposable_tableware',
  'shabbat_platters_urns',
  'free_delivery',
  'waiter_staff',
  'setup_teardown',
  'live_cooking_station',
  'sound_system',
  'kids_meals',
  'vegetarian_food',
  'gluten_free_options'
];

export const ADDON_PRICE_TYPES = ['per_guest', 'flat'];

export const GUEST_COUNT_BRACKETS = [
  { id: 'small', max: 30 },
  { id: 'medium', max: 80 },
  { id: 'large', max: 200 },
  { id: 'xlarge', max: 500 },
  { id: 'huge', max: 999999 }
];

export const LOCALES = ['he', 'en', 'fr'];
export const RTL_LOCALES = ['he'];
