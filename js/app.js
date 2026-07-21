/* ============================================================
   APP SHELL — routing, header, sidebar, theme, settings, export
   ============================================================ */

const App = {
  currentModule: "dashboard",
  refreshTimer: null,

  modules: {
    dashboard: { label: "SA Dashboard", icon: "fa-gauge-high", render: () => ModDashboard.render() },
    payments:  { label: "Payment Tracker", icon: "fa-credit-card", render: () => ModPayments.render() },
    leads:     { label: "Leads", icon: "fa-user-plus", render: () => ModLeads.render() },
    marketing: { label: "Marketing", icon: "fa-bullhorn", render: () => ModMarketing.render() },
    premium:   { label: "Premium & Elite Plan", icon: "fa-crown", render: () => ModPremium.render() },
    refund:    { label: "Refund Dashboard", icon: "fa-rotate-left", render: () => ModRefund.render() },
    reports:   { label: "Reports", icon: "fa-file-lines", render: () => ModGeneric.render("Reports", "Consolidated report builder — combine any module's tables into a scheduled or one-off export.") },
    analytics: { label: "Analytics", icon: "fa-chart-line", render: () => ModGeneric.render("Analytics", "Deeper cross-module analytics: cohort trends, forecast models and drill-through explorers live here.") },
    settings:  { label: "Settings", icon: "fa-gear", render: () => ModSettings.render() },
    help:      { label: "Help", icon: "fa-circle-question", render: () => ModGeneric.render("Help", "Documentation, onboarding walkthroughs and support contacts for the Simpliaxis analytics team.") },
  },

  async init() {
    this._loadPrefs();
    this._bindHeader();
    this._bindSidebar();
    this._buildSidebarNav();
    Utils.toast("Connecting to data sources…", "info");
    await DataStore.loadAll();
    this._updateConnectionStatus();
    this._startAutoRefresh();
    this.navigate("dashboard");
    Utils.toast("Dashboard ready", "success");
  },

  navigate(key) {
    if (!this.modules[key]) return;
    this.currentModule = key;
    Utils.qsa(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.module === key));
    Utils.qs("#pageTitle").textContent = this.modules[key].label;
    Utils.qs("#mainContent").innerHTML = `<div class="module-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading ${this.modules[key].label}…</div>`;
    requestAnimationFrame(() => this.modules[key].render());
    if (window.innerWidth < 992) Utils.qs("#sidebar").classList.remove("open");
  },

  _buildSidebarNav() {
    const nav = Utils.qs("#sidebarNav");
    nav.innerHTML = "";
    Object.entries(this.modules).forEach(([key, m]) => {
      const item = Utils.el(`
        <button class="nav-item" data-module="${key}">
          <i class="fa-solid ${m.icon}"></i>
          <span>${m.label}</span>
        </button>`);
      item.addEventListener("click", () => this.navigate(key));
      nav.appendChild(item);
    });
  },

  _bindSidebar() {
    Utils.qs("#sidebarToggle").addEventListener("click", () => {
      Utils.qs("#sidebar").classList.toggle("collapsed");
    });
    Utils.qs("#sidebarMobileToggle").addEventListener("click", () => {
      Utils.qs("#sidebar").classList.toggle("open");
    });
  },

  _bindHeader() {
    // live clock
    const clockNode = Utils.qs("#liveClock");
    const dateNode = Utils.qs("#currentDate");
    const tick = () => {
      const now = new Date();
      clockNode.textContent = now.toLocaleTimeString("en-IN", { hour12: true });
      dateNode.textContent = now.toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
    };
    tick();
    setInterval(tick, 1000);

    // theme toggle
    Utils.qs("#themeToggle").addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      this.setTheme(isDark ? "light" : "dark");
    });

    // refresh
    Utils.qs("#refreshBtn").addEventListener("click", async () => {
      const btn = Utils.qs("#refreshBtn i");
      btn.classList.add("fa-spin");
      await DataStore.loadAll();
      this._updateConnectionStatus();
      this.modules[this.currentModule].render();
      btn.classList.remove("fa-spin");
      Utils.toast("Data refreshed", "success");
    });

    // fullscreen
    Utils.qs("#fullscreenBtn").addEventListener("click", () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    });

    // global search (filters current module's tables client-side)
    Utils.qs("#globalSearch").addEventListener("input", Utils.debounce((e) => {
      const q = e.target.value.toLowerCase();
      Utils.qsa("table.data-table tbody tr").forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    }, 200));

    // notifications
    Utils.qs("#notifBtn").addEventListener("click", () => {
      Utils.qs("#notifPanel").classList.toggle("open");
    });

    // export menu
    Utils.qs("#exportBtn").addEventListener("click", () => {
      Utils.qs("#exportMenu").classList.toggle("open");
    });
    Utils.qsa("#exportMenu button").forEach((btn) => {
      btn.addEventListener("click", () => {
        Exporter[btn.dataset.type]();
        Utils.qs("#exportMenu").classList.remove("open");
      });
    });

    // settings shortcut
    Utils.qs("#settingsBtn").addEventListener("click", () => this.navigate("settings"));

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#notifBtn") && !e.target.closest("#notifPanel")) Utils.qs("#notifPanel").classList.remove("open");
      if (!e.target.closest("#exportBtn") && !e.target.closest("#exportMenu")) Utils.qs("#exportMenu").classList.remove("open");
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    Utils.qs("#themeToggle i").className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    localStorage.setItem("sa_theme", theme);
    Charts.palette = CONFIG.defaults.chartPalette;
    if (this.modules[this.currentModule]) this.modules[this.currentModule].render();
  },

  setAccent(hex) {
    document.documentElement.style.setProperty("--accent", hex);
    localStorage.setItem("sa_accent", hex);
  },

  _loadPrefs() {
    const theme = localStorage.getItem("sa_theme") || CONFIG.defaults.theme;
    const accent = localStorage.getItem("sa_accent") || CONFIG.defaults.accent;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.setProperty("--accent", accent);
    Utils.qs("#themeToggle i").className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  },

  _updateConnectionStatus() {
    const keys = Object.keys(CONFIG.sheets);
    const liveCount = keys.filter((k) => DataStore.isLive(k)).length;
    const dot = Utils.qs("#connectionDot");
    const label = Utils.qs("#connectionLabel");
    if (liveCount === keys.length) {
      dot.className = "status-dot live"; label.textContent = "Live";
    } else if (liveCount === 0) {
      dot.className = "status-dot demo"; label.textContent = "Demo data";
    } else {
      dot.className = "status-dot partial"; label.textContent = `${liveCount}/${keys.length} live`;
    }
    Utils.qs("#lastRefresh").textContent = DataStore.lastRefresh
      ? `Updated ${DataStore.lastRefresh.toLocaleTimeString("en-IN", { hour12: true })}`
      : "—";
  },

  _startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(async () => {
      await DataStore.loadAll();
      this._updateConnectionStatus();
      if (this.modules[this.currentModule]) this.modules[this.currentModule].render();
    }, CONFIG.autoRefreshSeconds * 1000);
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
