/* ============================================================
   SIMPLIAXIS EXECUTIVE DASHBOARD — CONFIGURATION
   ------------------------------------------------------------
   Replace the empty strings below with your PUBLISHED Google
   Sheet CSV links (File > Share > Publish to web > CSV).
   Leave a URL blank and that module will run on realistic
   sample data so the dashboard is always demo-ready.
   ============================================================ */

const CONFIG = {
  appName: "SA Executive Dashboard",
  company: "Simpliaxis",

  // ---- Data sources -----------------------------------------
  sheets: {
    dashboardCSV:      "",   // Module 1 — SA Dashboard
    paymentTrackerCSV: "",   // Module 2 — Payment Tracker
    metaCSV:           "",   // Module 3 — Leads: Meta
    emailMarketingCSV: "",   // Module 3 — Leads: Email Marketing
    linkedinCSV:       "",   // Module 3 — Leads: LinkedIn
    cpcCSV:            "",   // Module 3 — Leads: CPC
    marketingCSV:      "",   // Module 4 — Marketing (Apr/May/Jun 2026)
    premiumCSV:        "",   // Module 5 — Premium & Elite Plan
    refundCSV:         "",   // Module 6 — Refund Dashboard
    salesTargetCSV:    "",   // Sales Target vs Achieved (shown inside Payment Tracker)
  },

  // ---- Behaviour ----------------------------------------------
  autoRefreshSeconds: 30,
  retryAttempts: 3,
  retryDelayMs: 2000,

  // ---- Defaults (overridable from Settings panel, saved to localStorage) --
  defaults: {
    theme: "dark",          // "dark" | "light"
    accent: "#00C2A8",
    compactMode: false,
    chartPalette: ["#00C2A8", "#FF7A59", "#6C7BFF", "#FFC24B", "#3FD98E", "#FF5C7A", "#7ADFFF", "#B98BFF"],
  },
};
