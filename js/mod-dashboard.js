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
    Charts.line("chLeadTrend", byMonth.labels, [{ label: "Leads", data: byMonth.leads }]);
    Charts.bar("chPaymentTrend", byMonth.labels, [{ label: "Payments", data: byMonth.payments }]);

    const stageGroups = Utils.groupBy(rows, "Stage");
    const stageEntries = Object.entries(stageGroups).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
    Charts.funnel("chFunnel", stageEntries.map(([s]) => s), stageEntries.map(([, rs]) => rs.length));

    const sourceGroups = Utils.groupBy(rows, "Source");
    Charts.pie("chSource", Object.keys(sourceGroups), Object.values(sourceGroups).map((g) => g.length));

    const countryGroups = Utils.groupBy(rows, "Country");
    Charts.donut("chCountry", Object.keys(countryGroups), Object.values(countryGroups).map((g) => Utils.sum(g, "Revenue")));

    const courseGroups = Utils.groupBy(rows, "Course");
    Charts.bar("chCourse", Object.keys(courseGroups), [{ label: "Revenue", data: Object.values(courseGroups).map((g) => Utils.sum(g, "Revenue")) }]);

    const ownerGroups = Utils.groupBy(rows, "Owner");
    Charts.bar("chSales", Object.keys(ownerGroups), [{ label: "Revenue", data: Object.values(ownerGroups).map((g) => Utils.sum(g, "Revenue")) }], { indexAxis: "y" });

    const today = rows.filter((r) => Utils.isToday(r.Date)).length;
    const week = rows.filter((r) => Utils.isThisWeek(r.Date)).length;
    const month = rows.filter((r) => Utils.isThisMonth(r.Date)).length;
    Charts.bar("chComparison", ["Daily", "Weekly", "Monthly"], [{ label: "Leads", data: [today, week, month] }]);

    this._renderHeatmap(rows);
  },

  _monthlySeries(rows) {
    const map = {};
    rows.forEach((r) => {
      if (!r.Date) return;
      const m = String(r.Date).slice(0, 7);
      map[m] = map[m] || { leads: 0, payments: 0, revenue: 0 };
      map[m].leads += 1;
      map[m].payments += Number(r.Payment) || 0;
      map[m].revenue += Number(r.Revenue) || 0;
    });
    const labels = Object.keys(map).sort();
    return {
      labels,
      leads: labels.map((l) => map[l].leads),
      payments: labels.map((l) => map[l].payments),
      revenue: labels.map((l) => map[l].revenue),
    };
  },

  _renderHeatmap(rows) {
    const box = Utils.qs("#heatmapBox");
    const { countries, courses } = MockData.lists;
    let max = 0;
    const grid = countries.map((c) => courses.map((co) => {
      const v = rows.filter((r) => r.Country === c && r.Course === co).length;
      max = Math.max(max, v);
      return v;
    }));
    let html = `<div class="heatmap"><div class="heatmap-row heatmap-head"><div></div>${courses.map((c) => `<div class="heatmap-label">${c}</div>`).join("")}</div>`;
    countries.forEach((c, ri) => {
      html += `<div class="heatmap-row"><div class="heatmap-label">${c}</div>${courses.map((_, ci) => {
        const v = grid[ri][ci];
        const alpha = max ? 0.12 + 0.75 * (v / max) : 0.12;
        return `<div class="heatmap-cell" style="background:rgba(0,194,168,${alpha.toFixed(2)})" title="${c} × ${courses[ci]}: ${v}">${v}</div>`;
      }).join("")}</div>`;
    });
    html += `</div>`;
    box.innerHTML = html;
  },

  _renderCalendar(rows) {
    const { year, month } = this._calState;
    Utils.qs("#calMonthLabel").textContent = new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDate = Utils.groupBy(rows, "Date");

    let html = "";
    ["S", "M", "T", "W", "T", "F", "S"].forEach((d) => (html += `<div class="cal-dow">${d}</div>`));
    for (let i = 0; i < startDay; i++) html += `<div class="cal-cell empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayRows = byDate[dateStr] || [];
      const hasData = dayRows.length > 0;
      html += `<div class="cal-cell ${hasData ? "has-data" : ""}" data-date="${dateStr}">
        <span class="cal-day">${d}</span>
        ${hasData ? `<span class="cal-dot">${dayRows.length}</span>` : ""}
      </div>`;
    }
    Utils.qs("#calendarGrid").innerHTML = html;

    Utils.qs("#calPrev").onclick = () => { this._shiftMonth(-1, rows); };
    Utils.qs("#calNext").onclick = () => { this._shiftMonth(1, rows); };
    Utils.qsa(".cal-cell.has-data").forEach((cell) => {
      cell.addEventListener("click", () => this._showDayDetail(cell.dataset.date, rows));
    });
  },

  _shiftMonth(delta, rows) {
    let { year, month } = this._calState;
    month += delta;
    if (month < 0) { month = 11; year -= 1; }
    if (month > 11) { month = 0; year += 1; }
    this._calState = { year, month };
    this._renderCalendar(rows);
  },

  _showDayDetail(dateStr, rows) {
    const dayRows = rows.filter((r) => r.Date === dateStr);
    const leads = dayRows.length;
    const payments = Utils.sum(dayRows, "Payment");
    const revenue = Utils.sum(dayRows, "Revenue");
    const conv = leads ? (payments / leads) * 100 : 0;
    const closed = dayRows.filter((r) => Number(r.Payment) > 0 || Number(r.Revenue) > 0).length;

    const prevDay = new Date(dateStr); prevDay.setDate(prevDay.getDate() - 1);
    const prevDayRows = rows.filter((r) => r.Date === prevDay.toISOString().slice(0, 10));
    const prevWeekStart = new Date(dateStr); prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekRows = rows.filter((r) => new Date(r.Date) >= prevWeekStart && new Date(r.Date) < new Date(dateStr));
    const prevMonth = new Date(dateStr); prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStr = prevMonth.toISOString().slice(0, 7);
    const prevMonthRows = rows.filter((r) => String(r.Date).startsWith(prevMonthStr));

    Utils.qs("#calendarDetail").innerHTML = `
      <h4>${new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h4>
      <div class="detail-grid">
        <div><span>Leads</span><b>${leads}</b></div>
        <div><span>Payments</span><b>${payments}</b></div>
        <div><span>Revenue</span><b>${Utils.fmtCurrency(revenue, "USD")}</b></div>
        <div><span>Conversion</span><b>${Utils.fmtPercent(conv)}</b></div>
        <div><span>Closed Deals</span><b>${closed}</b></div>
        <div><span>Follow-ups</span><b>${dayRows.filter((r) => !(Number(r.Payment) > 0 || Number(r.Revenue) > 0)).length}</b></div>
      </div>
      <div class="detail-compare">
        <div><span>vs Previous Day</span><b class="${leads >= prevDayRows.length ? 'up' : 'down'}">${Utils.fmtPercent(Utils.pctChange(leads, prevDayRows.length))}</b></div>
        <div><span>vs Previous Week (avg/day)</span><b class="${leads >= (prevWeekRows.length / 7) ? 'up' : 'down'}">${Utils.fmtPercent(Utils.pctChange(leads, prevWeekRows.length / 7))}</b></div>
        <div><span>vs Previous Month (avg/day)</span><b class="${leads >= (prevMonthRows.length / 30) ? 'up' : 'down'}">${Utils.fmtPercent(Utils.pctChange(leads, prevMonthRows.length / 30))}</b></div>
      </div>`;
  };
};
