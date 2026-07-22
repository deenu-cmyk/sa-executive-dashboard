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
