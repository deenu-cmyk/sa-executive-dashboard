/* ============================================================
   MODULE 5 — PREMIUM & ELITE PLAN
   ============================================================ */

const ModPremium = {
  showRecords: false, // Records table collapsed by default, same pattern as Refund tab
  search: "", // matches against Country, Course, Source, Plan

  // Comparison 1 = primary period shown across KPIs/charts/table.
  // Comparison 2 = optional period to compare against (adds trend arrows).
  // Defaults to "This Month" so the dashboard opens on current data
  // instead of the entire dataset.
  compare1: { preset: "this_month", start: "", end: "" },
  compare2: { preset: "none", start: "", end: "" },

  _PRESETS: [
    { id: "yesterday", label: "Yesterday" },
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "last_week", label: "Last Week" },
    { id: "this_week", label: "This Week" },
    { id: "next_week", label: "Next Week" },
    { id: "last_7_days", label: "Last 7 Days" },
    { id: "next_7_days", label: "Next 7 Days" },
    { id: "last_month", label: "Last Month" },
    { id: "last_30_days", label: "Last 30 Days" },
    { id: "this_month", label: "This Month" },
    { id: "next_month", label: "Next Month" },
    { id: "last_year", label: "Last Year" },
    { id: "this_year", label: "This Year" },
  ],

  render() {
    const all = DataStore.get("premiumCSV");

    const range1 = this._resolveRange(this.compare1.preset, this.compare1.start, this.compare1.end);
    const range2 = this.compare2.preset === "none" ? null : this._resolveRange(this.compare2.preset, this.compare2.start, this.compare2.end);

    const rows = (range1 ? all.filter((r) => this._inRange(r.Date, range1)) : all)
      .filter((r) => this._matchesSearch(r, ["Country", "Course", "Source", "Plan"], this.search));
    const compareRows = range2 ? all.filter((r) => this._inRange(r.Date, range2)) : null;

    const stats = this._aggregateStats(rows);
    const compareStats = compareRows ? this._aggregateStats(compareRows) : null;
    const withTrend = (key) => compareStats ? Utils.pctChange(stats[key], compareStats[key]) : undefined;

    const label1 = this._presetLabel(this.compare1.preset, range1);
    const label2 = range2 ? this._presetLabel(this.compare2.preset, range2) : null;
    const comparisonCaption = label2
      ? `Comparing <b>${label1}</b> vs <b>${label2}</b>`
      : `Showing <b>${label1}</b> with no comparison selected`;

    const sourceStats = this._sourceStats(rows);
    const monthly = this._monthlySeries(all); // trend chart always spans full history regardless of the active filter
    const insights = this._buildInsights(stats, compareStats, sourceStats);

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="filter-bar">
        <div class="filter-group">
          <label>Comparison 1</label>
          <select id="fPlanCompare1">${this._presetOptions(this.compare1.preset, true)}</select>
        </div>
        ${this.compare1.preset === "custom" ? `
        <div class="filter-group">
          <label>Custom Range 1</label>
          <div class="date-range-inputs" style="display:flex;align-items:center;gap:6px;">
            <input type="date" id="fPlanCompare1Start" value="${this.compare1.start || ""}" />
            <span style="opacity:.6;">to</span>
            <input type="date" id="fPlanCompare1End" value="${this.compare1.end || ""}" />
          </div>
        </div>` : ""}
        <div class="filter-group">
          <label>Comparison 2</label>
          <select id="fPlanCompare2">${this._presetOptions(this.compare2.preset, false)}</select>
        </div>
        ${this.compare2.preset === "custom" ? `
        <div class="filter-group">
          <label>Custom Range 2</label>
          <div class="date-range-inputs" style="display:flex;align-items:center;gap:6px;">
            <input type="date" id="fPlanCompare2Start" value="${this.compare2.start || ""}" />
            <span style="opacity:.6;">to</span>
            <input type="date" id="fPlanCompare2End" value="${this.compare2.end || ""}" />
          </div>
        </div>` : ""}
        <div class="filter-group">
          <label>Search</label>
          <input type="text" id="fPlanSearch" placeholder="Country, Course, Source, Plan..." value="${this.search}" style="min-width:220px;" />
        </div>
        <button class="btn-reset" id="fPlanReset"><i class="fa-solid fa-arrow-rotate-left"></i> Reset</button>
      </div>

      ${Components.kpiRow([
        { label: "Total Leads", value: Utils.fmtNumber(stats.totalLeads), icon: "fa-users", trend: withTrend("totalLeads") },
        { label: "Premium Payments", value: Utils.fmtNumber(stats.premiumPayments), icon: "fa-receipt", trend: withTrend("premiumPayments") },
        { label: "Elite Payments", value: Utils.fmtNumber(stats.elitePayments), icon: "fa-receipt", trend: withTrend("elitePayments") },
        { label: "Premium Amount", value: Utils.fmtCurrency(stats.premiumAmount, "USD"), icon: "fa-sack-dollar", trend: withTrend("premiumAmount") },
        { label: "Elite Amount", value: Utils.fmtCurrency(stats.eliteAmount, "USD"), icon: "fa-sack-dollar", trend: withTrend("eliteAmount") },
        { label: "Total Combined Revenue", value: Utils.fmtCurrency(stats.totalRevenue, "USD"), icon: "fa-coins", trend: withTrend("totalRevenue") },
        { label: "Pro Amount", value: Utils.fmtCurrency(stats.proAmount, "USD"), icon: "fa-hand-holding-dollar", trend: withTrend("proAmount") },
        { label: "Avg Payment Value", value: Utils.fmtCurrency(stats.avgPaymentValue, "USD"), icon: "fa-calculator", trend: withTrend("avgPaymentValue") },
      ])}

      <p class="chart-sub" style="margin: -8px 0 12px;">${comparisonCaption}</p>

      ${this._insightsPanel(insights)}

      <div class="chart-grid">
        <div class="chart-card span-4"><h3>Premium vs Elite</h3><div class="chart-box"><canvas id="chPlanSplit"></canvas></div></div>
        <div class="chart-card span-4"><h3>Country Comparison</h3><div class="chart-box"><canvas id="chPlanCountry"></canvas></div></div>
        <div class="chart-card span-4"><h3>Course Comparison</h3><div class="chart-box"><canvas id="chPlanCourse"></canvas></div></div>
        <div class="chart-card span-12"><h3>Premium vs Elite Revenue — Monthly Trend</h3><div class="chart-box"><canvas id="chPlanTrend"></canvas></div></div>
        <div class="chart-card span-12"><h3>Payments by Lead Source</h3><div class="chart-box"><canvas id="chPlanSource"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead("Lead Source Breakdown", "fa-list-ul")}
        ${this._sourceTable(sourceStats)}
      </div>

      <div class="panel">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          ${Components.sectionHead(`Premium & Elite Records (${Utils.fmtNumber(rows.length)})`, "fa-table-list")}
          <button class="btn-reset" id="togglePlanRecords"><i class="fa-solid fa-${this.showRecords ? "eye-slash" : "eye"}"></i> ${this.showRecords ? "Hide" : "Show"} Records</button>
        </div>
        ${this.showRecords ? Components.dataTable(rows, [
          { key: "Date", label: "Date" }, { key: "Plan", label: "Plan" },
          { key: "Country", label: "Country" }, { key: "Course", label: "Course" },
          { key: "Source", label: "Lead Source" },
          { key: "Payment", label: "Payments" },
          { key: "Revenue", label: "Amount Paid", fmt: (v) => Utils.fmtCurrency(v, "USD") },
        ], { limit: 200 }) : `<p class="chart-sub" style="margin-top:8px;">Hidden by default. Click "Show Records" above to see the raw rows.</p>`}
      </div>
    `;

    this._renderCharts(rows, sourceStats, monthly, stats);
    this._bindFilterBar();
  },

  _bindFilterBar() {
    Utils.qs("#fPlanCompare1").addEventListener("change", (e) => { this.compare1.preset = e.target.value; this.render(); });
    Utils.qs("#fPlanCompare2").addEventListener("change", (e) => { this.compare2.preset = e.target.value; this.render(); });

    const c1s = Utils.qs("#fPlanCompare1Start"), c1e = Utils.qs("#fPlanCompare1End");
    if (c1s) c1s.addEventListener("change", (e) => { this.compare1.start = e.target.value; this.render(); });
    if (c1e) c1e.addEventListener("change", (e) => { this.compare1.end = e.target.value; this.render(); });

    const c2s = Utils.qs("#fPlanCompare2Start"), c2e = Utils.qs("#fPlanCompare2End");
    if (c2s) c2s.addEventListener("change", (e) => { this.compare2.start = e.target.value; this.render(); });
    if (c2e) c2e.addEventListener("change", (e) => { this.compare2.end = e.target.value; this.render(); });

    const planSearchInput = Utils.qs("#fPlanSearch");
    const commitPlanSearch = (e) => { this.search = e.target.value; this.render(); };
    planSearchInput.addEventListener("change", commitPlanSearch);
    planSearchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") commitPlanSearch(e); });

    Utils.qs("#fPlanReset").addEventListener("click", () => {
      this.compare1 = { preset: "this_month", start: "", end: "" };
      this.compare2 = { preset: "none", start: "", end: "" };
      this.search = "";
      this.render();
    });

    Utils.qs("#togglePlanRecords").addEventListener("click", () => { this.showRecords = !this.showRecords; this.render(); });
  },

  // ---- Comparison 1 / Comparison 2 preset resolution (same pattern as Refund tab) ------------------------------------------------

  _presetOptions(selected, isPrimary) {
    const list = isPrimary
      ? [{ id: "all", label: "All Time" }, { id: "custom", label: "Custom" }, ...this._PRESETS]
      : [{ id: "none", label: "No Comparison" }, { id: "custom", label: "Custom" }, ...this._PRESETS];
    return list.map((p) => `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${p.label}</option>`).join("");
  },

  _resolveRange(key, start, end) {
    if (key === "all" || key === "none") return null;
    if (key === "custom") return (start && end) ? { start: this._dateOnly(start), end: this._dateOnly(end) } : null;

    const today = this._dateOnly(new Date());
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const startOfWeek = (d) => addDays(d, -d.getDay());
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

    switch (key) {
      case "yesterday": { const y = addDays(today, -1); return { start: y, end: y }; }
      case "today": return { start: today, end: today };
      case "tomorrow": { const t = addDays(today, 1); return { start: t, end: t }; }
      case "last_week": { const ws = startOfWeek(today); return { start: addDays(ws, -7), end: addDays(ws, -1) }; }
      case "this_week": { const ws = startOfWeek(today); return { start: ws, end: addDays(ws, 6) }; }
      case "next_week": { const ws = startOfWeek(today); return { start: addDays(ws, 7), end: addDays(ws, 13) }; }
      case "last_7_days": return { start: addDays(today, -6), end: today };
      case "next_7_days": return { start: today, end: addDays(today, 6) };
      case "last_month": { const lmEnd = addDays(startOfMonth(today), -1); return { start: startOfMonth(lmEnd), end: lmEnd }; }
      case "last_30_days": return { start: addDays(today, -29), end: today };
      case "this_month": return { start: startOfMonth(today), end: endOfMonth(today) };
      case "next_month": { const nm = new Date(today.getFullYear(), today.getMonth() + 1, 1); return { start: nm, end: endOfMonth(nm) }; }
      case "last_year": { const y = today.getFullYear() - 1; return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) }; }
      case "this_year": return { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 11, 31) };
      default: return null;
    }
  },

  _presetLabel(key, range) {
    const labels = { all: "All Time", none: "No Comparison", custom: "Custom" };
    this._PRESETS.forEach((p) => { labels[p.id] = p.label; });
    if (key === "custom" && range) {
      const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${fmt(range.start)} – ${fmt(range.end)}`;
    }
    return labels[key] || key;
  },

  _dateOnly(val) {
    const d = new Date(val);
    if (isNaN(d)) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  },

  _inRange(dateVal, range) {
    if (!range) return true;
    const d = this._dateOnly(dateVal);
    return d && d >= range.start && d <= range.end;
  },

  // Case-insensitive substring match against any of the given fields.
  // Empty query always matches (search box empty = no filtering).
  _matchesSearch(row, fields, query) {
    if (!query || !query.trim()) return true;
    const q = query.trim().toLowerCase();
    return fields.some((f) => String(row[f] || "").toLowerCase().includes(q));
  },

  // ---- stats ------------------------------------------------

  _parseCurrency(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
  },

  _aggregateStats(rows) {
    const premium = rows.filter((r) => r.Plan === "Premium");
    const elite = rows.filter((r) => r.Plan === "Elite");

    const premiumPayments = Utils.sum(premium, "Payment");
    const elitePayments = Utils.sum(elite, "Payment");
    const premiumAmount = Utils.sum(premium, "Revenue");
    const eliteAmount = Utils.sum(elite, "Revenue");
    const totalRevenue = premiumAmount + eliteAmount;
    const totalPayments = premiumPayments + elitePayments;
    // "Pro Amount" is a real column in the source sheet (bracket notation
    // since the key has a space, same pattern as Refund's "Main Refund
    // Reason"). It's consistently ~20% of the paid amount per row.
    const proAmount = Utils.sum(rows, "Pro Amount");

    return {
      premium, elite,
      totalLeads: premium.length + elite.length,
      premiumLeads: premium.length,
      eliteLeads: elite.length,
      premiumPayments, elitePayments,
      premiumAmount, eliteAmount,
      totalRevenue,
      proAmount,
      avgPaymentValue: totalPayments ? totalRevenue / totalPayments : 0,
      premiumConversion: premium.length ? (premiumPayments / premium.length) * 100 : 0,
      eliteConversion: elite.length ? (elitePayments / elite.length) * 100 : 0,
    };
  },

  _sourceStats(rows) {
    const groups = Utils.groupBy(rows, "Source");
    return Object.entries(groups).map(([name, rs]) => ({
      name,
      leads: rs.length,
      premiumLeads: rs.filter((r) => r.Plan === "Premium").length,
      eliteLeads: rs.filter((r) => r.Plan === "Elite").length,
      payments: Utils.sum(rs, "Payment"),
      revenue: Utils.sum(rs, "Revenue"),
    })).sort((a, b) => b.revenue - a.revenue);
  },

  _sourceTable(sources) {
    if (!sources.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No records match the current filters.</p></div>`;
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Source</th><th>Total Leads</th><th>Premium</th><th>Elite</th><th>Payments</th><th>Revenue</th></tr></thead>
          <tbody>
            ${sources.map((s) => `
              <tr>
                <td>${s.name}</td>
                <td>${Utils.fmtNumber(s.leads)}</td>
                <td>${Utils.fmtNumber(s.premiumLeads)}</td>
                <td>${Utils.fmtNumber(s.eliteLeads)}</td>
                <td>${Utils.fmtNumber(s.payments)}</td>
                <td>${Utils.fmtCurrency(s.revenue, "USD")}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  },

  // Monthly trend always uses the full dataset (not the Comparison 1
  // filter) since a trend line only makes sense across real history —
  // narrowing it to "Today" or "This Week" would leave nothing to plot.
  _monthlySeries(all) {
    const map = {};
    all.forEach((r) => {
      const key = String(r.Date || "").slice(0, 7);
      if (!key) return;
      if (!map[key]) map[key] = { premium: 0, elite: 0 };
      const amt = this._parseCurrency(r.Revenue);
      if (r.Plan === "Premium") map[key].premium += amt;
      else if (r.Plan === "Elite") map[key].elite += amt;
    });
    return Object.keys(map).sort().map((m) => ({
      month: m,
      label: this._monthLabel(m),
      premium: map[m].premium,
      elite: map[m].elite,
    }));
  },

  _monthLabel(m) {
    const d = new Date(`${m}-01`);
    return isNaN(d) ? m : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  },

  // ---- Dynamic Insights Panel (rule-based, no external AI call) ------------------------------------------------
  // Generates 3-5 plain-English observations from the stats already
  // computed for the current filter, so it stays free and instant.
  // Anomaly threshold: flag a KPI trend if it moved 15%+ vs Comparison 2.

  _buildInsights(stats, compareStats, sourceStats) {
    const insights = [];

    if (compareStats) {
      const change = Utils.pctChange(stats.totalRevenue, compareStats.totalRevenue);
      if (typeof change === "number" && !isNaN(change) && isFinite(change)) {
        const dir = change >= 0 ? "up" : "down";
        insights.push({
          icon: change >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down",
          text: `Combined revenue is <b>${dir} ${Math.abs(change).toFixed(1)}%</b> vs the comparison period (${Utils.fmtCurrency(stats.totalRevenue, "USD")} vs ${Utils.fmtCurrency(compareStats.totalRevenue, "USD")}).`,
        });
      }
    }

    if (stats.totalRevenue > 0 && stats.totalLeads > 0) {
      const eliteRevShare = (stats.eliteAmount / stats.totalRevenue) * 100;
      const eliteLeadShare = (stats.eliteLeads / stats.totalLeads) * 100;
      insights.push({
        icon: "fa-crown",
        text: `Elite plan contributes <b>${eliteRevShare.toFixed(1)}%</b> of revenue from just <b>${eliteLeadShare.toFixed(1)}%</b> of leads${eliteRevShare > eliteLeadShare * 1.3 ? " — disproportionately high-value" : ""}.`,
      });
    }

    if (sourceStats.length) {
      const top = sourceStats[0];
      insights.push({
        icon: "fa-bullseye",
        text: `"<b>${top.name}</b>" is the top lead source, generating ${Utils.fmtCurrency(top.revenue, "USD")} from ${Utils.fmtNumber(top.leads)} leads.`,
      });
    }

    if (stats.totalRevenue > 0) {
      const proRatio = (stats.proAmount / stats.totalRevenue) * 100;
      insights.push({
        icon: "fa-hand-holding-dollar",
        text: `Pro Amount is <b>${proRatio.toFixed(1)}%</b> of total revenue this period (${Utils.fmtCurrency(stats.proAmount, "USD")}).`,
      });
    }

    if (compareStats) {
      const avgChange = Utils.pctChange(stats.avgPaymentValue, compareStats.avgPaymentValue);
      if (typeof avgChange === "number" && !isNaN(avgChange) && isFinite(avgChange) && Math.abs(avgChange) >= 15) {
        insights.push({
          icon: "fa-triangle-exclamation",
          text: `Average payment value ${avgChange >= 0 ? "jumped" : "dropped"} <b>${Math.abs(avgChange).toFixed(1)}%</b> vs the comparison period — worth checking for a pricing or plan-mix shift.`,
        });
      }
    }

    if (!insights.length) {
      insights.push({ icon: "fa-circle-info", text: "Not enough data in the selected period to generate insights yet." });
    }

    return insights.slice(0, 5);
  },

  _insightsPanel(insights) {
    return `
      <div class="panel" style="background:linear-gradient(135deg, rgba(20,184,166,.10), rgba(20,184,166,.02)); border:1px solid rgba(20,184,166,.28); margin-bottom:20px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--accent, #14b8a6);"></i>
          <h3 style="margin:0;">Dynamic Insights</h3>
        </div>
        <ul style="list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px;">
          ${insights.map((ins) => `
            <li style="display:flex; align-items:flex-start; gap:10px;">
              <i class="fa-solid ${ins.icon}" style="color:var(--accent, #14b8a6); margin-top:3px; flex-shrink:0; width:14px;"></i>
              <span style="font-size:14px; line-height:1.5;">${ins.text}</span>
            </li>`).join("")}
        </ul>
      </div>`;
  },

  // ---- charts ------------------------------------------------

  _renderCharts(rows, sourceStats, monthly, stats) {
    const premium = stats.premium, elite = stats.elite;

    Charts.donut("chPlanSplit", ["Premium", "Elite"], [premium.length, elite.length]);

    const countries = [...new Set(rows.map((r) => r.Country).filter(Boolean))].sort();
    Charts.bar("chPlanCountry", countries, [
      { label: "Premium", data: countries.map((c) => premium.filter((r) => r.Country === c).length) },
      { label: "Elite", data: countries.map((c) => elite.filter((r) => r.Country === c).length) },
    ]);

    const courses = [...new Set(rows.map((r) => r.Course).filter(Boolean))].sort();
    Charts.bar("chPlanCourse", courses, [
      { label: "Premium", data: courses.map((c) => premium.filter((r) => r.Course === c).length) },
      { label: "Elite", data: courses.map((c) => elite.filter((r) => r.Course === c).length) },
    ]);

    Charts.line("chPlanTrend", monthly.map((m) => m.label), [
      { label: "Premium", data: monthly.map((m) => m.premium) },
      { label: "Elite", data: monthly.map((m) => m.elite) },
    ]);

    Charts.bar("chPlanSource", sourceStats.map((s) => s.name), [
      { label: "Payments", data: sourceStats.map((s) => s.payments) },
    ], { plugins: { legend: { display: false } } });
  },
};

