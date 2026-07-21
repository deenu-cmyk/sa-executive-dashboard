/* ============================================================
   MODULE 2 — PAYMENT TRACKER
   ============================================================ */

const ModPayments = {
  activeRegion: "All",

  render() {
    const all = DataStore.get("paymentTrackerCSV");
    const regions = ["All", "India", "USA", "APAC", "EMEA", "Chat"];
    const rows = this.activeRegion === "All" ? all : all.filter((r) => r.Region === this.activeRegion);

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="tab-bar">${regions.map((r) => `<button class="tab ${r === this.activeRegion ? "active" : ""}" data-region="${r}">${r}</button>`).join("")}</div>

      <div class="panel">
        ${Components.sectionHead(`Payment Records — ${this.activeRegion}`, "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "PaymentID", label: "Payment ID" },
          { key: "Date", label: "Date" },
          { key: "Region", label: "Region" },
          { key: "Country", label: "Country" },
          { key: "Course", label: "Course" },
          { key: "Amount", label: "Amount", fmt: (v) => Utils.fmtCurrency(v) },
          { key: "Status", label: "Status", fmt: (v) => Components.statusBadge(v) },
        ], { limit: 200 })}
      </div>

      <div class="panel">
        ${Components.sectionHead("Sales Target vs Achieved", "fa-bullseye")}
        ${this._salesTargetSection()}
      </div>
    `;

    this._renderSalesTargetChart();

    Utils.qsa(".tab-bar .tab").forEach((btn) => btn.addEventListener("click", () => { this.activeRegion = btn.dataset.region; this.render(); }));
  },

  _salesTargetSection() {
    const GOAL_PCT = 0.8;
    const all = DataStore.get("salesTargetCSV");
    const rows = this.activeRegion === "All" ? all : all.filter((r) => r.Region === this.activeRegion);
    if (!rows.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No sales target data for this region.</p></div>`;

    const totalTarget = Utils.sum(rows, "Target");
    const totalAchieved = Utils.sum(rows, "Achieved");
    const overallPct = totalTarget ? (totalAchieved / totalTarget) * 100 : 0;
    const overallGoalGap = Math.max(0, totalTarget * GOAL_PCT - totalAchieved);
    const atGoalCount = rows.filter((r) => Number(r.Achieved) >= Number(r.Target) * GOAL_PCT).length;

    const ranked = [...rows].map((r) => {
      const target = Number(r.Target) || 0;
      const achieved = Number(r.Achieved) || 0;
      return { ...r, target, achieved, pct: target ? (achieved / target) * 100 : 0 };
    }).sort((a, b) => b.pct - a.pct);

    const topPerformer = ranked[0];
    const medals = ["🥇", "🥈", "🥉"];

    const body = ranked.map((r, i) => {
      const barColor = r.pct >= 100 ? "#3FD98E" : r.pct >= 50 ? "#00C2A8" : "#FF7A59";
      const goalGap = Math.max(0, r.target * GOAL_PCT - r.achieved);
      const goalCell = goalGap <= 0
        ? `<span class="badge badge-success">Goal met</span>`
        : Utils.fmtCurrency(goalGap);
      return `
        <tr>
          <td class="rank-cell">${medals[i] || `#${i + 1}`}</td>
          <td>${r.Region}</td>
          <td>${r.Owner}</td>
          <td>${Utils.fmtCurrency(r.target)}</td>
          <td>${Utils.fmtCurrency(r.achieved)}</td>
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
        { label: "Team Target", value: Utils.fmtCurrency(totalTarget), icon: "fa-bullseye" },
        { label: "Team Achieved", value: Utils.fmtCurrency(totalAchieved), icon: "fa-flag-checkered" },
        { label: "Overall Achievement", value: Utils.fmtPercent(overallPct), icon: "fa-chart-pie" },
        { label: "At 80% Goal", value: `${atGoalCount} / ${rows.length}`, icon: "fa-medal" },
        { label: "Top Performer", value: topPerformer ? topPerformer.Owner : "—", icon: "fa-crown" },
        { label: "Gap to Team Goal", value: overallGoalGap <= 0 ? "Goal met" : Utils.fmtCurrency(overallGoalGap), icon: "fa-arrow-trend-up" },
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
              <td>${Utils.fmtCurrency(totalTarget)}</td>
              <td>${Utils.fmtCurrency(totalAchieved)}</td>
              <td>
                <div class="target-progress">
                  <div class="target-progress-track"><div class="target-progress-fill" style="width:${Math.min(100, overallPct)}%; background:var(--accent)"></div></div>
                  <span class="target-progress-label">${overallPct.toFixed(0)}%</span>
                </div>
              </td>
              <td>${overallGoalGap <= 0 ? `<span class="badge badge-success">Goal met</span>` : Utils.fmtCurrency(overallGoalGap)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  },

  _renderSalesTargetChart() {
    const all = DataStore.get("salesTargetCSV");
    const rows = this.activeRegion === "All" ? all : all.filter((r) => r.Region === this.activeRegion);
    if (!rows.length) return;
    const ranked = [...rows].map((r) => ({
      owner: r.Owner,
      target: Number(r.Target) || 0,
      achieved: Number(r.Achieved) || 0,
    })).sort((a, b) => b.achieved - a.achieved);

    Charts.bar("chTargetVsAchieved", ranked.map((r) => r.owner), [
      { label: "Target", data: ranked.map((r) => r.target) },
      { label: "Achieved", data: ranked.map((r) => r.achieved) },
    ], { indexAxis: "y" });
  },
};
