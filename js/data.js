/* ============================================================
   DATA LAYER
   Loads each configured CSV with PapaParse. Falls back to a
   deterministic mock dataset (same shape a real sheet export
   would have) so every module always has something to render.
   ============================================================ */

// Maps a sheet's real column headers to the canonical field names the
// dashboard code reads. Add an entry per sheet key as you connect real
// Google Sheets with different header names than the mock data schema.
const FIELD_MAPS = {
  dashboardCSV: {
    Owner: "Sales Owner",
    Source: "Lead Source",
    Stage: "Lead Stage",
    Payment: "Payment Qty",
  },
};

function normalizeRows(rows, map) {
  if (!map) return rows;
  return rows.map((row) => {
    const out = { ...row };
    Object.entries(map).forEach(([canonical, actual]) => {
      if (out[canonical] === undefined && row[actual] !== undefined) {
        out[canonical] = row[actual];
      }
    });
    return out;
  });
}

// Converts common Google Sheets date exports (Date objects, "DD/MM/YYYY",
// "MM/DD/YYYY", or ISO strings) into a consistent "YYYY-MM-DD" string so
// every chart/filter that reads r.Date works regardless of sheet locale.
function normalizeDateField(rows) {
  return rows.map((row) => {
    if (row.Date === undefined || row.Date === null || row.Date === "") return row;
    const iso = toISODate(row.Date);
    if (iso) return { ...row, Date: iso };
    return row;
  });
}

function toISODate(value) {
  if (value instanceof Date && !isNaN(value)) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
      const day = Number(dmy[1]), month = Number(dmy[2]), year = Number(dmy[3]);
      if (day <= 31 && month <= 12) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
    const parsed = new Date(value);
    if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

const DataStore = {
  cache: {},
  status: {},
  lastRefresh: null,

  async loadAll() {
    const keys = Object.keys(CONFIG.sheets);
    await Promise.all(keys.map(k => this.load(k)));
    this.lastRefresh = new Date();
  },

  async load(key) {
    const url = CONFIG.sheets[key];
    this.status[key] = "loading";
    if (!url) {
      this.cache[key] = MockData.generate(key);
      this.status[key] = "mock";
      return this.cache[key];
    }
    for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
      try {
        let rows = await this._fetchCSV(url);
        rows = normalizeRows(rows, FIELD_MAPS[key]);
        rows = normalizeDateField(rows);
        this.cache[key] = rows;
        this.status[key] = "live";
        return rows;
      } catch (err) {
        if (attempt === CONFIG.retryAttempts) {
          console.warn(`[DataStore] ${key} failed after ${attempt} attempts, using mock data.`, err);
          this.cache[key] = MockData.generate(key);
          this.status[key] = "error-mock";
        } else {
          await new Promise(r => setTimeout(r, CONFIG.retryDelayMs));
        }
      }
    }
    return this.cache[key];
  },

  _fetchCSV(url) {
    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (res) => {
          if (!res.data || !res.data.length) return reject(new Error("Empty CSV"));
          resolve(res.data);
        },
        error: (err) => reject(err),
      });
    });
  },

  get(key) {
    return this.cache[key] || [];
  },

  isLive(key) {
    return this.status[key] === "live";
  },
};

/* ============================================================
   MOCK DATA GENERATORS
   ============================================================ */

