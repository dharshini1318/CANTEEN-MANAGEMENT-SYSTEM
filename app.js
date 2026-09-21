/* ============================================================
   CAMPUS BITES CANTEEN — APPLICATION LOGIC
   Pure vanilla JS, no frameworks, no jQuery
   ============================================================ */

/* Theme system removed */
/* ============================================================
   DATA STORE
   ============================================================ */
const TAX_RATE = 0.05;

const categories = [
  { id: 1, name: 'Breakfast', emoji: '🌅' },
  { id: 2, name: 'Rice & Meals', emoji: '🍚' },
  { id: 3, name: 'Snacks', emoji: '🍿' },
  { id: 4, name: 'Beverages', emoji: '☕' },
  { id: 5, name: 'Desserts', emoji: '🍮' }
];

let foodItems = [
  // === BREAKFAST (cat: 1) ===
  {
    id: 1, cat: 1, name: 'Masala Dosa',
    desc: 'Crispy golden rice crepe stuffed with spiced potato masala, served with sambar & coconut chutney.',
    price: 50, rating: 4.7, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&h=350&fit=crop'
  },
  {
    id: 2, cat: 1, name: 'Plain Dosa',
    desc: 'Thin, crispy rice and lentil crepe served with sambar and fresh coconut chutney.',
    price: 35, rating: 4.3, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&h=350&fit=crop'
  },
  {
    id: 3, cat: 1, name: 'Rava Dosa',
    desc: 'Crispy semolina crepe with a lacy texture, speckled with cumin and black pepper.',
    price: 55, rating: 4.4, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=500&h=350&fit=crop'
  },
  {
    id: 4, cat: 1, name: 'Onion Dosa',
    desc: 'Classic dosa topped with chopped onions and green chilies for an extra crunch.',
    price: 45, rating: 4.2, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1667040015850-f9e690460d82?w=500&h=350&fit=crop'
  },
  {
    id: 5, cat: 1, name: 'Mysore Masala Dosa',
    desc: 'Dosa smeared with spicy red chutney, filled with potato masala — a Mysore special!',
    price: 65, rating: 4.8, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 6, cat: 1, name: 'Idli Sambar',
    desc: 'Soft steamed rice cakes served with hot sambar and a trio of chutneys.',
    price: 30, rating: 4.5, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&h=350&fit=crop'
  },
  {
    id: 7, cat: 1, name: 'Mini Idli',
    desc: 'Bite-sized idlis dunked in spicy sambar, garnished with ghee and curry leaves.',
    price: 40, rating: 4.4, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1626132647523-66068394d31c?w=500&h=350&fit=crop'
  },
  {
    id: 8, cat: 1, name: 'Medu Vada',
    desc: 'Crispy golden lentil donuts, fluffy inside, served with sambar and chutney.',
    price: 30, rating: 4.5, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&h=350&fit=crop'
  },
  {
    id: 9, cat: 1, name: 'Upma',
    desc: 'Savory semolina porridge tempered with mustard, curry leaves, and vegetables.',
    price: 25, rating: 3.9, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=500&h=350&fit=crop'
  },
  {
    id: 10, cat: 1, name: 'Pongal (Ven Pongal)',
    desc: 'Comforting rice and lentil dish tempered with cumin, pepper, and cashews in ghee.',
    price: 40, rating: 4.6, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 11, cat: 1, name: 'Uttapam',
    desc: 'Thick, fluffy rice pancake topped with onions, tomatoes, and green chilies.',
    price: 45, rating: 4.2, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=500&h=350&fit=crop&q=90'
  },

  // === RICE & MEALS (cat: 2) ===
  {
    id: 12, cat: 2, name: 'Curd Rice',
    desc: 'Cooling tempered curd rice with pomegranate, perfect for a comforting meal.',
    price: 35, rating: 4.3, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=350&fit=crop'
  },
  {
    id: 13, cat: 2, name: 'Sambar Rice',
    desc: 'Steamed rice mixed with aromatic lentil sambar, finished with a ghee drizzle.',
    price: 45, rating: 4.4, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=350&fit=crop'
  },
  {
    id: 14, cat: 2, name: 'Lemon Rice',
    desc: 'Tangy turmeric-yellow rice with peanuts, curry leaves, and a citrusy kick.',
    price: 35, rating: 4.2, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 15, cat: 2, name: 'Tamarind Rice',
    desc: 'Sweet-sour tamarind rice (Puliyodarai) — a temple prasadam favourite.',
    price: 40, rating: 4.3, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 16, cat: 2, name: 'Coconut Rice',
    desc: 'Fragrant rice tossed with fresh coconut, cashews, and a south Indian tempering.',
    price: 40, rating: 4.1, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44726?w=500&h=350&fit=crop'
  },
  {
    id: 17, cat: 2, name: 'Tomato Rice',
    desc: 'Vibrant rice cooked in fresh tomato puree with aromatic spices.',
    price: 35, rating: 4.0, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500&h=350&fit=crop&q=80'
  },
  {
    id: 18, cat: 2, name: 'Chicken Biryani',
    desc: 'Fragrant Dindigul-style biryani with succulent chicken, seeraga samba rice and raita.',
    price: 120, rating: 4.9, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=350&fit=crop'
  },

  // === SNACKS (cat: 3) ===
  {
    id: 19, cat: 3, name: 'Sambar Vada',
    desc: 'Medu vadas soaked in hot sambar, a melt-in-your-mouth snack.',
    price: 35, rating: 4.5, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 20, cat: 3, name: 'Bajji / Pakora',
    desc: 'Mixed vegetable fritters in spiced chickpea batter, served with green chutney.',
    price: 25, rating: 4.2, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=350&fit=crop'
  },
  {
    id: 21, cat: 3, name: 'Sundal',
    desc: 'Spiced chickpea salad with grated coconut — a healthy temple-style snack.',
    price: 20, rating: 4.0, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=350&fit=crop'
  },

  // === BEVERAGES (cat: 4) ===
  {
    id: 22, cat: 4, name: 'Filter Coffee',
    desc: 'Authentic South Indian filter coffee — strong decoction with frothy milk in a steel tumbler.',
    price: 20, rating: 4.8, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=500&h=350&fit=crop'
  },
  {
    id: 23, cat: 4, name: 'Masala Chai',
    desc: 'Spiced tea with ginger, cardamom, and cloves — brewed the desi way.',
    price: 15, rating: 4.6, special: 1, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500&h=350&fit=crop'
  },
  {
    id: 24, cat: 4, name: 'Buttermilk (Neer Mor)',
    desc: 'Refreshing spiced buttermilk with curry leaves and ginger.',
    price: 15, rating: 4.1, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&h=350&fit=crop'
  },
  {
    id: 25, cat: 4, name: 'Rose Milk',
    desc: 'Chilled milk with rose syrup — a nostalgic South Indian drink.',
    price: 25, rating: 4.3, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&h=350&fit=crop'
  },
  {
    id: 26, cat: 4, name: 'Badam Milk',
    desc: 'Rich almond milk drink with saffron and cardamom.',
    price: 30, rating: 4.4, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500&h=350&fit=crop&q=90'
  },
  {
    id: 27, cat: 4, name: 'Fresh Lime Soda',
    desc: 'Freshly squeezed lime with soda water — sweet or salted, your choice.',
    price: 20, rating: 4.2, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&h=350&fit=crop'
  },
  {
    id: 28, cat: 4, name: 'Tender Coconut',
    desc: 'Fresh tender coconut water — the ultimate natural refresher.',
    price: 40, rating: 4.5, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&h=350&fit=crop'
  },

  // === DESSERTS (cat: 5) ===
  {
    id: 29, cat: 5, name: 'Gulab Jamun',
    desc: 'Soft milk-solid dumplings soaked in rose-scented sugar syrup — melt-in-your-mouth sweet.',
    price: 30, rating: 4.7, special: 0, available: 1, stock: 50,
    img: 'https://images.unsplash.com/photo-1666190020635-44e0e3486542?w=500&h=350&fit=crop'
  }
];

