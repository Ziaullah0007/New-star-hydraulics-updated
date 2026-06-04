// ============================================================
// NEW STAR HYDRAULICS – main.js
// Features: CSV product loader | Branch tabs | Navbar scroll
//           Counter animation | Scroll reveal | Form handler
// ============================================================

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 400);
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
const btnNav    = document.querySelector('.btn-nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
  if (btnNav) btnNav.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    if (btnNav) btnNav.classList.remove('open');
  });
});

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => sectionObserver.observe(s));

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.stat-num');
let counted = false;

function countUp() {
  counters.forEach(counter => {
    const target = +counter.dataset.target;
    const step   = Math.max(1, Math.ceil(target / 60));
    let current  = 0;
    const timer  = setInterval(() => {
      current += step;
      if (current >= target) { counter.textContent = target; clearInterval(timer); }
      else counter.textContent = current;
    }, 28);
  });
}

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
  const statsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !counted) { counted = true; countUp(); }
  }, { threshold: 0.3 });
  statsObserver.observe(statsSection);
}

// ===== BACK TO TOP =====
document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll('.why-card, .about-grid, .stat-item, .contact-card, .branch-card');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObs.observe(el);
});

// ===== CONTACT BRANCH TABS =====
const ctabs  = document.querySelectorAll('.ctab');
const panels = document.querySelectorAll('.contact-panel');

ctabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const branch = tab.dataset.branch;
    ctabs.forEach(t  => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${branch}`).classList.add('active');
  });
});

// ===== CONTACT FORMS =====
function setupForm(formId) {
  const form = document.getElementById(formId);

  if (!form) return;

  form.addEventListener('submit', () => {
    const btn = form.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.innerHTML =
      '<i class="fa fa-spinner fa-spin"></i> Sending...';
  });
}

setupForm('contactFormHyd');
setupForm('contactFormVja');

// ============================================================
// ===== CSV PRODUCT LOADER =====
// ============================================================

let allProducts = [];
let activeFilter = 'All';

/**
 * Parse a CSV string into an array of row objects.
 * Handles simple CSV (no quoted commas).
 */
function parseCSV(text) {
  const lines  = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj  = {};
    headers.forEach((h, i) => obj[h] = vals[i] || '');
    return obj;
  });
}

/**
 * Build a product card HTML string from a CSV row.
 */
function buildCard(product) {
    const color = product.color || '#1a56db';
    const icon = product.icon || 'fa-box';
    const cat = product.category || '';

    return `
    <div class="product-card" data-category="${cat}">
      
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <span class="product-cat-badge">${cat}</span>

      <h3>${product.name}</h3>

      <p>${product.description}</p>

      <a href="#contact" class="product-link">
        Enquire <i class="fa fa-arrow-right"></i>
      </a>
    </div>
  `;
}

/**
 * Render products to the grid, applying the active category filter.
 */
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const filtered = activeFilter === 'All'
    ? products
    : products.filter(p => p.category === activeFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="csv-loading">No products found in this category.</div>`;
    return;
  }
  grid.innerHTML = filtered.map(buildCard).join('');

  // Re-run scroll reveal on new cards
  grid.querySelectorAll('.product-card').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.4s ease ${i * 40}ms, transform 0.4s ease ${i * 40}ms`;
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
  });
}

/**
 * Load products from a CSV URL/path.
 */
async function loadProductsFromCSV(url) {
  const grid = document.getElementById('productsGrid');
  if (grid) grid.innerHTML = `<div class="csv-loading"><i class="fa fa-spinner fa-spin"></i> Loading products...</div>`;
  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    allProducts = parseCSV(text);
    renderProducts(allProducts);
  } catch (err) {
    console.warn('CSV load failed, using built-in products.', err.message);
    loadFallbackProducts();
  }
}

/**
 * Fallback: render hard-coded products if CSV fetch fails (e.g. file:// protocol).
 */
function loadFallbackProducts() {
  allProducts = [
    { name:'Hydraulic Hoses',      category:'Hydraulic',   description:'High-pressure hydraulic hoses for heavy machinery, construction equipment, and industrial systems.', icon:'fa-water',          color:'#1a56db' },
    { name:'Hydraulic Fittings',   category:'Hydraulic',   description:'BSP, NPT, JIC, and metric fittings — couplings, adapters, and connectors for all hydraulic circuits.', icon:'fa-plug',           color:'#7e3af2' },
    { name:'Hydraulic Cylinders',  category:'Hydraulic',   description:'Single and double acting hydraulic cylinders for industrial presses, lifts, and mobile equipment.', icon:'fa-arrows-alt-v',   color:'#5521b5' },
    { name:'Pneumatic Hoses',      category:'Pneumatic',   description:'Flexible air and pneumatic hoses suitable for compressors, automation, and light industrial use.', icon:'fa-wind',           color:'#057a55' },
    { name:'Pneumatic Fittings',   category:'Pneumatic',   description:'Push-in fittings and connectors for pneumatic tubing and compressed air systems.', icon:'fa-compress-arrows-alt', color:'#03543f' },
    { name:'Industrial Hoses',     category:'Industrial',  description:'Suction & discharge, steam, chemical, and food-grade hoses for diverse industries.', icon:'fa-fire',           color:'#c81e1e' },
    { name:'LPG & Oil Hoses',      category:'Industrial',  description:'Petroleum and LPG transfer hoses for fuel stations, dispensing units and tank trucks.', icon:'fa-gas-pump',       color:'#78350f' },
    { name:'Hose Assemblies',      category:'Assemblies',  description:'Custom-crimped hose assemblies built to your exact specifications with quick turnaround.', icon:'fa-tools',          color:'#ff5a1f' },
    { name:'Hydraulic Valves',     category:'Accessories', description:'Directional, pressure relief, and flow control valves for hydraulic systems.', icon:'fa-sliders-h',      color:'#0694a2' },
    { name:'Seals & O-Rings',      category:'Accessories', description:'NBR, EPDM, Viton and PTFE seals and O-rings for hydraulic and pneumatic systems.', icon:'fa-ring',           color:'#0e7490' },
    { name:'Pressure Gauges',      category:'Accessories', description:'Glycerine-filled and dry pressure gauges for monitoring hydraulic and pneumatic system pressure.', icon:'fa-tachometer-alt', color:'#1e3a5f' },
    { name:'Hydraulic Filters',    category:'Accessories', description:'High and low pressure hydraulic filters and filter elements for contamination control.', icon:'fa-filter',         color:'#164e63' },
  ];
  renderProducts(allProducts);
}

// ===== CATEGORY FILTER BUTTONS =====
document.getElementById('productFilters')?.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderProducts(allProducts);
  });
});

// ===== CUSTOM CSV FILE UPLOAD =====
document.getElementById('csvFileInput')?.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    allProducts = parseCSV(e.target.result);
    renderProducts(allProducts);
    // Show confirmation
    const notice = document.querySelector('.csv-notice');
    if (notice) {
      const orig = notice.querySelector('code');
      if (orig) orig.textContent = file.name;
    }
  };
  reader.readAsText(file);
});

// ===== INITIAL LOAD =====
// Tries products.csv first; falls back to built-in list
if (window.NSH_PRODUCTS && window.NSH_PRODUCTS.length > 0) {
    allProducts = window.NSH_PRODUCTS;
    renderProducts(allProducts);
} else {
    loadFallbackProducts();
}
