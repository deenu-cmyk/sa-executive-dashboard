/* ============================================================
   UTILITIES
   ============================================================ */

const Utils = {
  fmtNumber(n) {
    if (n === undefined || n === null || isNaN(n)) return "0";
    return new Intl.NumberFormat("en-IN").format(Math.round(n));
  },

  fmtCurrency(n, currency = "INR", abbreviate = true) {
    if (n === undefined || n === null || isNaN(n)) n = 0;
    const symbols = { INR: "₹", USD: "$", AED: "AED ", GBP: "£" };
    const symbol = symbols[currency] || "$";
    if (!abbreviate) {
      return `${symbol}${Utils.fmtNumber(n)}`;
    }
    if (currency === "INR") {
      if (Math.abs(n) >= 10000000) return `${symbol}${(n / 10000000).toFixed(2)}Cr`;
      if (Math.abs(n) >= 100000) return `${symbol}${(n / 100000).toFixed(2)}L`;
      if (Math.abs(n) >= 1000) return `${symbol}${(n / 1000).toFixed(1)}K`;
      return `${symbol}${Utils.fmtNumber(n)}`;
    }
    if (Math.abs(n) >= 1000000000) return `${symbol}${(n / 1000000000).toFixed(2)}B`;
    if (Math.abs(n) >= 1000000) return `${symbol}${(n / 1000000).toFixed(2)}M`;
    if (Math.abs(n) >= 1000) return `${symbol}${(n / 1000).toFixed(1)}K`;
    return `${symbol}${Utils.fmtNumber(n)}`;
  },

  fmtPercent(n, digits = 1) {
    if (n === undefined || n === null || isNaN(n)) return "0%";
    return `${n.toFixed(digits)}%`;
  },

  el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  },

  qs(sel, root = document) { return root.querySelector(sel); },
  qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },

  animateCounter(node, target, opts = {}) {
    const { duration = 900, format = (v) => Utils.fmtNumber(v), decimals = 0 } = opts;
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + (target - start) * eased;
      node.textContent = format(decimals ? Number(value.toFixed(decimals)) : value);
      if (progress < 1) requestAnimationFrame(tick);
      else node.textContent = format(target);
    }
    requestAnimationFrame(tick);
  },

  toNumber(v) {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return isNaN(v) ? 0 : v;
    const cleaned = String(v).replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  },

  sum(rows, key) { return rows.reduce((a, r) => a + Utils.toNumber(r[key]), 0); },
  count(rows) { return rows.length; },

  groupBy(rows, key) {
    const map = {};
    rows.forEach((r) => {
      const k = r[key] ?? "Unknown";
      (map[k] = map[k] || []).push(r);
    });
    return map;
  },

  topKey(rows, key, valueKey) {
    const groups = Utils.groupBy(rows, key);
    let best = null, bestVal = -Infinity;
    Object.entries(groups).forEach(([k, rs]) => {
      const val = valueKey ? Utils.sum(rs, valueKey) : rs.length;
      if (val > bestVal) { bestVal = val; best = k; }
    });
    return best || "—";
  },

  dateRangeFilter(rows, days) {
    if (!days) return rows;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return rows.filter((r) => r.Date && new Date(r.Date) >= cutoff);
  },

  isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  },

  isThisWeek(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const t = new Date();
    const weekAgo = new Date(); weekAgo.setDate(t.getDate() - 7);
    return d >= weekAgo && d <= t;
  },

  isThisMonth(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const t = new Date();
    return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  },

  isThisYear(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr).getFullYear() === new Date().getFullYear();
  },

  pctChange(curr, prev) {
    if (!prev) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  },

  debounce(fn, wait = 250) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  },

  toast(msg, type = "info") {
    const wrap = Utils.qs("#toastWrap");
    if (!wrap) return;
    const node = Utils.el(`<div class="toast toast-${type}"><i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i><span>${msg}</span></div>`);
    wrap.appendChild(node);
    requestAnimationFrame(() => node.classList.add("show"));
    setTimeout(() => { node.classList.remove("show"); setTimeout(() => node.remove(), 300); }, 3200);
  },
};