const admins = [
  { id: 1, name: 'Canteen Admin', email: 'admin@canteen.edu', pass: 'Admin@123', role: 'super_admin' }
];

let currentAdmin = null;
let activeMenuCat = 'all';
let currentAdminTab = 'dashboard';

/* ============================================================
   UTILITIES
   ============================================================ */
function rupees(n) { return '₹' + Number(n).toFixed(2); }
function foodById(id) { return foodItems.find(f => f.id === id); }
function catById(id) { return categories.find(c => c.id === id); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function esc(s) {
  const d = document.createElement('div');
  d.innerText = s ?? '';
  return d.innerHTML;
}

function $(id) { return document.getElementById(id); }

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = $('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function statusBadgeClass(s) {
  return 'badge-' + s;
}

function alertHtml(msg) {
  return `<div class="alert alert-danger">${esc(msg)}</div>`;
}

/* ============================================================
   VIEW ROUTING
   ============================================================ */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const nav = $('customerNav');
  if (nav) nav.style.display = (name === 'admin') ? 'none' : '';

  const footer = $('mainFooter');
  if (footer) footer.style.display = (name === 'admin') ? 'none' : '';

  const el = $('view-' + name);
  if (el) {
    el.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile nav
  const navCenter = document.querySelector('.navbar-center');
  if (navCenter) navCenter.classList.remove('open');

  // Update active nav link
  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    link.classList.toggle('active', link.dataset.view === name);
  });

  if (name === 'home') renderHome();
  if (name === 'menu') renderMenu();
  if (name === 'admin') showAdminTab(currentAdminTab || 'dashboard');
}

