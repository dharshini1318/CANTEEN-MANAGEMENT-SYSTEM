/* ============================================================
   CAMPUS BITES CANTEEN — APPLICATION LOGIC
   Pure vanilla JS, no frameworks, no jQuery
   ============================================================ */

/* ============================================================
   THEME SYSTEM
   ============================================================ */
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('cb-theme') || 'dark';
    this.set(saved);
  },
  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cb-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.set(current === 'dark' ? 'light' : 'dark');
  }
};

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

let users = [
  { id: 1, name: 'Aarav Sharma', roll: 'CS2023001', dept: 'Computer Science', email: 'student@college.edu', phone: '9876543210', pass: 'Student@123', status: 'active' }
];

const admins = [
  { id: 1, name: 'Canteen Admin', email: 'admin@canteen.edu', pass: 'Admin@123', role: 'super_admin' }
];

let cart = [];
let orders = [];
let orderSeq = 1000;
let currentUser = null;
let currentAdmin = null;
let activeMenuCat = 'all';
let currentAdminTab = 'dashboard';
let adminOrderFilter = 'all';

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
  if (name === 'cart') renderCart();
  if (name === 'checkout') renderCheckout();
  if (name === 'orders') renderOrders();
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
          ? '<span class="badge badge-success">In Stock</span>'
          : '<span class="badge badge-danger">Out of Stock</span>'}
      </div>
      ${inStock ? `
      <div class="food-card-actions">
        <button class="btn btn-primary btn-sm" onclick="addToCart(${f.id})">🛒 Add</button>
        <button class="btn btn-outline btn-sm" onclick="addToCart(${f.id});showView('cart')">Buy Now</button>
      </div>` : '<button class="btn btn-secondary btn-sm w-100" disabled>Unavailable</button>'}
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
   CART
   ============================================================ */
function addToCart(foodId) {
  if (!currentUser) {
    showToast('Please login to add items to your cart.', 'info');
    showView('login');
    return;
  }
  const f = foodById(foodId);
  if (!f || !f.available || f.stock < 1) {
    showToast('This item is unavailable.', 'error');
    return;
  }
  const line = cart.find(c => c.foodId === foodId);
  if (line) line.qty += 1; else cart.push({ foodId, qty: 1 });
  updateCartBadge();
  showToast(esc(f.name) + ' added to cart.', 'success');

  // Bump animation
  const badge = $('cartBadge');
  if (badge) {
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  }
}

function updateCartBadge() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const badge = $('cartBadge');
  if (badge) badge.textContent = count;
}

