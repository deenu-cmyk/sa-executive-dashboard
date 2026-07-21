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
    dashboardCSV:      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=1667797721&single=true&output=csv",   // Module 1 — SA Dashboard
    paymentTrackerCSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=1883774701&single=true&output=csv",   // Module 2 — Payment Tracker
    metaCSV:           "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=1927841194&single=true&output=csv",   // Module 3 — Leads: Meta
    emailMarketingCSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=1462599851&single=true&output=csv",   // Module 3 — Leads: Email Marketing
    linkedinCSV:       "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=1462599851&single=true&output=csv",   // Module 3 — Leads: LinkedIn
    cpcCSV:             "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=87684967&single=true&output=csv",   // Module 3 — Leads: CPC
    marketingCSV:       "",   // Module 4 — Marketing (Apr/May/Jun 2026)
    premiumCSV:         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=1548491104&single=true&output=csv",   // Module 5 — Premium & Elite Plan
    refundCSV:           "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZI9D3IMZQDw8Hbj_bUEh4lm8Lz8fSijp0UGeDc2IX4bM9meDEIE6FIHTjO3zxw52An93N0wiP53Ph/pub?gid=1645670793&single=true&output=csv",  // Module 6 — Refund Dashboard
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
