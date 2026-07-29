/* ============================================================
   MODULE 4 — MARKETING
   ------------------------------------------------------------
   Months are derived automatically from whatever values exist
   in the sheet's "Month" column — no hardcoded month list, so
   adding a new month (e.g. July) to the sheet just works, no
   code changes needed.
============================================================ */

const ModMarketing = {
  activeMonth: null, // set on first render to the most recent month found
  compareMonth: undefined, // undefined = default to previous month; "__none__" = no comparison; else an explicit month key
  compareGranularity: "month", // "month" | "week" | "day"
  spendView: "spend", // spend | roas | cpl
  filters: { program: "", country: "" },

  render() {
    const all = DataStore.get("marketingCSV");
    const monthOrder = this._deriveMonths(all);

    if (!monthOrder.length) {
      Utils.qs("#mainContent").innerHTML = `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No marketing data available yet.</p></div>`;
      return;
    }

    // Default to the latest month on first load, or if the previously
    // selected month no longer exists in the data.
    if (!this.activeMonth || !monthOrder.includes(this.activeMonth)) {
      this.activeMonth = monthOrder[monthOrder.length - 1];
    }

    let rows, stats, prevStats, compareMonth, periodLabel, comparisonCaption;

    if (this.compareGranularity === "month") {
      rows = all.filter((r) => r.Month === this.activeMonth);
      rows = this._applyFilters(rows);

      const idx = monthOrder.indexOf(this.activeMonth);
      const defaultPrevMonth = idx > 0 ? monthOrder[idx - 1] : "";

      compareMonth = this.compareMonth === "__none__"
        ? ""
        : (this.compareMonth && monthOrder.includes(this.compareMonth) && this.compareMonth !== this.activeMonth
          ? this.compareMonth
          : defaultPrevMonth);

      let prevRows = compareMonth ? all.filter((r) => r.Month === compareMonth) : [];
      prevRows = this._applyFilters(prevRows);

      stats = this._aggregate(rows);
      prevStats = compareMonth ? this._aggregate(prevRows) : null;
      periodLabel = this._monthLabel(this.activeMonth);
      comparisonCaption = compareMonth
        ? `Comparing <b>${periodLabel}</b> vs <b>${this._monthLabel(compareMonth)}</b>`
        : `Showing <b>${periodLabel}</b> with no comparison selected`;
    } else {
      // Week/Day mode ignores the Month dropdown entirely and compares real
      // calendar periods (This Week vs Last Week, or Today vs Yesterday)
      // using each row's actual Date value.
      const filteredAll = this._applyFilters(all);
      const period = this._periodRanges(this.compareGranularity);

      const currentRows = filteredAll.filter((r) => this._inRange(r.Date, period.current));
      const previousRows = filteredAll.filter((r) => this._inRange(r.Date, period.previous));

      rows = currentRows;
      stats = this._aggregate(currentRows);
      prevStats = this._aggregate(previousRows);
      periodLabel = period.currentLabel;
      comparisonCaption = `Comparing <b>${period.currentLabel}</b> vs <b>${period.previousLabel}</b>`;
    }

    const programs = this._programStats(rows);
    const countries = this._countryStats(rows);
    const monthly = this._monthlySeries(this._applyFilters(all), monthOrder);
    const allPrograms = [...new Set(all.map((r) => r.Program).filter(Boolean))].sort();
    const allMarkets = [...new Set(all.map((r) => r.Country).filter(Boolean))].sort();

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="filter-bar">
        <div class="filter-group">
          <label>Compare By</label>
          <div class="segmented-mini" id="fGranularity">
            <button class="${this.compareGranularity === "month" ? "active" : ""}" data-granularity="month">Month</button>
            <button class="${this.compareGranularity === "week" ? "active" : ""}" data-granularity="week">Week</button>
            <button class="${this.compareGranularity === "day" ? "active" : ""}" data-granularity="day">Day</button>
          </div>
        </div>
        ${this.compareGranularity === "month" ? `
        <div class="filter-group">
          <label>Month</label>
          <select id="fMonth">${monthOrder.map((m) => `<option value="${m}" ${m === this.activeMonth ? "selected" : ""}>${this._monthLabel(m)}</option>`).join("")}</select>
        </div>` : ""}
        <div class="filter-group">
          <label>Program</label>
          <select id="fProgram"><option value="">All Programs</option>${allPrograms.map((p) => `<option value="${p}" ${p === this.filters.program ? "selected" : ""}>${p}</option>`).join("")}</select>
        </div>
        <div class="filter-group">
          <label>Market</label>
          <select id="fMarket"><option value="">All Markets</option>${allMarkets.map((c) => `<option value="${c}" ${c === this.filters.country ? "selected" : ""}>${c}</option>`).join("")}</select>
        </div>
        ${this.compareGranularity === "month" ? `
        <div class="filter-group">
          <label>Compare To</label>
          <select id="fCompareMonth">
            <option value="__none__" ${compareMonth === "" ? "selected" : ""}>No comparison</option>
            ${monthOrder.filter((m) => m !== this.activeMonth).map((m) => `<option value="${m}" ${m === compareMonth ? "selected" : ""}>${this._monthLabel(m)}</option>`).join("")}
          </select>
        </div>` : ""}
        <button class="btn-reset" id="fReset"><i class="fa-solid fa-arrow-rotate-left"></i> Reset</button>
      </div>

      ${Components.kpiRow(this._kpiCards(stats, prevStats))}

      <div class="insight-banner">${this._buildInsight(programs, monthly, stats)}</div>
      <p class="chart-sub" style="margin: -8px 0 12px;">${comparisonCaption}</p>

      <div class="chart-grid">
        <div class="chart-card span-6">
          <div class="chart-card-head">
            <h3>Spend by Program · ${periodLabel}</h3>
            <div class="segmented-mini">
              <button class="${this.spendView === "spend" ? "active" : ""}" data-view="spend">Spend</button>
              <button class="${this.spendView === "roas" ? "active" : ""}" data-view="roas">ROAS</button>
              <button class="${this.spendView === "cpl" ? "active" : ""}" data-view="cpl">CPL</button>
            </div>
          </div>
          <div class="chart-box"><canvas id="chSpendByProgram"></canvas></div>
        </div>
        <div class="chart-card span-6"><h3>Leads &amp; Deals by Market</h3><div class="chart-box"><canvas id="chLeadsMarket"></canvas></div></div>
        <div class="chart-card span-8"><h3>Spend &amp; Revenue — Monthly Trend</h3><div class="chart-box"><canvas id="chMktTrend"></canvas></div></div>
        <div class="chart-card span-4"><h3>Revenue Share by Program</h3><div class="chart-box"><canvas id="chRevShare"></canvas></div></div>
        <div class="chart-card span-6"><h3>ROAS vs CPL — Efficiency Scatter</h3><p class="chart-sub">Bubble size = spend · ${periodLabel}</p><div class="chart-box"><canvas id="chEfficiency"></canvas></div></div>
        <div class="chart-card span-6"><h3>Spend Breakdown · ${periodLabel}</h3><div id="rankedSpend" class="ranked-bar-list"></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead(`Program Performance Detail — ${periodLabel}`, "fa-table-list")}
        ${this._programTable(programs)}
      </div>
    `;

    this._renderCharts(programs, countries, monthly);
    this._renderRankedSpend(programs);
    this._bindFilterBar();
  },

  // ---- month handling ------------------------------------------------
  // Pulls every distinct value out of the Month column and sorts it
  // chronologically. Works whether Month is stored as "2026-04",
  // "April 2026", or similar — falls back to plain text sort only if a
  // value genuinely can't be parsed as a date.
  _deriveMonths(all) {
    const raw = [...new Set(all.map((r) => r.Month).filter(Boolean))];
    raw.sort((a, b) => {
      const da = this._parseMonth(a);
      const db = this._parseMonth(b);
      if (da && db) return da - db;
      return String(a).localeCompare(String(b));
    });
    return raw;
  },

  _parseMonth(m) {
    const s = String(m).trim();
    const d = new Date(/^\d{4}-\d{2}$/.test(s) ? `${s}-01` : s);
    return isNaN(d) ? null : d;
  },

  _monthLabel(m) {
    const d = this._parseMonth(m);
    return d ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : m;
  },

  // ---- week/day comparison (real calendar dates, ignores Month entirely) ------------------------------------------------
  _dateOnly(val) {
    const d = new Date(val);
    if (isNaN(d)) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  },

  _inRange(dateVal, range) {
    const d = this._dateOnly(dateVal);
    return d && d >= range.start && d <= range.end;
  },

  _periodRanges(granularity) {
    const today = this._dateOnly(new Date());

    if (granularity === "day") {
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      return {
        current: { start: today, end: today },
        previous: { start: yesterday, end: yesterday },
        currentLabel: "Today",
        previousLabel: "Yesterday",
      };
    }

    // week
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - today.getDay());
    const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart); prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    return {
      current: { start: weekStart, end: today },
      previous: { start: prevWeekStart, end: prevWeekEnd },
      currentLabel: "This Week",
      previousLabel: "Last Week",
    };
  },

  _bindFilterBar() {
    Utils.qsa("#fGranularity button").forEach((btn) => btn.addEventListener("click", () => { this.compareGranularity = btn.dataset.granularity; this.render(); }));
    const monthSelect = Utils.qs("#fMonth");
    if (monthSelect) monthSelect.addEventListener("change", (e) => { this.activeMonth = e.target.value; this.render(); });
    const compareSelect = Utils.qs("#fCompareMonth");
    if (compareSelect) compareSelect.addEventListener("change", (e) => { this.compareMonth = e.target.value; this.render(); });
    Utils.qs("#fProgram").addEventListener("change", (e) => { this.filters.program = e.target.value; this.render(); });
    Utils.qs("#fMarket").addEventListener("change", (e) => { this.filters.country = e.target.value; this.render(); });
    Utils.qs("#fReset").addEventListener("click", () => { this.filters = { program: "", country: "" }; this.compareMonth = undefined; this.render(); });
    Utils.qsa(".chart-card-head .segmented-mini button").forEach((btn) => btn.addEventListener("click", () => { this.spendView = btn.dataset.view; this.render(); }));
  },

  _applyFilters(rows) {
    let out = rows;
    if (this.filters.program) out = out.filter((r) => r.Program === this.filters.program);
    if (this.filters.country) out = out.filter((r) => r.Country === this.filters.country);
    return out;
  },

  _aggregate(rows) {
    const revenue = Utils.sum(rows, "Revenue");
    const spend = Utils.sum(rows, "Spend");
    const profit = revenue - spend;
    const roi = spend ? (profit / spend) * 100 : 0;
    const roas = spend ? revenue / spend : 0;
    const clicks = Utils.sum(rows, "Clicks");
    const impressions = Utils.sum(rows, "Impressions");
    const ctr = impressions ? (clicks / impressions) * 100 : 0;
    const leads = Utils.sum(rows, "Leads");
    const deals = Utils.sum(rows, "DealsClosed");
    const cpl = leads ? spend / leads : 0;
    const cpa = deals ? spend / deals : 0;
    const aov = deals ? revenue / deals : 0;
    const convRate = leads ? (deals / leads) * 100 : 0;

    return { revenue, spend, profit, roi, roas, ctr, cpl, cpa, aov, deals, leads, convRate };
  },

  // ROI and CPA cards removed per request. Marketing Spend now appears
  // before Revenue.
  _kpiCards(s, prevStats) {
    const withTrend = (key) => prevStats ? Utils.pctChange(s[key], prevStats[key]) : undefined;
    return [
      { label: "Marketing Spend", value: Utils.fmtCurrency(s.spend, "INR"), icon: "fa-coins", trend: withTrend("spend") },
      { label: "Revenue", value: Utils.fmtCurrency(s.revenue, "INR"), icon: "fa-sack-dollar", trend: withTrend("revenue") },
      { label: "Profit", value: Utils.fmtCurrency(s.profit, "INR"), icon: "fa-chart-line", trend: withTrend("profit") },
      { label: "ROAS", value: `${s.roas.toFixed(2)}x`, icon: "fa-bullseye", trend: withTrend("roas") },
      { label: "CTR", value: Utils.fmtPercent(s.ctr), icon: "fa-computer-mouse", trend: withTrend("ctr") },
      { label: "CPL", value: Utils.fmtCurrency(s.cpl, "INR"), icon: "fa-user-tag", trend: withTrend("cpl") },
      { label: "Avg Order Value", value: Utils.fmtCurrency(s.aov, "INR"), icon: "fa-cart-shopping", trend: withTrend("aov") },
      { label: "Deals Closed", value: Utils.fmtNumber(s.deals), icon: "fa-award", trend: withTrend("deals") },
      { label: "Valid Leads", value: Utils.fmtNumber(s.leads), icon: "fa-user-check", trend: withTrend("leads") },
      { label: "Conversion Rate", value: Utils.fmtPercent(s.convRate), icon: "fa-percent", trend: withTrend("convRate") },
    ];
  },

  _programStats(rows) {
    const groups = Utils.groupBy(rows, "Program");
    return Object.entries(groups).map(([name, rs], i) => {
      const spend = Utils.sum(rs, "Spend");
      const revenue = Utils.sum(rs, "Revenue");
      const leads = Utils.sum(rs, "Leads");
      const deals = Utils.sum(rs, "DealsClosed");
      return {
        name,
        color: Charts.palette[i % Charts.palette.length],
        spend, revenue, leads, deals,
        roas: spend ? revenue / spend : 0,
        cpl: leads ? spend / leads : 0,
        cvr: leads ? (deals / leads) * 100 : 0,
      };
    }).sort((a, b) => b.spend - a.spend);
  },

  _countryStats(rows) {
    const groups = Utils.groupBy(rows, "Country");
    return Object.entries(groups).map(([name, rs]) => ({
      name,
      leads: Utils.sum(rs, "Leads"),
      deals: Utils.sum(rs, "DealsClosed"),
    })).sort((a, b) => b.leads - a.leads);
  },

  _monthlySeries(all, monthOrder) {
    return monthOrder.map((m) => {
      const rs = all.filter((r) => r.Month === m);
      return {
        month: m,
        label: this._monthLabel(m),
        spend: Utils.sum(rs, "Spend"),
        revenue: Utils.sum(rs, "Revenue"),
        leads: Utils.sum(rs, "Leads"),
        deals: Utils.sum(rs, "DealsClosed"),
      };
    });
  },

  _buildInsight(programs, monthly, stats) {
    if (!programs.length) return `<span>No program-level data matches the current filters.</span>`;

    const isMonthMode = this.compareGranularity === "month";
    const idx = isMonthMode ? monthly.findIndex((m) => m.month === this.activeMonth) : -1;
    const prev = idx > 0 ? monthly[idx - 1] : null;
    const isBreakout = isMonthMode && stats.revenue > stats.spend && prev && prev.revenue <= prev.spend;

    const label = isMonthMode
      ? this._monthLabel(this.activeMonth)
      : (this.compareGranularity === "day" ? "Today" : "This Week");

    const best = [...programs].sort((a, b) => b.roas - a.roas)[0];
    const worst = [...programs].sort((a, b) => a.roas - b.roas)[0];

    const parts = [];
    parts.push(`<b>${label}${isBreakout ? " — breakout month" : ""}:</b> ROAS hit <b>${stats.roas.toFixed(2)}x</b> (${Utils.fmtCurrency(stats.revenue, "INR")} revenue vs ${Utils.fmtCurrency(stats.spend, "INR")} spend).`);
    if (best) parts.push(`<b>${best.name}</b> delivered the strongest return at <b>${best.roas.toFixed(2)}x</b> ROAS.`);
    if (worst && worst.roas < 1) parts.push(`⚠ <b>${worst.name}</b> is running at only <b>${worst.roas.toFixed(2)}x</b> ROAS — worth reviewing spend allocation.`);
    return parts.join(" ");
  },

  _renderCharts(programs, countries, monthly) {
    const valueFor = (p) => this.spendView === "spend" ? p.spend : this.spendView === "roas" ? p.roas : p.cpl;

    Charts.bar("chSpendByProgram", programs.map((p) => p.name), [{
      label: this.spendView.toUpperCase(),
      data: programs.map(valueFor),
      backgroundColor: programs.map((p) => p.color),
    }], { plugins: { legend: { display: false } } });

    Charts.bar("chLeadsMarket", countries.map((c) => c.name), [
      { label: "Valid Leads", data: countries.map((c) => c.leads) },
      { label: "Deals", data: countries.map((c) => c.deals) },
    ]);

    Charts.line("chMktTrend", monthly.map((m) => m.label), [
      { label: "Spend", data: monthly.map((m) => m.spend) },
      { label: "Revenue", data: monthly.map((m) => m.revenue) },
    ]);

    Charts.donut("chRevShare", programs.map((p) => p.name), programs.map((p) => p.revenue));

    const maxSpend = Math.max(...programs.map((p) => p.spend), 1);
    Charts.bubble("chEfficiency", programs.map((p) => ({
      label: p.name,
      x: p.cpl,
      y: p.roas,
      r: Math.max(8, Math.min(38, (p.spend / maxSpend) * 38)),
      color: p.color,
    })), {
      scales: {
        x: { title: { display: true, text: "CPL (₹)" } },
        y: { title: { display: true, text: "ROAS" } },
      },
    });
  },

  _renderRankedSpend(programs) {
    const box = Utils.qs("#rankedSpend");
    if (!programs.length) { box.innerHTML = `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No records match the current filters.</p></div>`; return; }
    const max = Math.max(...programs.map((p) => p.spend), 1);
    box.innerHTML = programs.map((p) => `
      <div class="ranked-bar-row">
        <span class="ranked-bar-label">${p.name}</span>
        <div class="ranked-bar-track">
          <div class="ranked-bar-fill" style="width:${Math.max(4, (p.spend / max) * 100)}%; background:${p.color}"></div>
        </div>
        <span class="ranked-bar-value">${Utils.fmtCurrency(p.spend, "INR")}</span>
        <span class="badge ${p.roas >= 1 ? "badge-success" : "badge-neutral"}">${p.roas.toFixed(2)}x</span>
      </div>`).join("");
  },

  _programTable(programs) {
    if (!programs.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No records match the current filters.</p></div>`;
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Program</th><th>Spend</th><th>Revenue</th><th>ROAS</th><th>Valid Leads</th><th>Deals</th><th>CPL</th><th>CVR %</th>
          </tr></thead>
          <tbody>
            ${programs.map((p) => `
              <tr>
                <td>${p.name}</td>
                <td>${Utils.fmtCurrency(p.spend, "INR")}</td>
                <td>${Utils.fmtCurrency(p.revenue, "INR")}</td>
                <td><span class="badge ${p.roas >= 1 ? "badge-success" : "badge-neutral"}">${p.roas.toFixed(2)}x</span></td>
                <td>${Utils.fmtNumber(p.leads)}</td>
                <td>${Utils.fmtNumber(p.deals)}</td>
                <td>${Utils.fmtCurrency(p.cpl, "INR")}</td>
                <td>${Utils.fmtPercent(p.cvr)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  },
};
