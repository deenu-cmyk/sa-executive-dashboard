/* ============================================================
   MODULE 5 — PREMIUM & ELITE PLAN
   ============================================================ */

const ModPremium = {
  render() {
    const rows = DataStore.get("premiumCSV");
    const premium = rows.filter((r) => r.Plan === "Premium");
    const elite = rows.filter((r) => r.Plan === "Elite");

    const premiumPayments = Utils.sum(premium, "Payment");
    const elitePayments = Utils.sum(elite, "Payment");
    const premiumAmount = Utils.sum(premium, "Revenue");
    const eliteAmount = Utils.sum(elite, "Revenue");
    const growth = 6.4; // illustrative period-over-period growth

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      ${Components.kpiRow([
        { label: "Premium Leads", value: Utils.fmtNumber(premium.length), icon: "fa-star" },
        { label: "Elite Leads", value: Utils.fmtNumber(elite.length), icon: "fa-crown" },
        { label: "Premium Payments", value: Utils.fmtNumber(premiumPayments), icon: "fa-receipt" },
        { label: "Elite Payments", value: Utils.fmtNumber(elitePayments), icon: "fa-receipt" },
        { label: "Premium Amount", value: Utils.fmtCurrency(premiumAmount, "USD"), icon: "fa-sack-dollar" },
        { label: "Elite Amount", value: Utils.fmtCurrency(eliteAmount, "USD"), icon: "fa-sack-dollar" },
        { label: "Growth", value: Utils.fmtPercent(growth), icon: "fa-arrow-trend-up" },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-4"><h3>Premium vs Elite</h3><div class="chart-box"><canvas id="chPlanSplit"></canvas></div></div>
        <div class="chart-card span-4"><h3>Country Comparison</h3><div class="chart-box"><canvas id="chPlanCountry"></canvas></div></div>
        <div class="chart-card span-4"><h3>Course Comparison</h3><div class="chart-box"><canvas id="chPlanCourse"></canvas></div></div>
        <div class="chart-card span-12"><h3>Payments by Lead Source</h3><div class="chart-box"><canvas id="chPlanSource"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead("Premium & Elite Records", "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "Date", label: "Date" }, { key: "Plan", label: "Plan" },
          { key: "Country", label: "Country" }, { key: "Course", label: "Course" },
          { key: "Source", label: "Lead Source" },
          { key: "Revenue", label: "Amount Paid", fmt: (v) => Utils.fmtCurrency(v, "USD") },
        ], { limit: 200 })}
      </div>
    `;

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

    const sourceGroups = Utils.groupBy(rows, "Source");
    const sourceEntries = Object.entries(sourceGroups)
      .map(([name, rs]) => ({ name, payments: Utils.sum(rs, "Payment") }))
      .sort((a, b) => b.payments - a.payments);
    Charts.bar("chPlanSource", sourceEntries.map((s) => s.name), [
      { label: "Payments", data: sourceEntries.map((s) => s.payments) },
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
  activeMonth: "All", // auto-detected from Date, same pattern as other tabs
  showRecords: false, // Refund Records table is collapsed by default

  render() {
    const all = DataStore.get("refundCSV");
    const monthOrder = this._deriveMonths(all);
    if (this.activeMonth !== "All" && !monthOrder.includes(this.activeMonth)) {
      this.activeMonth = monthOrder.length ? monthOrder[monthOrder.length - 1] : "All";
    }
    const rows = this.activeMonth === "All" ? all : all.filter((r) => this._monthKey(r.Date) === this.activeMonth);

    const totalAmount = rows.reduce((s, r) => s + this._parseCurrency(r.Amount), 0);
    const approved = rows.filter((r) => String(r.Status).toLowerCase() === "approved");
    const pending = rows.filter((r) => String(r.Status).toLowerCase() === "pending");
    const rejected = rows.filter((r) => String(r.Status).toLowerCase() === "rejected");
    const approvalRate = rows.length ? (approved.length / rows.length) * 100 : 0;

    const reasonGroups = this._groupByReason(rows);

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="filter-bar">
        <div class="filter-group">
          <label>Month</label>
          <select id="fRefundMonth">
            <option value="All" ${this.activeMonth === "All" ? "selected" : ""}>All Months</option>
            ${monthOrder.map((m) => `<option value="${m}" ${m === this.activeMonth ? "selected" : ""}>${this._monthLabel(m)}</option>`).join("")}
          </select>
        </div>
      </div>

      ${Components.kpiRow([
        { label: "Refund Requests", value: Utils.fmtNumber(rows.length), icon: "fa-rotate-left" },
        { label: "Total Amount", value: Utils.fmtCurrency(totalAmount, "INR"), icon: "fa-sack-dollar" },
        { label: "Approved", value: Utils.fmtNumber(approved.length), icon: "fa-circle-check" },
        { label: "Pending", value: Utils.fmtNumber(pending.length), icon: "fa-clock" },
        { label: "Rejected", value: Utils.fmtNumber(rejected.length), icon: "fa-circle-xmark" },
        { label: "Approval Rate", value: Utils.fmtPercent(approvalRate), icon: "fa-bullseye" },
      ])}

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
        ${this.showRecords ? Components.dataTable(rows, [
          { key: "Date", label: "Date" },
          { key: "Country", label: "Country" },
          { key: "Course", label: "Course" },
          { key: "Amount", label: "Amount", fmt: (v) => Utils.fmtCurrency(this._parseCurrency(v), "INR") },
          { key: "Status", label: "Status", fmt: (v) => Components.statusBadge(v) },
          { key: "Main Refund Reason", label: "Reason" },
        ], { limit: 200 }) : `<p class="chart-sub" style="margin-top:8px;">Hidden by default. Click "Show Refund Records" above to see the raw rows.</p>`}
      </div>
    `;

    this._renderCharts(rows);

    Utils.qs("#fRefundMonth").addEventListener("change", (e) => { this.activeMonth = e.target.value; this.render(); });
    Utils.qs("#toggleRefundRecords").addEventListener("click", () => { this.showRecords = !this.showRecords; this.render(); });
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
                &nbsp;·&nbsp; ${Utils.fmtCurrency(g.amount, "INR")}
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

  // ---- helpers ------------------------------------------------

  _parseCurrency(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
  },

  // Date is already normalized to "YYYY-MM-DD" by DataStore before modules
  // see it, so grabbing the month is just a slice — no parsing needed.
  _monthKey(dateStr) {
    return String(dateStr || "").slice(0, 7);
  },

  _deriveMonths(all) {
    const raw = [...new Set(all.map((r) => this._monthKey(r.Date)).filter(Boolean))];
    raw.sort();
    return raw;
  },

  _monthLabel(m) {
    const d = new Date(`${m}-01`);
    return isNaN(d) ? m : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  },
};
