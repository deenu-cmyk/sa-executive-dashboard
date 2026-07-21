/* ============================================================
   MODULE 5 — PREMIUM & ELITE PLAN
   ============================================================ */

const ModPremium = {
  render() {
    const rows = DataStore.get("premiumCSV");
    const premium = rows.filter((r) => r.Plan === "Premium");
    const elite = rows.filter((r) => r.Plan === "Elite");
    const revenue = Utils.sum(rows, "Revenue");
    const payments = rows.filter((r) => r.Revenue > 0);
    const conv = rows.length ? (payments.length / rows.length) * 100 : 0;
    const growth = 6.4; // illustrative period-over-period growth

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      ${Components.kpiRow([
        { label: "Premium Leads", value: Utils.fmtNumber(premium.length), icon: "fa-star" },
        { label: "Elite Leads", value: Utils.fmtNumber(elite.length), icon: "fa-crown" },
        { label: "Revenue", value: Utils.fmtCurrency(revenue), icon: "fa-sack-dollar" },
        { label: "Payments", value: Utils.fmtNumber(payments.length), icon: "fa-receipt" },
        { label: "Conversion", value: Utils.fmtPercent(conv), icon: "fa-bullseye" },
        { label: "Growth", value: Utils.fmtPercent(growth), icon: "fa-arrow-trend-up" },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-4"><h3>Premium vs Elite</h3><div class="chart-box"><canvas id="chPlanSplit"></canvas></div></div>
        <div class="chart-card span-4"><h3>Country Comparison</h3><div class="chart-box"><canvas id="chPlanCountry"></canvas></div></div>
        <div class="chart-card span-4"><h3>Course Comparison</h3><div class="chart-box"><canvas id="chPlanCourse"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead("Premium & Elite Records", "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "LeadID", label: "Lead ID" }, { key: "Date", label: "Date" }, { key: "Plan", label: "Plan" },
          { key: "Country", label: "Country" }, { key: "Course", label: "Course" },
          { key: "Revenue", label: "Revenue", fmt: (v) => Utils.fmtCurrency(v) },
        ])}
      </div>
    `;

    Charts.donut("chPlanSplit", ["Premium", "Elite"], [premium.length, elite.length]);

    const countries = MockData.lists.countries;
    Charts.bar("chPlanCountry", countries, [
      { label: "Premium", data: countries.map((c) => premium.filter((r) => r.Country === c).length) },
      { label: "Elite", data: countries.map((c) => elite.filter((r) => r.Country === c).length) },
    ]);

    const courses = MockData.lists.courses;
    Charts.bar("chPlanCourse", courses, [
      { label: "Premium", data: courses.map((c) => premium.filter((r) => r.Course === c).length) },
      { label: "Elite", data: courses.map((c) => elite.filter((r) => r.Course === c).length) },
    ]);
  },
};

/* ============================================================
   MODULE 6 — REFUND DASHBOARD
   ============================================================ */

const ModRefund = {
  render() {
    const rows = DataStore.get("refundCSV");
    const approved = rows.filter((r) => r.Status === "Approved");
    const pending = rows.filter((r) => r.Status === "Pending");
    const rejected = rows.filter((r) => r.Status === "Rejected");
    const amount = Utils.sum(rows, "Amount");
    const pct = rows.length ? (rows.length / (rows.length + 900)) * 100 : 0; // illustrative refund rate vs total payments
    const avgDays = rows.length ? Utils.sum(rows, "ProcessingDays") / rows.length : 0;

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      ${Components.kpiRow([
        { label: "Refund Requests", value: Utils.fmtNumber(rows.length), icon: "fa-rotate-left" },
        { label: "Approved", value: Utils.fmtNumber(approved.length), icon: "fa-circle-check" },
        { label: "Pending", value: Utils.fmtNumber(pending.length), icon: "fa-hourglass-half" },
        { label: "Rejected", value: Utils.fmtNumber(rejected.length), icon: "fa-circle-xmark" },
        { label: "Refund Amount", value: Utils.fmtCurrency(amount, "USD"), icon: "fa-sack-dollar" },
        { label: "Refund %", value: Utils.fmtPercent(pct), icon: "fa-percent" },
        { label: "Avg Processing Time", value: `${avgDays.toFixed(1)}d`, icon: "fa-clock" },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-4"><h3>Refund Reasons</h3><div class="chart-box"><canvas id="chRefundReason"></canvas></div></div>
        <div class="chart-card span-4"><h3>Country-wise Refunds</h3><div class="chart-box"><canvas id="chRefundCountry"></canvas></div></div>
        <div class="chart-card span-4"><h3>Course-wise Refunds</h3><div class="chart-box"><canvas id="chRefundCourse"></canvas></div></div>
        <div class="chart-card span-12"><h3>Monthly Trend</h3><div class="chart-box"><canvas id="chRefundMonthly"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead("Refund Records", "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "RefundID", label: "Refund ID" }, { key: "Date", label: "Date" }, { key: "Country", label: "Country" },
          { key: "Course", label: "Course" }, { key: "Amount", label: "Amount", fmt: (v) => Utils.fmtCurrency(v, "USD") },
          { key: "Status", label: "Status", fmt: (v) => Components.statusBadge(v) }, { key: "Reason", label: "Reason" },
        ])}
      </div>
    `;

    const reasonGroups = Utils.groupBy(rows, "Reason");
    Charts.pie("chRefundReason", Object.keys(reasonGroups), Object.values(reasonGroups).map((g) => g.length));

    const countryGroups = Utils.groupBy(rows, "Country");
    Charts.bar("chRefundCountry", Object.keys(countryGroups), [{ label: "Refunds", data: Object.values(countryGroups).map((g) => g.length) }]);

    const courseGroups = Utils.groupBy(rows, "Course");
    Charts.donut("chRefundCourse", Object.keys(courseGroups), Object.values(courseGroups).map((g) => g.length));

    const monthly = {};
    rows.forEach((r) => { const m = String(r.Date).slice(0, 7); monthly[m] = (monthly[m] || 0) + 1; });
    const months = Object.keys(monthly).sort();
    Charts.line("chRefundMonthly", months, [{ label: "Refund Requests", data: months.map((m) => monthly[m]) }]);
  },
};
