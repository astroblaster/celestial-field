import { CELESTIAL_CONFIG, PLAYER_STONE, CRYSTAL_BASE_SIZE, CRYSTAL_LIFETIME } from "./data";
import { azimuthToAngle, altitudeToIntensity } from "./logic";

// Convert hex color to "r,g,b" string for use in rgba()
function hexToRgb(hex) {
  if (!hex) return null;
  const match = hex.replace("#", "").match(/.{2}/g);
  if (!match || match.length < 3) return null;
  return match.slice(0, 3).map((h) => parseInt(h, 16)).join(",");
}

// ─── DRAW CRYSTAL SHAPE ─────────────────────────────────────────────────────

export function drawCrystalShape(ctx, x, y, size, sides, color, glowColor, timestamp, alpha = 1) {
  const pulse = 1 + 0.06 * Math.sin(timestamp / 800 + x * 0.05);
  const s = size * pulse;

  ctx.globalAlpha = alpha;

  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, s * 2.5);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, s * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyGrad = ctx.createRadialGradient(x - s * 0.2, y - s * 0.2, 0, x, y, s);
  bodyGrad.addColorStop(0, "#fff");
  bodyGrad.addColorStop(0.35, color);
  bodyGrad.addColorStop(1, color + "88");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const px = x + s * Math.cos(a);
    const py = y + s * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Edge highlight
  ctx.strokeStyle = `rgba(255,255,255,${0.15 * alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// ─── MAIN DRAW FUNCTION ─────────────────────────────────────────────────────

export function drawField(ctx, W, H, timestamp, skyData, fieldCrystals, clickEffects, floatingTexts) {
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(cx, cy) - 40;

  // Clear
  ctx.clearRect(0, 0, W, H);

  // Background
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius + 40);
  bgGrad.addColorStop(0, "#0a0a14");
  bgGrad.addColorStop(0.5, "#06060e");
  bgGrad.addColorStop(1, "#020208");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Star dust
  for (let i = 0; i < 120; i++) {
    const pr = (n) => (((Math.sin(n * 127.1 + 42) * 43758.5453) % 1) + 1) % 1;
    const sx = pr(i * 2) * W;
    const sy = pr(i * 2 + 1) * H;
    const b = 0.15 + 0.2 * pr(i * 3) + 0.05 * Math.sin(timestamp / 2000 + i);
    ctx.fillStyle = `rgba(180, 190, 220, ${b})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 0.5 + pr(i * 4) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer ring
  ctx.strokeStyle = "rgba(60, 65, 80, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Compass
  const compass = [
    { l: "N", a: -Math.PI / 2 },
    { l: "E", a: 0 },
    { l: "S", a: Math.PI / 2 },
    { l: "W", a: Math.PI },
  ];
  ctx.font = '12px "Palatino", Georgia, serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  compass.forEach(({ l, a }) => {
    ctx.fillStyle = "rgba(100, 110, 130, 0.7)";
    ctx.fillText(l, cx + (radius + 22) * Math.cos(a), cy + (radius + 22) * Math.sin(a));
  });

  // Zone rings
  for (let r = 0.33; r <= 0.66; r += 0.33) {
    ctx.strokeStyle = "rgba(40, 45, 60, 0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Player stone
  const pulseScale = 1 + 0.03 * Math.sin(timestamp / 1200);
  const stoneSize = PLAYER_STONE.size * pulseScale;

  const stoneGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, stoneSize * 2.5);
  stoneGlow.addColorStop(0, "rgba(180, 190, 220, 0.15)");
  stoneGlow.addColorStop(1, "rgba(180, 190, 220, 0)");
  ctx.fillStyle = stoneGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, stoneSize * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PLAYER_STONE.color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
    const px = cx + stoneSize * Math.cos(a);
    const py = cy + stoneSize * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  const coreGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, stoneSize * 0.7);
  coreGrad.addColorStop(0, PLAYER_STONE.coreColor);
  coreGrad.addColorStop(1, "rgba(160, 168, 184, 0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, stoneSize * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Celestial bodies
  const bodies = [];
  if (skyData) {
    const allBodies = [
      { ...skyData.sun, name: "Sun" },
      { ...skyData.moon, name: "Moon" },
      ...skyData.planets,
    ];

    allBodies.forEach((body) => {
      if (!body.is_above_horizon) return;
      const config = CELESTIAL_CONFIG[body.name];
      if (!config) return;

      const angle = azimuthToAngle(body.azimuth_degrees);
      const intensity = altitudeToIntensity(body.altitude_degrees);
      const bx = cx + radius * Math.cos(angle);
      const by = cy + radius * Math.sin(angle);
      bodies.push({ ...body, config, angle, intensity, x: bx, y: by });
    });

    // Energy beams
    bodies.forEach(({ x, y, config, intensity }) => {
      const perpAngle = Math.atan2(cy - y, cx - x) + Math.PI / 2;
      const beamWidth = config.size * 0.4 * intensity;
      const tipWidth = 2;

      const grad = ctx.createLinearGradient(x, y, cx, cy);
      grad.addColorStop(0, config.glowColor.replace(/[\d.]+\)$/, `${0.12 * intensity})`));
      grad.addColorStop(0.5, config.glowColor.replace(/[\d.]+\)$/, `${0.06 * intensity})`));
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.5 + 0.15 * Math.sin(timestamp / 1500);
      ctx.beginPath();
      ctx.moveTo(x - beamWidth * Math.cos(perpAngle), y - beamWidth * Math.sin(perpAngle));
      ctx.lineTo(x + beamWidth * Math.cos(perpAngle), y + beamWidth * Math.sin(perpAngle));
      ctx.lineTo(cx + tipWidth * Math.cos(perpAngle), cy + tipWidth * Math.sin(perpAngle));
      ctx.lineTo(cx - tipWidth * Math.cos(perpAngle), cy - tipWidth * Math.sin(perpAngle));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Particles along beam
      const pCount = Math.floor(3 * intensity);
      for (let i = 0; i < pCount; i++) {
        const t = ((timestamp / (4000 - intensity * 1000) + i / pCount) % 1);
        const px = x + (cx - x) * t;
        const py = y + (cy - y) * t;
        const pSize = 1.5 * (1 - t * 0.5) * intensity;
        ctx.fillStyle = config.color;
        ctx.globalAlpha = 0.6 * (1 - t) * intensity;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    // Draw bodies on ring
    bodies.forEach(({ x, y, config, intensity }) => {
      const pulse = 1 + 0.08 * Math.sin(timestamp / 1000 + x * 0.1);
      const size = config.size * pulse * (0.7 + 0.3 * intensity);

      const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      glow.addColorStop(0, config.glowColor);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, Math.PI * 2);
      ctx.fill();

      const bodyGrad = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2, 0, x, y, size);
      bodyGrad.addColorStop(0, "#fff");
      bodyGrad.addColorStop(0.3, config.color);
      bodyGrad.addColorStop(1, config.color + "88");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${Math.max(10, size * 0.9)}px "Palatino", Georgia, serif`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.symbol, x, y + size + 14);
    });
  }

  // ── Field crystals ──
  const now = timestamp;
  fieldCrystals.forEach((fc) => {
    if (fc.collected) return;
    const age = now - fc.spawnTime;
    const lifetime = CRYSTAL_LIFETIME[fc.rarity] || 20000;

    // Fade in over 500ms
    const fadeIn = Math.min(1, age / 500);
    // Warning flash in last 30% of lifetime
    const lifeProgress = age / lifetime;
    let alpha = fadeIn;
    if (lifeProgress > 0.7) {
      const warnProgress = (lifeProgress - 0.7) / 0.3;
      alpha = fadeIn * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(warnProgress * Math.PI * 8)));
    }

    const fx = cx + fc.fieldX;
    const fy = cy + fc.fieldY;
    drawCrystalShape(ctx, fx, fy, CRYSTAL_BASE_SIZE, fc.sides, fc.color, fc.glowColor, timestamp, alpha);
  });

  // ── Click effects ──
  // Remove expired effects in place
  for (let i = clickEffects.length - 1; i >= 0; i--) {
    const fx = clickEffects[i];
    const age = now - fx.startTime;
    if (age < 0) continue; // not started yet
    if (age > fx.duration) {
      clickEffects.splice(i, 1);
      continue;
    }
    const progress = age / fx.duration;

    if (fx.type === "ripple") {
      const rippleRadius = Math.max(0, fx.maxRadius * progress);
      const alpha = 0.5 * (1 - progress);
      ctx.strokeStyle = `rgba(${hexToRgb(fx.color) || "255,215,0"}, ${alpha})`;
      ctx.lineWidth = 2 * (1 - progress);
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.type === "particle") {
      const t = progress;
      const px = fx.x + fx.vx * t * 60;
      const py = fx.y + fx.vy * t * 60;
      const alpha = 0.9 * (1 - progress);
      const size = Math.max(0.1, fx.size * (1 - progress * 0.5));
      ctx.fillStyle = `rgba(${hexToRgb(fx.color) || "255,215,0"}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Floating text ──
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    const age = now - ft.startTime;
    if (age > ft.duration) {
      floatingTexts.splice(i, 1);
      continue;
    }
    const progress = age / ft.duration;
    const alpha = 1 - progress;
    const yOffset = -40 * progress;

    ctx.font = `bold ${14 + 4 * (1 - progress)}px "Palatino", Georgia, serif`;
    ctx.fillStyle = `rgba(${hexToRgb(ft.color) || "255,215,0"}, ${alpha})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ft.text, ft.x, ft.y + yOffset);
  }

  // Horizon label
  ctx.font = '10px "Palatino", Georgia, serif';
  ctx.fillStyle = "rgba(80, 90, 110, 0.5)";
  ctx.textAlign = "center";
  ctx.fillText("— HORIZON —", cx, cy + radius + 35);

  return bodies;
}
