/* ============================================================
   SMOKE CURSOR EFFECT — drifting, fading smoke particles that
   follow the mouse across the whole page. Self-contained: just
   include this script tag anywhere and it sets itself up.
   ============================================================ */

(function () {
  const canvas = document.createElement("canvas");
  canvas.id = "smokeEffectCanvas";
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none", // never blocks clicks on the real UI underneath
    zIndex: "9999",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // Theme color — matches the dashboard's teal accent. Change this hex
  // if you want a different smoke tint.
  const SMOKE_COLOR = "0, 194, 168"; // r,g,b for --accent teal

  let particles = [];
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastSpawn = 0;

  function spawnParticle(x, y) {
    particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      radius: 6 + Math.random() * 10,
      alpha: 0.35 + Math.random() * 0.15,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -0.4 - Math.random() * 0.6, // drifts upward like real smoke
      growth: 0.25 + Math.random() * 0.35,
      life: 0,
      maxLife: 60 + Math.random() * 40,
    });
  }

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    const now = performance.now();
    // Throttle spawning so it stays smoke-like rather than a solid blob.
    if (now - lastSpawn > 16) {
      spawnParticle(mouseX, mouseY);
      lastSpawn = now;
    }
  });

  // Touch support for mobile.
  window.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      spawnParticle(t.clientX, t.clientY);
    },
    { passive: true }
  );

  function animate() {
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    particles.forEach((p) => {
      p.life += 1;
      p.x += p.vx;
      p.y += p.vy;
      p.radius += p.growth;
      p.alpha *= 0.965; // fade out

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0, `rgba(${SMOKE_COLOR}, ${p.alpha})`);
      gradient.addColorStop(1, `rgba(${SMOKE_COLOR}, 0)`);

      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    particles = particles.filter((p) => p.alpha > 0.01 && p.life < p.maxLife);

    requestAnimationFrame(animate);
  }

  animate();
})();