function cartTotals() {
  let subtotal = 0;
  cart.forEach(c => {
    const f = foodById(c.foodId);
    if (f) subtotal += f.price * c.qty;
  });
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

function renderCart() {
  const content = $('cartContent');
  if (!content) return;

  if (!currentUser) {
    content.innerHTML = emptyState('🔒', 'Please login to view your cart.');
    return;
  }
  if (!cart.length) {
    content.innerHTML = emptyState('🛒', 'Your cart is empty.', true);
    return;
  }

  const rows = cart.map(c => {
    const f = foodById(c.foodId);
    return `
    <div class="cart-item">
      <img class="cart-item-img" src="${f.img}" alt="${esc(f.name)}" onerror="this.style.background='var(--bg-tertiary)';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/>'">
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(f.name)}</div>
        <div class="cart-item-price">${rupees(f.price)} each</div>
      </div>
      <div class="qty-control">
        <button onclick="changeQty(${f.id},-1)">−</button>
        <input value="${c.qty}" readonly>
        <button onclick="changeQty(${f.id},1)">+</button>
      </div>
      <div class="cart-item-total">${rupees(f.price * c.qty)}</div>
      <button class="cart-item-remove" onclick="removeFromCart(${f.id})">🗑</button>
    </div>`;
  }).join('');

  const t = cartTotals();
  content.innerHTML = `
  <div class="cart-layout">
    <div>${rows}</div>
    <div class="summary-card">
      <div class="glass-card-static">
        <h4 style="margin-bottom:1rem;font-family:var(--font-heading)">Order Summary</h4>
        <div class="summary-row"><span>Subtotal</span><strong>${rupees(t.subtotal)}</strong></div>
        <div class="summary-row"><span>Tax (5%)</span><strong>${rupees(t.tax)}</strong></div>
        <div class="summary-row total"><span>Grand Total</span><strong class="total-value">${rupees(t.total)}</strong></div>
        <button class="btn btn-primary w-100 mt-3" onclick="showView('checkout')">Proceed to Checkout →</button>
        <button class="btn btn-outline w-100 mt-2" onclick="showView('menu')">Add More Items</button>
      </div>
    </div>
  </div>`;
}

function changeQty(foodId, delta) {
  const line = cart.find(c => c.foodId === foodId);
  if (!line) return;
  line.qty = Math.max(1, line.qty + delta);
  updateCartBadge();
  renderCart();
}

function removeFromCart(foodId) {
  cart = cart.filter(c => c.foodId !== foodId);
  updateCartBadge();
  renderCart();
  showToast('Item removed from cart.', 'info');
}

function emptyState(icon, msg, showBtn) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <p>${msg}</p>
    ${showBtn ? '<button class="btn btn-primary mt-3" onclick="showView(\'menu\')">Browse Menu</button>' : ''}
  </div>`;
}

/* ============================================================
   CHECKOUT & PLACE ORDER
   ============================================================ */
function renderCheckout() {
  if (!cart.length) { showView('cart'); return; }
  if ($('co_name')) $('co_name').value = currentUser.name;
  if ($('co_roll')) $('co_roll').value = currentUser.roll || '';
  if ($('co_dept')) $('co_dept').value = currentUser.dept || '';
  if ($('co_phone')) $('co_phone').value = currentUser.phone || '';

  const t = cartTotals();
  const summaryItems = $('checkoutSummaryItems');
  if (summaryItems) {
    summaryItems.innerHTML = cart.map(c => {
      const f = foodById(c.foodId);
      return `<div class="summary-row small"><span>${esc(f.name)} × ${c.qty}</span><span>${rupees(f.price * c.qty)}</span></div>`;
    }).join('');
  }
  if ($('co_subtotal')) $('co_subtotal').textContent = rupees(t.subtotal);
  if ($('co_tax')) $('co_tax').textContent = rupees(t.tax);
  if ($('co_total')) $('co_total').textContent = rupees(t.total);
}

function placeOrder() {
  const name = ($('co_name')?.value || '').trim();
  const roll = ($('co_roll')?.value || '').trim();
  const dept = ($('co_dept')?.value || '').trim();
  const phone = ($('co_phone')?.value || '').trim();
  const type = $('co_type')?.value || 'pickup';
  const time = $('co_time')?.value || 'ASAP';
  const pmEl = document.querySelector('input[name="pm"]:checked');
  const method = pmEl ? pmEl.value : 'UPI';

  if (name.length < 3 || !/^[0-9]{10}$/.test(phone)) {
    showToast('Please provide a valid name and 10-digit phone number.', 'error');
    return;
  }

  for (const c of cart) {
    const f = foodById(c.foodId);
    if (!f || f.stock < c.qty) {
      showToast(`Sorry, "${f ? f.name : 'item'}" no longer has enough stock.`, 'error');
      return;
    }
  }

  const t = cartTotals();
  const items = cart.map(c => {
    const f = foodById(c.foodId);
    return { foodId: f.id, name: f.name, price: f.price, qty: c.qty, total: f.price * c.qty };
  });

  items.forEach(it => { foodById(it.foodId).stock -= it.qty; });

  const order = {
    id: ++orderSeq, userId: currentUser.id, studentName: name, roll, dept, phone,
    type, time, method, items, subtotal: t.subtotal, tax: t.tax, total: t.total,
    status: 'pending', txRef: method.toUpperCase().replace(' ', '') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    createdAt: new Date()
  };
  orders.unshift(order);
  cart = [];
  updateCartBadge();

  $('confMessage').textContent = `Your order #${order.id} has been received and is being processed.`;
  $('receiptBox').innerHTML = receiptHtml(order);
  $('trackBtn').onclick = () => { showView('orders'); setTimeout(() => trackOrder(order.id), 50); };
  showView('confirmation');
  showToast('Order placed successfully!', 'success');
}

