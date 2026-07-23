/* ============================================================
   MODULE 2 — PAYMENT TRACKER
   (Currently shows Sales Target vs Achieved — connect
   paymentTrackerCSV in config.js to add real payment records.)
   ============================================================ */

const ModPayments = {
  GOAL_PCT: 80,

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

  _colorFor(pct) {
    if (pct >= this.GOAL_PCT) return "#3FD98E";
    if (pct >= 50) return "#FFC24B";
    return "#FF5C7A";
  },

  _salesTargetSection() {
    const rows = DataStore.get("salesTargetCSV");
    if (!rows.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No sales target data connected yet.</p></div>`;

    const totalTarget = Utils.sum(rows, "Target");
    const totalAchieved = Utils.sum(rows, "Achieved");
    const overallPct = totalTarget ? (totalAchieved / totalTarget) * 100 : 0;
    const overallGoalGap = Math.max(0, totalTarget * (this.GOAL_PCT / 100) - totalAchieved);
    const atGoalCount = rows.filter((r) => Utils.toNumber(r.Achieved) >= Utils.toNumber(r.Target) * (this.GOAL_PCT / 100)).length;

    const ranked = [...rows].map((r) => {
      const target = Utils.toNumber(r.Target);
      const achieved = Utils.toNumber(r.Achieved);
      return { ...r, target, achieved, pct: target ? (achieved / target) * 100 : 0 };
    }).sort((a, b) => b.pct - a.pct);

    const topPerformer = ranked[0];
    const medals = ["🥇", "🥈", "🥉"];

    const body = ranked.map((r, i) => {
      const barColor = this._colorFor(r.pct);
      const goalGap = Math.max(0, r.target * (this.GOAL_PCT / 100) - r.achieved);
      const goalCell = goalGap <= 0
        ? `<span class="badge badge-success">Goal met</span>`
        : Utils.fmtCurrency(goalGap, "USD", false);
      return `
        <tr>
          <td class="rank-cell">${medals[i] || `#${i + 1}`}</td>
          <td>${r.Region}</td>
          <td>${r.Owner}</td>
          <td>${Utils.fmtCurrency(r.target, "USD", false)}</td>
          <td>${Utils.fmtCurrency(r.achieved, "USD", false)}</td>
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
        { label: "Team Target", value: Utils.fmtCurrency(totalTarget, "USD", false), icon: "fa-bullseye" },
        { label: "Team Achieved", value: Utils.fmtCurrency(totalAchieved, "USD", false), icon: "fa-flag-checkered" },
        { label: "Overall Achievement", value: Utils.fmtPercent(overallPct), icon: "fa-chart-pie" },
        { label: `At ${this.GOAL_PCT}% Goal`, value: `${atGoalCount} / ${rows.length}`, icon: "fa-medal" },
        { label: "Top Performer", value: topPerformer ? topPerformer.Owner : "—", icon: "fa-crown" },
        { label: "Gap to Team Goal", value: overallGoalGap <= 0 ? "Goal met" : Utils.fmtCurrency(overallGoalGap, "USD", false), icon: "fa-arrow-trend-up" },
      ])}

      <div class="chart-card" style="margin: 16px 0;">
        <div class="chart-card-head">
          <h3>% of Target Achieved by Owner</h3>
          <div class="legend-dots">
            <span><i style="background:#3FD98E"></i> ≥ ${this.GOAL_PCT}%</span>
            <span><i style="background:#FFC24B"></i> 50–${this.GOAL_PCT - 1}%</span>
            <span><i style="background:#FF5C7A"></i> &lt; 50%</span>
          </div>
        </div>
        <div class="chart-box" style="height:${Math.max(220, ranked.length * 34)}px"><canvas id="chTargetVsAchieved"></canvas></div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>#</th><th>Region</th><th>Lead Owner</th><th>Target</th><th>Achieved</th><th>Progress</th><th>Needed for ${this.GOAL_PCT}% Goal</th></tr></thead>
          <tbody>${body}</tbody>
          <tfoot>
            <tr class="target-total-row">
              <td></td>
              <td colspan="2">Team Total</td>
              <td>${Utils.fmtCurrency(totalTarget, "USD", false)}</td>
              <td>${Utils.fmtCurrency(totalAchieved, "USD", false)}</td>
              <td>
                <div class="target-progress">
                  <div class="target-progress-track"><div class="target-progress-fill" style="width:${Math.min(100, overallPct)}%; background:${this._colorFor(overallPct)}"></div></div>
                  <span class="target-progress-label">${overallPct.toFixed(0)}%</span>
                </div>
              </td>
              <td>${overallGoalGap <= 0 ? `<span class="badge badge-success">Goal met</span>` : Utils.fmtCurrency(overallGoalGap, "USD", false)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  },

  _renderSalesTargetChart() {
    const rows = DataStore.get("salesTargetCSV");
    if (!rows.length) return;
    const ranked = [...rows].map((r) => {
      const target = Utils.toNumber(r.Target);
      const achieved = Utils.toNumber(r.Achieved);
      return { owner: r.Owner, pct: target ? (achieved / target) * 100 : 0 };
    }).sort((a, b) => b.pct - a.pct);

    Charts.goalBar("chTargetVsAchieved", ranked.map((r) => r.owner), ranked.map((r) => r.pct), this.GOAL_PCT);
  },
};

