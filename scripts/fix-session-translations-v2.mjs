// Follow-up to scripts/fix-session-translations.mjs: that script used the project's own
// lib/translate.js (MyMemory free API) to fill en/fr for the 5 session caterers' packages, but
// the free engine mistranslated several short Hebrew dish names badly out of context (e.g.
// "חומוס ביתי" -> "Homemade chick" / "Poussin fait maison"). This script replaces every en/fr
// translation for those 5 caterers with hand-written translations instead, keyed by exact
// Hebrew text (a single map reused across all matching fields, since many dish names repeat
// across packages and even across caterers).
//
// Usage: node --env-file=.env.local scripts/fix-session-translations-v2.mjs

import { kv } from '@vercel/kv';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('KV_REST_API_URL / KV_REST_API_TOKEN are not set.');
  process.exit(1);
}

const CATERER_IDS = ['oHeb8Jc13p', 'LFJQpB7eV0', 'sRA1msRV1N', 'PoTelhGays', '8NF8JEdiOD'];

// he -> [en, fr]. One shared map: identical Hebrew text always gets identical translations,
// which is correct here (the same dish name means the same thing everywhere it repeats).
const T = {
  // --- Kaza ---
  'קייטרינג בוטיק במשלוח': ['Delivery-only boutique catering', 'Traiteur boutique en livraison'],
  "קרפצ'יו סלק": ['Beet carpaccio', 'Carpaccio de betterave'],
  "קרפצ'יו חציל": ["Eggplant carpaccio", "Carpaccio d'aubergine"],
  'חומוס ביתי': ['Homemade hummus', 'Houmous maison'],
  'חציל זעלוק': ['Eggplant zaalouk', 'Aubergine zaalouk'],
  'חציל פיקנטי': ['Spicy eggplant', 'Aubergine épicée'],
  'חמוצי הבית': ['House pickles', 'Pickles maison'],
  'סלט עלים': ['Leaf salad', 'Salade de jeunes pousses'],
  'סלט ירוקים': ['Green salad', 'Salade verte'],
  'מטבוחה מרוקאית': ['Moroccan matbucha', 'Matbucha marocaine'],
  'פלפלים חריפים': ['Spicy peppers', 'Piments épicés'],
  'סלק אדום לימוני': ['Lemony red beet salad', 'Betterave rouge au citron'],
  'סלט כרוב חמצמץ': ['Tangy cabbage salad', 'Salade de chou acidulée'],
  'פלחי גזר חרפרף': ['Crunchy carrot slices', 'Rondelles de carotte croquantes'],
  'עגבניות חריפות': ['Spicy tomatoes', 'Tomates épicées'],
  'סלט משוואיה': ['Mechouiya salad', 'Salade méchouia'],
  "טחינת השף": ["Chef's tahini", 'Tahini du chef'],
  'סלט ביצים': ['Egg salad', "Salade d'œufs"],
  'פסטייה עוף': ['Chicken pastilla', 'Pastilla au poulet'],
  'פרחי סינייה עוף': ['Chicken sinia flowers', 'Fleurs de sinia au poulet'],
  'מושט מרוקאי חריף': ['Spicy Moroccan-style mullet', 'Mulet épicé à la marocaine'],
  'מושט בעשבי תיבול': ['Mullet with fresh herbs', 'Mulet aux herbes fraîches'],
  'סיגר מממולא בשר': ['Meat-stuffed cigar', 'Cigare farci à la viande'],
  'קציצות דגים פיקנטי': ['Spicy fish cakes', 'Boulettes de poisson épicées'],
  'פטריות פורטבלו במילוי בשר': ['Meat-stuffed portobello mushrooms', 'Champignons portobello farcis à la viande'],
  'אורז קלאסי': ['Classic rice', 'Riz classique'],
  'אורז אושפלו': ['Rice with orzo pasta', 'Riz à l’orzo'],
  'אורז בתיבול השף': ["Rice with chef's seasoning", 'Riz aux épices du chef'],
  'אנטי-פסטי': ['Antipasti', 'Antipasti'],
  'פולנטה חמימה': ['Warm polenta', 'Polenta chaude'],
  'קוסקוס מרוקאי': ['Moroccan couscous', 'Couscous marocain'],
  'פטריות מוקפצות': ['Sautéed mushrooms', 'Champignons sautés'],
  'תפודי מדורה עם ירק': ['Bonfire potatoes with herbs', 'Pommes de terre "médora" aux herbes'],
  'שעועית ירוקה מוקפצת': ['Sautéed green beans', 'Haricots verts sautés'],
  'דואט תפוח אדמה ובטטה': ['Potato and sweet potato duet', 'Duo de pomme de terre et patate douce'],
  'אסאדו מעושן': ['Smoked asado', 'Asado fumé'],
  'ארטישוק ממולא': ['Stuffed artichoke', 'Artichaut farci'],
  'פרגית בערמונים': ['Chicken thigh with chestnuts', 'Cuisse de poulet aux châtaignes'],
  'פרגית ממולאת בשר': ['Chicken thigh stuffed with meat', 'Cuisse de poulet farcie à la viande'],
  'קציצות עגל/עוף ברוטב': ['Veal/chicken meatballs in sauce', 'Boulettes de veau/poulet en sauce'],
  'קדירת בשר וירקות שורש': ['Meat and root vegetable stew', 'Ragoût de viande aux légumes racines'],
  "פרגית בחמאת בוטנים וצ'ילי": ['Chicken thigh in peanut butter and chili', 'Cuisse de poulet au beurre de cacahuète et piment'],
  'צלי בקר ברוטב יין ופטריות': ['Beef roast in wine and mushroom sauce', 'Rôti de bœuf sauce vin et champignons'],
  'משלוח בלבד ללא צוות הגשה - המגשים מגיעים ארוזים ומוכנים': [
    'Delivery only, no serving staff - trays arrive packed and ready',
    'Livraison uniquement, sans personnel de service - plateaux livrés emballés et prêts'
  ],
  'לחם הבית - כלול במחיר': ['House bread - included in the price', 'Pain maison - inclus dans le prix'],
  'משלוח - משתנה לפי מיקום': ['Delivery - price varies by location', 'Livraison - tarif selon la localisation'],
  'כלים חד"פ יוקרתיים + שתייה מוגזת וקלה': [
    'Premium disposable tableware + soft and sparkling drinks',
    'Vaisselle jetable haut de gamme + boissons gazeuses et softs'
  ],
  'שירות ותפעול מלא כולל שף אומן באירוע + חיתוכי פירות': [
    'Full service and setup including an on-site chef + fruit platters',
    'Service complet incluant un chef sur place + plateaux de fruits découpés'
  ],
  'שדרוג מנת פתיחה לסלמון/לברק בעשבי תיבול/חמאת בוטנים': [
    'Upgrade starter to salmon/sea bream with herbs/peanut butter',
    "Surclassement de l'entrée en saumon/daurade aux herbes/beurre de cacahuète"
  ],
  'שדרוג מנה עיקרית לבשר ראש וגרגרי חומוס': [
    'Upgrade main course to beef cheek with chickpeas',
    'Surclassement du plat principal en joue de bœuf aux pois chiches'
  ],
  'אירועי בוטיק': ['Boutique events', 'Événements boutique'],
  'תפריט עשיר כולל הגשה מלאה, מנהל אירוע וצוות מלצרים': [
    'Rich menu including full service, event manager and waitstaff',
    'Menu riche incluant service complet, chef de salle et équipe de serveurs'
  ],
  'גריל בוטיק': ['Boutique grill', 'Grill boutique'],
  "תפריט גריל כולל הגשה - בשרים נצלים על האש מול האורחים": [
    'Grill menu including service - meats grilled live in front of guests',
    'Menu grill avec service - viandes grillées en direct devant les invités'
  ],
  'בר מצווה ועלייה לתורה': ['Bar Mitzvah and Torah reading', 'Bar Mitsva et montée à la Torah'],
  'שבת חתן': ['Shabbat Chatan (groom’s Shabbat)', 'Chabbat Hatan'],
  'יש לוודא מראש אילו ארוחות כלולות, שעות השירות ואופן ההקמה לפני כניסת השבת': [
    'Please confirm in advance which meals are included, service hours, and setup before Shabbat begins',
    "Merci de confirmer à l'avance les repas inclus, les horaires de service et l'installation avant l'entrée de Chabbat"
  ],
  'חינה מרוקאית': ['Moroccan henna', 'Henné marocain'],
  'עמדות מעוצבות בסגנון מרוקאי, צוות מקצועי ומעטפת אירוח מלאה': [
    'Designed Moroccan-style stations, professional staff and full hospitality package',
    'Stands décorés de style marocain, équipe professionnelle et prestation complète'
  ],
  'תחנות שוק': ['Market stations', 'Stands façon marché'],
  'עמדות שוק חיות - האוכל מוכן ומוגש מול האורחים, כולל צוות וציוד': [
    'Live market stations - food prepared and served in front of guests, including staff and equipment',
    'Stands de marché en direct - plats préparés et servis devant les invités, personnel et matériel inclus'
  ],

  // --- Nash-Nash ---
  'תפריט בוקר - 40-50 איש': ['Breakfast menu - 40-50 guests', 'Menu petit-déjeuner - 40 à 50 convives'],
  'סלט ים-תיכוני': ['Mediterranean salad', 'Salade méditerranéenne'],
  'סלט טונה': ['Tuna salad', 'Salade au thon'],
  'סלט בריאות': ['Health salad', 'Salade santé'],
  'סלט נשנש': ['Nash-Nash salad', 'Salade Nash-Nash'],
  'סלט כפרי': ['Village salad', 'Salade paysanne'],
  "מגש טורטיות (35 יח')": ['Tortilla wrap tray (35 pcs)', 'Plateau de wraps tortilla (35 pcs)'],
  "מגש פריקסה (25 יח')": ['Frikaseh pastry tray (25 pcs)', 'Plateau de frikaseh (25 pcs)'],
  "מגש מיני גבטינוס סביח (20 יח')": ['Mini sabich gvetiños tray (20 pcs)', 'Plateau mini gvetiños sabich (20 pcs)'],
  "מגש מיני גבטינוס גבינות (20 יח')": ['Mini cheese gvetiños tray (20 pcs)', 'Plateau mini gvetiños au fromage (20 pcs)'],
  "מגש עלי גפן (60 יח')": ['Stuffed grape leaves tray (60 pcs)', 'Plateau de feuilles de vigne farcies (60 pcs)'],
  'מגש לחמים': ['Bread tray', 'Plateau de pains'],
  '2 מגשי גבינות (קוטר 12)': ['2 cheese platters (12cm)', '2 plateaux de fromages (12cm)'],
  "מגש קרואסון ממולא (20 יח')": ['Stuffed croissant tray (20 pcs)', 'Plateau de croissants farcis (20 pcs)'],
  'מגש שקשוקה (30 ביצים)': ['Shakshuka tray (30 eggs)', 'Plateau de chakchouka (30 œufs)'],
  "מגש קישים (20 יח')": ['Quiche tray (20 pcs)', 'Plateau de quiches (20 pcs)'],
  "מגש פוקצ'ות (20 יח')": ['Focaccia tray (20 pcs)', 'Plateau de focaccias (20 pcs)'],
  'מגש פירות (קוטר 14)': ['Fruit platter (14cm)', 'Plateau de fruits (14cm)'],
  '2 מגשי קינוחים': ['2 dessert platters', '2 plateaux de desserts'],
  'חבילה מלאה בגודל זה: סה"כ ₪4,240 (עד 50 סועדים)': [
    'Full package at this size: total ₪4,240 (up to 50 guests)',
    'Forfait complet pour cette taille : total ₪4 240 (jusqu’à 50 convives)'
  ],
  'זמינות גם בגדלים 50-60 / 60-70 / 70-80 / 90-100 איש - הצעת מחיר בהתאמה': [
    'Also available in sizes 50-60 / 60-70 / 70-80 / 90-100 guests - custom quote',
    'Disponible aussi pour 50-60 / 60-70 / 70-80 / 90-100 convives - devis sur mesure'
  ],
  'משלוח לא כלול - ניתן להוסיף בתיאום מראש בעלות נוספת': [
    'Delivery not included - can be added in advance for an extra fee',
    'Livraison non incluse - peut être ajoutée sur demande moyennant un supplément'
  ],
  'תפריט ערב - 90-100 איש': ['Evening menu - 90-100 guests', 'Menu du soir - 90 à 100 convives'],
  '2x סלט כפרי': ['2x Village salad', '2x Salade paysanne'],
  '2x סלט נשנש': ['2x Nash-Nash salad', '2x Salade Nash-Nash'],
  '2x סלט פסטה קר': ['2x Cold pasta salad', '2x Salade de pâtes froide'],
  '2x סלט ים-תיכוני': ['2x Mediterranean salad', '2x Salade méditerranéenne'],
  '2x סלט טונה': ['2x Tuna salad', '2x Salade au thon'],
  'מגשי אנטיפסטי (2)': ['Antipasti trays (2)', "Plateaux d'antipasti (2)"],
  'מגשי עלי גפן (2)': ['Stuffed grape leaves trays (2)', 'Plateaux de feuilles de vigne farcies (2)'],
  'מגשי מיני פיצה (2)': ['Mini pizza trays (2)', 'Plateaux de mini pizzas (2)'],
  'מגשי פריקסה (2)': ['Frikaseh trays (2)', 'Plateaux de frikaseh (2)'],
  'מגשי מיני פיתה (2)': ['Mini pita trays (2)', 'Plateaux de mini pitas (2)'],
  'מגש מיני המבורגר גבינה': ['Mini cheeseburger tray', 'Plateau de mini cheeseburgers'],
  'מגש מיני המבורגר פטריות': ['Mini mushroom burger tray', 'Plateau de mini burgers aux champignons'],
  'מגשי קישים (2)': ['Quiche trays (2)', 'Plateaux de quiches (2)'],
  'מגשי טורטיות (2)': ['Tortilla wrap trays (2)', 'Plateaux de wraps tortilla (2)'],
  'מגש קרואסון ממולא': ['Stuffed croissant tray', 'Plateau de croissants farcis'],
  '2 מגשי פירות': ['2 fruit platters', '2 plateaux de fruits'],
  '3 מגשי קינוחים': ['3 dessert platters', '3 plateaux de desserts'],
  'חבילה מלאה בגודל זה: סה"כ ₪9,200 (90-100 סועדים)': [
    'Full package at this size: total ₪9,200 (90-100 guests)',
    'Forfait complet pour cette taille : total ₪9 200 (90 à 100 convives)'
  ],
  'זמינות גם בגדלים 40-50 / 60-70 / 70-80 איש - הצעת מחיר בהתאמה': [
    'Also available in sizes 40-50 / 60-70 / 70-80 guests - custom quote',
    'Disponible aussi pour 40-50 / 60-70 / 70-80 convives - devis sur mesure'
  ],

  // --- Ussishkin ---
  'מגשי אירוח חלביים': ['Dairy hospitality trays', 'Plateaux de réception laitiers'],
  'פסטה אלפרדו': ['Alfredo pasta', 'Pâtes Alfredo'],
  'רביולי בטטה': ['Sweet potato ravioli', 'Ravioles à la patate douce'],
  'פסטה רוזה': ['Rosé sauce pasta', 'Pâtes sauce rosée'],
  'נודלס אסיאתי': ['Asian noodles', 'Nouilles asiatiques'],
  'רביולי גבינות': ['Cheese ravioli', 'Ravioles au fromage'],
  'מיני לזניה': ['Mini lasagna', 'Mini lasagnes'],
  'תפוח אדמה מוקרם': ['Creamed potato gratin', 'Gratin de pommes de terre'],
  'פסטה ברוטב עגבניות': ['Pasta in tomato sauce', 'Pâtes sauce tomate'],
  'פסטה אולי אוליו': ["Pasta aglio e olio", "Pâtes aglio e olio"],
  'קציצות דגים': ['Fish cakes', 'Boulettes de poisson'],
  'מיני שקשוקה': ['Mini shakshuka', 'Mini chakchouka'],
  'בורקס פינוקים': ['Assorted burekas', 'Bourekas assortis'],
  'מיני בורקס תרד וגבינות': ['Mini spinach and cheese burekas', 'Mini bourekas épinards et fromage'],
  'מיני בורקס גבינה': ['Mini cheese burekas', 'Mini bourekas au fromage'],
  'מיני קיש בטטה': ['Mini sweet potato quiche', 'Mini quiche à la patate douce'],
  'מיני פיצות': ['Mini pizzas', 'Mini pizzas'],
  "פוקאצ'ות": ['Focaccias', 'Focaccias'],
  'מיני בייגל': ['Mini bagels', 'Mini bagels'],
  'מקלות שום': ['Garlic breadsticks', "Bâtonnets à l'ail"],
  'מקלות פרמזן': ['Parmesan breadsticks', 'Bâtonnets au parmesan'],
  'סיגר גבינות': ['Cheese cigars', 'Cigares au fromage'],
  'מיני רוגעלך': ['Mini rugelach', 'Mini rugelach'],
  'פחזניות בציפוי שוקלד': ['Chocolate-coated profiteroles', 'Profiteroles nappées de chocolat'],
  'קראנץ שוקולד': ['Chocolate crunch', 'Croustillant au chocolat'],
  'קראנץ שקדים': ['Almond crunch', 'Croustillant aux amandes'],
  'מיקס עוגיות': ['Cookie mix', 'Assortiment de biscuits'],
  'כדורי שוקולד': ['Chocolate balls', 'Boules au chocolat'],
  'בראוניז אישית': ['Individual brownie', 'Brownie individuel'],
  'פטיפור גבינה': ['Cheese petit four', 'Petit four au fromage'],
  'פטיפור אגוזים': ['Nut petit four', 'Petit four aux noix'],
  'כוס רד ולווט': ['Red velvet cup', 'Verrine red velvet'],
  'כוס ביסקויטים': ['Biscuit cup', 'Verrine biscuit'],
  'כוס טירמיסו': ['Tiramisu cup', 'Verrine tiramisu'],
  'מיני סופלונים': ['Mini soufflés', 'Mini soufflés'],
  'סלט תפוח אדמה': ['Potato salad', 'Salade de pommes de terre'],
  'סלט שוק': ['Market salad', 'Salade du marché'],
  'סלט קפרזה': ['Caprese salad', 'Salade caprese'],
  'סלט בטטה': ['Sweet potato salad', 'Salade de patate douce'],
  'סלט לבבות קיסר': ["Caesar hearts salad", "Salade cœurs César"],
  'סלט ירוקים ופיצוחים': ['Greens and nuts salad', 'Salade verte aux fruits secs'],
  'סלט פסטה': ['Pasta salad', 'Salade de pâtes'],
  'סלט כרוב אסיאתי': ['Asian cabbage salad', 'Salade de chou à l’asiatique'],
  'סלט שורשים אסיאתי': ['Asian root vegetable salad', 'Salade de légumes racines à l’asiatique'],
  'סלט טבולה': ['Tabbouleh salad', 'Salade taboulé'],
  'טורטיות סלט ביצים': ['Egg salad tortilla wraps', "Wraps tortilla à la salade d'œufs"],
  'טורטיות גבינות': ['Cheese tortilla wraps', 'Wraps tortilla au fromage'],
  'טורטיות טונה': ['Tuna tortilla wraps', 'Wraps tortilla au thon'],
  'טורטיות מצופות במילוי סביח': ['Coated tortillas filled with sabich', 'Tortillas enrobées farcies au sabich'],
  'מיני סביח': ['Mini sabich', 'Mini sabich'],
  'ביס גבינות': ['Cheese bites', 'Bouchées au fromage'],
  'ביס טונה': ['Tuna bites', 'Bouchées au thon'],
  'ביס מקושקשת': ['Scrambled egg bites', "Bouchées d'œufs brouillés"],
  'דגנים מקושקשת': ['Scrambled egg with grains', 'Œufs brouillés aux céréales'],
  'סושי טורטייה': ['Tortilla sushi', 'Sushi tortilla'],
  'שווארמה פטריות': ['Mushroom shawarma', 'Chawarma aux champignons'],
  'שווארמה טבעונית': ['Vegan shawarma', 'Chawarma végane'],
  'ירקות חתוכים': ['Cut vegetables', 'Légumes coupés'],
  'מגש פירות': ['Fruit platter', 'Plateau de fruits'],
  'ירקות אנטיפסטי': ['Antipasti vegetables', 'Légumes antipasti'],
  'עלי גפן ממולאים': ['Stuffed grape leaves', 'Feuilles de vigne farcies'],
  'סירת פירות': ['Fruit boat', 'Barquette de fruits'],
  'שיפודי אנטיפסטי': ['Antipasti skewers', 'Brochettes antipasti'],
  'יקיטורי סלומון': ['Salmon yakitori', 'Yakitori de saumon'],
  'סיגר סלמון': ['Salmon cigars', 'Cigares au saumon'],
  'פחזניות סלמון': ['Salmon profiteroles', 'Profiteroles au saumon'],

  // --- Scoop ---
  'אוכל מוכן לשבת': ['Ready-made Shabbat food', 'Plats préparés pour Chabbat'],
  'סלט חצילים על האש': ["Fire-roasted eggplant salad", "Salade d'aubergines grillées au feu"],
  'סלט מלפפונים': ['Cucumber salad', 'Salade de concombres'],
  'חציל שלם אפוי': ['Whole baked eggplant', 'Aubergine entière rôtie'],
  'סלט חציל בטעם כבד': ['Mock chopped liver eggplant salad', 'Salade d’aubergines façon "faux foie"'],
  'חציל מטוגן': ['Fried eggplant', 'Aubergine frite'],
  'סלט סלק אדום': ['Red beet salad', 'Salade de betterave rouge'],
  'סלט קולורבי': ['Kohlrabi salad', 'Salade de chou-rave'],
  'סלט גרין דיפ': ['Green dip salad', 'Trempette verte'],
  'קונפי שום': ['Garlic confit', "Confit d'ail"],
  'סלט באבא גנוש': ['Baba ganoush', 'Baba ganoush'],
  'סלט פטריות אסיאתי': ['Asian mushroom salad', 'Salade de champignons à l’asiatique'],
  'סלט כרוב': ['Cabbage salad', 'Salade de chou'],
  'סלט ישראלי': ['Israeli salad', 'Salade israélienne'],
  'מיקס חמוצים וזיתים': ['Pickle and olive mix', 'Mélange de pickles et olives'],
  'חציל שלם אפוי עם טחינה': ['Whole baked eggplant with tahini', 'Aubergine entière rôtie au tahini'],
  "סלט בטטה בצ'ילי": ['Chili sweet potato salad', 'Salade de patate douce au piment'],
  'סלט טפנד זיתים': ["Olive tapenade", "Tapenade d'olives"],
  'מטבל עגבניות ערבי': ['Arab-style tomato dip', 'Trempette de tomates à l’arabe'],
  'סלט זיתים מרוקאי': ['Moroccan olive salad', "Salade d'olives marocaine"],
  'כבד קצוץ': ['Chopped liver', 'Foie haché'],
  'סלט גזר שוק': ['Market carrot salad', 'Salade de carottes du marché'],
  'סלט מטבוחה מסורתית': ['Traditional matbucha', 'Matbucha traditionnelle'],
  'סלט סיזר': ['Caesar salad', 'Salade César'],
  'סלט קינואה': ['Quinoa salad', 'Salade de quinoa'],
  'טאבולה': ['Tabbouleh', 'Taboulé'],
  'טחינה': ['Tahini', 'Tahini'],
  'חומוס': ['Hummus', 'Houmous'],
  'גבינת שמנת': ['Cream cheese', 'Fromage à la crème'],
  'גבינת שמנת בצל ירוק': ['Cream cheese with scallions', 'Fromage à la crème et ciboule'],
  'גבינת שמנת שום ושמיר': ['Cream cheese with garlic and dill', 'Fromage à la crème à l’ail et à l’aneth'],
  'גבינת שמנת זיתים ירוקים': ['Cream cheese with green olives', 'Fromage à la crème aux olives vertes'],
  'גבינת שמנת עם סלמון מעושן': ['Cream cheese with smoked salmon', 'Fromage à la crème et saumon fumé'],
  'סלמון מעושן': ['Smoked salmon', 'Saumon fumé'],
  'שיפודי פרגית': ['Chicken thigh skewers', 'Brochettes de cuisse de poulet'],
  'קציצות גפילטע פיש': ['Gefilte fish balls', 'Boulettes de gefilte fish'],
  'פילה סלומון ברוטב עדין': ['Salmon fillet in a delicate sauce', 'Filet de saumon sauce délicate'],
  'מיטבולס': ['Meatballs', 'Boulettes de viande'],
  'סליידרס': ['Sliders', 'Sliders'],
  'כבד עוף': ['Chicken liver', 'Foie de poulet'],
  'גפילטע פיש מסורתי': ['Traditional gefilte fish', 'Gefilte fish traditionnel'],
  'גלילות חצילים ממולאים - מוסקה': ['Rolled stuffed eggplant - moussaka style', 'Rouleaux d’aubergines farcies façon moussaka'],
  "סלמון טריאקי וג'ינג'ר": ['Teriyaki ginger salmon', 'Saumon teriyaki au gingembre'],
  'פילה סלומון מרוקאי': ['Moroccan-style salmon fillet', 'Filet de saumon à la marocaine'],
  'פילה סלומון דבש וטימין': ['Honey thyme salmon fillet', 'Filet de saumon au miel et thym'],
  'פילה אמנון פסטו': ['Pesto tilapia fillet', 'Filet de tilapia au pesto'],
  'דג מטוגן ללא גלוטן': ['Gluten-free fried fish', 'Poisson frit sans gluten'],
  'פטריות פורטובלו ממולא בחציל': ['Portobello mushroom stuffed with eggplant', 'Champignon portobello farci à l’aubergine'],
  'פטריות פורטובלו ממולאות בבשר': ['Portobello mushrooms stuffed with meat', 'Champignons portobello farcis à la viande'],
  'פילה אמנון מרוקאי': ['Moroccan-style tilapia fillet', 'Filet de tilapia à la marocaine'],
  'סלמון ברוטב חרדל דבש': ['Salmon in honey mustard sauce', 'Saumon sauce miel-moutarde'],
  'בריסקט רול עם בצל מטוגן': ['Brisket roll with fried onions', 'Roulé de brisket aux oignons frits'],
  'כנפיים, ברביקיו': ['BBQ wings', 'Ailes de poulet BBQ'],
  "כנפיים, צ'ילי מתוק": ['Sweet chili wings', 'Ailes de poulet au piment doux'],
  'חזה עוף צרוב על האש': ['Fire-seared chicken breast', 'Blanc de poulet saisi au feu'],
  'קדירת פאט רוסט': ['Pot roast stew', 'Ragoût de pot roast'],
  'שניצל כרובית': ['Cauliflower schnitzel', 'Schnitzel de chou-fleur'],
  'ריב רוסטביף': ['Rib roast beef', 'Rôti de bœuf côte'],
  "ג'נרל צוז צ'יקן": ["General Tso's chicken", 'Poulet General Tso'],
  'חזה עוף מעושן': ['Smoked chicken breast', 'Blanc de poulet fumé'],
  'פרגית ברוטב שום ודבש': ['Chicken thigh in garlic honey sauce', 'Cuisse de poulet sauce ail-miel'],
  'אסאדו בבישול איטי': ['Slow-cooked asado', 'Asado cuit lentement'],
  'ביף אנד ברוקלי': ['Beef and broccoli', 'Bœuf au brocoli'],
  'פופרס חריף ללא גלוטן': ['Gluten-free spicy poppers', 'Poppers épicés sans gluten'],
  'שניצל ללא גלוטן': ['Gluten-free schnitzel', 'Schnitzel sans gluten'],
  'פרוסות צלי בקר': ['Sliced beef roast', 'Tranches de rôti de bœuf'],
  'קורנדביף': ['Corned beef', 'Corned-beef'],
  'עוף משמש': ['Apricot chicken', "Poulet à l'abricot"],
  'KFC': ['KFC-style fried chicken', 'Poulet frit façon KFC'],
  'כרעיים ברוטב דבש וטימין': ['Drumsticks in honey thyme sauce', 'Pilons sauce miel-thym'],
  'בריסקט': ['Brisket', 'Brisket'],
  'פרוסות לשון': ['Sliced beef tongue', 'Tranches de langue de bœuf'],
  'בריסקט מעושן': ['Smoked brisket', 'Brisket fumé'],
  'שניצלונים ללא גלוטן': ['Gluten-free schnitzel strips', 'Aiguillettes de schnitzel sans gluten'],
  'עוף לימון': ['Lemon chicken', 'Poulet au citron'],
  'פרגיות ממולאות': ['Stuffed chicken thighs', 'Cuisses de poulet farcies'],
  'עוף מרסלה': ['Chicken marsala', 'Poulet marsala'],
  'פרוסות חזה הודו': ['Sliced turkey breast', 'Tranches de blanc de dinde'],
  'עוף מוקפץ': ['Stir-fried chicken', 'Poulet sauté'],
  'עוף מעושן': ['Smoked chicken', 'Poulet fumé'],
  'צלי עוף קלאסי': ['Classic roast chicken', 'Poulet rôti classique'],
  'סטייק פרגית קלאסי': ['Classic chicken thigh steak', 'Steak de cuisse de poulet classique'],
  'מוקפץ טופו עם ברוקולי בצל ופטריות': ['Stir-fried tofu with broccoli, onion and mushrooms', 'Tofu sauté au brocoli, oignon et champignons'],
  'שניצל פרצל': ['Pretzel-crusted schnitzel', 'Schnitzel croûte de bretzel'],
  'שניצל': ['Schnitzel', 'Schnitzel'],
  'שניצלונים': ['Schnitzel strips', 'Aiguillettes de schnitzel'],
  'פופרס חריף': ['Spicy poppers', 'Poppers épicés'],
  'פרגיות ברוטב טריאקי': ['Chicken thighs in teriyaki sauce', 'Cuisses de poulet sauce teriyaki'],
  "סטיקי צ'יקן": ['Sticky chicken', 'Poulet sticky'],
  'כרעיים ברוטב פירות יבשים': ['Drumsticks in dried fruit sauce', 'Pilons sauce aux fruits secs'],
  'צלי עוף ברוטב חרדל דבש': ['Roast chicken in honey mustard sauce', 'Poulet rôti sauce miel-moutarde'],
  'אוכל מוכן לחגים': ['Ready-made holiday food', 'Plats préparés pour les fêtes'],

  // --- Asado (a few keys overlap with Kaza/Scoop above and are intentionally identical) ---
  'חבילת בסיס': ['Basic package', 'Formule de base'],
  'סחוג בשמן זית': ['Skhug in olive oil', "Zhoug à l'huile d'olive"],
  'חציל על האש עם שמן זית ורוטב הבית': [
    'Fire-grilled eggplant with olive oil and house sauce',
    'Aubergine grillée au feu, huile d’olive et sauce maison'
  ],
  'חציל יוני': ['Greek-style eggplant', 'Aubergine à la grecque'],
  'כרוב עם פיצוחים': ['Cabbage with nuts', 'Chou aux fruits secs'],
  'סלט קולרבי מוחמץ': ['Pickled kohlrabi salad', 'Salade de chou-rave mariné'],
  'סלט ירקות חי': ['Fresh vegetable salad', 'Salade de légumes frais'],
  'סלט גזר מרוקאי': ['Moroccan carrot salad', 'Salade de carottes marocaine'],
  'סלט תפו"א': ['Potato salad', 'Salade de pommes de terre'],
  'חציל במיונז': ['Eggplant in mayonnaise', 'Aubergine à la mayonnaise'],
  'סלט קולסלאו': ['Coleslaw', 'Coleslaw'],
  'סלט ווסדורף': ['Waldorf salad', 'Salade Waldorf'],
  'כרוב סגול': ['Purple cabbage salad', 'Salade de chou rouge'],
  'חציל בטעם כבד': ['Mock chopped liver eggplant', 'Aubergine façon "faux foie"'],
  'פלפלים קלויים': ['Roasted peppers', 'Poivrons rôtis'],
  'זיתים מבושלים': ['Cooked olives', 'Olives cuisinées'],
  'קציצות בקר - קציצות בשר בקר מובחר ברוטב עגבניות עשיר': [
    'Beef meatballs - select ground beef meatballs in a rich tomato sauce',
    'Boulettes de bœuf - boulettes de bœuf sélectionné en sauce tomate riche'
  ],
  'פרגית עסיסית - סטייק פרגית על האש בתיבול ביתי עדין': [
    'Juicy chicken thigh - fire-grilled chicken thigh steak with delicate homemade seasoning',
    'Cuisse de poulet juteuse - steak de cuisse de poulet grillé au feu, assaisonnement maison délicat'
  ],
  'אסאדו ברוטב מתוק - בשר אסאדו בבישול ארוך ברוטב ברביקיו דבש': [
    'Sweet-sauce asado - slow-cooked asado beef in a honey BBQ sauce',
    'Asado sauce sucrée - bœuf asado mijoté longuement en sauce barbecue au miel'
  ],
  'בחרו 8 סלטים מתוך 24 + מנה עיקרית אחת': [
    'Choose 8 salads out of 24 + one main course',
    'Choisissez 8 salades parmi 24 + un plat principal'
  ],
  'חבילת פרימיום': ['Premium package', 'Formule premium'],
  'סלמון ברוטב אדום כבוש עם גמבה ועלי תיבול': [
    'Salmon in cured red sauce with shrimp and fresh herbs',
    'Saumon sauce rouge marinée, gambas et herbes fraîches'
  ],
  'סלמון ברוטב מתוק עם נגיעות פיסטוק ושקדים': [
    'Salmon in sweet sauce with touches of pistachio and almonds',
    'Saumon sauce sucrée, touches de pistache et amandes'
  ],
  'מושט ברוטב מרוקאי אוטנטי חריף (חריימה)': [
    'Mullet in authentic spicy Moroccan sauce (chraime)',
    'Mulet sauce marocaine épicée authentique (chraime)'
  ],
  'מושט בגריל עם פסטו ושקדים': ['Grilled mullet with pesto and almonds', 'Mulet grillé au pesto et amandes'],
  'דג נסיכה אסייתי עם מבחר עלים': [
    'Asian-style princess fish with mixed greens',
    'Poisson "princesse" à l’asiatique, mélange de jeunes pousses'
  ],
  'דג נסיכה ברוטב לימונים ופלפל אדום (ניתן לבקש חריף)': [
    'Princess fish in lemon and red pepper sauce (spicy option available)',
    'Poisson "princesse" sauce citron et poivron rouge (option épicée disponible)'
  ],
  'מרק עוף עם קניידלך': ['Chicken soup with matzah balls', 'Soupe de poulet aux kneidlach'],
  "מרק פטריות פורצ'יני עם אצבעות אנטריקוט": [
    'Porcini mushroom soup with entrecôte strips',
    'Velouté de cèpes aux lanières d’entrecôte'
  ],
  'אורז לבן עם שקדים וצימוקים': ['White rice with almonds and raisins', 'Riz blanc aux amandes et raisins secs'],
  'אורז עם עשבי תיבול טריים': ['Rice with fresh herbs', 'Riz aux herbes fraîches'],
  'אורז מאלובה עם ירקות': ['Maqluba-style rice with vegetables', 'Riz façon maqlouba aux légumes'],
  'תפו"א אפוי בשום, שמן זית ורוזמרין': [
    'Potatoes roasted with garlic, olive oil and rosemary',
    'Pommes de terre rôties à l’ail, huile d’olive et romarin'
  ],
  'קוסקוס אותנטי': ['Authentic couscous', 'Couscous authentique'],
  'אפונה ברוטב צהוב עם שמן זית': ['Peas in yellow sauce with olive oil', 'Petits pois sauce jaune à l’huile d’olive'],
  'שעועית ברוטב עגבניות': ['Green beans in tomato sauce', 'Haricots verts sauce tomate'],
  'ירקות מוקפצים ברוטב סיני': ['Stir-fried vegetables in Chinese-style sauce', 'Légumes sautés sauce chinoise'],
  'לחם שום חתוך לפרוסות': ['Sliced garlic bread', 'Pain à l’ail tranché'],
  'מגינה אותנטי': ['Authentic megina (vegetable and egg bake)', 'Meguina authentique (gratin de légumes et œufs)'],
  'קוגל תפוח אדמה': ['Potato kugel', 'Kugel de pommes de terre'],
  'לזניה בשרית': ['Meat lasagna', 'Lasagnes à la viande'],
  'קיש ברוקולי (פרווה)': ['Broccoli quiche (dairy-free)', 'Quiche au brocoli (parve)'],
  'פלטת דגים מעושנים': ['Smoked fish platter', 'Plateau de poissons fumés'],
  'כולל שתייה קלה, סכו"ם מהודר ומשלוח חינם': [
    'Includes soft drinks, upgraded cutlery and free delivery',
    'Comprend boissons, couverts haut de gamme et livraison gratuite'
  ],
  'תפריט שבת חתן מורחב: מנת דגים, מרקים, תוספות ומבחר לסעודה שלישית': [
    'Extended Shabbat Chatan menu: fish course, soups, side dishes and a third-meal selection',
    'Menu Chabbat Hatan élargi : plat de poisson, soupes, accompagnements et un choix pour le troisième repas'
  ]
};