function receiptHtml(o) {
  const rows = o.items.map(it => `<tr><td>${esc(it.name)}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${rupees(it.price)}</td><td style="text-align:right">${rupees(it.total)}</td></tr>`).join('');
  return `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <div><h4 style="margin:0;font-family:var(--font-heading)">Campus Bites Canteen</h4><span class="small text-muted">Order Receipt</span></div>
    <span class="badge ${statusBadgeClass(o.status)}">${cap(o.status)}</span>
  </div>
  <div class="divider"></div>
  <div class="receipt-grid mb-3">
    <div><strong>Order ID:</strong> #${o.id}</div>
    <div><strong>Date:</strong> ${o.createdAt.toLocaleString()}</div>
    <div><strong>Student:</strong> ${esc(o.studentName)}</div>
    <div><strong>Roll No:</strong> ${esc(o.roll || '-')}</div>
    <div><strong>Order Type:</strong> ${cap(o.type)}</div>
    <div><strong>Pickup Time:</strong> ${esc(o.time)}</div>
    <div><strong>Payment:</strong> ${esc(o.method)}</div>
    <div><strong>Transaction Ref:</strong> ${o.txRef}</div>
  </div>
  <div class="divider"></div>
  <div class="table-responsive">
    <table class="data-table">
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="divider"></div>
  <div class="summary-row"><span>Subtotal</span><span>${rupees(o.subtotal)}</span></div>
  <div class="summary-row"><span>Tax</span><span>${rupees(o.tax)}</span></div>
  <div class="summary-row total"><span>Grand Total</span><span class="total-value">${rupees(o.total)}</span></div>`;
}

/* ============================================================
   ORDER HISTORY & TRACKING
   ============================================================ */
function renderOrders() {
  const content = $('ordersContent');
  if (!content) return;

  if (!currentUser) {
    content.innerHTML = emptyState('🔒', 'Please login to view your orders.');
    return;
  }

  const myOrders = orders.filter(o => o.userId === currentUser.id);
  if (!myOrders.length) {
    content.innerHTML = emptyState('📋', "You haven't placed any orders yet.", true);
    return;
  }

  const rows = myOrders.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.createdAt.toLocaleString()}</td>
      <td>${o.items.length} item(s)</td>
      <td>${rupees(o.total)}</td>
      <td><span class="badge ${statusBadgeClass(o.status)}">${cap(o.status)}</span></td>
      <td style="text-align:right"><button class="btn btn-outline btn-sm" onclick="trackOrder(${o.id})">Track</button></td>
    </tr>`).join('');

  content.innerHTML = `
    <div id="trackingBox" class="mb-5"></div>
    <h4 class="mb-3" style="font-family:var(--font-heading)">Order History</h4>
    <div class="glass-card-static">
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  trackOrder(myOrders[0].id);
}

const STEPS = [
  ['pending', 'Order Placed', '📦'],
  ['confirmed', 'Confirmed', '✅'],
  ['preparing', 'Preparing', '🔥'],
  ['ready', 'Ready', '🔔'],
  ['completed', 'Completed', '🎉']
];

function trackOrder(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  const box = $('trackingBox');
  if (!box) return;

  if (o.status === 'cancelled') {
    box.innerHTML = `<div class="glass-card-static"><h4>Order #${o.id}</h4><span class="badge badge-cancelled">Cancelled</span></div>`;
    return;
  }

  const idx = STEPS.findIndex(s => s[0] === o.status);
  const stepsHtml = STEPS.map((s, i) => {
    const cls = i < idx ? 'done' : (i === idx ? 'active' : '');
    const icon = i < idx ? '✓' : s[2];
    return `<div class="timeline-step ${cls}"><div class="timeline-dot">${icon}</div><div class="timeline-label">${s[1]}</div></div>`;
  }).join('');

  const itemsList = o.items.map(it => `<div class="summary-row small"><span>${esc(it.name)} × ${it.qty}</span><span>${rupees(it.total)}</span></div>`).join('');

  box.innerHTML = `
    <div class="glass-card-static">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h4 style="margin:0;font-family:var(--font-heading)">Tracking Order #${o.id}</h4>
        <span class="badge ${statusBadgeClass(o.status)}">${cap(o.status)}</span>
      </div>
      <p class="small text-muted mb-3">Placed ${o.createdAt.toLocaleString()} · Estimated prep time: 15-20 mins</p>
      <div class="order-timeline">${stepsHtml}</div>
      <div class="divider"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div>${itemsList}</div>
        <div style="text-align:right"><strong>Order Total: </strong><span class="food-price">${rupees(o.total)}</span></div>
      </div>
    </div>`;
}

