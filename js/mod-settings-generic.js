/* ============================================================
   SETTINGS MODULE
   ============================================================ */

const ModSettings = {
  render() {
    const theme = document.documentElement.getAttribute("data-theme");
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const compact = localStorage.getItem("sa_compact") === "1";
    const refreshSec = localStorage.getItem("sa_refresh") || CONFIG.autoRefreshSeconds;

    const main = Utils.qs("#mainContent");
    main.innerHTML = `
      <div class="panel settings-panel">
        <h3><i class="fa-solid fa-palette"></i> Appearance</h3>
        <div class="settings-row">
          <label>Theme</label>
          <div class="segmented">
            <button class="${theme === "light" ? "active" : ""}" data-theme="light">Light</button>
            <button class="${theme === "dark" ? "active" : ""}" data-theme="dark">Dark</button>
          </div>
        </div>
        <div class="settings-row">
          <label>Accent Color</label>
          <div class="accent-swatches">
            ${["#00C2A8", "#6C7BFF", "#FF7A59", "#3FD98E", "#FFC24B", "#FF5C7A"].map((c) => `<button class="swatch ${c === accent ? "active" : ""}" style="background:${c}" data-accent="${c}"></button>`).join("")}
          </div>
        </div>
        <div class="settings-row">
          <label>Compact Mode</label>
          <label class="switch"><input type="checkbox" id="compactToggle" ${compact ? "checked" : ""}><span></span></label>
        </div>
      </div>

      <div class="panel settings-panel">
        <h3><i class="fa-solid fa-rotate"></i> Data & Refresh</h3>
        <div class="settings-row">
          <label>Auto Refresh Interval (seconds)</label>
          <input type="number" id="refreshInput" min="10" value="${refreshSec}" />
        </div>
        <div class="settings-row">
          <label>Google Sheet CSV URLs</label>
          <div class="sheet-url-list">
            ${Object.keys(CONFIG.sheets).map((k) => `
              <div class="sheet-url-item">
                <span>${k}</span>
                <input type="text" data-key="${k}" placeholder="https://docs.google.com/.../pub?output=csv" value="${CONFIG.sheets[k]}" />
                <span class="src-badge ${DataStore.isLive(k) ? "live" : "mock"}">${DataStore.isLive(k) ? "Live" : "Demo"}</span>
              </div>`).join("")}
          </div>
          <button class="btn-primary" id="saveSheets"><i class="fa-solid fa-floppy-disk"></i> Save & Reconnect</button>
        </div>
      </div>
    `;

    Utils.qsa("[data-theme]", main).forEach((btn) => btn.addEventListener("click", () => App.setTheme(btn.dataset.theme)));
    Utils.qsa("[data-accent]", main).forEach((btn) => btn.addEventListener("click", () => { App.setAccent(btn.dataset.accent); this.render(); }));
    Utils.qs("#compactToggle").addEventListener("change", (e) => {
      document.body.classList.toggle("compact", e.target.checked);
      localStorage.setItem("sa_compact", e.target.checked ? "1" : "0");
    });
    Utils.qs("#refreshInput").addEventListener("change", (e) => {
      CONFIG.autoRefreshSeconds = Math.max(10, Number(e.target.value) || 30);
      localStorage.setItem("sa_refresh", CONFIG.autoRefreshSeconds);
      App._startAutoRefresh();
      Utils.toast(`Auto refresh set to ${CONFIG.autoRefreshSeconds}s`, "success");
    });
    Utils.qs("#saveSheets").addEventListener("click", async () => {
      Utils.qsa(".sheet-url-item input", main).forEach((input) => { CONFIG.sheets[input.dataset.key] = input.value.trim(); });
      Utils.toast("Reconnecting to data sources…", "info");
      await DataStore.loadAll();
      App._updateConnectionStatus();
      this.render();
      Utils.toast("Sheets updated", "success");
    });
  },
};

/* ============================================================
   GENERIC MODULE — used for simple placeholder sections
   ============================================================ */

const ModGeneric = {
  render(title, description) {
    Utils.qs("#mainContent").innerHTML = `
      <div class="panel empty-panel">
        <i class="fa-solid fa-layer-group"></i>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>`;
  },
};
