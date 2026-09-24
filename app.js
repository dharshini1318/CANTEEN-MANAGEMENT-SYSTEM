/* ============================================================
   CAMPUS BITES CANTEEN — APPLICATION LOGIC
   Pure vanilla JS, no frameworks
   Features: Digital menu card, hidden admin panel, localStorage
   ============================================================ */

/* ============================================================
   DATA STORE
   ============================================================ */
const ADMIN_PASSWORD = '123456789';
const DATA_VERSION = 2; // Bump this to force-reset localStorage data

const defaultCategories = [
  { id: 1, name: 'Breakfast', icon: 'sunrise' },
  { id: 2, name: 'Rice & Meals', icon: 'bowl' },
  { id: 3, name: 'Snacks', icon: 'snack' },
  { id: 4, name: 'Beverages', icon: 'coffee' },
  { id: 5, name: 'Desserts', icon: 'cake' },
  { id: 6, name: 'North Indian', icon: 'flame' },
  { id: 7, name: 'Chinese', icon: 'noodles' },
  { id: 8, name: 'Juices', icon: 'juice' }
];

const defaultFoodItems = [
  // === BREAKFAST (cat: 1) ===
  {
    id: 1, cat: 1, name: 'Masala Dosa',
    desc: 'Crispy golden rice crepe stuffed with spiced potato masala, served with sambar & coconut chutney.',
    price: 50, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&h=350&fit=crop'
  },
  {
    id: 2, cat: 1, name: 'Plain Dosa',
    desc: 'Thin, crispy rice and lentil crepe served with sambar and fresh coconut chutney.',
    price: 35, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&h=350&fit=crop'
  },
  {
    id: 3, cat: 1, name: 'Rava Dosa',
    desc: 'Crispy semolina crepe with a lacy texture, speckled with cumin and black pepper.',
    price: 55, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=500&h=350&fit=crop'
  },
  {
    id: 4, cat: 1, name: 'Onion Dosa',
    desc: 'Classic dosa topped with chopped onions and green chilies for an extra crunch.',
    price: 45, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1667040015850-f9e690460d82?w=500&h=350&fit=crop'
  },
  {
    id: 5, cat: 1, name: 'Mysore Masala Dosa',
    desc: 'Dosa smeared with spicy red chutney, filled with potato masala — a Mysore special!',
    price: 65, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 6, cat: 1, name: 'Idli Sambar',
    desc: 'Soft steamed rice cakes served with hot sambar and a trio of chutneys.',
    price: 30, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=350&fit=crop'
  },
  {
    id: 7, cat: 1, name: 'Mini Idli',
    desc: 'Bite-sized idlis dunked in spicy sambar, garnished with ghee and curry leaves.',
    price: 40, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1626132647523-66068394d31c?w=500&h=350&fit=crop'
  },
  {
    id: 8, cat: 1, name: 'Medu Vada',
    desc: 'Crispy golden lentil donuts, fluffy inside, served with sambar and chutney.',
    price: 30, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&h=350&fit=crop'
  },
  {
    id: 9, cat: 1, name: 'Upma',
    desc: 'Savory semolina porridge tempered with mustard, curry leaves, and vegetables.',
    price: 25, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=500&h=350&fit=crop'
  },
  {
    id: 10, cat: 1, name: 'Pongal',
    desc: 'Comforting rice and lentil dish tempered with cumin, pepper, and cashews in ghee.',
    price: 40, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=350&fit=crop'
  },
  {
    id: 11, cat: 1, name: 'Uttapam',
    desc: 'Thick, fluffy rice pancake topped with onions, tomatoes, and green chilies.',
    price: 45, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=500&h=350&fit=crop&q=90'
  },

  // === RICE & MEALS (cat: 2) ===
  {
    id: 12, cat: 2, name: 'Curd Rice',
    desc: 'Cooling tempered curd rice with pomegranate, perfect for a comforting meal.',
    price: 35, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=350&fit=crop'
  },
  {
    id: 13, cat: 2, name: 'Sambar Rice',
    desc: 'Steamed rice mixed with aromatic lentil sambar, finished with a ghee drizzle.',
    price: 45, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=350&fit=crop'
  },
  {
    id: 14, cat: 2, name: 'Lemon Rice',
    desc: 'Tangy turmeric-yellow rice with peanuts, curry leaves, and a citrusy kick.',
    price: 35, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44726?w=500&h=350&fit=crop'
  },
  {
    id: 15, cat: 2, name: 'Tamarind Rice',
    desc: 'Sweet-sour tamarind rice (Puliyodarai) — a temple prasadam favourite.',
    price: 40, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 16, cat: 2, name: 'Coconut Rice',
    desc: 'Fragrant rice tossed with fresh coconut, cashews, and a south Indian tempering.',
    price: 40, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=500&h=350&fit=crop'
  },
  {
    id: 17, cat: 2, name: 'Tomato Rice',
    desc: 'Vibrant rice cooked in fresh tomato puree with aromatic spices.',
    price: 35, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 18, cat: 2, name: 'Chicken Biryani',
    desc: 'Fragrant Dindigul-style biryani with succulent chicken, seeraga samba rice and raita.',
    price: 120, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=350&fit=crop'
  },
  {
    id: 19, cat: 2, name: 'Veg Meals (Thali)',
    desc: 'Complete South Indian thali with rice, sambar, rasam, poriyal, curd, papad and pickle.',
    price: 80, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=350&fit=crop'
  },

  // === SNACKS (cat: 3) ===
  {
    id: 20, cat: 3, name: 'Sambar Vada',
    desc: 'Medu vadas soaked in hot sambar, a melt-in-your-mouth snack.',
    price: 35, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 21, cat: 3, name: 'Bajji / Pakora',
    desc: 'Mixed vegetable fritters in spiced chickpea batter, served with green chutney.',
    price: 25, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 22, cat: 3, name: 'Sundal',
    desc: 'Spiced chickpea salad with grated coconut — a healthy temple-style snack.',
    price: 20, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 23, cat: 3, name: 'Samosa',
    desc: 'Crispy triangular pastry stuffed with spiced potatoes and green peas.',
    price: 15, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=350&fit=crop&q=80'
  },
  {
    id: 24, cat: 3, name: 'Bread Omelette',
    desc: 'Fluffy egg omelette with onion, tomato, and green chili, sandwiched in toasted bread.',
    price: 30, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&h=350&fit=crop'
  },

  // === BEVERAGES (cat: 4) ===
  {
    id: 25, cat: 4, name: 'Filter Coffee',
    desc: 'Authentic South Indian filter coffee — strong decoction with frothy milk in a steel tumbler.',
    price: 20, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=500&h=350&fit=crop'
  },
  {
    id: 26, cat: 4, name: 'Masala Chai',
    desc: 'Spiced tea with ginger, cardamom, and cloves — brewed the desi way.',
    price: 15, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500&h=350&fit=crop'
  },
  {
    id: 27, cat: 4, name: 'Buttermilk',
    desc: 'Refreshing spiced buttermilk with curry leaves and ginger.',
    price: 15, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&h=350&fit=crop'
  },
  {
    id: 28, cat: 4, name: 'Rose Milk',
    desc: 'Chilled milk with rose syrup — a nostalgic South Indian drink.',
    price: 25, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=350&fit=crop'
  },
  {
    id: 29, cat: 4, name: 'Badam Milk',
    desc: 'Rich almond milk drink with saffron and cardamom.',
    price: 30, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 30, cat: 4, name: 'Fresh Lime Soda',
    desc: 'Freshly squeezed lime with soda water — sweet or salted, your choice.',
    price: 20, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&h=350&fit=crop'
  },
  {
    id: 31, cat: 4, name: 'Tender Coconut',
    desc: 'Fresh tender coconut water — the ultimate natural refresher.',
    price: 40, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&h=350&fit=crop'
  },

  // === DESSERTS (cat: 5) ===
  {
    id: 32, cat: 5, name: 'Gulab Jamun',
    desc: 'Soft milk-solid dumplings soaked in rose-scented sugar syrup — melt-in-your-mouth sweet.',
    price: 30, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1666190020635-44e0e3486542?w=500&h=350&fit=crop'
  },
  {
    id: 33, cat: 5, name: 'Payasam',
    desc: 'Creamy vermicelli pudding with cashews, raisins, and a touch of cardamom.',
    price: 35, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&h=350&fit=crop'
  },
  {
    id: 34, cat: 5, name: 'Jalebi',
    desc: 'Crispy spiral fritters soaked in warm saffron sugar syrup — crunchy outside, juicy inside.',
    price: 25, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1601303516920-5fd7474ca4e8?w=500&h=350&fit=crop'
  },
  {
    id: 35, cat: 5, name: 'Ice Cream (Scoop)',
    desc: 'Rich and creamy ice cream in your choice of flavour — vanilla, chocolate, or butterscotch.',
    price: 40, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&h=350&fit=crop'
  },

  // === NORTH INDIAN (cat: 6) ===
  {
    id: 36, cat: 6, name: 'Chapati with Curry',
    desc: 'Soft whole-wheat chapatis served with a side of mixed vegetable curry.',
    price: 40, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=350&fit=crop&q=80'
  },
  {
    id: 37, cat: 6, name: 'Paneer Butter Masala',
    desc: 'Soft paneer cubes simmered in a rich, creamy tomato-butter gravy.',
    price: 90, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&h=350&fit=crop&q=80'
  },
  {
    id: 38, cat: 6, name: 'Aloo Paratha',
    desc: 'Stuffed whole-wheat flatbread with spiced potato filling, served with curd and pickle.',
    price: 45, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&h=350&fit=crop'
  },
  {
    id: 39, cat: 6, name: 'Chole Bhature',
    desc: 'Spiced chickpea curry served with fluffy deep-fried bhatura bread.',
    price: 60, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1626132647523-66068394d31c?w=500&h=350&fit=crop&q=90'
  },

  // === CHINESE (cat: 7) ===
  {
    id: 40, cat: 7, name: 'Veg Fried Rice',
    desc: 'Wok-tossed rice with mixed vegetables, soy sauce, and a hint of chili.',
    price: 60, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=350&fit=crop'
  },
  {
    id: 41, cat: 7, name: 'Chicken Noodles',
    desc: 'Stir-fried hakka noodles with chicken, vegetables, and Indo-Chinese spices.',
    price: 80, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&h=350&fit=crop'
  },
  {
    id: 42, cat: 7, name: 'Gobi Manchurian',
    desc: 'Crispy cauliflower florets tossed in a tangy, sweet, and spicy Manchurian sauce.',
    price: 50, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 43, cat: 7, name: 'Veg Manchurian',
    desc: 'Deep-fried vegetable balls in a spicy, tangy Manchurian gravy — the Indo-Chinese classic.',
    price: 55, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&h=350&fit=crop'
  },

  // === JUICES (cat: 8) ===
  {
    id: 44, cat: 8, name: 'Mango Juice',
    desc: 'Thick and pulpy mango juice made with fresh Alphonso mangoes.',
    price: 35, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&h=350&fit=crop'
  },
  {
    id: 45, cat: 8, name: 'Watermelon Juice',
    desc: 'Refreshing chilled watermelon juice — no sugar, all natural.',
    price: 30, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500&h=350&fit=crop'
  },
  {
    id: 46, cat: 8, name: 'Orange Juice',
    desc: 'Freshly squeezed orange juice — tangy, sweet, and packed with Vitamin C.',
    price: 35, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&h=350&fit=crop'
  },
  {
    id: 47, cat: 8, name: 'Sugarcane Juice',
    desc: 'Freshly pressed sugarcane juice with a splash of lemon and ginger.',
    price: 25, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1625865797062-44d9e14e4c8f?w=500&h=350&fit=crop'
  }
];

