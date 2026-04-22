// ============================================
// DataMind — Utility Functions
// ============================================

export const Utils = {
  // Number formatting
  formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Number.isInteger(num) ? num.toString() : num.toFixed(decimals);
  },

  formatPercent(num) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return (num * 100).toFixed(1) + '%';
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  // Date utilities
  isDateString(str) {
    if (typeof str !== 'string') return false;
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
      /^\d{4}\/\d{2}\/\d{2}$/,
    ];
    return datePatterns.some(p => p.test(str.trim()));
  },

  parseDate(str) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  },

  // DOM helpers
  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  },

  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') el.className = v;
      else if (k === 'innerHTML') el.innerHTML = v;
      else if (k === 'textContent') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else if (c) el.appendChild(c);
    });
    return el;
  },

  // Animation helpers
  animateIn(el, animation = 'fadeInUp', duration = 400) {
    el.style.animation = `${animation} ${duration}ms ease forwards`;
  },

  staggerChildren(parent, selector, delay = 60) {
    const children = parent.querySelectorAll(selector);
    children.forEach((child, i) => {
      child.style.animationDelay = `${i * delay}ms`;
    });
  },

  // Debounce & Throttle
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  throttle(fn, ms = 100) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(...args); }
    };
  },

  // Data type detection
  detectType(values) {
    const sample = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 100);
    if (sample.length === 0) return 'empty';

    let numCount = 0, dateCount = 0, boolCount = 0;
    for (const v of sample) {
      const s = String(v).trim().toLowerCase();
      if (s === 'true' || s === 'false') boolCount++;
      else if (!isNaN(Number(s)) && s !== '') numCount++;
      else if (this.isDateString(s)) dateCount++;
    }

    const ratio = 0.8;
    if (numCount / sample.length >= ratio) return 'numeric';
    if (dateCount / sample.length >= ratio) return 'date';
    if (boolCount / sample.length >= ratio) return 'boolean';

    const unique = new Set(sample.map(v => String(v).trim().toLowerCase()));
    if (unique.size <= Math.min(20, sample.length * 0.3)) return 'categorical';

    return 'text';
  },

  // Generate unique ID
  uid() {
    return '_' + Math.random().toString(36).slice(2, 9);
  },

  // Deep clone
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Sleep
  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  // Color palette for charts
  chartColors: [
    '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b',
    '#6366f1', '#14b8a6', '#f43f5e', '#84cc16', '#f97316',
    '#a78bfa', '#22d3ee', '#fb7185', '#34d399', '#fbbf24'
  ]
};
