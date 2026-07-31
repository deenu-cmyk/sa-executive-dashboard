/* ============================================================
   MODULE 2 — PAYMENT TRACKER
   ============================================================ */

const ModPayments = {
  // Year → Month drill-down state. activeYear/activeMonth are null until
  // real dates are found in the data (graceful fallback to "show everything"
  // for sheets that haven't added a Date column yet).
  activeYear: null,
  activeMonth: null, // "YYYY-MM" or null (null = whole year / whole dataset)

  render() {
    const all = DataStore.get("salesTargetCSV");
    const hasDates = all.some((r) => this._parseDate(r.Date));
    const years = hasDates ? this._deriveYears(all) : [];

    if (hasDates) {
      if (!this.activeYear || !years.includes(this.activeYear)) {
        this.activeYear = years[years.length - 1] || null;
        this.activeMonth = null;
      }
    }

    const rows = this._filteredRows(all, hasDates);
    const scopeLabel = this._scopeLabel(hasDates);

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="panel">
        ${this._yearMonthNav(all, years, hasDates)}
      </div>
      <div class="panel">
        ${Components.sectionHead(`Sales Target vs Achieved${scopeLabel ? " — " + scopeLabel : ""}`, "fa-bullseye")}
        ${this._salesTargetSection(rows)}
      </div>
    `;
    this._renderSalesTargetChart(rows);
    this._bindNav();
  },

  // ---- Year / Month drill-down ------------------------------------------------

  _parseDate(v) {
    const d = new Date(v);
    return isNaN(d) ? null : d;
  },

  _yearKey(v) {
    return String(v || "").slice(0, 4);
  },

  _monthKey(v) {
    return String(v || "").slice(0, 7);
  },

  _deriveYears(rows) {
    const years = [...new Set(rows.map((r) => this._yearKey(r.Date)).filter(Boolean))];
    return years.sort();
  },

  _monthsForYear(rows, year) {
    return [...new Set(
      rows.filter((r) => this._yearKey(r.Date) === year).map((r) => this._monthKey(r.Date))
    )];
  },

  _filteredRows(all, hasDates) {
    if (!hasDates) return all; // legacy sheets without a Date column: no filtering
    if (this.activeMonth) return all.filter((r) => this._monthKey(r.Date) === this.activeMonth);
    if (this.activeYear) return all.filter((r) => this._yearKey(r.Date) === this.activeYear);
    return all;
  },

  _scopeLabel(hasDates) {
    if (!hasDates) return "";
    if (this.activeMonth) {
      const d = new Date(`${this.activeMonth}-01`);
      return isNaN(d) ? this.activeMonth : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return this.activeYear ? `${this.activeYear} (All Months)` : "";
  },

  _yearMonthNav(all, years, hasDates) {
    if (!hasDates) {
      return `<p class="chart-sub" style="margin:0;">Add a <b>Date</b> column (format <code>YYYY-MM-DD</code>) to your Sales Target sheet — one row per Region/Owner per month — to enable the Year → Month drill-down here.</p>`;
    }

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsInYear = this._monthsForYear(all, this.activeYear);
    const btnStyle = (active) => active ? "background:var(--accent); color:#fff; border-color:var(--accent);" : "";

    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <label style="font-size:12px; text-transform:uppercase; opacity:.7; margin-right:4px;">Year</label>
          ${years.map((y) => `<button class="btn-reset year-btn" data-year="${y}" style="${btnStyle(y === this.activeYear)}">${y}</button>`).join("")}
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <label style="font-size:12px; text-transform:uppercase; opacity:.7; margin-right:4px;">Month</label>
          <button class="btn-reset month-btn" data-month="" style="${btnStyle(!this.activeMonth)}">All ${this.activeYear}</button>
          ${MONTH_NAMES.map((name, idx) => {
            const key = `${this.activeYear}-${String(idx + 1).padStart(2, "0")}`;
            const hasData = monthsInYear.includes(key);
            const active = this.activeMonth === key;
            return `<button class="btn-reset month-btn" data-month="${key}" ${hasData ? "" : "disabled"} style="${btnStyle(active)} ${hasData ? "" : "opacity:.35; cursor:not-allowed;"}">${name}</button>`;
          }).join("")}
        </div>
      </div>`;
  },

  _bindNav() {
    Utils.qsa(".year-btn").forEach((btn) => btn.addEventListener("click", () => {
      this.activeYear = btn.dataset.year;
      this.activeMonth = null;
      this.render();
    }));
    Utils.qsa(".month-btn").forEach((btn) => btn.addEventListener("click", () => {
      if (btn.disabled) return;
      this.activeMonth = btn.dataset.month || null;
      this.render();
    }));
  },

  _salesTargetSection(rows) {
    const GOAL_PCT = 0.8;
    if (!rows.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No sales target data for this period.</p></div>`;

    const totalTarget = Utils.sum(rows, "Target");
    const totalAchieved = Utils.sum(rows, "Achieved");
    const overallPct = totalTarget ? (totalAchieved / totalTarget) * 100 : 0;
    const overallGoalGap = Math.max(0, totalTarget * GOAL_PCT - totalAchieved);

    // Group by Owner and sum Target/Achieved across months first. Without
    // this, an owner with data in 3 different months would show up as 3
    // separate rows/bars in an "All Year" or multi-month view instead of
    // one combined total.
    const grouped = this._groupByOwner(rows);
    const atGoalCount = grouped.filter((r) => r.achieved >= r.target * GOAL_PCT).length;

    const ranked = grouped.map((r) => ({
      ...r, pct: r.target ? (r.achieved / r.target) * 100 : 0,
    })).sort((a, b) => b.pct - a.pct);

    const topPerformer = ranked[0];
    const medals = ["🥇", "🥈", "🥉"];

    const body = ranked.map((r, i) => {
      // Same three-tier thresholds as the chart: green >= 80%, orange >= 50%, red below.
      const barColor = r.pct >= 80 ? "#3FD98E" : r.pct >= 50 ? "#FFC24B" : "#FF5C7A";
      const goalGap = Math.max(0, r.target * GOAL_PCT - r.achieved);
      const goalCell = goalGap <= 0
        ? `<span class="badge badge-success">Goal met</span>`
        : Utils.fmtCurrency(goalGap, "USD");
      return `
        <tr>
          <td class="rank-cell">${medals[i] || `#${i + 1}`}</td>
          <td>${r.Region}</td>
          <td>${r.Owner}</td>
          <td>${Utils.fmtCurrency(r.target, "USD")}</td>
          <td>${Utils.fmtCurrency(r.achieved, "USD")}</td>
          <td>
            <div class="target-progress">
              <div class="target-progress-track"><div class="target-progress-fill" style="width:${Math.min(100, r.pct)}%; background:${barColor}"></div></div>
              <span class="target-progress-label">${r.pct.toFixed(0)}%</span>
            </div>
          </td>
          <td>${goalCell}</td>
        </tr>`;
    }).join("");

    return `
      ${Components.kpiRow([
        { label: "Team Target", value: Utils.fmtCurrency(totalTarget, "USD"), icon: "fa-bullseye" },
        { label: "Team Achieved", value: Utils.fmtCurrency(totalAchieved, "USD"), icon: "fa-flag-checkered" },
        { label: "Overall Achievement", value: Utils.fmtPercent(overallPct), icon: "fa-chart-pie" },
        { label: "At 80% Goal", value: `${atGoalCount} / ${grouped.length}`, icon: "fa-medal" },
        { label: "Top Performer", value: topPerformer ? topPerformer.Owner : "—", icon: "fa-crown" },
        { label: "Gap to Team Goal", value: overallGoalGap <= 0 ? "Goal met" : Utils.fmtCurrency(overallGoalGap, "USD"), icon: "fa-arrow-trend-up" },
      ])}
      <div class="chart-card" style="margin: 16px 0;">
        <h3>Target vs Achieved by Owner</h3>
        <div class="chart-box" style="height:${Math.max(220, ranked.length * 34)}px"><canvas id="chTargetVsAchieved"></canvas></div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Region</th><th>Lead Owner</th><th>Target</th><th>Achieved</th><th>Progress</th><th>Needed for 80% Goal</th></tr></thead>
          <tbody>${body}</tbody>
          <tfoot>
            <tr class="target-total-row">
              <td></td>
              <td colspan="2">Team Total</td>
              <td>${Utils.fmtCurrency(totalTarget, "USD")}</td>
              <td>${Utils.fmtCurrency(totalAchieved, "USD")}</td>
              <td>
                <div class="target-progress">
                  <div class="target-progress-track"><div class="target-progress-fill" style="width:${Math.min(100, overallPct)}%; background:var(--accent)"></div></div>
                  <span class="target-progress-label">${overallPct.toFixed(0)}%</span>
                </div>
              </td>
              <td>${overallGoalGap <= 0 ? `<span class="badge badge-success">Goal met</span>` : Utils.fmtCurrency(overallGoalGap, "USD")}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  },

  _renderSalesTargetChart(rows) {
    if (!rows.length) return;
    // Same grouping + ranking (by % achieved) used in the table above, so
    // the chart and table always show the same owners in the same order —
    // one bar per owner, summed across whatever months are in view.
    const grouped = this._groupByOwner(rows);
    const ranked = grouped.map((r) => ({
      owner: r.Owner, target: r.target, achieved: r.achieved,
      pct: r.target ? (r.achieved / r.target) * 100 : 0,
    })).sort((a, b) => b.pct - a.pct);
    // Grouped dollar bars — Target vs Achieved side by side per owner —
    // instead of a single % achievement bar.
    Charts.bar("chTargetVsAchieved", ranked.map((r) => r.owner), [
      { label: "Target", data: ranked.map((r) => r.target) },
      { label: "Achieved", data: ranked.map((r) => r.achieved) },
    ]);
  },

  // Sums Target/Achieved across all rows for the same Owner. If an owner's
  // rows span more than one Region, Region is shown as "Multiple" rather
  // than silently picking one.
  _groupByOwner(rows) {
    const map = {};
    rows.forEach((r) => {
      const key = r.Owner || "Unknown";
      if (!map[key]) map[key] = { Owner: r.Owner, Region: r.Region, target: 0, achieved: 0 };
      map[key].target += Number(r.Target) || 0;
      map[key].achieved += Number(r.Achieved) || 0;
      if (map[key].Region && r.Region && map[key].Region !== r.Region) map[key].Region = "Multiple";
    });
    return Object.values(map);
  },
};