/* ============================================================
   AUTH — STUDENT
   ============================================================ */
function doLogin() {
  const email = ($('li_email')?.value || '').trim();
  const pass = $('li_pass')?.value || '';
  const u = users.find(x => x.email === email);
  if (!u || u.pass !== pass) { $('loginAlert').innerHTML = alertHtml('Invalid email or password.'); return; }
  if (u.status === 'blocked') { $('loginAlert').innerHTML = alertHtml('Your account has been blocked.'); return; }
  currentUser = u;
  $('loginAlert').innerHTML = '';
  refreshAuthArea();
  showToast('Welcome back, ' + u.name.split(' ')[0] + '!', 'success');
  showView('home');
}

function doRegister() {
  const name = ($('rg_name')?.value || '').trim();
  const roll = ($('rg_roll')?.value || '').trim();
  const dept = ($('rg_dept')?.value || '').trim();
  const phone = ($('rg_phone')?.value || '').trim();
  const email = ($('rg_email')?.value || '').trim();
  const pass = $('rg_pass')?.value || '';
  const pass2 = $('rg_pass2')?.value || '';

  const errors = [];
  if (name.length < 3) errors.push('Full name must be at least 3 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('Please enter a valid email.');
  if (pass.length < 6) errors.push('Password must be at least 6 characters.');
  if (pass !== pass2) errors.push('Passwords do not match.');
  if (!/^[0-9]{10}$/.test(phone)) errors.push('Phone number must be 10 digits.');
  if (users.some(u => u.email === email)) errors.push('An account with this email already exists.');

  if (errors.length) { $('registerAlert').innerHTML = alertHtml(errors.join(' ')); return; }

  const newUser = { id: users.length + 1, name, roll, dept, email, phone, pass, status: 'active' };
  users.push(newUser);
  $('registerAlert').innerHTML = '';
  showToast('Registration successful! Please login.', 'success');
  $('li_email').value = email;
  $('li_pass').value = pass;
  showView('login');
}

function refreshAuthArea() {
  const area = $('authArea');
  if (!area) return;

  if (currentUser) {
    area.innerHTML = `
      <div style="position:relative">
        <button class="btn btn-primary" onclick="toggleUserMenu()" id="userMenuBtn">
          👤 ${esc(currentUser.name.split(' ')[0])} ▾
        </button>
        <div id="userDropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;min-width:200px;z-index:100" class="glass-card-static">
          <a href="#" onclick="showView('orders');toggleUserMenu();return false" style="display:block;padding:0.5rem 0;color:var(--text-primary);font-weight:600">📋 Order History</a>
          <div class="divider" style="margin:0.5rem 0"></div>
          <a href="#" onclick="logoutUser();return false" style="display:block;padding:0.5rem 0;color:var(--danger);font-weight:600">🚪 Logout</a>
        </div>
      </div>`;
    const ordersNav = $('ordersNavBtn');
    if (ordersNav) ordersNav.style.display = '';
  } else {
    area.innerHTML = `
      <button class="btn btn-outline" onclick="showView('login')">Login</button>
      <button class="btn btn-primary" onclick="showView('register')">Register</button>`;
    const ordersNav = $('ordersNavBtn');
    if (ordersNav) ordersNav.style.display = 'none';
  }
}

function toggleUserMenu() {
  const dd = $('userDropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function logoutUser() {
  currentUser = null;
  cart = [];
  updateCartBadge();
  refreshAuthArea();
  showToast('Logged out.', 'info');
  showView('home');
}

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
  const map = { dashboard: renderAdminDashboard, food: renderAdminFood, stock: renderAdminStock, orders: renderAdminOrders, users: renderAdminUsers };
  (map[tab] || renderAdminDashboard)();
}

function renderAdminDashboard() {
  const totalUsers = users.length;
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => o.createdAt.toDateString() === today).length;
  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const todaySales = orders.filter(o => o.createdAt.toDateString() === today && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalFoodItems = foodItems.length;

  const content = $('adminTabContent');
  if (!content) return;

  const recentRows = orders.slice(0, 6).map(o => `
    <tr>
      <td>#${o.id}</td><td>${esc(o.studentName)}</td><td>${rupees(o.total)}</td>
      <td>${esc(o.method)}</td><td><span class="badge ${statusBadgeClass(o.status)}">${cap(o.status)}</span></td>
      <td>${o.createdAt.toLocaleString()}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="text-center text-muted" style="padding:2rem">No orders yet.</td></tr>';

  content.innerHTML = `
    <div class="glass-card-static mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
      <div><h3 style="margin:0;font-family:var(--font-heading)">Welcome, ${esc(currentAdmin.name)}</h3><p class="small text-muted mb-0">Here's what's happening at the canteen today</p></div>
      <span class="badge badge-secondary">${new Date().toDateString()}</span>
    </div>
    <div class="stats-grid mb-4">
      ${statCard('👥', '#f59e0b', totalUsers, 'Total Users')}
      ${statCard('📋', '#3b82f6', todayOrders, "Today's Orders")}
      ${statCard('⏳', '#eab308', pendingOrders, 'Pending Orders')}
      ${statCard('✅', '#10b981', completedOrders, 'Completed Orders')}
      ${statCard('💰', '#d97706', rupees(todaySales), "Today's Sales")}
      ${statCard('🍽️', '#8b5cf6', totalFoodItems, 'Food Items')}
    </div>
    <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:1.5rem" class="mb-4">
      <div class="glass-card-static"><h5 class="mb-3" style="font-family:var(--font-heading)">Order Status Breakdown</h5><canvas id="statusChart" height="160"></canvas></div>
      <div class="glass-card-static"><h5 class="mb-3" style="font-family:var(--font-heading)">Most Popular Items</h5><canvas id="popularChart" height="160"></canvas></div>
    </div>
    <div class="glass-card-static">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0" style="font-family:var(--font-heading)">Recent Orders</h5>
        <button class="btn btn-outline btn-sm" onclick="showAdminTab('orders')">View All</button>
      </div>
      <div class="table-responsive">
        <table class="data-table"><thead><tr><th>Order ID</th><th>Student</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${recentRows}</tbody></table>
      </div>
    </div>`;

  renderCharts();
}

function statCard(icon, color, value, label) {
  return `<div class="stat-card">
    <div class="stat-icon" style="background:${color}">${icon}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${label}</div>
  </div>`;
}

let statusChartInst = null, popularChartInst = null;
function renderCharts() {
  if (typeof Chart === 'undefined') return;

  const chartColors = {
    pending: '#9ca3af', confirmed: '#3b82f6', preparing: '#eab308',
    ready: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444'
  };

  // Status chart
  const statusCounts = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const sLabels = Object.keys(statusCounts).map(cap);
  const sData = Object.values(statusCounts);
  const sColors = Object.keys(statusCounts).map(s => chartColors[s] || '#9ca3af');

  if (statusChartInst) statusChartInst.destroy();
  const ctx1 = $('statusChart');
  if (ctx1) {
    statusChartInst = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: sLabels.length ? sLabels : ['No data'],
        datasets: [{ data: sData.length ? sData : [1], backgroundColor: sColors.length ? sColors : ['#374151'] }]
      },
      options: {
        plugins: { legend: { labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() } } }
      }
    });
  }

  // Popular items chart
  const popMap = {};
  orders.forEach(o => o.items.forEach(it => { popMap[it.name] = (popMap[it.name] || 0) + it.qty; }));
  const sorted = Object.entries(popMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (popularChartInst) popularChartInst.destroy();
  const ctx2 = $('popularChart');
  if (ctx2) {
    popularChartInst = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: sorted.length ? sorted.map(s => s[0]) : ['No data'],
        datasets: [{ label: 'Units Sold', data: sorted.length ? sorted.map(s => s[1]) : [0], backgroundColor: '#f59e0b' }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() }, grid: { display: false } }
        }
      }
    });
  }
}

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

/* ---- Admin: Order Management ---- */
function filterAdminOrders(s) { adminOrderFilter = s; renderAdminOrders(); }

function renderAdminOrders() {
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
  const filtered = adminOrderFilter === 'all' ? orders : orders.filter(o => o.status === adminOrderFilter);
  const content = $('adminTabContent');
  if (!content) return;

  const filterBtns = [`<button class="chip ${adminOrderFilter === 'all' ? 'active' : ''}" onclick="filterAdminOrders('all')">All</button>`]
    .concat(statuses.map(s => `<button class="chip ${adminOrderFilter === s ? 'active' : ''}" onclick="filterAdminOrders('${s}')">${cap(s)}</button>`));

  const rows = filtered.length ? filtered.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${esc(o.studentName)}<br><span class="small text-muted">${esc(o.roll || '')}</span></td>
      <td>${esc(o.phone)}</td>
      <td>${rupees(o.total)}</td>
      <td>${esc(o.method)}</td>
      <td>${cap(o.type)}</td>
      <td><span id="statusBadge-${o.id}" class="badge ${statusBadgeClass(o.status)}">${cap(o.status)}</span></td>
      <td><select class="form-select" style="min-width:130px;padding:0.4rem 2rem 0.4rem 0.6rem" onchange="updateOrderStatus(${o.id}, this.value)">
        ${statuses.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${cap(s)}</option>`).join('')}
      </select></td>
      <td>${o.createdAt.toLocaleString()}</td>
    </tr>`).join('') : `<tr><td colspan="9" class="text-center text-muted" style="padding:2rem">No orders found for this filter.</td></tr>`;

  content.innerHTML = `
    <div class="glass-card-static mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
      <h3 style="margin:0;font-family:var(--font-heading)">📋 Order Management</h3>
      <div class="d-flex gap-2 flex-wrap">${filterBtns.join('')}</div>
    </div>
    <div class="glass-card-static"><div class="table-responsive"><table class="data-table">
      <thead><tr><th>Order ID</th><th>Student</th><th>Contact</th><th>Total</th><th>Payment</th><th>Type</th><th>Status</th><th>Update</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></div>`;
}

function updateOrderStatus(orderId, status) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  o.status = status;
  const badge = $('statusBadge-' + orderId);
  if (badge) { badge.className = 'badge ' + statusBadgeClass(status); badge.textContent = cap(status); }
  showToast(`Order #${orderId} marked as ${status}.`, 'success');
}