/* ============================================================
   PARTICLES
   ============================================================ */
function createParticles() {
  const container = $('particles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = (Math.random() * 6 + 3) + 'px';
    p.style.height = p.style.width;
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    container.appendChild(p);
  }
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
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stagger-item').forEach(el => observer.observe(el));
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome() {
  const catGrid = $('homeCategories');
  if (catGrid) {
    catGrid.innerHTML = categories.map(c => `
      <div class="category-card stagger-item" onclick="goToCategory(${c.id})">
        <div class="category-icon">${c.emoji}</div>
        <div class="category-name">${c.name}</div>
      </div>
    `).join('');
  }

  const specials = foodItems.filter(f => f.special && f.available).slice(0, 4);
  const specialsGrid = $('specialsGrid');
  if (specialsGrid) {
    specialsGrid.innerHTML = specials.map((f, i) => foodCardHtml(f, i)).join('');
  }

  setTimeout(observeStagger, 50);
}

function goToCategory(id) {
  showView('menu');
  setTimeout(() => filterCategory(id), 50);
}

function searchFromHero() {
  const q = $('heroSearch').value;
  showView('menu');
  setTimeout(() => {
    $('menuSearch').value = q;
    renderMenu();
  }, 50);
}

/* ============================================================
   FOOD CARD HTML
   ============================================================ */
function foodCardHtml(f, index = 0) {
  const inStock = f.available && f.stock > 0;
  const delay = index * 0.08;
  return `
  <div class="food-card stagger-item" style="transition-delay: ${delay}s">
    <div class="food-card-img-wrapper">
      <img src="${f.img}" alt="${esc(f.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
      <div style="display:none;width:100%;height:200px;align-items:center;justify-content:center;background:var(--bg-tertiary);font-size:3rem">🍽️</div>
      <div class="food-card-badges">
        <div>${f.special ? '<span class="food-card-special">⭐ Chef\'s Special</span>' : ''}</div>
        <span class="food-card-rating">⭐ ${f.rating.toFixed(1)}</span>
      </div>
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
      .concat(categories.map(c => `<button class="chip ${activeMenuCat === c.id ? 'active' : ''}" onclick="filterCategory(${c.id})">${c.emoji} ${c.name}</button>`));
    chipContainer.innerHTML = chips.join('');
  }

  const q = ($('menuSearch')?.value || '').toLowerCase();
  const items = foodItems.filter(f => {
    const matchCat = activeMenuCat === 'all' || f.cat === activeMenuCat;
    const matchQ = f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const grid = $('menuGrid');
  if (grid) {
    grid.innerHTML = items.length
      ? items.map((f, i) => foodCardHtml(f, i)).join('')
      : '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">😕</div><p>No food items match your search.</p></div>';
  }

  setTimeout(observeStagger, 50);
}

/* ============================================================

/* ============================================================
   AUTH — ADMIN
   ============================================================ */
function doAdminLogin() {
  const email = ($('ad_email')?.value || '').trim();
  const pass = $('ad_pass')?.value || '';
  const a = admins.find(x => x.email === email);
  if (!a || a.pass !== pass) { $('adminLoginAlert').innerHTML = alertHtml('Invalid admin credentials.'); return; }
  currentAdmin = a;
  showView('admin');
}

function logoutAdmin() {
  currentAdmin = null;
  showToast('Admin logged out.', 'info');
  showView('home');
}

/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */
function showAdminTab(tab) {
  currentAdminTab = tab;
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`.sidebar-link[data-tab="${tab}"]`);
  if (link) link.classList.add('active');
  const map = { dashboard: renderAdminDashboard, food: renderAdminFood, stock: renderAdminStock };
  (map[tab] || renderAdminDashboard)();
}

function renderAdminDashboard() {
  const totalFoodItems = foodItems.length;

  const content = $('adminTabContent');
  if (!content) return;

  content.innerHTML = `
    <div class="glass-card-static mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div><h3 style="margin:0;font-family:var(--font-heading)">Welcome, ${esc(currentAdmin.name)}</h3><p class="small text-muted mb-0">Admin Dashboard</p></div>
      <span class="badge badge-secondary">${new Date().toDateString()}</span>
    </div>
    <div class="stats-grid mb-4">
      ${statCard('🍽️', '#8b5cf6', totalFoodItems, 'Food Items Menu')}
      ${statCard('📦', '#10b981', foodItems.reduce((a,b)=>a+b.stock,0), 'Total Stock Units')}
    </div>
  `;
}

function statCard(icon, color, value, label) {
  return `<div class="stat-card">
    <div class="stat-icon" style="background:${color}">${icon}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${label}</div>
  </div>`;
}

/* Render charts removed as orders are no longer tracked */

/* ---- Admin: Food Management ---- */
function renderAdminFood() {
  const content = $('adminTabContent');
  if (!content) return;

  const rows = foodItems.map(f => `
    <tr>
      <td><img src="${f.img}" alt="${esc(f.name)}" style="width:44px;height:44px;border-radius:8px;object-fit:cover" onerror="this.style.background='var(--bg-tertiary)'"></td>
      <td>${esc(f.name)} ${f.special ? '<span class="badge badge-accent">Special</span>' : ''}</td>
      <td>${esc(catById(f.cat).name)}</td>
      <td>${rupees(f.price)}</td>
      <td>${f.stock}</td>
      <td>⭐ ${f.rating.toFixed(1)}</td>
      <td><span class="badge ${f.available ? 'badge-success' : 'badge-secondary'}">${f.available ? 'Available' : 'Hidden'}</span></td>
      <td style="text-align:right">
        <button class="btn btn-outline btn-sm" onclick="openFoodModal(${f.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFood(${f.id})">🗑</button>
      </td>
    </tr>`).join('');

  content.innerHTML = `
    <div class="glass-card-static mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
      <h3 style="margin:0;font-family:var(--font-heading)">🍽️ Food Management</h3>
      <button class="btn btn-primary" onclick="openFoodModal()">+ Add Food Item</button>
    </div>
    <div class="glass-card-static"><div class="table-responsive"><table class="data-table">
      <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></div>
    <div id="foodModalHost"></div>`;
}

function openFoodModal(foodId) {
  const f = foodId ? foodById(foodId) : null;
  const catOptions = categories.map(c => `<option value="${c.id}" ${f && f.cat === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');

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
      <div class="form-row mb-3">
        <div class="form-group"><label class="form-label">Food Name</label><input id="fm_name" class="form-input" value="${f ? esc(f.name) : ''}"></div>
        <div class="form-group"><label class="form-label">Category</label><select id="fm_cat" class="form-select">${catOptions}</select></div>
      </div>
      <div class="form-group mb-3"><label class="form-label">Description</label><textarea id="fm_desc" class="form-textarea">${f ? esc(f.desc) : ''}</textarea></div>
      <div class="form-group mb-3"><label class="form-label">Image URL</label><input id="fm_img" class="form-input" value="${f ? f.img : ''}"></div>
      <div class="form-row mb-3">
        <div class="form-group"><label class="form-label">Price (₹)</label><input id="fm_price" type="number" class="form-input" value="${f ? f.price : ''}"></div>
        <div class="form-group"><label class="form-label">Stock Qty</label><input id="fm_stock" type="number" class="form-input" value="${f ? f.stock : 50}"></div>
      </div>
      <div class="form-row mb-3">
        <div class="form-group"><label class="form-label">Rating</label><input id="fm_rating" type="number" step="0.1" min="0" max="5" class="form-input" value="${f ? f.rating : 4.0}"></div>
        <div></div>
      </div>
      <div class="form-row">
        <label class="form-switch"><input type="checkbox" id="fm_special" ${f && f.special ? 'checked' : ''}> <span>Today's Special</span></label>
        <label class="form-switch"><input type="checkbox" id="fm_available" ${!f || f.available ? 'checked' : ''}> <span>Available</span></label>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeFoodModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveFood(${f ? f.id : 'null'})">Save Food Item</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

function closeFoodModal() {
  const modal = $('foodModal');
  if (modal) {
    modal.classList.add('hide');
    setTimeout(() => modal.remove(), 200);
  }
}

function saveFood(foodId) {
  const name = ($('fm_name')?.value || '').trim();
  const cat = parseInt($('fm_cat')?.value);
  const desc = ($('fm_desc')?.value || '').trim();
  const img = ($('fm_img')?.value || '').trim();
  const price = parseFloat($('fm_price')?.value);
  const stock = parseInt($('fm_stock')?.value);
  const rating = parseFloat($('fm_rating')?.value);
  const special = $('fm_special')?.checked ? 1 : 0;
  const available = $('fm_available')?.checked ? 1 : 0;

  if (name.length < 2 || !price || price <= 0) { showToast('Please provide a valid name and price.', 'error'); return; }

  if (foodId) {
    const f = foodById(foodId);
    Object.assign(f, { name, cat, desc, img: img || f.img, price, stock, rating, special, available });
    showToast('Food item updated.', 'success');
  } else {
    const newId = Math.max(...foodItems.map(f => f.id)) + 1;
    foodItems.push({ id: newId, cat, name, desc, price, rating, special, available, stock, img: img || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&h=350&fit=crop' });
    showToast('Food item added.', 'success');
  }
  closeFoodModal();
  renderAdminFood();
}

function deleteFood(id) {
  if (!confirm('Delete this food item permanently?')) return;
  foodItems = foodItems.filter(f => f.id !== id);
  renderAdminFood();
  showToast('Food item deleted.', 'info');
}

/* ---- Admin: Stock Management ---- */
function renderAdminStock() {
  const sorted = [...foodItems].sort((a, b) => a.stock - b.stock);
  const content = $('adminTabContent');
  if (!content) return;

  const rows = sorted.map(f => `
    <tr>
      <td>${esc(f.name)}</td>
      <td>${esc(catById(f.cat).name)}</td>
      <td><strong>${f.stock}</strong></td>
      <td>${f.stock <= 5 ? '<span class="badge badge-danger">Low Stock</span>' : '<span class="badge badge-success">OK</span>'}</td>
      <td>
        <div class="d-flex gap-2 align-items-center">
          <input type="number" id="stock_${f.id}" class="form-input" style="width:100px;padding:0.4rem 0.6rem" value="${f.stock}">
          <button class="btn btn-primary btn-sm" onclick="updateStock(${f.id})">Update</button>
        </div>
      </td>
    </tr>`).join('');

  content.innerHTML = `
    <div class="glass-card-static mb-4"><h3 style="margin:0;font-family:var(--font-heading)">📦 Stock Management</h3></div>
    <div class="glass-card-static"><div class="table-responsive"><table class="data-table">
      <thead><tr><th>Item</th><th>Category</th><th>Current Stock</th><th>Alert</th><th style="min-width:200px">Update Stock</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></div>`;
}

function updateStock(foodId) {
  const val = Math.max(0, parseInt($('stock_' + foodId)?.value) || 0);
  foodById(foodId).stock = val;
  renderAdminStock();
  showToast('Stock updated.', 'success');
}

/* Admin orders and users management removed */

/* ============================================================
   MOBILE NAV TOGGLE
   ============================================================ */
function toggleMobileNav() {
  const navCenter = document.querySelector('.navbar-center');
  if (navCenter) navCenter.classList.toggle('open');
}

function toggleAdminSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar) sidebar.classList.toggle('show');
}

/* ============================================================
   CLOSE DROPDOWN ON CLICK OUTSIDE
   ============================================================ */
document.addEventListener('click', (e) => {
  const dd = $('userDropdown');
  const btn = $('userMenuBtn');
  if (dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) {
    dd.style.display = 'none';
  }
});

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  renderHome();
});