/* ============================================================
   MODULE 6 — REFUND DASHBOARD
   ------------------------------------------------------------
   Expects the sheet's real columns (confirmed from the live CSV):
     Date, Country, Course, Amount, Status,
     "Main Refund Reason", Reason
   Note: "Main Refund Reason" has a space in it — that's fine,
   the code below reads it with bracket notation, no rename needed.
   ============================================================ */

const ModRefund = {
  showRecords: false, // Refund Records table is collapsed by default

  // Comparison 1 = primary period shown on the KPI cards / charts / table.
  // Comparison 2 = optional period to compare against (adds trend arrows).
  // preset is one of the keys in _PRESETS, plus "all" (Comparison 1 only,
  // meaning no date filter) and "none" (Comparison 2 only, meaning don't
  // compare). start/end are "YYYY-MM-DD" strings used only when preset
  // is "custom". Defaults to "This Month" so the dashboard opens on
  // current data instead of the entire dataset.
  compare1: { preset: "this_month", start: "", end: "" },
  compare2: { preset: "none", start: "", end: "" },

  search: "", // matches against Country, Course, Status, Main Refund Reason

  _PRESETS: [
    { id: "yesterday", label: "Yesterday" },
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "last_week", label: "Last Week" },
    { id: "this_week", label: "This Week" },
    { id: "next_week", label: "Next Week" },
    { id: "last_7_days", label: "Last 7 Days" },
    { id: "next_7_days", label: "Next 7 Days" },
    { id: "last_month", label: "Last Month" },
    { id: "last_30_days", label: "Last 30 Days" },
    { id: "this_month", label: "This Month" },
    { id: "next_month", label: "Next Month" },
    { id: "last_year", label: "Last Year" },
    { id: "this_year", label: "This Year" },
  ],

  render() {
    const all = DataStore.get("refundCSV");

    const range1 = this._resolveRange(this.compare1.preset, this.compare1.start, this.compare1.end);
    const range2 = this.compare2.preset === "none" ? null : this._resolveRange(this.compare2.preset, this.compare2.start, this.compare2.end);

    const rows = (range1 ? all.filter((r) => this._inRange(r.Date, range1)) : all)
      .filter((r) => this._matchesSearch(r, ["Country", "Course", "Status", "Main Refund Reason"], this.search));
    const compareRows = range2 ? all.filter((r) => this._inRange(r.Date, range2)) : null;

    const stats = this._aggregateStats(rows);
    const compareStats = compareRows ? this._aggregateStats(compareRows) : null;
    const withTrend = (key) => compareStats ? Utils.pctChange(stats[key], compareStats[key]) : undefined;

    const reasonGroups = this._groupByReason(rows);

    const label1 = this._presetLabel(this.compare1.preset, range1);
    const label2 = range2 ? this._presetLabel(this.compare2.preset, range2) : null;
    const comparisonCaption = label2
      ? `Comparing <b>${label1}</b> vs <b>${label2}</b>`
      : `Showing <b>${label1}</b> with no comparison selected`;

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="filter-bar">
        <div class="filter-group">
          <label>Comparison 1</label>
          <select id="fCompare1">${this._presetOptions(this.compare1.preset, true)}</select>
        </div>
        ${this.compare1.preset === "custom" ? `
        <div class="filter-group">
          <label>Custom Range 1</label>
          <div class="date-range-inputs" style="display:flex;align-items:center;gap:6px;">
            <input type="date" id="fCompare1Start" value="${this.compare1.start || ""}" />
            <span style="opacity:.6;">to</span>
            <input type="date" id="fCompare1End" value="${this.compare1.end || ""}" />
          </div>
        </div>` : ""}
        <div class="filter-group">
          <label>Comparison 2</label>
          <select id="fCompare2">${this._presetOptions(this.compare2.preset, false)}</select>
        </div>
        ${this.compare2.preset === "custom" ? `
        <div class="filter-group">
          <label>Custom Range 2</label>
          <div class="date-range-inputs" style="display:flex;align-items:center;gap:6px;">
            <input type="date" id="fCompare2Start" value="${this.compare2.start || ""}" />
            <span style="opacity:.6;">to</span>
            <input type="date" id="fCompare2End" value="${this.compare2.end || ""}" />
          </div>
        </div>` : ""}
        <div class="filter-group">
          <label>Search</label>
          <input type="text" id="fRefundSearch" placeholder="Country, Course, Status, Reason..." value="${this.search}" style="min-width:220px;" />
        </div>
        <button class="btn-reset" id="fRefundReset"><i class="fa-solid fa-arrow-rotate-left"></i> Reset</button>
      </div>

      ${Components.kpiRow([
        { label: "Refund Requests", value: Utils.fmtNumber(stats.count), icon: "fa-rotate-left", trend: withTrend("count") },
        { label: "Total Amount", value: Utils.fmtCurrency(stats.totalAmount, "USD"), icon: "fa-sack-dollar", trend: withTrend("totalAmount") },
        { label: "Approved", value: Utils.fmtNumber(stats.approvedCount), icon: "fa-circle-check", trend: withTrend("approvedCount") },
        { label: "Pending", value: Utils.fmtNumber(stats.pendingCount), icon: "fa-clock", trend: withTrend("pendingCount") },
        { label: "Rejected", value: Utils.fmtNumber(stats.rejectedCount), icon: "fa-circle-xmark", trend: withTrend("rejectedCount") },
        { label: "Approval Rate", value: Utils.fmtPercent(stats.approvalRate), icon: "fa-bullseye", trend: withTrend("approvalRate") },
        { label: "Oldest Pending", value: stats.pendingCount ? `${stats.oldestPendingDays} day${stats.oldestPendingDays !== 1 ? "s" : ""}` : "—", icon: "fa-hourglass-half" },
      ])}

      <p class="chart-sub" style="margin: -8px 0 12px;">${comparisonCaption}</p>

      <div class="panel">
        ${Components.sectionHead("Refund Reasons", "fa-list-ul")}
        ${this._reasonList(reasonGroups, rows.length)}
      </div>

      <div class="chart-grid">
        <div class="chart-card span-6"><h3>By Country</h3><div class="chart-box"><canvas id="chRefundCountry"></canvas></div></div>
        <div class="chart-card span-6"><h3>By Status</h3><div class="chart-box"><canvas id="chRefundStatus"></canvas></div></div>
      </div>

      <div class="panel">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          ${Components.sectionHead(`Refund Records (${Utils.fmtNumber(rows.length)})`, "fa-table-list")}
          <button class="btn-reset" id="toggleRefundRecords"><i class="fa-solid fa-${this.showRecords ? "eye-slash" : "eye"}"></i> ${this.showRecords ? "Hide" : "Show"} Refund Records</button>
        </div>
        ${this.showRecords ? Components.dataTable(rows.map((r) => ({ ...r, "Waiting Period": this._waitingLabel(r) })), [
          { key: "Date", label: "Date" },
          { key: "Country", label: "Country" },
          { key: "Course", label: "Course" },
          { key: "Amount", label: "Amount", fmt: (v) => Utils.fmtCurrency(this._parseCurrency(v), "USD") },
          { key: "Status", label: "Status", fmt: (v) => Components.statusBadge(v) },
          { key: "Waiting Period", label: "Waiting Period" },
          { key: "Main Refund Reason", label: "Reason" },
        ], { limit: 200 }) : `<p class="chart-sub" style="margin-top:8px;">Hidden by default. Click "Show Refund Records" above to see the raw rows.</p>`}
      </div>
    `;

    this._renderCharts(rows);
    this._bindFilterBar();
  },

  _bindFilterBar() {
    Utils.qs("#fCompare1").addEventListener("change", (e) => { this.compare1.preset = e.target.value; this.render(); });
    Utils.qs("#fCompare2").addEventListener("change", (e) => { this.compare2.preset = e.target.value; this.render(); });

    const c1s = Utils.qs("#fCompare1Start"), c1e = Utils.qs("#fCompare1End");
    if (c1s) c1s.addEventListener("change", (e) => { this.compare1.start = e.target.value; this.render(); });
    if (c1e) c1e.addEventListener("change", (e) => { this.compare1.end = e.target.value; this.render(); });

    const c2s = Utils.qs("#fCompare2Start"), c2e = Utils.qs("#fCompare2End");
    if (c2s) c2s.addEventListener("change", (e) => { this.compare2.start = e.target.value; this.render(); });
    if (c2e) c2e.addEventListener("change", (e) => { this.compare2.end = e.target.value; this.render(); });

    const refundSearchInput = Utils.qs("#fRefundSearch");
    const commitRefundSearch = (e) => { this.search = e.target.value; this.render(); };
    refundSearchInput.addEventListener("change", commitRefundSearch);
    refundSearchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") commitRefundSearch(e); });

    Utils.qs("#fRefundReset").addEventListener("click", () => {
      this.compare1 = { preset: "this_month", start: "", end: "" };
      this.compare2 = { preset: "none", start: "", end: "" };
      this.search = "";
      this.render();
    });

    Utils.qs("#toggleRefundRecords").addEventListener("click", () => { this.showRecords = !this.showRecords; this.render(); });
  },

  // ---- Comparison 1 / Comparison 2 preset resolution ------------------------------------------------

  _presetOptions(selected, isPrimary) {
    const list = isPrimary
      ? [{ id: "all", label: "All Time" }, { id: "custom", label: "Custom" }, ...this._PRESETS]
      : [{ id: "none", label: "No Comparison" }, { id: "custom", label: "Custom" }, ...this._PRESETS];
    return list.map((p) => `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${p.label}</option>`).join("");
  },

  _resolveRange(key, start, end) {
    if (key === "all" || key === "none") return null;
    if (key === "custom") return (start && end) ? { start: this._dateOnly(start), end: this._dateOnly(end) } : null;

    const today = this._dateOnly(new Date());
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const startOfWeek = (d) => addDays(d, -d.getDay());
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

    switch (key) {
      case "yesterday": { const y = addDays(today, -1); return { start: y, end: y }; }
      case "today": return { start: today, end: today };
      case "tomorrow": { const t = addDays(today, 1); return { start: t, end: t }; }
      case "last_week": { const ws = startOfWeek(today); return { start: addDays(ws, -7), end: addDays(ws, -1) }; }
      case "this_week": { const ws = startOfWeek(today); return { start: ws, end: addDays(ws, 6) }; }
      case "next_week": { const ws = startOfWeek(today); return { start: addDays(ws, 7), end: addDays(ws, 13) }; }
      case "last_7_days": return { start: addDays(today, -6), end: today };
      case "next_7_days": return { start: today, end: addDays(today, 6) };
      case "last_month": { const lmEnd = addDays(startOfMonth(today), -1); return { start: startOfMonth(lmEnd), end: lmEnd }; }
      case "last_30_days": return { start: addDays(today, -29), end: today };
      case "this_month": return { start: startOfMonth(today), end: endOfMonth(today) };
      case "next_month": { const nm = new Date(today.getFullYear(), today.getMonth() + 1, 1); return { start: nm, end: endOfMonth(nm) }; }
      case "last_year": { const y = today.getFullYear() - 1; return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) }; }
      case "this_year": return { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 11, 31) };
      default: return null;
    }
  },

  _presetLabel(key, range) {
    const labels = { all: "All Time", none: "No Comparison", custom: "Custom" };
    this._PRESETS.forEach((p) => { labels[p.id] = p.label; });
    if (key === "custom" && range) {
      const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${fmt(range.start)} – ${fmt(range.end)}`;
    }
    return labels[key] || key;
  },

  _dateOnly(val) {
    const d = new Date(val);
    if (isNaN(d)) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  },

  _inRange(dateVal, range) {
    if (!range) return true;
    const d = this._dateOnly(dateVal);
    return d && d >= range.start && d <= range.end;
  },

  // Case-insensitive substring match against any of the given fields.
  // Empty query always matches (search box empty = no filtering).
  _matchesSearch(row, fields, query) {
    if (!query || !query.trim()) return true;
    const q = query.trim().toLowerCase();
    return fields.some((f) => String(row[f] || "").toLowerCase().includes(q));
  },

  _aggregateStats(rows) {
    const totalAmount = rows.reduce((s, r) => s + this._parseCurrency(r.Amount), 0);
    const approved = rows.filter((r) => String(r.Status).toLowerCase() === "approved");
    const pending = rows.filter((r) => String(r.Status).toLowerCase() === "pending");
    const rejected = rows.filter((r) => String(r.Status).toLowerCase() === "rejected");
    const approvalRate = rows.length ? (approved.length / rows.length) * 100 : 0;
    const oldestPendingDays = pending.length ? Math.max(...pending.map((r) => this._daysSince(r.Date) || 0)) : 0;
    return {
      count: rows.length,
      totalAmount,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      approvalRate,
      oldestPendingDays,
    };
  },

  // ---- bullet-point reason list (no chart, per request) ------------------------------------------------

  _groupByReason(rows) {
    const map = {};
    rows.forEach((r) => {
      const reason = (r["Main Refund Reason"] || "Uncategorized").toString().trim();
      if (!map[reason]) map[reason] = { count: 0, amount: 0 };
      map[reason].count += 1;
      map[reason].amount += this._parseCurrency(r.Amount);
    });
    return Object.entries(map)
      .map(([reason, v]) => ({ reason, ...v }))
      .sort((a, b) => b.count - a.count);
  },

  _reasonList(groups, total) {
    if (!groups.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No refund data for this month.</p></div>`;
    return `
      <ul style="list-style:none; margin:0; padding:0;">
        ${groups.map((g) => {
          const pct = total ? Math.round((g.count / total) * 100) : 0;
          return `
            <li style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 4px; border-bottom:1px solid var(--grid, rgba(148,163,184,.15));">
              <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                <span style="width:8px; height:8px; border-radius:50%; background:var(--accent, #E42128); flex-shrink:0;"></span>
                <span style="font-weight:500;">${g.reason}</span>
              </div>
              <div style="white-space:nowrap; color:var(--text-muted, #94a3b8); font-size:13px;">
                <b style="color:inherit;">${Utils.fmtNumber(g.count)}</b> request${g.count !== 1 ? "s" : ""}
                &nbsp;·&nbsp; ${Utils.fmtCurrency(g.amount, "USD")}
                &nbsp;·&nbsp; ${pct}%
              </div>
            </li>`;
        }).join("")}
      </ul>`;
  },

  // ---- supporting charts (kept — only the reasons pie chart was removed) ------------------------------------------------

  _renderCharts(rows) {
    const byCountry = Utils.groupBy(rows, "Country");
    Charts.bar("chRefundCountry", Object.keys(byCountry), [{ label: "Refunds", data: Object.values(byCountry).map((g) => g.length) }]);

    const byStatus = Utils.groupBy(rows, "Status");
    Charts.donut("chRefundStatus", Object.keys(byStatus), Object.values(byStatus).map((g) => g.length));
  },

  // ---- waiting period (computed fresh from today's date every render —
  // never stored, so it automatically stays correct as days pass) ------------------------------------------------

  _daysSince(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const today = new Date();
    const diff = Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000
    );
    return diff;
  },

  _waitingLabel(r) {
    const days = this._daysSince(r.Date);
    if (days === null) return "—";
    const status = String(r.Status || "").toLowerCase();
    if (status === "pending") return `${days} day${days !== 1 ? "s" : ""} waiting`;
    return `${days} day${days !== 1 ? "s" : ""} since request`;
  },

  // ---- helpers ------------------------------------------------

  _parseCurrency(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
  },
};