/* ---- Admin: User Management ---- */
function renderAdminUsers() {
  const content = $('adminTabContent');
  if (!content) return;

  const rows = users.map(u => {
    const uOrders = orders.filter(o => o.userId === u.id);
    const spent = uOrders.reduce((s, o) => s + o.total, 0);
    return `
    <tr>
      <td>${esc(u.name)}<br><span class="small text-muted">${esc(u.roll || '')}</span></td>
      <td>${esc(u.email)}</td>
      <td>${esc(u.dept || '')}</td>
      <td>${esc(u.phone || '')}</td>
      <td>${uOrders.length}</td>
      <td>${rupees(spent)}</td>
      <td><span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${cap(u.status)}</span></td>
      <td style="text-align:right">${u.status === 'active'
        ? `<button class="btn btn-danger btn-sm" onclick="toggleUserStatus(${u.id},'blocked')">Block</button>`
        : `<button class="btn btn-success btn-sm" onclick="toggleUserStatus(${u.id},'active')">Unblock</button>`}
      </td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div class="glass-card-static mb-4"><h3 style="margin:0;font-family:var(--font-heading)">👥 User Management</h3></div>
    <div class="glass-card-static"><div class="table-responsive"><table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div></div>`;
}

function toggleUserStatus(userId, status) {
  const u = users.find(x => x.id === userId);
  if (!u) return;
  u.status = status;
  renderAdminUsers();
  showToast('User status updated.', 'success');
}

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
  ThemeManager.init();
  createParticles();
  renderHome();
  updateCartBadge();
});