/* ============================================================
   STATE — Load from localStorage or use defaults
   ============================================================ */
let categories = loadData('cb_categories', defaultCategories);
let foodItems = loadData('cb_foodItems', defaultFoodItems);
let isAdminLoggedIn = false;
let activeMenuCat = 'all';
let currentAdminTab = 'dashboard';

/* ============================================================
   PERSISTENCE
   ============================================================ */
function loadData(key, fallback) {
  try {
    const storedVersion = localStorage.getItem('cb_data_version');
    if (storedVersion && parseInt(storedVersion) === DATA_VERSION) {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } else {
      // Version mismatch — clear old data
      localStorage.removeItem('cb_categories');
      localStorage.removeItem('cb_foodItems');
      localStorage.setItem('cb_data_version', DATA_VERSION);
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(fallback));
}

function saveData() {
  try {
    localStorage.setItem('cb_data_version', DATA_VERSION);
    localStorage.setItem('cb_categories', JSON.stringify(categories));
    localStorage.setItem('cb_foodItems', JSON.stringify(foodItems));
  } catch (e) { /* ignore */ }
}

/* ============================================================
   UTILITIES
   ============================================================ */
function rupees(n) { return 'Rs. ' + Number(n).toFixed(0); }
function foodById(id) { return foodItems.find(f => f.id === id); }
function catById(id) { return categories.find(c => c.id === id); }

function esc(s) {
  const d = document.createElement('div');
  d.innerText = s ?? '';
  return d.innerHTML;
}

function $(id) { return document.getElementById(id); }

/* Category SVG icons */
function getCategoryIcon(iconName, size = 24) {
  const icons = {
    sunrise: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`,
    bowl: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12a8 8 0 0 0 8-4H4a8 8 0 0 0 8 4Z"/><path d="M12 12v6"/><path d="M6 18h12"/></svg>`,
    snack: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/></svg>`,
    coffee: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`,
    cake: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v2"/><path d="M12 8v2"/><path d="M17 8v2"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>`,
    flame: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    noodles: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12a8 8 0 0 0 8-4H4a8 8 0 0 0 8 4Z"/><path d="M12 12v6"/><path d="M6 18h12"/><path d="M6 4c0 2.5 1.5 4 4 4"/><path d="M14 4c0 2.5 1.5 4 4 4"/></svg>`,
    juice: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/><path d="M5 8h14"/><path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"/><path d="m12 8 1-6h2"/></svg>`,
    default: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"/></svg>`
  };
  return icons[iconName] || icons.default;
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(msg, type = 'success') {
  const iconSvgs = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  const container = $('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <span>${iconSvgs[type] || iconSvgs.info}</span>
    <span>${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/* ============================================================
   ROUTING — Hash-based navigation
   ============================================================ */
function navigate(name) {
  if (window.location.hash === '#' + name) {
    // Hash is already set — manually trigger route handler
    handleRoute();
  } else {
    window.location.hash = name;
  }
}

function handleRoute() {
  const hash = window.location.hash.replace('#', '') || 'home';

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const nav = $('customerNav');
  const footer = $('mainFooter');

  if (hash === 'admin') {
    if (isAdminLoggedIn) {
      showViewDirect('admin');
      if (nav) nav.style.display = 'none';
      if (footer) footer.style.display = 'none';
      showAdminTab(currentAdminTab || 'dashboard');
    } else {
      showViewDirect('adminLogin');
      if (nav) nav.style.display = 'none';
      if (footer) footer.style.display = 'none';
    }
  } else if (hash === 'menu') {
    showViewDirect('menu');
    if (nav) nav.style.display = '';
    if (footer) footer.style.display = '';
    renderMenu();
  } else {
    showViewDirect('home');
    if (nav) nav.style.display = '';
    if (footer) footer.style.display = '';
    renderHome();
  }

  // Update nav links
  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    link.classList.toggle('active', link.dataset.view === hash);
  });

  // Close mobile nav
  const navCenter = $('navCenter');
  if (navCenter) navCenter.classList.remove('open');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showViewDirect(name) {
  const el = $('view-' + name);
  if (el) el.classList.add('active');
}

/* ============================================================
   STAGGER ANIMATION (Intersection Observer)
   ============================================================ */
function observeStagger() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stagger-item:not(.visible)').forEach(el => observer.observe(el));
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome() {
  const catGrid = $('homeCategories');
  if (catGrid) {
    catGrid.innerHTML = categories.map(c => `
      <div class="category-card stagger-item" onclick="navigate('menu'); setTimeout(()=>filterCategory(${c.id}),100)">
        <div class="category-icon">${getCategoryIcon(c.icon)}</div>
        <div class="category-name">${esc(c.name)}</div>
      </div>
    `).join('');
  }

  const specials = foodItems.filter(f => f.special && f.available).slice(0, 4);
  const specialsGrid = $('specialsGrid');
  if (specialsGrid) {
    specialsGrid.innerHTML = specials.length
      ? specials.map((f, i) => foodCardHtml(f, i)).join('')
      : '<div class="empty-state"><p>No specials today</p></div>';
  }

  setTimeout(observeStagger, 50);
}

function scrollToSpecials() {
  const el = $('specialsSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ============================================================
   FOOD CARD HTML
   ============================================================ */
function foodCardHtml(f, index = 0) {
  const inStock = f.available && f.stock > 0;
  const delay = index * 0.06;
  return `
  <div class="food-card stagger-item" style="transition-delay: ${delay}s">
    <div class="food-card-img">
      <img src="${f.img}" alt="${esc(f.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
      <div class="food-card-img-fallback">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"/></svg>
      </div>
      ${f.special ? '<div class="food-card-special-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Special</div>' : ''}
    </div>
    <div class="food-card-body">
      <div class="food-card-name">${esc(f.name)}</div>
      <div class="food-card-desc">${esc(f.desc)}</div>
      <div class="food-card-footer">
        <span class="food-price">${rupees(f.price)}</span>
        ${inStock
          ? '<span class="badge badge-success">Available</span>'
          : '<span class="badge badge-danger">Out of Stock</span>'}
      </div>
    </div>
  </div>`;
}

/* ============================================================
   MENU
   ============================================================ */
function filterCategory(id) {
  activeMenuCat = id;
  renderMenu();
}

function renderMenu() {
  const chipContainer = $('menuCategoryFilters');
  if (chipContainer) {
    const chips = [`<button class="chip ${activeMenuCat === 'all' ? 'active' : ''}" onclick="filterCategory('all')">All</button>`]
      .concat(categories.map(c => `<button class="chip ${activeMenuCat === c.id ? 'active' : ''}" onclick="filterCategory(${c.id})">${esc(c.name)}</button>`));
    chipContainer.innerHTML = chips.join('');
  }

  const q = ($('menuSearch')?.value || '').toLowerCase();
  const items = foodItems.filter(f => {
    const matchCat = activeMenuCat === 'all' || f.cat === activeMenuCat;
    const matchQ = f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q);
    return matchCat && matchQ && f.available;
  });

  const grid = $('menuGrid');
  if (grid) {
    grid.innerHTML = items.length
      ? items.map((f, i) => foodCardHtml(f, i)).join('')
      : `<div class="empty-state" style="grid-column:1/-1">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
           <p>No food items found.</p>
         </div>`;
  }

  setTimeout(observeStagger, 50);
}

/* ============================================================
   AUTH — ADMIN
   ============================================================ */
function doAdminLogin() {
  const pass = ($('adminPass')?.value || '').trim();
  if (pass !== ADMIN_PASSWORD) {
    $('adminLoginAlert').innerHTML = '<div class="alert alert-danger">Invalid password. Please try again.</div>';
    return;
  }
  isAdminLoggedIn = true;
  navigate('admin');
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  showToast('Logged out successfully.', 'info');
  navigate('home');
}

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */
function showAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.sidebar-link[data-tab="${tab}"]`);
  if (link) link.classList.add('active');

  // Close mobile sidebar
  const sidebar = $('adminSidebar');
  if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('show');

  const map = {
    dashboard: renderAdminDashboard,
    food: renderAdminFood,
    categories: renderAdminCategories,
    stock: renderAdminStock
  };
  (map[tab] || renderAdminDashboard)();
}

function renderAdminDashboard() {
  const content = $('adminTabContent');
  if (!content) return;

  const totalItems = foodItems.length;
  const availableItems = foodItems.filter(f => f.available).length;
  const totalStock = foodItems.reduce((a, b) => a + b.stock, 0);
  const specialCount = foodItems.filter(f => f.special).length;

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <h2 class="admin-card-title">Dashboard</h2>
          <p style="color:var(--text-muted);font-size:var(--text-sm);margin-top:4px">Overview of your canteen menu</p>
        </div>
        <span class="badge badge-secondary">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </div>
    <div class="stats-grid">
      ${statCard('var(--accent)', totalItems, 'Total Food Items', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"/></svg>')}
      ${statCard('#34D399', availableItems, 'Available Items', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>')}
      ${statCard('#60A5FA', totalStock, 'Total Stock Units', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>')}
      ${statCard('#FBBF24', specialCount, "Today's Specials", '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>')}
    </div>
  `;
}

function statCard(color, value, label, iconSvg) {
  return `<div class="stat-card">
    <div class="stat-icon" style="background:${color}">${iconSvg}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${label}</div>
  </div>`;
}

/* ---- Admin: Food Management ---- */
function renderAdminFood() {
  const content = $('adminTabContent');
  if (!content) return;

  const rows = foodItems.map(f => `
    <tr>
      <td><img src="${f.img}" alt="${esc(f.name)}" onerror="this.style.background='var(--bg-tertiary)';this.alt='No image'"></td>
      <td><strong>${esc(f.name)}</strong> ${f.special ? '<span class="badge badge-accent">Special</span>' : ''}</td>
      <td>${esc(catById(f.cat)?.name || 'Unknown')}</td>
      <td>${rupees(f.price)}</td>
      <td>${f.stock}</td>
      <td><span class="badge ${f.available ? 'badge-success' : 'badge-danger'}">${f.available ? 'Available' : 'Hidden'}</span></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-outline btn-sm" onclick="openFoodModal(${f.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFood(${f.id})">Delete</button>
      </td>
    </tr>`).join('');

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h2 class="admin-card-title">Food Items</h2>
        <button class="btn btn-primary" onclick="openFoodModal()">+ Add Item</button>
      </div>
      <div class="table-responsive"><table class="data-table">
        <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>
    <div id="foodModalHost"></div>`;
}

function openFoodModal(foodId) {
  const f = foodId ? foodById(foodId) : null;
  const catOptions = categories.map(c => `<option value="${c.id}" ${f && f.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');

  // Remove existing modal
  const existing = $('foodModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'foodModal';
  modal.innerHTML = `
  <div class="modal-content">
    <div class="modal-header">
      <h4 class="modal-title">${f ? 'Edit: ' + esc(f.name) : 'Add Food Item'}</h4>
      <button class="modal-close" onclick="closeFoodModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Food Name</label><input id="fm_name" class="form-input" value="${f ? esc(f.name) : ''}"></div>
        <div class="form-group"><label class="form-label">Category</label><select id="fm_cat" class="form-select">${catOptions}</select></div>
      </div>
      <div class="form-group"><label class="form-label">Description</label><textarea id="fm_desc" class="form-textarea">${f ? esc(f.desc) : ''}</textarea></div>
      <div class="form-group"><label class="form-label">Image URL</label><input id="fm_img" class="form-input" value="${f ? f.img : ''}" placeholder="https://..."></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Price (Rs.)</label><input id="fm_price" type="number" class="form-input" value="${f ? f.price : ''}"></div>
        <div class="form-group"><label class="form-label">Stock Qty</label><input id="fm_stock" type="number" class="form-input" value="${f ? f.stock : 50}"></div>
      </div>
      <div class="form-row" style="margin-top:var(--space-md)">
        <label class="form-switch"><input type="checkbox" id="fm_special" ${f && f.special ? 'checked' : ''}> <span>Today's Special</span></label>
        <label class="form-switch"><input type="checkbox" id="fm_available" ${!f || f.available ? 'checked' : ''}> <span>Available</span></label>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeFoodModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveFood(${f ? f.id : 'null'})">Save</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

function closeFoodModal() {
  const modal = $('foodModal');
  if (modal) modal.remove();
}

function saveFood(foodId) {
  const name = ($('fm_name')?.value || '').trim();
  const cat = parseInt($('fm_cat')?.value);
  const desc = ($('fm_desc')?.value || '').trim();
  const img = ($('fm_img')?.value || '').trim();
  const price = parseFloat($('fm_price')?.value);
  const stock = parseInt($('fm_stock')?.value) || 0;
  const special = $('fm_special')?.checked ? 1 : 0;
  const available = $('fm_available')?.checked ? 1 : 0;

  if (name.length < 2 || !price || price <= 0) {
    showToast('Please provide a valid name and price.', 'error');
    return;
  }

  if (foodId) {
    const f = foodById(foodId);
    Object.assign(f, { name, cat, desc, img: img || f.img, price, stock, special, available });
    showToast('Food item updated.', 'success');
  } else {
    const newId = foodItems.length ? Math.max(...foodItems.map(f => f.id)) + 1 : 1;
    foodItems.push({
      id: newId, cat, name, desc, price, special, available, stock,
      img: img || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&h=350&fit=crop'
    });
    showToast('Food item added.', 'success');
  }
  saveData();
  closeFoodModal();
  renderAdminFood();
}

function deleteFood(id) {
  if (!confirm('Delete this food item permanently?')) return;
  foodItems = foodItems.filter(f => f.id !== id);
  saveData();
  renderAdminFood();
  showToast('Food item deleted.', 'info');
}

/* ---- Admin: Categories Management ---- */
function renderAdminCategories() {
  const content = $('adminTabContent');
  if (!content) return;

  const rows = categories.map(c => `
    <tr>
      <td>${getCategoryIcon(c.icon, 20)}</td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${foodItems.filter(f => f.cat === c.id).length} items</td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-outline btn-sm" onclick="openCategoryModal(${c.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">Delete</button>
      </td>
    </tr>`).join('');

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h2 class="admin-card-title">Categories</h2>
        <button class="btn btn-primary" onclick="openCategoryModal()">+ Add Category</button>
      </div>
      <div class="table-responsive"><table class="data-table">
        <thead><tr><th>Icon</th><th>Name</th><th>Items</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function openCategoryModal(catId) {
  const c = catId ? catById(catId) : null;
  const iconOptions = ['sunrise', 'bowl', 'snack', 'coffee', 'cake', 'flame', 'noodles', 'juice', 'default'];
  const iconSelect = iconOptions.map(icon =>
    `<option value="${icon}" ${c && c.icon === icon ? 'selected' : ''}>${icon}</option>`
  ).join('');

  const existing = $('foodModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'foodModal';
  modal.innerHTML = `
  <div class="modal-content">
    <div class="modal-header">
      <h4 class="modal-title">${c ? 'Edit: ' + esc(c.name) : 'Add Category'}</h4>
      <button class="modal-close" onclick="closeFoodModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Category Name</label><input id="cm_name" class="form-input" value="${c ? esc(c.name) : ''}"></div>
      <div class="form-group"><label class="form-label">Icon</label><select id="cm_icon" class="form-select">${iconSelect}</select></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeFoodModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCategory(${c ? c.id : 'null'})">Save</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

function saveCategory(catId) {
  const name = ($('cm_name')?.value || '').trim();
  const icon = $('cm_icon')?.value || 'default';

  if (name.length < 2) {
    showToast('Please provide a valid name.', 'error');
    return;
  }

  if (catId) {
    const c = catById(catId);
    c.name = name;
    c.icon = icon;
    showToast('Category updated.', 'success');
  } else {
    const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    categories.push({ id: newId, name, icon });
    showToast('Category added.', 'success');
  }
  saveData();
  closeFoodModal();
  renderAdminCategories();
}

function deleteCategory(id) {
  const itemCount = foodItems.filter(f => f.cat === id).length;
  if (itemCount > 0) {
    showToast(`Cannot delete — ${itemCount} food items are in this category. Move them first.`, 'error');
    return;
  }
  if (!confirm('Delete this category permanently?')) return;
  categories = categories.filter(c => c.id !== id);
  saveData();
  renderAdminCategories();
  showToast('Category deleted.', 'info');
}

/* ---- Admin: Stock Management ---- */
function renderAdminStock() {
  const sorted = [...foodItems].sort((a, b) => a.stock - b.stock);
  const content = $('adminTabContent');
  if (!content) return;

  const rows = sorted.map(f => `
    <tr>
      <td><strong>${esc(f.name)}</strong></td>
      <td>${esc(catById(f.cat)?.name || 'Unknown')}</td>
      <td><strong>${f.stock}</strong></td>
      <td>${f.stock <= 5 ? '<span class="badge badge-danger">Low</span>' : '<span class="badge badge-success">OK</span>'}</td>
      <td>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="number" id="stock_${f.id}" class="form-input" style="width:100px;padding:8px 12px" value="${f.stock}">
          <button class="btn btn-primary btn-sm" onclick="updateStock(${f.id})">Update</button>
        </div>
      </td>
    </tr>`).join('');

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h2 class="admin-card-title">Stock Management</h2>
      </div>
      <div class="table-responsive"><table class="data-table">
        <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Status</th><th style="min-width:180px">Update</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function updateStock(foodId) {
  const val = Math.max(0, parseInt($('stock_' + foodId)?.value) || 0);
  foodById(foodId).stock = val;
  saveData();
  renderAdminStock();
  showToast('Stock updated.', 'success');
}

/* ============================================================
   MOBILE NAV
   ============================================================ */
function toggleMobileNav() {
  const navCenter = $('navCenter');
  if (navCenter) navCenter.classList.toggle('open');
}

function toggleAdminSidebar() {
  const sidebar = $('adminSidebar');
  if (sidebar) sidebar.classList.toggle('show');
}

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  try { localStorage.setItem('cb_theme', next); } catch(e) {}
}

function applySavedTheme() {
  try {
    const saved = localStorage.getItem('cb_theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch(e) {}
}

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener('hashchange', handleRoute);

document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  handleRoute();
});
