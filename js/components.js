/* ============================================================
   SHARED COMPONENTS — KPI rows & data tables reused by modules
   ============================================================ */

const Components = {
  kpiRow(cards) {
    return `<div class="kpi-grid compact">${cards.map((c) => {
      const trendClass = c.trend === undefined ? "" : c.trend > 0 ? "up" : c.trend < 0 ? "down" : "flat";
      return `
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon"><i class="fa-solid ${c.icon}"></i></div>
          ${c.trend !== undefined ? `<span class="kpi-trend ${trendClass}"><i class="fa-solid fa-arrow-${c.trend >= 0 ? "up" : "down"}"></i> ${Math.abs(c.trend).toFixed(1)}%</span>` : ""}
        </div>
        <div class="kpi-value">${c.value}</div>
        <div class="kpi-label">${c.label}</div>
        ${c.trend !== undefined ? `<div class="kpi-sub">vs prev month</div>` : ""}
      </div>`;
    }).join("")}</div>`;
  },

  dataTable(rows, columns, opts = {}) {
    const id = opts.id || "dt-" + Math.random().toString(36).slice(2, 8);
    if (!rows.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No records match the current filters.</p></div>`;
    const head = columns.map((c) => `<th>${c.label}</th>`).join("");
    const body = rows.slice(0, opts.limit || 50).map((r) => `<tr>${columns.map((c) => `<td>${c.fmt ? c.fmt(r[c.key], r) : (r[c.key] ?? "—")}</td>`).join("")}</tr>`).join("");
    return `
      <div class="table-wrap">
        <table class="data-table" id="${id}">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
        ${rows.length > (opts.limit || 50) ? `<div class="table-footnote">Showing ${opts.limit || 50} of ${rows.length} records</div>` : ""}
      </div>`;
  },

  sectionHead(title, icon) {
    return `<h3><i class="fa-solid ${icon}"></i> ${title}</h3>`;
  },

  statusBadge(status) {
    const map = { Completed: "success", Approved: "success", Live: "success", Pending: "warn", Refunded: "info", Failed: "error", Rejected: "error", "Closed Won": "success", "Closed Lost": "error" };
    return `<span class="badge badge-${map[status] || "neutral"}">${status}</span>`;
  },
};
