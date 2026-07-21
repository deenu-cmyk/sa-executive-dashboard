/* ============================================================
   MODULE 2 — PAYMENT TRACKER
   ============================================================ */

const ModPayments = {
  activeRegion: "All",

  render() {
    const all = DataStore.get("paymentTrackerCSV");
    const regions = ["All", "India", "USA", "APAC", "EMEA", "CHAT"];
    const rows = this.activeRegion === "All" ? all : all.filter((r) => r.Region === this.activeRegion);

    const revenue = Utils.sum(rows, "Amount");
    const completed = rows.filter((r) => r.Status === "Completed");
    const pending = rows.filter((r) => r.Status === "Pending");
    const refunded = rows.filter((r) => r.Status === "Refunded");
    const successRate = rows.length ? (completed.length / rows.length) * 100 : 0;

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="tab-bar">${regions.map((r) => `<button class="tab ${r === this.activeRegion ? "active" : ""}" data-region="${r}">${r}</button>`).join("")}</div>

      ${Components.kpiRow([
        { label: "Revenue", value: Utils.fmtCurrency(revenue), icon: "fa-sack-dollar" },
        { label: "Payments", value: Utils.fmtNumber(rows.length), icon: "fa-receipt" },
        { label: "Completed", value: Utils.fmtNumber(completed.length), icon: "fa-circle-check" },
        { label: "Pending", value: Utils.fmtNumber(pending.length), icon: "fa-hourglass-half" },
        { label: "Refunds", value: Utils.fmtNumber(refunded.length), icon: "fa-rotate-left" },
        { label: "Success Rate", value: Utils.fmtPercent(successRate), icon: "fa-bullseye" },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-6"><h3>Daily Trend</h3><div class="chart-box"><canvas id="chPayDaily"></canvas></div></div>
        <div class="chart-card span-6"><h3>Regional Comparison</h3><div class="chart-box"><canvas id="chPayRegion"></canvas></div></div>
      </div>

      <div class="panel">
        ${Components.sectionHead("Payment Records", "fa-table-list")}
        ${Components.dataTable(rows, [
          { key: "PaymentID", label: "Payment ID" },
          { key: "Date", label: "Date" },
          { key: "Region", label: "Region" },
          { key: "Country", label: "Country" },
          { key: "Course", label: "Course" },
          { key: "Amount", label: "Amount", fmt: (v) => Utils.fmtCurrency(v) },
          { key: "Status", label: "Status", fmt: (v) => Components.statusBadge(v) },
        ])}
      </div>

      <div class="panel">
        ${Components.sectionHead("Sales Target vs Achieved", "fa-bullseye")}
        ${this._salesTargetTable()}
      </div>
    `;

    const byDate = {};
    rows.forEach((r) => { byDate[r.Date] = (byDate[r.Date] || 0) + r.Amount; });
    const dates = Object.keys(byDate).sort().slice(-30);
    Charts.line("chPayDaily", dates, [{ label: "Revenue", data: dates.map((d) => byDate[d]) }]);

    const byRegion = Utils.groupBy(all, "Region");
    Charts.bar("chPayRegion", Object.keys(byRegion), [{ label: "Revenue", data: Object.values(byRegion).map((g) => Utils.sum(g, "Amount")) }]);

    Utils.qsa(".tab-bar .tab").forEach((btn) => btn.addEventListener("click", () => { this.activeRegion = btn.dataset.region; this.render(); }));
  },

  _salesTargetTable() {
    const GOAL_PCT = 0.8; // 80% goal threshold
    const all = DataStore.get("salesTargetCSV");
    const rows = this.activeRegion === "All" ? all : all.filter((r) => r.Region === this.activeRegion);
    if (!rows.length) return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No sales target data for this region.</p></div>`;

    const totalTarget = Utils.sum(rows, "Target");
    const totalAchieved = Utils.sum(rows, "Achieved");
    const overallPct = totalTarget ? (totalAchieved / totalTarget) * 100 : 0;
    const overallGoalGap = Math.max(0, totalTarget * GOAL_PCT - totalAchieved);

    const body = rows.map((r) => {
      const target = Number(r.Target) || 0;
      const achieved = Number(r.Achieved) || 0;
      const pct = target ? (achieved / target) * 100 : 0;
      const barColor = pct >= 100 ? "#3FD98E" : pct >= 50 ? "#00C2A8" : "#FF7A59";
      const goalGap = Math.max(0, target * GOAL_PCT - achieved);
      const goalCell = goalGap <= 0
        ? `<span class="badge badge-success">Goal met</span>`
        : Utils.fmtCurrency(goalGap);
      return `
        <tr>
          <td>${r.Region}</td>
          <td>${r.Owner}</td>
          <td>${Utils.fmtCurrency(target)}</td>
          <td>${Utils.fmtCurrency(achieved)}</td>
          <td>
            <div class="target-progress">
              <div class="target-progress-track"><div class="target-progress-fill" style="width:${Math.min(100, pct)}%; background:${barColor}"></div></div>
              <span class="target-progress-label">${pct.toFixed(0)}%</span>
            </div>
          </td>
          <td>${goalCell}</td>
        </tr>`;
    }).join("");

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Region</th><th>Lead Owner</th><th>Target</th><th>Achieved</th><th>Progress</th><th>Needed for 80% Goal</th></tr></thead>
          <tbody>${body}</tbody>
          <tfoot>
            <tr class="target-total-row">
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
};
