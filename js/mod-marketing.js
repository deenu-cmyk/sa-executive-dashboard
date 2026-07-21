/* ============================================================
   MODULE 4 — MARKETING
   ============================================================ */

const ModMarketing = {
  activeMonth: "2026-04",
  monthLabels: { "2026-04": "April 2026", "2026-05": "May 2026", "2026-06": "June 2026" },

  render() {
    const all = DataStore.get("marketingCSV");
    const rows = all.filter((r) => r.Month === this.activeMonth);

    const revenue = Utils.sum(rows, "Revenue");
    const spend = Utils.sum(rows, "Spend");
    const profit = revenue - spend;
    const roi = spend ? (profit / spend) * 100 : 0;
    const roas = spend ? revenue / spend : 0;
    const clicks = Utils.sum(rows, "Clicks");
    const impressions = Utils.sum(rows, "Impressions");
    const ctr = impressions ? (clicks / impressions) * 100 : 0;
    const leads = Utils.sum(rows, "Leads");
    const qualified = Utils.sum(rows, "QualifiedLeads");
    const deals = Utils.sum(rows, "DealsClosed");
    const cpl = leads ? spend / leads : 0;
    const cpa = deals ? spend / deals : 0;
    const aov = deals ? revenue / deals : 0;
    const convRate = leads ? (deals / leads) * 100 : 0;

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="tab-bar">${Object.entries(this.monthLabels).map(([k, label]) => `<button class="tab ${k === this.activeMonth ? "active" : ""}" data-month="${k}">${label}</button>`).join("")}</div>

      ${Components.kpiRow([
        { label: "Revenue", value: Utils.fmtCurrency(revenue), icon: "fa-sack-dollar" },
        { label: "Marketing Spend", value: Utils.fmtCurrency(spend), icon: "fa-coins" },
        { label: "Profit", value: Utils.fmtCurrency(profit), icon: "fa-chart-line" },
        { label: "ROI", value: Utils.fmtPercent(roi), icon: "fa-arrow-trend-up" },
        { label: "ROAS", value: `${roas.toFixed(2)}x`, icon: "fa-bullseye" },
        { label: "CTR", value: Utils.fmtPercent(ctr), icon: "fa-computer-mouse" },
        { label: "CPL", value: Utils.fmtCurrency(cpl), icon: "fa-user-tag" },
        { label: "CPA", value: Utils.fmtCurrency(cpa), icon: "fa-handshake" },
        { label: "Avg Order Value", value: Utils.fmtCurrency(aov), icon: "fa-cart-shopping" },
        { label: "Deals Closed", value: Utils.fmtNumber(deals), icon: "fa-award" },
        { label: "Valid Leads", value: Utils.fmtNumber(qualified), icon: "fa-user-check" },
        { label: "Conversion Rate", value: Utils.fmtPercent(convRate), icon: "fa-percent" },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-8"><h3>Daily Revenue vs Spend</h3><div class="chart-box"><canvas id="chMktDaily"></canvas></div></div>
        <div class="chart-card span-4"><h3>Monthly Comparison</h3><div class="chart-box"><canvas id="chMktMonthly"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead(`${this.monthLabels[this.activeMonth]} — Daily Data`, "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "Date", label: "Date" },
          { key: "Revenue", label: "Revenue", fmt: (v) => Utils.fmtCurrency(v) },
          { key: "Spend", label: "Spend", fmt: (v) => Utils.fmtCurrency(v) },
          { key: "Clicks", label: "Clicks", fmt: (v) => Utils.fmtNumber(v) },
          { key: "Leads", label: "Leads", fmt: (v) => Utils.fmtNumber(v) },
          { key: "DealsClosed", label: "Deals Closed" },
        ])}
      </div>
    `;

    const dates = rows.map((r) => r.Date);
    Charts.line("chMktDaily", dates, [{ label: "Revenue", data: rows.map((r) => r.Revenue) }, { label: "Spend", data: rows.map((r) => r.Spend) }]);

    const byMonth = Utils.groupBy(all, "Month");
    Charts.bar("chMktMonthly", Object.keys(byMonth).map((m) => this.monthLabels[m] || m), [{ label: "Revenue", data: Object.values(byMonth).map((g) => Utils.sum(g, "Revenue")) }, { label: "Spend", data: Object.values(byMonth).map((g) => Utils.sum(g, "Spend")) }]);

    Utils.qsa(".tab-bar .tab").forEach((btn) => btn.addEventListener("click", () => { this.activeMonth = btn.dataset.month; this.render(); }));
  },
};
