/* ============================================================
   AUTH GATE — simple per-user login for the dashboard.
   ------------------------------------------------------------
   IMPORTANT — read this before relying on it:
   This is a STATIC site (GitHub Pages), so there is no server
   to verify passwords. The USERS list below ships inside this
   JS file, which means anyone who opens DevTools -> Sources can
   read it. This is fine for keeping casual visitors out of an
   internal dashboard, but it is NOT real security — don't put
   anything here you wouldn't want a curious visitor to see.

   HOW TO ADD / CHANGE USERS
   Just edit the USERS object below. Keys are usernames (lowercase
   recommended), values are passwords.

   INSTALL
   Add this as the very FIRST script tag in your <body>, before
   config.js and everything else, so the login screen appears
   before the dashboard has a chance to render:

     <script src="js/auth.js"></script>
     <script src="js/config.js"></script>
     ...rest of your scripts...

   Also update LOGO_PATH below to wherever you upload the actual
   logo file in your repo (e.g. "assets/simpliaxis-logo.webp").
   ============================================================ */

(function () {
  const USERS = {
    "vishal@simpliaxis.com": "Simpliaxis",
    "deenu@simpliaxis.com": "Simpliaxis",
    "sai.j@simpliaxis.com": "Simpliaxis",
    "manoj.k@simpliaxis.com": "Simpliaxis",
    "sabari@simpliaxis.com": "Simpliaxis",
    "swathi@simpliaxis.com": "Simpliaxis",
    // add more "email: password" pairs here
  };

  const LOGO_PATH = "assets/simpliaxis-logo.webp"; // update to match your repo's actual logo path
  const STORAGE_KEY = "sa_dashboard_auth_user";
  const BRAND_RED = "#E42128";
  const BRAND_NAVY = "#202E57";

  function isLoggedIn() {
    const user = localStorage.getItem(STORAGE_KEY);
    return user && Object.prototype.hasOwnProperty.call(USERS, user);
  }

  function showOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.innerHTML = `
      <div class="auth-card">
        <img src="${LOGO_PATH}" alt="Simpliaxis" class="auth-logo" onerror="this.style.display='none'" />
        <h2>Executive Dashboard</h2>
        <p class="auth-sub">Sign in to continue</p>
        <form id="authForm">
          <input type="email" id="authUser" placeholder="you@simpliaxis.com" autocomplete="username" required />
          <input type="password" id="authPass" placeholder="Password" autocomplete="current-password" required />
          <button type="submit">Sign In</button>
          <p id="authError" class="auth-error"></p>
        </form>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #authOverlay {
        position: fixed; inset: 0; z-index: 999999;
        background: #0B1020;
        display: flex; align-items: center; justify-content: center;
        font-family: Inter, system-ui, sans-serif;
      }
      #authOverlay .auth-card {
        background: #151B33;
        border-radius: 14px;
        padding: 40px 36px;
        width: 320px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      }
      #authOverlay .auth-logo { max-width: 180px; margin-bottom: 20px; }
      #authOverlay h2 { color: #fff; font-size: 18px; margin: 0 0 4px; }
      #authOverlay .auth-sub { color: #828282; font-size: 13px; margin: 0 0 20px; }
      #authOverlay input {
        width: 100%; box-sizing: border-box; padding: 11px 14px; margin-bottom: 12px;
        border-radius: 8px; border: 1px solid #2a2f52; background: #0F1428;
        color: #fff; font-size: 14px;
      }
      #authOverlay input:focus { outline: none; border-color: ${BRAND_RED}; }
      #authOverlay button {
        width: 100%; padding: 11px; border: none; border-radius: 8px;
        background: ${BRAND_RED}; color: #fff; font-weight: 600; font-size: 14px;
        cursor: pointer; margin-top: 4px;
      }
      #authOverlay button:hover { background: #c81b21; }
      #authOverlay .auth-error { color: #EB5757; font-size: 12px; min-height: 16px; margin: 10px 0 0; }
      #logoutBtn {
        position: fixed; top: 14px; right: 14px; z-index: 99998;
        background: ${BRAND_NAVY}; color: #fff; border: none; border-radius: 8px;
        padding: 8px 14px; font-size: 12px; font-family: Inter, system-ui, sans-serif;
        cursor: pointer; opacity: 0.85;
      }
      #logoutBtn:hover { opacity: 1; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    document.getElementById("authForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("authUser").value.trim().toLowerCase();
      const p = document.getElementById("authPass").value;
      const errEl = document.getElementById("authError");
      if (USERS[u] && USERS[u] === p) {
        localStorage.setItem(STORAGE_KEY, u);
        overlay.remove();
        style.remove();
        addLogoutButton();
      } else {
        errEl.textContent = "Incorrect username or password.";
      }
    });
  }

  function addLogoutButton() {
    if (document.getElementById("logoutBtn")) return;
    const btn = document.createElement("button");
    btn.id = "logoutBtn";
    btn.textContent = "Logout";
    btn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
    document.body.appendChild(btn);
  }

  // Run as soon as the DOM exists.
  function init() {
    if (isLoggedIn()) {
      addLogoutButton();
    } else {
      showOverlay();
    }
  }

  if (document.body) init();
  else document.addEventListener("DOMContentLoaded", init);
})();
