/* ============================================================
   MODULE 4 — MARKETING
   ============================================================ */

const ModMarketing = {
  activeMonth: "2026-06",
  monthLabels: { "2026-04": "April 2026", "2026-05": "May 2026", "2026-06": "June 2026" },
  spendView: "spend", // spend | roas | cpl

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
    const deals = Utils.sum(rows, "DealsClosed");
    const cpl = leads ? spend / leads : 0;
    const cpa = deals ? spend / deals : 0;
    const aov = deals ? revenue / deals : 0;
    const convRate = leads ? (deals / leads) * 100 : 0;

    const programs = this._programStats(rows);
    const countries = this._countryStats(rows);
    const monthly = this._monthlySeries(all);

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
        { label: "Valid Leads", value: Utils.fmtNumber(leads), icon: "fa-user-check" },
        { label: "Conversion Rate", value: Utils.fmtPercent(convRate), icon: "fa-percent" },
      ])}

      <div class="insight-banner">${this._buildInsight(programs, monthly, roas, revenue, spend)}</div>

      <div class="chart-grid">
        <div class="chart-card span-6">
          <div class="chart-card-head">
            <h3>Spend by Program · ${this.monthLabels[this.activeMonth]}</h3>
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

        <div class="chart-card span-6"><h3>ROAS vs CPL — Efficiency Scatter</h3><p class="chart-sub">Bubble size = spend · ${this.monthLabels[this.activeMonth]}</p><div class="chart-box"><canvas id="chEfficiency"></canvas></div></div>
        <div class="chart-card span-6"><h3>Spend Breakdown · ${this.monthLabels[this.activeMonth]}</h3><div id="rankedSpend" class="ranked-bar-list"></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead(`Program Performance Detail — ${this.monthLabels[this.activeMonth]}`, "fa-table-list")}
        ${this._programTable(programs)}
      </div>
    `;

    this._renderCharts(programs, countries, monthly);
    this._renderRankedSpend(programs);

    Utils.qsa(".tab-bar .tab").forEach((btn) => btn.addEventListener("click", () => { this.activeMonth = btn.dataset.month; this.render(); }));
    Utils.qsa(".segmented-mini button").forEach((btn) => btn.addEventListener("click", () => { this.spendView = btn.dataset.view; this.render(); }));
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

  _monthlySeries(all) {
    const months = Object.keys(this.monthLabels);
    return months.map((m) => {
      const rs = all.filter((r) => r.Month === m);
      return {
        month: m,
        label: this.monthLabels[m],
        spend: Utils.sum(rs, "Spend"),
        revenue: Utils.sum(rs, "Revenue"),
        leads: Utils.sum(rs, "Leads"),
        deals: Utils.sum(rs, "DealsClosed"),
      };
    });
  },

  _buildInsight(programs, monthly, roas, revenue, spend) {
    if (!programs.length) return `<span>No program-level data for this month yet.</span>`;
    const idx = monthly.findIndex((m) => m.month === this.activeMonth);
    const prev = idx > 0 ? monthly[idx - 1] : null;
    const isBreakout = revenue > spend && prev && prev.revenue <= prev.spend;

    const best = [...programs].sort((a, b) => b.roas - a.roas)[0];
    const worst = [...programs].sort((a, b) => a.roas - b.roas)[0];

    const parts = [];
    parts.push(`<b>${this.monthLabels[this.activeMonth]}${isBreakout ? " — breakout month" : ""}:</b> ROAS hit <b>${roas.toFixed(2)}x</b> (${Utils.fmtCurrency(revenue)} revenue vs ${Utils.fmtCurrency(spend)} spend).`);
    if (best) parts.push(`<b>${best.name}</b> delivered the strongest return at <b>${best.roas.toFixed(2)}x</b> ROAS.`);
    if (worst && worst.roas < 1) parts.push(`⚠ <b>${worst.name}</b> is running at only <b>${worst.roas.toFixed(2)}x</b> ROAS — worth reviewing spend allocation.`);
    return parts.join(" ");
  },

  _renderCharts(programs, countries, monthly) {
    // Spend by program (toggleable)
    const valueFor = (p) => this.spendView === "spend" ? p.spend : this.spendView === "roas" ? p.roas : p.cpl;
    Charts.bar("chSpendByProgram", programs.map((p) => p.name), [{
      label: this.spendView.toUpperCase(),
      data: programs.map(valueFor),
      backgroundColor: programs.map((p) => p.color),
    }], { plugins: { legend: { display: false } } });

    // Leads & deals by market
    Charts.bar("chLeadsMarket", countries.map((c) => c.name), [
      { label: "Valid Leads", data: countries.map((c) => c.leads) },
      { label: "Deals", data: countries.map((c) => c.deals) },
    ]);

    // Monthly trend
    Charts.line("chMktTrend", monthly.map((m) => m.label), [
      { label: "Spend", data: monthly.map((m) => m.spend) },
      { label: "Revenue", data: monthly.map((m) => m.revenue) },
    ]);

    // Revenue share donut
    Charts.donut("chRevShare", programs.map((p) => p.name), programs.map((p) => p.revenue));

    // Efficiency bubble scatter
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
    const max = Math.max(...programs.map((p) => p.spend), 1);
    box.innerHTML = programs.map((p) => `
      <div class="ranked-bar-row">
        <span class="ranked-bar-label">${p.name}</span>
        <div class="ranked-bar-track">
          <div class="ranked-bar-fill" style="width:${Math.max(4, (p.spend / max) * 100)}%; background:${p.color}"></div>
        </div>
        <span class="ranked-bar-value">${Utils.fmtCurrency(p.spend)}</span>
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
                <td>${Utils.fmtCurrency(p.spend)}</td>
                <td>${Utils.fmtCurrency(p.revenue)}</td>
                <td><span class="badge ${p.roas >= 1 ? "badge-success" : "badge-neutral"}">${p.roas.toFixed(2)}x</span></td>
                <td>${Utils.fmtNumber(p.leads)}</td>
                <td>${Utils.fmtNumber(p.deals)}</td>
                <td>${Utils.fmtCurrency(p.cpl)}</td>
                <td>${Utils.fmtPercent(p.cvr)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  },
};
