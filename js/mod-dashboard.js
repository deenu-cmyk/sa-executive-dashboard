/* ============================================================
   MODULE 1 — SA DASHBOARD
   ============================================================ */

const ModDashboard = {
  filters: { country: "", course: "", days: 0 },

  render() {
    let rows = DataStore.get("dashboardCSV");
    rows = this._applyFilters(rows);

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      ${this._filterBar()}
      <div class="kpi-grid" id="kpiGrid"></div>
      <div class="chart-grid">
        <div class="chart-card span-8"><h3>Revenue Trend</h3><div class="chart-box"><canvas id="chRevenueTrend"></canvas></div></div>
        <div class="chart-card span-4"><h3>Lead Funnel</h3><div class="chart-box"><canvas id="chFunnel"></canvas></div></div>

        <div class="chart-card span-4"><h3>Lead Trend</h3><div class="chart-box"><canvas id="chLeadTrend"></canvas></div></div>
        <div class="chart-card span-4"><h3>Payment Trend</h3><div class="chart-box"><canvas id="chPaymentTrend"></canvas></div></div>
        <div class="chart-card span-4"><h3>Lead Source Analysis</h3><div class="chart-box"><canvas id="chSource"></canvas></div></div>

        <div class="chart-card span-4"><h3>Country Analysis</h3><div class="chart-box"><canvas id="chCountry"></canvas></div></div>
        <div class="chart-card span-4"><h3>Course Analysis</h3><div class="chart-box"><canvas id="chCourse"></canvas></div></div>
        <div class="chart-card span-4"><h3>Sales Performance</h3><div class="chart-box"><canvas id="chSales"></canvas></div></div>

        <div class="chart-card span-6"><h3>Daily / Weekly / Monthly Comparison</h3><div class="chart-box"><canvas id="chComparison"></canvas></div></div>
        <div class="chart-card span-6"><h3>Country × Course Heatmap</h3><div class="chart-box" id="heatmapBox"></div></div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h3><i class="fa-solid fa-calendar-days"></i> Interactive Calendar</h3>
          <div class="calendar-nav">
            <button id="calPrev"><i class="fa-solid fa-chevron-left"></i></button>
            <span id="calMonthLabel"></span>
            <button id="calNext"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
        <div class="calendar-layout">
          <div id="calendarGrid" class="calendar-grid"></div>
          <div id="calendarDetail" class="calendar-detail">
            <p class="muted">Click a date to see leads, payments, revenue and comparisons.</p>
          </div>
        </div>
      </div>
    `;

    this._renderKPIs(rows);
    this._renderCharts(rows);
    this._bindFilterBar();
    this._calState = this._calState || { year: new Date().getFullYear(), month: new Date().getMonth() };
    this._renderCalendar(rows);
  },

  _filterBar() {
    const { countries, courses } = MockData.lists;
    return `
      <div class="filter-bar">
        <div class="filter-group">
          <label>Country</label>
          <select id="fCountry"><option value="">All Countries</option>${countries.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
        </div>
        <div class="filter-group">
          <label>Course</label>
          <select id="fCourse"><option value="">All Courses</option>${courses.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
        </div>
        <div class="filter-group">
          <label>Date Range</label>
          <select id="fDays">
            <option value="0">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last Quarter</option>
            <option value="365">Last Year</option>
          </select>
        </div>
        <button class="btn-reset" id="fReset"><i class="fa-solid fa-arrow-rotate-left"></i> Reset</button>
      </div>`;
  },

  _bindFilterBar() {
    const cSel = Utils.qs("#fCountry"), coSel = Utils.qs("#fCourse"), dSel = Utils.qs("#fDays");
    cSel.value = this.filters.country; coSel.value = this.filters.course; dSel.value = this.filters.days;
    const apply = () => {
      this.filters = { country: cSel.value, course: coSel.value, days: Number(dSel.value) };
      this.render();
    };
    cSel.addEventListener("change", apply);
    coSel.addEventListener("change", apply);
    dSel.addEventListener("change", apply);
    Utils.qs("#fReset").addEventListener("click", () => { this.filters = { country: "", course: "", days: 0 }; this.render(); });
  },

  _applyFilters(rows) {
    let out = rows;
    if (this.filters.country) out = out.filter((r) => r.Country === this.filters.country);
    if (this.filters.course) out = out.filter((r) => r.Course === this.filters.course);
    if (this.filters.days) out = Utils.dateRangeFilter(out, this.filters.days);
    return out;
  },

  _renderKPIs(rows) {
    const totalLeads = rows.length;
    const totalPayments = Utils.sum(rows, "Payment");
    const totalRevenue = Utils.sum(rows, "Revenue");
    const conversion = totalLeads ? (totalPayments / totalLeads) * 100 : 0;
    const avgDeal = totalPayments ? totalRevenue / totalPayments : 0;
    const todayLeads = rows.filter((r) => Utils.isToday(r.Date)).length;
    const todayPayments = rows.filter((r) => Utils.isToday(r.Date) && r.Payment).length;
    const weekRevenue = Utils.sum(rows.filter((r) => Utils.isThisWeek(r.Date)), "Revenue");
    const monthRevenue = Utils.sum(rows.filter((r) => Utils.isThisMonth(r.Date)), "Revenue");
    const yearRevenue = Utils.sum(rows.filter((r) => Utils.isThisYear(r.Date)), "Revenue");
    const topCountry = Utils.topKey(rows, "Country", "Revenue");
    const topCourse = Utils.topKey(rows, "Course", "Revenue");
    const topOwner = Utils.topKey(rows, "Owner", "Revenue");

    const cards = [
      { label: "Total Leads", value: totalLeads, icon: "fa-user-group", fmt: Utils.fmtNumber, trend: 4.2 },
      { label: "Total Payments", value: totalPayments, icon: "fa-receipt", fmt: Utils.fmtNumber, trend: 2.8 },
      { label: "Total Revenue", value: totalRevenue, icon: "fa-sack-dollar", fmt: (v) => Utils.fmtCurrency(v, "USD"), trend: 6.1 },
      { label: "Conversion Rate", value: conversion, icon: "fa-bullseye", fmt: (v) => Utils.fmtPercent(v), trend: 1.4 },
      { label: "Avg Deal Size", value: avgDeal, icon: "fa-scale-balanced", fmt: (v) => Utils.fmtCurrency(v, "USD"), trend: -0.6 },
      { label: "Today's Leads", value: todayLeads, icon: "fa-calendar-day", fmt: Utils.fmtNumber, trend: 0 },
      { label: "Today's Payments", value: todayPayments, icon: "fa-money-check-dollar", fmt: Utils.fmtNumber, trend: 0 },
      { label: "Weekly Revenue", value: weekRevenue, icon: "fa-calendar-week", fmt: (v) => Utils.fmtCurrency(v, "USD"), trend: 3.3 },
      { label: "Monthly Revenue", value: monthRevenue, icon: "fa-calendar", fmt: (v) => Utils.fmtCurrency(v, "USD"), trend: 5.7 },
      { label: "Yearly Revenue", value: yearRevenue, icon: "fa-chart-column", fmt: (v) => Utils.fmtCurrency(v, "USD"), trend: 8.9 },
      { label: "Top Country", value: topCountry, icon: "fa-earth-asia", isText: true },
      { label: "Top Course", value: topCourse, icon: "fa-graduation-cap", isText: true },
      { label: "Top Sales Executive", value: topOwner, icon: "fa-medal", isText: true },
    ];

    const grid = Utils.qs("#kpiGrid");
    grid.innerHTML = "";
    cards.forEach((c, i) => {
      const spark = Array.from({ length: 12 }, () => Math.random() * 100);
      const trendClass = c.trend > 0 ? "up" : c.trend < 0 ? "down" : "flat";
      const card = Utils.el(`
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon"><i class="fa-solid ${c.icon}"></i></div>
            ${c.trend !== undefined ? `<span class="kpi-trend ${trendClass}"><i class="fa-solid fa-arrow-${c.trend >= 0 ? "up" : "down"}"></i> ${Math.abs(c.trend)}%</span>` : ""}
          </div>
          <div class="kpi-value" id="kpi-${i}">${c.isText ? c.value : "0"}</div>
          <div class="kpi-label">${c.label}</div>
          ${!c.isText ? `<div class="kpi-spark"><canvas id="spark-${i}"></canvas></div>` : ""}
        </div>`);
      grid.appendChild(card);
      if (!c.isText) {
        Utils.animateCounter(Utils.qs(`#kpi-${i}`, card), c.value, { format: c.fmt });
        requestAnimationFrame(() => Charts.sparkline(`spark-${i}`, spark, Charts.palette[i % Charts.palette.length]));
      }
    });
  },

  _renderCharts(rows) {
    const byMonth = this._monthlySeries(rows);
    Charts.line("chRevenueTrend", byMonth.labels, [{ label: "Revenue", data: byMonth.revenue }, { label: "Target", data: byMonth.revenue.map((v) => v * 1.1), borderDash: [6, 4] }]);
