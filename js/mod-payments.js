/* ============================================================
   MODULE 2 — PAYMENT TRACKER
   ============================================================ */

const ModPayments = {
  activeRegion: "All",

  render() {
    const all = DataStore.get("paymentTrackerCSV");
    const regions = ["All", "India", "USA", "APAC", "MENA", "Chat"];
    const rows = this.activeRegion === "All" ? all : all.filter((r) => r.Region === this.activeRegion);

    const revenue = Utils.sum(rows, "Amount");
    const completed = rows.filter((r) => r.Status === "Completed");
    const pending = rows.filter((r) => r.Status === "Pending");
    const refunded = rows.filter((r) => r.Status === "Refunded");
    const successRate = rows.length ? (completed.length / rows.length) * 100 : 0;

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="tab-bar">${regions.map((r) => `<button class="tab ${r === this.activeRegion ? "active" : ""}" data-region="${r}">${r}</button>`).join("")}</div>

      ${Components.kpiRow([
        { label: "Revenue", value: Utils.fmtCurrency(revenue), icon: "fa-sack-dollar" },
        { label: "Payments", value: Utils.fmtNumber(rows.length), icon: "fa-receipt" },
        { label: "Completed", value: Utils.fmtNumber(completed.length), icon: "fa-circle-check" },
        { label: "Pending", value: Utils.fmtNumber(pending.length), icon: "fa-hourglass-half" },
        { label: "Refunds", value: Utils.fmtNumber(refunded.length), icon: "fa-rotate-left" },
        { label: "Success Rate", value: Utils.fmtPercent(successRate), icon: "fa-bullseye" },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-6"><h3>Daily Trend</h3><div class="chart-box"><canvas id="chPayDaily"></canvas></div></div>
        <div class="chart-card span-6"><h3>Regional Comparison</h3><div class="chart-box"><canvas id="chPayRegion"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead("Payment Records", "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "PaymentID", label: "Payment ID" },
          { key: "Date", label: "Date" },
          { key: "Region", label: "Region" },
          { key: "Country", label: "Country" },
          { key: "Course", label: "Course" },
          { key: "Amount", label: "Amount", fmt: (v) => Utils.fmtCurrency(v) },
          { key: "Status", label: "Status", fmt: (v) => Components.statusBadge(v) },
        ])}
      </div>
    `;

    const byDate = {};
    rows.forEach((r) => { byDate[r.Date] = (byDate[r.Date] || 0) + r.Amount; });
    const dates = Object.keys(byDate).sort().slice(-30);
    Charts.line("chPayDaily", dates, [{ label: "Revenue", data: dates.map((d) => byDate[d]) }]);

    const byRegion = Utils.groupBy(all, "Region");
    Charts.bar("chPayRegion", Object.keys(byRegion), [{ label: "Revenue", data: Object.values(byRegion).map((g) => Utils.sum(g, "Amount")) }]);

    Utils.qsa(".tab-bar .tab").forEach((btn) => btn.addEventListener("click", () => { this.activeRegion = btn.dataset.region; this.render(); }));
  },
};
