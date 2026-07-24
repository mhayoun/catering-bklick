export const dictionaries = {
  he: {
    dir: 'rtl',
    siteName: 'קייטרינג בקליק',
    tagline: 'קליק אחד, ואוכל טוב יותר בדרך אליכם',
    nav: { search: 'חיפוש', dashboard: 'הקייטרינגים שלי', admin: 'ניהול אתר', login: 'התחברות', logout: 'התנתקות', addBusiness: 'הוספת עסק', menu: 'תפריט' },
    hero: {
      title: 'מוצאים קייטרינג. לוחצים. אוכלים.',
      subtitle: 'מאגר קייטרינגים מכל הארץ - כשר, חלבי, בשרי, ולכל אירוע. בלי טלפונים מיותרים, בלי דיל שמשתבש.',
      cta: 'התחילו לחפש',
      count: 'עסקי קייטרינג במאגר'
    },
    search: {
      title: 'חיפוש קייטרינג',
      location: 'אזור בארץ',
      kashrut: 'כשרות',
      cateringType: 'סוג קייטרינג',
      eventType: 'סוג אירוע',
      guests: 'מספר אורחים',
      menu: 'פריטי תפריט',
      beverages: 'משקאות',
      services: 'שירותים נוספים',
      keyword: 'חיפוש חופשי (שם עסק, עיר...)',
      submit: 'חפשו קייטרינג',
      reset: 'איפוס סינון',
      resultsCount: 'נמצאו {n} עסקים',
      noResults: 'לא נמצאו קייטרינגים שתואמים את הסינון. נסו להרחיב את הקריטריונים.',
      any: 'הכל'
    },
    districts: {
      jerusalem: 'ירושלים והסביבה',
      center: 'מרכז',
      telaviv: 'תל אביב והגוש',
      north: 'צפון',
      haifa: 'חיפה והקריות',
      south: 'דרום',
      judea_samaria: 'יהודה ושומרון'
    },
    kashrut: {
      rabbanut: 'רבנות',
      badatz: 'בד"ץ',
      mehadrin: 'מהדרין',
      none: 'ללא השגחה'
    },
    cateringType: { dairy: 'חלבי', meat: 'בשרי' },
    eventTypes: {
      brit: 'ברית מילה',
      bar_mitzvah: 'בר/בת מצווה',
      engagement: 'אירוסין',
      shabbat_chatan: 'שבת חתן',
      celebration: 'מסיבה / חגיגה',
      memorial: 'אזכרה / יום שנה'
    },
    menuCategories: {
      salads: 'סלטים',
      fish: 'דגים',
      meat: 'בשרים',
      main_courses: 'מנות עיקריות',
      desserts: 'קינוחים',
      beverages: 'משקאות'
    },
    beverageTypes: { alcoholic: 'אלכוהוליים', non_alcoholic: 'ללא אלכוהול' },
    services: {
      elegant_tableware: 'כלים אלגנטיים',
      free_delivery: 'משלוח חינם',
      waiter_staff: 'צוות הגשה',
      setup_teardown: 'הקמה ופירוק',
      live_cooking_station: 'עמדת בישול חי',
      sound_system: 'מערכת הגברה'
    },
    guestBrackets: {
      small: 'עד 30 אורחים',
      medium: 'עד 80 אורחים',
      large: 'עד 200 אורחים',
      xlarge: 'עד 500 אורחים',
      huge: '500+ אורחים'
    },
    card: { from: 'החל מ-', perGuest: 'לאורח', guestsUpTo: 'עד {n} אורחים', viewProfile: 'לפרופיל המלא' },
    profile: {
      about: 'קצת עלינו',
      menu: 'התפריט',
      services: 'שירותים נוספים',
      gallery: 'תמונות',
      videos: 'סרטונים',
      contact: 'יצירת קשר',
      call: 'התקשרו',
      whatsapp: 'וואטסאפ',
      email: 'אימייל',
      website: 'אתר',
      address: 'כתובת',
      backToSearch: 'חזרה לתוצאות החיפוש'
    },
    auth: {
      loginTitle: 'התחברות לבעלי עסקים',
      loginSubtitle: 'התחברו עם Google כדי לנהל את פרופיל הקייטרינג שלכם',
      googleLogin: 'המשך עם Google',
      needAccount: 'בעלי עסק? היכנסו כדי להוסיף או לנהל את הקייטרינג שלכם.'
    },
    dashboard: {
      title: 'הקייטרינגים שלי',
      empty: 'עדיין לא הוספתם עסק. בואו נתקן את זה.',
      addNew: 'הוספת קייטרינג חדש',
      edit: 'עריכה',
      delete: 'מחיקה',
      status: 'סטטוס',
      statusPending: 'ממתין לאישור המנהל',
      statusApproved: 'מאושר ומוצג באתר',
      statusRejected: 'נדחה',
      rejectionReason: 'סיבת הדחייה',
      moderationNote: 'כל עסק חדש, וכל עריכה בעסק קיים, עוברים בדיקה ואישור של מנהל האתר לפני שהם מוצגים בחיפוש הציבורי.'
    },
    admin: {
      title: 'ניהול ואישור עסקים',
      subtitle: 'עסקים חדשים ועריכות ממתינים לאישור שלך לפני שהם מוצגים באתר.',
      empty: 'אין כרגע בקשות הממתינות לאישור. הכל מעודכן!',
      submittedBy: 'הוגש על ידי',
      viewFullProfile: 'צפייה בפרופיל המלא',
      approve: 'אישור ופרסום',
      reject: 'דחייה',
      rejectReasonPrompt: 'סיבת הדחייה (תוצג לבעל העסק):',
      notAuthorized: 'העמוד הזה מיועד למנהלי האתר בלבד.'
    },
    form: {
      title: 'פרטי העסק',
      subtitle: 'טופס זה משתמש באותם קריטריונים בדיוק כמו מנוע החיפוש, כדי שהלקוחות הנכונים תמיד ימצאו אתכם.',
      businessName: 'שם העסק',
      description: 'תיאור קצר',
      descriptionAutoTranslate: 'התיאור יתורגם אוטומטית לשתי השפות הנוספות בעת השמירה.',
      district: 'אזורים (ניתן לבחור כמה)',
      city: 'עיר',
      cityAutoTranslate: 'שם העיר יתורגם אוטומטית לשתי השפות הנוספות בעת השמירה.',
      translating: 'מתרגם…',
      address: 'כתובת מדויקת',
      kashrut: 'רמות כשרות (ניתן לבחור כמה)',
      cateringType: 'סוגי קייטרינג (ניתן לבחור כמה)',
      districts: 'אזורים (ניתן לבחור כמה)',
      kashrutLevels: 'רמות כשרות (ניתן לבחור כמה)',
      cateringTypes: 'סוגי קייטרינג (ניתן לבחור כמה)',
      districtsRequired: 'יש לבחור לפחות אזור אחד',
      cateringTypesRequired: 'יש לבחור לפחות סוג קייטרינג אחד',
      maxGuests: 'מספר אורחים מקסימלי',
      eventTypes: 'אירועים שאנחנו מספקים',
      menuCategories: 'קטגוריות תפריט',
      beverageTypes: 'סוגי משקאות',
      services: 'שירותים נוספים',
      priceFrom: 'מחיר החל מ- (לאורח, בש"ח)',
      phone: 'טלפון',
      whatsapp: 'מספר וואטסאפ',
      email: 'אימייל',
      website: 'אתר אינטרנט',
      instagram: 'אינסטגרם (קישור)',
      facebook: 'פייסבוק (קישור)',
      photos: 'תמונות',
      uploadPhotos: 'העלאת תמונות',
      videos: 'קישורי סרטונים (יוטיוב/וידאו)',
      addVideoLink: 'הוספת קישור וידאו',
      save: 'שמירת פרופיל',
      saving: 'שומר...',
      publish: 'פרסום',
      cancel: 'ביטול',
      required: 'שדה חובה',
      moderationNotice: 'לאחר השמירה, העסק (או העריכה) יישלחו לבדיקת מנהל האתר ויוצגו בחיפוש הציבורי רק לאחר אישור.'
    },
    footer: {
      rights: 'כל הזכויות שמורות',
      madeWith: 'נבנה עם הרבה תיאבון'
    }
  },

  en: {
    dir: 'ltr',
    siteName: 'Catering in a Click',
    tagline: 'One click, better food on the way',
    nav: { search: 'Search', dashboard: 'My Caterers', admin: 'Admin', login: 'Log in', logout: 'Log out', addBusiness: 'List Your Business', menu: 'Menu' },
    hero: {
      title: 'Find a caterer. Click. Eat well.',
      subtitle: 'A directory of caterers across Israel - kosher, dairy, meat, and every kind of event. No endless phone tag, no surprises.',
      cta: 'Start searching',
      count: 'caterers in the directory'
    },
    search: {
      title: 'Search Caterers',
      location: 'Area in Israel',
      kashrut: 'Kashrut certification',
      cateringType: 'Catering type',
      eventType: 'Event type',
      guests: 'Number of guests',
      menu: 'Menu items',
      beverages: 'Beverages',
      services: 'Additional services',
      keyword: 'Free text search (business name, city...)',
      submit: 'Search caterers',
      reset: 'Reset filters',
      resultsCount: '{n} caterers found',
      noResults: "No caterers match these filters. Try widening your search.",
      any: 'Any'
    },
    districts: {
      jerusalem: 'Jerusalem area',
      center: 'Central Israel',
      telaviv: 'Tel Aviv & Gush Dan',
      north: 'North',
      haifa: 'Haifa & the Krayot',
      south: 'South',
      judea_samaria: 'Judea & Samaria'
    },
    kashrut: {
      rabbanut: 'Rabbanut',
      badatz: 'Badatz',
      mehadrin: 'Mehadrin',
      none: 'No supervision'
    },
    cateringType: { dairy: 'Dairy (Halavi)', meat: 'Meat (Basari)' },
    eventTypes: {
      brit: 'Brit Milah (Circumcision)',
      bar_mitzvah: 'Bar/Bat Mitzvah',
      engagement: 'Engagement',
      shabbat_chatan: 'Shabbat Chatan (Shabbat Groom)',
      celebration: 'Celebration',
      memorial: 'Memorial / Anniversary'
    },
    menuCategories: {
      salads: 'Salads',
      fish: 'Fish',
      meat: 'Meat',
      main_courses: 'Main courses',
      desserts: 'Desserts',
      beverages: 'Beverages'
    },
    beverageTypes: { alcoholic: 'Alcoholic', non_alcoholic: 'Non-alcoholic' },
    services: {
      elegant_tableware: 'Elegant tableware',
      free_delivery: 'Free delivery',
      waiter_staff: 'Waiter staff',
      setup_teardown: 'Setup & teardown',
      live_cooking_station: 'Live cooking station',
      sound_system: 'Sound system'
    },
    guestBrackets: {
      small: 'Up to 30 guests',
      medium: 'Up to 80 guests',
      large: 'Up to 200 guests',
      xlarge: 'Up to 500 guests',
      huge: '500+ guests'
    },
    card: { from: 'From', perGuest: 'per guest', guestsUpTo: 'Up to {n} guests', viewProfile: 'View full profile' },
    profile: {
      about: 'About us',
      menu: 'Menu',
      services: 'Additional services',
      gallery: 'Photos',
      videos: 'Videos',
      contact: 'Contact',
      call: 'Call',
      whatsapp: 'WhatsApp',
      email: 'Email',
      website: 'Website',
      address: 'Address',
      backToSearch: 'Back to search results'
    },
    auth: {
      loginTitle: 'Business owner login',
      loginSubtitle: 'Sign in with Google to manage your catering profile',
      googleLogin: 'Continue with Google',
      needAccount: 'Own a catering business? Log in to add or manage your listing.'
    },
    dashboard: {
      title: 'My Caterers',
      empty: "You haven't listed a business yet. Let's fix that.",
      addNew: 'Add new caterer',
      edit: 'Edit',
      delete: 'Delete',
      status: 'Status',
      statusPending: 'Pending admin approval',
      statusApproved: 'Approved and live',
      statusRejected: 'Rejected',
      rejectionReason: 'Rejection reason',
      moderationNote: 'Every new business, and every edit to an existing one, is reviewed and approved by the site administrator before it appears in public search.'
    },
    admin: {
      title: 'Approve & manage businesses',
      subtitle: 'New businesses and edits wait here for your approval before they go live.',
      empty: 'Nothing pending review right now. All caught up!',
      submittedBy: 'Submitted by',
      viewFullProfile: 'View full profile',
      approve: 'Approve & publish',
      reject: 'Reject',
      rejectReasonPrompt: 'Reason for rejection (shown to the business owner):',
      notAuthorized: 'This page is for site administrators only.'
    },
    form: {
      title: 'Business details',
      subtitle: 'This form uses exactly the same criteria as the search engine, so the right customers always find you.',
      businessName: 'Business name',
      description: 'Short description',
      descriptionAutoTranslate: 'This will be automatically translated into the other two languages when you save.',
      district: 'Areas (select multiple)',
      city: 'City',
      cityAutoTranslate: 'The city name will be automatically translated into the other two languages when you save.',
      translating: 'Translating…',
      address: 'Exact address',
      kashrut: 'Kashrut levels (select multiple)',
      cateringType: 'Catering types (select multiple)',
      districts: 'Areas (select multiple)',
      kashrutLevels: 'Kashrut levels (select multiple)',
      cateringTypes: 'Catering types (select multiple)',
      districtsRequired: 'Select at least one area',
      cateringTypesRequired: 'Select at least one catering type',
      maxGuests: 'Maximum number of guests',
      eventTypes: 'Events you cater',
      menuCategories: 'Menu categories',
      beverageTypes: 'Beverage types',
      services: 'Additional services',
      priceFrom: 'Price from (per guest, NIS)',
      phone: 'Phone',
      whatsapp: 'WhatsApp number',
      email: 'Email',
      website: 'Website',
      instagram: 'Instagram (link)',
      facebook: 'Facebook (link)',
      photos: 'Photos',
      uploadPhotos: 'Upload photos',
      videos: 'Video links (YouTube/video)',
      addVideoLink: 'Add video link',
      save: 'Save profile',
      saving: 'Saving...',
      publish: 'Publish',
      cancel: 'Cancel',
      required: 'Required field',
      moderationNotice: 'After saving, this business (or edit) is sent for admin review and will only appear in public search once approved.'
    },
    footer: {
      rights: 'All rights reserved',
      madeWith: 'Built with a big appetite'
    }
  },

  fr: {
    dir: 'ltr',
    siteName: 'Catering en un clic',
    tagline: 'Un clic, un bon traiteur en route',
    nav: { search: 'Recherche', dashboard: 'Mes traiteurs', admin: 'Administration', login: 'Connexion', logout: 'Déconnexion', addBusiness: 'Inscrire mon entreprise', menu: 'Menu' },
    hero: {
      title: 'Trouvez un traiteur. Cliquez. Régalez-vous.',
      subtitle: "Un annuaire de traiteurs partout en Israël - casher, lacté, viande, pour tous les événements. Sans coups de fil interminables ni mauvaises surprises.",
      cta: 'Lancer la recherche',
      count: 'traiteurs référencés'
    },
    search: {
      title: 'Rechercher un traiteur',
      location: 'Région en Israël',
      kashrut: 'Certification de cacherout',
      cateringType: 'Type de traiteur',
      eventType: "Type d'événement",
      guests: "Nombre d'invités",
      menu: 'Éléments du menu',
      beverages: 'Boissons',
      services: 'Services supplémentaires',
      keyword: 'Recherche libre (nom, ville...)',
      submit: 'Rechercher',
      reset: 'Réinitialiser',
      resultsCount: '{n} traiteurs trouvés',
      noResults: 'Aucun traiteur ne correspond à ces filtres. Essayez d\'élargir votre recherche.',
      any: 'Tous'
    },
    districts: {
      jerusalem: 'Région de Jérusalem',
      center: 'Centre',
      telaviv: 'Tel Aviv & Gush Dan',
      north: 'Nord',
      haifa: 'Haïfa & les Krayot',
      south: 'Sud',
      judea_samaria: 'Judée-Samarie'
    },
    kashrut: {
      rabbanut: 'Rabbanout',
      badatz: 'Badatz',
      mehadrin: 'Mehadrin',
      none: 'Sans supervision'
    },
    cateringType: { dairy: 'Lacté (Halavi)', meat: 'Viande (Basari)' },
    eventTypes: {
      brit: 'Brit Mila (circoncision)',
      bar_mitzvah: 'Bar/Bat Mitzvah',
      engagement: 'Fiançailles',
      shabbat_chatan: 'Shabbat Hatan',
      celebration: 'Fête / célébration',
      memorial: 'Commémoration / anniversaire'
    },
    menuCategories: {
      salads: 'Salades',
      fish: 'Poisson',
      meat: 'Viandes',
      main_courses: 'Plats principaux',
      desserts: 'Desserts',
      beverages: 'Boissons'
    },
    beverageTypes: { alcoholic: 'Alcoolisées', non_alcoholic: 'Sans alcool' },
    services: {
      elegant_tableware: 'Vaisselle élégante',
      free_delivery: 'Livraison gratuite',
      waiter_staff: 'Personnel de service',
      setup_teardown: 'Installation et démontage',
      live_cooking_station: 'Cuisine en direct',
      sound_system: 'Système de sonorisation'
    },
    guestBrackets: {
      small: "Jusqu'à 30 invités",
      medium: "Jusqu'à 80 invités",
      large: "Jusqu'à 200 invités",
      xlarge: "Jusqu'à 500 invités",
      huge: '500+ invités'
    },
    card: { from: 'À partir de', perGuest: 'par invité', guestsUpTo: "Jusqu'à {n} invités", viewProfile: 'Voir le profil complet' },
    profile: {
      about: 'À propos',
      menu: 'Menu',
      services: 'Services supplémentaires',
      gallery: 'Photos',
      videos: 'Vidéos',
      contact: 'Contact',
      call: 'Appeler',
      whatsapp: 'WhatsApp',
      email: 'E-mail',
      website: 'Site web',
      address: 'Adresse',
      backToSearch: 'Retour aux résultats'
    },
    auth: {
      loginTitle: 'Connexion professionnels',
      loginSubtitle: 'Connectez-vous avec Google pour gérer votre profil traiteur',
      googleLogin: 'Continuer avec Google',
      needAccount: 'Vous êtes traiteur ? Connectez-vous pour ajouter ou gérer votre fiche.'
    },
    dashboard: {
      title: 'Mes traiteurs',
      empty: "Vous n'avez pas encore inscrit d'entreprise. Corrigeons cela.",
      addNew: 'Ajouter un traiteur',
      edit: 'Modifier',
      delete: 'Supprimer',
      status: 'Statut',
      statusPending: "En attente d'approbation",
      statusApproved: 'Approuvé et visible',
      statusRejected: 'Rejeté',
      rejectionReason: 'Motif du rejet',
      moderationNote: "Chaque nouvelle entreprise, et chaque modification d'une fiche existante, est vérifiée et approuvée par l'administrateur du site avant d'apparaître dans la recherche publique."
    },
    admin: {
      title: 'Approuver et gérer les entreprises',
      subtitle: "Les nouvelles entreprises et modifications attendent ici votre validation avant publication.",
      empty: 'Rien à valider pour le moment. Tout est à jour !',
      submittedBy: 'Soumis par',
      viewFullProfile: 'Voir le profil complet',
      approve: 'Approuver et publier',
      reject: 'Rejeter',
      rejectReasonPrompt: "Motif du rejet (affiché au propriétaire de l'entreprise) :",
      notAuthorized: 'Cette page est réservée aux administrateurs du site.'
    },
    form: {
      title: "Détails de l'entreprise",
      subtitle: "Ce formulaire utilise exactement les mêmes critères que le moteur de recherche, pour que les bons clients vous trouvent toujours.",
      businessName: "Nom de l'entreprise",
      description: 'Courte description',
      descriptionAutoTranslate: 'Ce texte sera automatiquement traduit dans les deux autres langues lors de l\'enregistrement.',
      district: 'Régions (sélection multiple)',
      city: 'Ville',
      cityAutoTranslate: "Le nom de la ville sera automatiquement traduit dans les deux autres langues lors de l'enregistrement.",
      translating: 'Traduction en cours…',
      address: 'Adresse exacte',
      kashrut: 'Niveaux de cacherout (sélection multiple)',
      cateringType: 'Types de traiteur (sélection multiple)',
      districts: 'Régions (sélection multiple)',
      kashrutLevels: 'Niveaux de cacherout (sélection multiple)',
      cateringTypes: 'Types de traiteur (sélection multiple)',
      districtsRequired: 'Sélectionnez au moins une région',
      cateringTypesRequired: 'Sélectionnez au moins un type de traiteur',
      maxGuests: "Nombre maximum d'invités",
      eventTypes: 'Événements couverts',
      menuCategories: 'Catégories du menu',
      beverageTypes: 'Types de boissons',
      services: 'Services supplémentaires',
      priceFrom: 'Prix à partir de (par invité, NIS)',
      phone: 'Téléphone',
      whatsapp: 'Numéro WhatsApp',
      email: 'E-mail',
      website: 'Site web',
      instagram: 'Instagram (lien)',
      facebook: 'Facebook (lien)',
      photos: 'Photos',
      uploadPhotos: 'Téléverser des photos',
      videos: 'Liens vidéo (YouTube/vidéo)',
      addVideoLink: 'Ajouter un lien vidéo',
      save: 'Enregistrer le profil',
      saving: 'Enregistrement...',
      publish: 'Publier',
      cancel: 'Annuler',
      required: 'Champ requis',
      moderationNotice: "Après l'enregistrement, cette entreprise (ou modification) est envoyée à l'administrateur pour validation et n'apparaîtra dans la recherche publique qu'une fois approuvée."
    },
    footer: {
      rights: 'Tous droits réservés',
      madeWith: 'Fait avec beaucoup d\'appétit'
    }
  }
};

export function getDictionary(locale) {
  return dictionaries[locale] || dictionaries.he;
}

export function t(dict, path, vars) {
  const value = path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), dict);
  if (typeof value !== 'string') return path;
  if (!vars) return value;
  return Object.keys(vars).reduce((str, key) => str.replace(`{${key}}`, vars[key]), value);
}