function applyTranslation(field) {
  if (!field?.he) return { changed: false };
  const t = T[field.he];
  if (!t) return { changed: false, missing: field.he };
  const [en, fr] = t;
  if (field.en === en && field.fr === fr) return { changed: false };
  field.en = en;
  field.fr = fr;
  return { changed: true };
}

async function fixCaterer(id) {
  const record = await kv.get(`caterer:${id}`);
  if (!record) {
    console.error(`Caterer ${id} not found - skipping.`);
    return;
  }

  let changed = 0;
  const missing = [];
  for (const pkg of record.packages || []) {
    const r1 = applyTranslation(pkg.name);
    if (r1.changed) changed++;
    if (r1.missing) missing.push(r1.missing);

    for (const cat of Object.keys(pkg.categoryItems || {})) {
      for (const item of pkg.categoryItems[cat] || []) {
        const r = applyTranslation(item);
        if (r.changed) changed++;
        if (r.missing) missing.push(r.missing);
      }
    }
    for (const addon of pkg.addons || []) {
      const r = applyTranslation(addon.name);
      if (r.changed) changed++;
      if (r.missing) missing.push(r.missing);
    }
  }

  record.updatedAt = new Date().toISOString();
  await kv.set(`caterer:${id}`, record);
  console.log(`"${record.businessName}" (${id}): corrected ${changed} fields.${missing.length ? ' MISSING: ' + [...new Set(missing)].join(' | ') : ''}`);
}

async function main() {
  for (const id of CATERER_IDS) {
    await fixCaterer(id);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
