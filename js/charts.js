/* ============================================================
   CHART FACTORY — thin wrappers around Chart.js so every module
   builds charts consistently and can be themed in one place.
   ============================================================ */

const Charts = {
  instances: {},
  palette: CONFIG.defaults.chartPalette,

  destroy(id) {
    if (this.instances[id]) { this.instances[id].destroy(); delete this.instances[id]; }
  },

  baseOptions(overrides = {}) {
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue("--grid").trim() || "rgba(148,163,184,.15)";
    const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() || "#94a3b8";
    const base = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, boxWidth: 10, font: { size: 11 } } },
        tooltip: { backgroundColor: "#1b1f3b", titleColor: "#fff", bodyColor: "#e2e8f0", padding: 10, cornerRadius: 8 },
      },
      scales: {
        x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 10 } } },
        y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 10 } } },
      },
    };
    return this._deepMerge(base, overrides);
  },

  _deepMerge(base, overrides) {
    const out = { ...base };
    Object.keys(overrides || {}).forEach((key) => {
      const val = overrides[key];
      if (val && typeof val === "object" && !Array.isArray(val) && base[key] && typeof base[key] === "object") {
        out[key] = this._deepMerge(base[key], val);
      } else {
        out[key] = val;
      }
    });
    return out;
  },

  line(id, labels, datasets, opts = {}) {
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    this.instances[id] = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          tension: 0.4, fill: true, borderWidth: 2, pointRadius: 0,
          borderColor: this.palette[i % this.palette.length],
          backgroundColor: this.palette[i % this.palette.length] + "22",
          ...ds,
        })),
      },
      options: this.baseOptions(opts),
    });
    return this.instances[id];
  },

  bar(id, labels, datasets, opts = {}) {
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    this.instances[id] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          borderRadius: 6, maxBarThickness: 28,
          backgroundColor: this.palette[i % this.palette.length],
          ...ds,
        })),
      },
      options: this.baseOptions(opts),
    });
    return this.instances[id];
  },

  donut(id, labels, data, opts = {}) {
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    this.instances[id] = new Chart(ctx, {
      type: "doughnut",
      data: { labels, datasets: [{ data, backgroundColor: this.palette, borderWidth: 0, hoverOffset: 6 }] },
      options: this.baseOptions({ cutout: "68%", scales: undefined, ...opts }),
    });
    return this.instances[id];
  },

  pie(id, labels, data, opts = {}) {
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    this.instances[id] = new Chart(ctx, {
      type: "pie",
      data: { labels, datasets: [{ data, backgroundColor: this.palette, borderWidth: 0 }] },
      options: this.baseOptions({ scales: undefined, ...opts }),
    });
    return this.instances[id];
  },

  sparkline(id, data, color) {
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    this.instances[id] = new Chart(ctx, {
      type: "line",
      data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: color + "22" }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
    return this.instances[id];
  },

  funnel(id, labels, data, opts = {}) {
    // Rendered as a horizontal bar chart, widest-first, to simulate a funnel.
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    this.instances[id] = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: this.palette, borderRadius: 6 }] },
      options: this.baseOptions({ indexAxis: "y", plugins: { legend: { display: false } }, ...opts }),
    });
    return this.instances[id];
  },

  bubble(id, points, opts = {}) {
    // points: [{ label, x, y, r, color }]
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    this.instances[id] = new Chart(ctx, {
      type: "bubble",
      data: {
        datasets: points.map((p) => ({
          label: p.label,
          data: [{ x: p.x, y: p.y, r: p.r }],
          backgroundColor: p.color + "aa",
          borderColor: p.color,
          borderWidth: 1.5,
        })),
      },
      options: this.baseOptions({
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ROAS ${ctx.raw.y.toFixed(2)}x, CPL ₹${Math.round(ctx.raw.x)}`,
            },
          },
        },
        ...opts,
      }),
    });
    return this.instances[id];
  },

  // Horizontal % achievement bar with a dashed goal-threshold reference line.
  // Bars are colored per threshold: green >= goalPct, orange >= 50%, red below.
  goalBar(id, labels, percents, goalPct = 80, opts = {}) {
    this.destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const colorFor = (p) => p >= goalPct ? "#3FD98E" : p >= 50 ? "#FFC24B" : "#FF5C7A";
    const goalLinePlugin = {
      id: "goalLine",
      afterDraw(chart) {
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        if (!xScale || !yScale) return;
        const x = xScale.getPixelForValue(goalPct);
        const ctx2d = chart.ctx;
        ctx2d.save();
        ctx2d.beginPath();
        ctx2d.setLineDash([5, 4]);
        ctx2d.moveTo(x, yScale.top);
        ctx2d.lineTo(x, yScale.bottom);
        ctx2d.strokeStyle = "#94A3B8";
        ctx2d.lineWidth = 1.5;
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        ctx2d.fillStyle = "#94A3B8";
        ctx2d.font = "11px Inter, sans-serif";
        ctx2d.fillText(`Goal ${goalPct}%`, x + 6, yScale.top + 12);
        ctx2d.restore();
      },
    };
    this.instances[id] = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{ data: percents, backgroundColor: percents.map(colorFor), borderRadius: 6, maxBarThickness: 22 }],
      },
      options: this.baseOptions({
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toFixed(0)}% of target` } },
        },
        scales: { x: { min: 0, suggestedMax: 120, ticks: { callback: (v) => v + "%" } } },
        ...opts,
      }),
      plugins: [goalLinePlugin],
    });
    return this.instances[id];
  },
};