const MockData = (() => {
  const countries = ["India", "USA", "UAE", "UK", "Australia", "Canada", "Singapore", "Saudi Arabia"];
  const courses = ["PMP", "Scrum Master", "Six Sigma", "ITIL", "PRINCE2", "Agile Coach", "Data Science", "DevOps"];
  const owners = ["Aditi Rao", "Karan Mehta", "Sara Khan", "Vikram Iyer", "Priya Nair", "Rohan Das"];
  const sources = ["Meta", "Email Marketing", "LinkedIn", "CPC", "Organic", "Referral"];
  const stages = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
  const campaigns = ["Spring Push", "PMP Blitz", "Agile Week", "Retarget Q2", "Brand Awareness", "Lead Gen June"];
  const reasons = ["Duplicate Payment", "Course Not Suitable", "Schedule Conflict", "Technical Issue", "Change of Mind"];

  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const dateWithinDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - rand(0, days));
    return d.toISOString().slice(0, 10);
  };

  function leadsRows(n, sourceFilter) {
    const rows = [];
    for (let i = 0; i < n; i++) {
      const revenue = rand(0, 1) ? rand(15000, 95000) : 0;
      rows.push({
        LeadID: `LD${1000 + i}`,
        Date: dateWithinDays(180),
        Country: pick(countries),
        Course: pick(courses),
        Owner: pick(owners),
        Source: sourceFilter || pick(sources),
        Campaign: pick(campaigns),
        Stage: pick(stages),
        Qualified: rand(0, 1),
        Revenue: revenue,
        Payment: revenue > 0 ? 1 : 0,
        Spend: rand(200, 4000),
      });
    }
    return rows;
  }

  function dashboardRows() { return leadsRows(600); }

  function paymentRows() {
    const regions = ["India", "USA", "APAC", "MENA", "Chat"];
    const rows = [];
    for (let i = 0; i < 500; i++) {
      const status = pick(["Completed", "Pending", "Refunded", "Failed"]);
      rows.push({
        PaymentID: `PAY${5000 + i}`,
        Date: dateWithinDays(180),
        Region: pick(regions),
        Country: pick(countries),
        Course: pick(courses),
        Amount: rand(15000, 95000),
        Status: status,
        Currency: pick(["INR", "USD", "AED", "GBP"]),
      });
    }
    return rows;
  }

  function marketingRows() {
    const months = ["2026-04", "2026-05", "2026-06"];
    const rows = [];
    months.forEach((m) => {
      for (let d = 1; d <= 28; d += 2) {
        rows.push({
          Month: m,
          Date: `${m}-${String(d).padStart(2, "0")}`,
          Revenue: rand(80000, 260000),
          Spend: rand(15000, 60000),
          Clicks: rand(500, 5000),
          Impressions: rand(20000, 120000),
          Leads: rand(20, 200),
          QualifiedLeads: rand(5, 80),
          DealsClosed: rand(1, 25),
        });
      }
    });
    return rows;
  }

  function premiumRows() {
    const rows = [];
    for (let i = 0; i < 300; i++) {
      rows.push({
        LeadID: `PE${2000 + i}`,
        Date: dateWithinDays(180),
        Plan: pick(["Premium", "Elite"]),
        Country: pick(countries),
        Course: pick(courses),
        Revenue: rand(0, 1) ? rand(40000, 150000) : 0,
        Converted: rand(0, 1),
      });
    }
    return rows;
  }

  function refundRows() {
    const rows = [];
    for (let i = 0; i < 220; i++) {
      const status = pick(["Approved", "Pending", "Rejected"]);
      rows.push({
        RefundID: `RF${3000 + i}`,
        Date: dateWithinDays(180),
        Country: pick(countries),
        Course: pick(courses),
        Amount: rand(10000, 90000),
        Status: status,
        Reason: pick(reasons),
        ProcessingDays: rand(1, 12),
      });
    }
    return rows;
  }

  const generators = {
    dashboardCSV: dashboardRows,
    paymentTrackerCSV: paymentRows,
    metaCSV: () => leadsRows(200, "Meta"),
    emailMarketingCSV: () => leadsRows(200, "Email Marketing"),
    linkedinCSV: () => leadsRows(200, "LinkedIn"),
    cpcCSV: () => leadsRows(200, "CPC"),
    marketingCSV: marketingRows,
    premiumCSV: premiumRows,
    refundCSV: refundRows,
  };

  return {
    generate(key) { return (generators[key] || (() => []))(); },
    lists: { countries, courses, owners, sources, stages, campaigns },
  };
})();
