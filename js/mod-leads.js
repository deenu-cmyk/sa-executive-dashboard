/* ============================================================
   MODULE 3 — LEADS
   ============================================================ */

const ModLeads = {
  activeSource: "metaCSV",
  sources: { metaCSV: "Meta", emailMarketingCSV: "Email Marketing", linkedinCSV: "LinkedIn", cpcCSV: "CPC" },

  render() {
    const rows = DataStore.get(this.activeSource);
    const qualified = rows.filter((r) => r.Qualified);
    const payments = rows.filter((r) => r.Payment);
    const revenue = Utils.sum(rows, "Revenue");
    const spend = Utils.sum(rows, "Spend");
    const roi = spend ? ((revenue - spend) / spend) * 100 : 0;
    const conv = rows.length ? (payments.length / rows.length) * 100 : 0;
    const cpl = rows.length ? spend / rows.length : 0;
    const topCampaign = Utils.topKey(rows, "Campaign");

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="tab-bar">${Object.entries(this.sources).map(([k, label]) => `<button class="tab ${k === this.activeSource ? "active" : ""}" data-src="${k}">${label}</button>`).join("")}</div>

      ${Components.kpiRow([
        { label: "Lead Count", value: Utils.fmtNumber(rows.length), icon: "fa-user-plus" },
        { label: "Qualified Leads", value: Utils.fmtNumber(qualified.length), icon: "fa-user-check" },
        { label: "Payments", value: Utils.fmtNumber(payments.length), icon: "fa-receipt" },
        { label: "Revenue", value: Utils.fmtCurrency(revenue), icon: "fa-sack-dollar" },
        { label: "ROI", value: Utils.fmtPercent(roi), icon: "fa-arrow-trend-up" },
        { label: "Conversion Rate", value: Utils.fmtPercent(conv), icon: "fa-bullseye" },
        { label: "Cost Per Lead", value: Utils.fmtCurrency(cpl), icon: "fa-coins" },
        { label: "Top Campaign", value: topCampaign, icon: "fa-flag" },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-4"><h3>Lead Pipeline</h3><div class="chart-box"><canvas id="chPipeline"></canvas></div></div>
        <div class="chart-card span-4"><h3>Country Distribution</h3><div class="chart-box"><canvas id="chLeadCountry"></canvas></div></div>
        <div class="chart-card span-4"><h3>Course Distribution</h3><div class="chart-box"><canvas id="chLeadCourse"></canvas></div></div>
        <div class="chart-card span-12"><h3>Daily / Weekly / Monthly Trend</h3><div class="chart-box"><canvas id="chLeadTrends"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead("Lead Records", "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "LeadID", label: "Lead ID" },
          { key: "Date", label: "Date" },
          { key: "Country", label: "Country" },
          { key: "Course", label: "Course" },
          { key: "Owner", label: "Owner" },
          { key: "Campaign", label: "Campaign" },
          { key: "Stage", label: "Stage", fmt: (v) => Components.statusBadge(v) },
          { key: "Revenue", label: "Revenue", fmt: (v) => Utils.fmtCurrency(v) },
        ])}
      </div>
    `;

    const stages = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won"];
    const stageGroups = Utils.groupBy(rows, "Stage");
    Charts.funnel("chPipeline", stages, stages.map((s) => (stageGroups[s] || []).length));

    const countryGroups = Utils.groupBy(rows, "Country");
    Charts.donut("chLeadCountry", Object.keys(countryGroups), Object.values(countryGroups).map((g) => g.length));

    const courseGroups = Utils.groupBy(rows, "Course");
    Charts.bar("chLeadCourse", Object.keys(courseGroups), [{ label: "Leads", data: Object.values(courseGroups).map((g) => g.length) }]);

    const today = rows.filter((r) => Utils.isToday(r.Date)).length;
    const week = rows.filter((r) => Utils.isThisWeek(r.Date)).length;
    const month = rows.filter((r) => Utils.isThisMonth(r.Date)).length;
    Charts.bar("chLeadTrends", ["Today", "This Week", "This Month"], [{ label: "Leads", data: [today, week, month] }]);

    Utils.qsa(".tab-bar .tab").forEach((btn) => btn.addEventListener("click", () => { this.activeSource = btn.dataset.src; this.render(); }));
  },
};
