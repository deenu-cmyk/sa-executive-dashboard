/* ============================================================
   MODULE 2 — PAYMENT TRACKER
   ============================================================ */

const ModPayments = {
  render() {
    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="panel">
        ${Components.sectionHead("Sales Target vs Achieved", "fa-bullseye")}
        ${this._salesTargetSection()}
      </div>
    `;

    this._renderSalesTargetChart();
  },

  _salesTargetSection() {
    const GOAL_PCT = 0.8;
    const rows = DataStore.get("salesTargetCSV");
    if (!rows.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No sales target data available.</p></div>`;

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
        { label: "At 80% Goal", value: `${atGoalCount} / ${rows.length}`, icon: "fa-medal" },
        { label: "Top Performer", value: topPerformer ? topPerformer.Owner : "—", icon: "fa-crown" },
        { label: "Gap to Team Goal", value: overallGoalGap <= 0 ? "Goal met" : Utils.fmtCurrency(overallGoalGap, "USD"), icon: "fa-arrow-trend-up" },
      ])}

      <div class="chart-card" style="margin: 16px 0;">
        <h3>Target Achievement by Owner</h3>
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

  _renderSalesTargetChart() {
    const rows = DataStore.get("salesTargetCSV");
    if (!rows.length) return;

    // Same ranking (by % achieved) used in the table above, so the chart
    // and table always agree on order.
    const ranked = [...rows].map((r) => {
      const target = Number(r.Target) || 0;
      const achieved = Number(r.Achieved) || 0;
      return { owner: r.Owner, pct: target ? (achieved / target) * 100 : 0 };
    }).sort((a, b) => b.pct - a.pct);

    // goalBar draws one bar per owner, colored green/orange/red by threshold,
    // with a dashed 80% goal line and a % label on every bar.
    Charts.goalBar("chTargetVsAchieved", ranked.map((r) => r.owner), ranked.map((r) => r.pct), 80);
  },
};
