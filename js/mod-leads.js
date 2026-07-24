/* ============================================================
   MODULE 3 — LEADS (Meta / Email Marketing / LinkedIn / CPC)
   ------------------------------------------------------------
   Expects each source sheet to use these EXACT column headers:
     Date, LeadName, Source, Course, Country, Payments,
     QualifiedLeads, Revenue, Owner, Stage
   ("Month" is not needed — it's derived from Date. Rename your
   sheet's "Qualified Leads" column to "QualifiedLeads", no space.)

   One row = one lead. Payments / QualifiedLeads are treated as
   "truthy" flags (1, "1", "yes", "true" all count; blank = no).
   ============================================================ */

const ModLeads = {
  activeSource: "metaCSV",
  sources: { metaCSV: "Meta", emailMarketingCSV: "Email Marketing", linkedinCSV: "LinkedIn", cpcCSV: "CPC" },

  search: "",
  filters: { country: "", owner: "", stage: "", source: "" },
  showRecords: false,
  compareMode: "week", // "day" | "week"

  render() {
    const all = DataStore.get(this.activeSource);
    const rows = this._applyFilters(all);

    const qualified = rows.filter((r) => this._truthy(r.QualifiedLeads ?? r["Qualified Leads"]));
    const paid = rows.filter((r) => this._truthy(r.Payments));
    const revenue = rows.reduce((sum, r) => sum + this._parseCurrency(r.Revenue), 0);
    const conv = rows.length ? (paid.length / rows.length) * 100 : 0;
    const topSource = rows.length ? Utils.topKey(rows, "Source") : "—";
    const topCountry = rows.length ? Utils.topKey(rows, "Country") : "—";
    const topOwner = rows.length ? Utils.topKey(rows, "Owner") : "—";

    const compare = this._compareSeries(rows);

    const countries = [...new Set(all.map((r) => r.Country).filter(Boolean))].sort();
    const owners = [...new Set(all.map((r) => r.Owner).filter(Boolean))].sort();
    const stages = [...new Set(all.map((r) => r.Stage).filter(Boolean))].sort();
    const srcs = [...new Set(all.map((r) => r.Source).filter(Boolean))].sort();

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="tab-bar">${Object.entries(this.sources).map(([k, label]) => `<button class="tab ${k === this.activeSource ? "active" : ""}" data-src="${k}">${label}</button>`).join("")}</div>

      <div class="filter-bar">
        <div class="filter-group" style="flex: 1 1 220px;">
          <label>Search</label>
          <input type="text" id="fSearch" placeholder="Search owner, country, source, course..." value="${this.search}" style="width:100%; padding:8px 10px; border-radius:8px; background:var(--panel-2, #12172e); border:1px solid var(--grid, #2a2f52); color:inherit;" />
        </div>
        <div class="filter-group"><label>Country</label><select id="fCountry"><option value="">All Countries</option>${countries.map((c) => `<option value="${c}" ${c === this.filters.country ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="filter-group"><label>Owner</label><select id="fOwner"><option value="">All Owners</option>${owners.map((o) => `<option value="${o}" ${o === this.filters.owner ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        <div class="filter-group"><label>Stage</label><select id="fStage"><option value="">All Stages</option>${stages.map((s) => `<option value="${s}" ${s === this.filters.stage ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <div class="filter-group"><label>Source</label><select id="fSource"><option value="">All Sources</option>${srcs.map((s) => `<option value="${s}" ${s === this.filters.source ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <button class="btn-reset" id="fReset"><i class="fa-solid fa-arrow-rotate-left"></i> Reset</button>
      </div>

      ${Components.kpiRow([
        { label: "Lead Count", value: Utils.fmtNumber(rows.length), icon: "fa-user-plus" },
        { label: "Qualified Leads", value: Utils.fmtNumber(qualified.length), icon: "fa-user-check" },
        { label: "Payments", value: Utils.fmtNumber(paid.length), icon: "fa-receipt" },
        { label: "Revenue", value: Utils.fmtCurrency(revenue, "INR"), icon: "fa-sack-dollar" },
        { label: "Conversion Rate", value: Utils.fmtPercent(conv), icon: "fa-bullseye" },
        { label: "Top Source", value: topSource, icon: "fa-flag", isText: true },
        { label: "Top Country", value: topCountry, icon: "fa-earth-asia", isText: true },
        { label: "Top Owner", value: topOwner, icon: "fa-medal", isText: true },
      ])}

      <div class="chart-grid">
        <div class="chart-card span-4"><h3>Lead Stage Breakdown</h3><div class="chart-box"><canvas id="chPipeline"></canvas></div></div>
        <div class="chart-card span-4"><h3>Country Distribution</h3><div class="chart-box"><canvas id="chLeadCountry"></canvas></div></div>
        <div class="chart-card span-4"><h3>Course Distribution</h3><div class="chart-box"><canvas id="chLeadCourse"></canvas></div></div>

        <div class="chart-card span-12">
          <div class="chart-card-head">
            <h3>Day-over-Day / Week-over-Week Comparison</h3>
            <div class="segmented-mini">
              <button class="${this.compareMode === "day" ? "active" : ""}" data-compare="day">Day</button>
              <button class="${this.compareMode === "week" ? "active" : ""}" data-compare="week">Week</button>
            </div>
          </div>
          <p class="chart-sub">${this._compareSummary(compare)}</p>
          <div class="chart-box"><canvas id="chCompare"></canvas></div>
        </div>
      </div>

      <div class="panel">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          ${Components.sectionHead(`Lead Records (${Utils.fmtNumber(rows.length)})`, "fa-table-list")}
          <button class="btn-reset" id="toggleRecords"><i class="fa-solid fa-${this.showRecords ? "eye-slash" : "eye"}"></i> ${this.showRecords ? "Hide" : "Show"} Lead Records</button>
        </div>
        ${this.showRecords ? Components.dataTable(rows, [
          { key: "Date", label: "Date" },
          { key: "LeadName", label: "Lead" },
          { key: "Source", label: "Source" },
          { key: "Course", label: "Course" },
          { key: "Country", label: "Country" },
          { key: "Owner", label: "Owner" },
          { key: "Stage", label: "Stage", fmt: (v) => Components.statusBadge(v) },
          { key: "Payments", label: "Paid", fmt: (v) => Components.statusBadge(this._truthy(v) ? "Paid" : "Unpaid") },
          { key: "Revenue", label: "Revenue", fmt: (v) => v ? Utils.fmtCurrency(this._parseCurrency(v), "INR") : "—" },
        ], { limit: 200 }) : `<p class="chart-sub" style="margin-top:8px;">Hidden by default to keep this view chart-first. Click "Show Lead Records" above to see the raw rows.</p>`}
      </div>
    `;

    this._renderCharts(rows);
    this._renderCompareChart(compare);
    this._bind();
  },

  // ---- helpers ------------------------------------------------

  _truthy(v) {
    if (v === true) return true;
    const s = String(v || "").trim().toLowerCase();
    return s === "1" || s === "yes" || s === "true" || s === "paid";
  },

  // Handles values like "₹32,482.55" or "$1,200" by stripping everything
  // that isn't a digit, minus sign, or decimal point before parsing.
  _parseCurrency(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
  },

  // ---- filtering ------------------------------------------------

  _applyFilters(rows) {
    let out = rows;
    if (this.filters.country) out = out.filter((r) => r.Country === this.filters.country);
    if (this.filters.owner) out = out.filter((r) => r.Owner === this.filters.owner);
    if (this.filters.stage) out = out.filter((r) => r.Stage === this.filters.stage);
    if (this.filters.source) out = out.filter((r) => r.Source === this.filters.source);
    if (this.search.trim()) {
      const q = this.search.trim().toLowerCase();
      out = out.filter((r) =>
        [r.LeadName, r.Owner, r.Country, r.Source, r.Course, r.Stage]
          .some((v) => String(v || "").toLowerCase().includes(q))
      );
    }
    return out;
  },

  _bind() {
    Utils.qsa(".tab-bar .tab").forEach((btn) => btn.addEventListener("click", () => { this.activeSource = btn.dataset.src; this.render(); }));

    let debounce;
    Utils.qs("#fSearch").addEventListener("input", (e) => {
      const val = e.target.value;
      clearTimeout(debounce);
      debounce = setTimeout(() => { this.search = val; this.render(); }, 250);
    });

    Utils.qs("#fCountry").addEventListener("change", (e) => { this.filters.country = e.target.value; this.render(); });
    Utils.qs("#fOwner").addEventListener("change", (e) => { this.filters.owner = e.target.value; this.render(); });
    Utils.qs("#fStage").addEventListener("change", (e) => { this.filters.stage = e.target.value; this.render(); });
    Utils.qs("#fSource").addEventListener("change", (e) => { this.filters.source = e.target.value; this.render(); });
    Utils.qs("#fReset").addEventListener("click", () => {
      this.search = ""; this.filters = { country: "", owner: "", stage: "", source: "" }; this.render();
    });

    Utils.qsa(".segmented-mini button").forEach((btn) => btn.addEventListener("click", () => { this.compareMode = btn.dataset.compare; this.render(); }));

    Utils.qs("#toggleRecords").addEventListener("click", () => { this.showRecords = !this.showRecords; this.render(); });
  },

  // ---- charts ------------------------------------------------

  _renderCharts(rows) {
    const stageGroups = Utils.groupBy(rows, "Stage");
    const stageEntries = Object.entries(stageGroups).sort((a, b) => b[1].length - a[1].length);
    Charts.bar("chPipeline", stageEntries.map(([s]) => s), [{
      label: "Leads",
      data: stageEntries.map(([, rs]) => rs.length),
      backgroundColor: stageEntries.map((_, i) => Charts.palette[i % Charts.palette.length]),
    }], { indexAxis: "y", plugins: { legend: { display: false } } });

    const countryGroups = Utils.groupBy(rows, "Country");
    Charts.donut("chLeadCountry", Object.keys(countryGroups), Object.values(countryGroups).map((g) => g.length));

    const courseGroups = Utils.groupBy(rows, "Course");
    Charts.bar("chLeadCourse", Object.keys(courseGroups), [{ label: "Leads", data: Object.values(courseGroups).map((g) => g.length) }]);
  },

  // ---- day/week comparison ------------------------------------------------

  _dateOnly(val) {
    const d = new Date(val);
    if (isNaN(d)) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  },

  _compareSeries(rows) {
    const today = this._dateOnly(new Date());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - today.getDay());
    const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart); prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

    const countInRange = (start, end) => rows.filter((r) => {
      const d = this._dateOnly(r.Date);
      return d && d >= start && d <= end;
    }).length;

    return {
      day: { current: countInRange(today, today), previous: countInRange(yesterday, yesterday), currentLabel: "Today", previousLabel: "Yesterday" },
      week: { current: countInRange(weekStart, today), previous: countInRange(prevWeekStart, prevWeekEnd), currentLabel: "This Week", previousLabel: "Last Week" },
    };
  },

  _compareSummary(compare) {
    const c = compare[this.compareMode];
    const pct = Utils.pctChange ? Utils.pctChange(c.current, c.previous) : (c.previous ? ((c.current - c.previous) / c.previous) * 100 : 0);
    const dir = pct >= 0 ? "up" : "down";
    return `${c.currentLabel}: <b>${Utils.fmtNumber(c.current)}</b> leads vs ${c.previousLabel.toLowerCase()}'s <b>${Utils.fmtNumber(c.previous)}</b> — <span class="${dir}">${Utils.fmtPercent(Math.abs(pct))} ${dir}</span>`;
  },

  _renderCompareChart(compare) {
    const c = compare[this.compareMode];
    Charts.bar("chCompare", [c.previousLabel, c.currentLabel], [{
      label: "Leads",
      data: [c.previous, c.current],
      backgroundColor: [Charts.palette[2], Charts.palette[0]],
    }], { plugins: { legend: { display: false } } });
  },
};
