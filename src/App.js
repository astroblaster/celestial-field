import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE = "/api/sky";
const SKY_POLL_INTERVAL = 60000;

// ─── PLANET PROPERTIES ───────────────────────────────────────────────────────
const CELESTIAL_CONFIG = {
  Sun: {
    color: "#FFD700",
    glowColor: "rgba(255, 215, 0, 0.4)",
    size: 18,
    symbol: "☉",
    energy: "Solar",
    desc: "Vitality, willpower, identity",
  },
  Moon: {
    color: "#C0C8E0",
    glowColor: "rgba(192, 200, 224, 0.4)",
    size: 15,
    symbol: "☽",
    energy: "Lunar",
    desc: "Intuition, emotion, cycles",
  },
  Mercury: {
    color: "#B0B8C8",
    glowColor: "rgba(176, 184, 200, 0.3)",
    size: 8,
    symbol: "☿",
    energy: "Mercurial",
    desc: "Communication, speed, intellect",
  },
  Venus: {
    color: "#E8A0D0",
    glowColor: "rgba(232, 160, 208, 0.3)",
    size: 10,
    symbol: "♀",
    energy: "Venusian",
    desc: "Harmony, beauty, growth",
  },
  Mars: {
    color: "#E05040",
    glowColor: "rgba(224, 80, 64, 0.3)",
    size: 10,
    symbol: "♂",
    energy: "Martial",
    desc: "Strength, action, courage",
  },
  Jupiter: {
    color: "#D4A060",
    glowColor: "rgba(212, 160, 96, 0.3)",
    size: 14,
    symbol: "♃",
    energy: "Jovian",
    desc: "Expansion, abundance, wisdom",
  },
  Saturn: {
    color: "#8A8060",
    glowColor: "rgba(138, 128, 96, 0.3)",
    size: 12,
    symbol: "♄",
    energy: "Saturnian",
    desc: "Structure, discipline, time",
  },
  Uranus: {
    color: "#60C8D0",
    glowColor: "rgba(96, 200, 208, 0.3)",
    size: 9,
    symbol: "♅",
    energy: "Uranian",
    desc: "Innovation, awakening, change",
  },
  Neptune: {
    color: "#4068D0",
    glowColor: "rgba(64, 104, 208, 0.3)",
    size: 9,
    symbol: "♆",
    energy: "Neptunian",
    desc: "Dreams, mystery, transcendence",
  },
};

const PLAYER_STONE = {
  color: "#A0A8B8",
  coreColor: "#D0D8E8",
  size: 24,
};

// ─── CRYSTAL CATALOG ─────────────────────────────────────────────────────────
// Rarity weights: Common=60, Uncommon=25, Rare=12, Legendary=3
const RARITY = {
  Common: { label: "Common", color: "#8090A0", weight: 60 },
  Uncommon: { label: "Uncommon", color: "#4CAF50", weight: 25 },
  Rare: { label: "Rare", color: "#7C4DFF", weight: 12 },
  Legendary: { label: "Legendary", color: "#FFD700", weight: 3 },
};

const CRYSTALS = [
  // ── Always available (no celestial requirement) ──
  { id: "quartz", name: "Clear Quartz", affinity: null, rarity: "Common",
    color: "#E8E8F0", glowColor: "rgba(232,232,240,0.3)", symbol: "◇",
    hardness: 7, desc: "Amplifies energy. The universal stone.", sides: 6 },
  { id: "granite", name: "Granite", affinity: null, rarity: "Common",
    color: "#908880", glowColor: "rgba(144,136,128,0.3)", symbol: "⬡",
    hardness: 6.5, desc: "Steady and grounding. A foundation stone.", sides: 5 },
  { id: "obsidian", name: "Obsidian", affinity: null, rarity: "Uncommon",
    color: "#1A1A2E", glowColor: "rgba(26,26,46,0.4)", symbol: "◆",
    hardness: 5.5, desc: "Volcanic glass. Shields against negativity.", sides: 4 },

  // ── Sun-aligned ──
  { id: "citrine", name: "Citrine", affinity: "Sun", rarity: "Uncommon",
    color: "#F0C040", glowColor: "rgba(240,192,64,0.3)", symbol: "◇",
    hardness: 7, desc: "Carries the power of the sun. Manifests abundance.", sides: 6 },
  { id: "sunstone", name: "Sunstone", affinity: "Sun", rarity: "Rare",
    color: "#E87030", glowColor: "rgba(232,112,48,0.4)", symbol: "✦",
    hardness: 6.5, desc: "Shimmers with solar fire. Radiates leadership.", sides: 8 },

  // ── Moon-aligned ──
  { id: "moonstone", name: "Moonstone", affinity: "Moon", rarity: "Uncommon",
    color: "#C8D0E8", glowColor: "rgba(200,208,232,0.4)", symbol: "◎",
    hardness: 6, desc: "Glows with inner light. Enhances intuition.", sides: 6 },
  { id: "selenite", name: "Selenite", affinity: "Moon", rarity: "Rare",
    color: "#E8E0F0", glowColor: "rgba(232,224,240,0.5)", symbol: "▽",
    hardness: 2, desc: "Named for the Moon goddess. Purifies energy.", sides: 4 },

  // ── Mars-aligned ──
  { id: "red_jasper", name: "Red Jasper", affinity: "Mars", rarity: "Uncommon",
    color: "#C04030", glowColor: "rgba(192,64,48,0.3)", symbol: "◆",
    hardness: 7, desc: "Stone of endurance. Fuels courage and stamina.", sides: 5 },
  { id: "garnet", name: "Garnet", affinity: "Mars", rarity: "Rare",
    color: "#901020", glowColor: "rgba(144,16,32,0.4)", symbol: "◇",
    hardness: 7, desc: "Deep red fire. Ignites passion and vitality.", sides: 8 },

  // ── Venus-aligned ──
  { id: "rose_quartz", name: "Rose Quartz", affinity: "Venus", rarity: "Common",
    color: "#E8A0B0", glowColor: "rgba(232,160,176,0.3)", symbol: "◇",
    hardness: 7, desc: "The stone of love. Soothes the heart.", sides: 6 },
  { id: "emerald", name: "Emerald", affinity: "Venus", rarity: "Legendary",
    color: "#30A050", glowColor: "rgba(48,160,80,0.4)", symbol: "◆",
    hardness: 7.5, desc: "Sacred to Venus. Bestows harmony and renewal.", sides: 6 },

  // ── Jupiter-aligned ──
  { id: "amethyst", name: "Amethyst", affinity: "Jupiter", rarity: "Uncommon",
    color: "#9060C0", glowColor: "rgba(144,96,192,0.3)", symbol: "◇",
    hardness: 7, desc: "Royal purple. Expands wisdom and spiritual sight.", sides: 6 },
  { id: "lapis_lazuli", name: "Lapis Lazuli", affinity: "Jupiter", rarity: "Rare",
    color: "#1840A0", glowColor: "rgba(24,64,160,0.4)", symbol: "◆",
    hardness: 5.5, desc: "Stone of the heavens. Commands truth and sovereignty.", sides: 5 },

  // ── Saturn-aligned ──
  { id: "onyx", name: "Onyx", affinity: "Saturn", rarity: "Uncommon",
    color: "#202028", glowColor: "rgba(32,32,40,0.4)", symbol: "■",
    hardness: 7, desc: "Absorbs and transforms. Teaches discipline.", sides: 4 },
  { id: "black_tourmaline", name: "Black Tourmaline", affinity: "Saturn", rarity: "Rare",
    color: "#101018", glowColor: "rgba(16,16,24,0.5)", symbol: "▮",
    hardness: 7.5, desc: "The great protector. Grounds and purifies.", sides: 3 },
];

const CRYSTAL_DROP_CHANCE = 0.25; // 25% chance per click
const MAX_FIELD_CRYSTALS = 5; // max uncollected crystals on field

function rollCrystalDrop(skyData) {
  if (Math.random() > CRYSTAL_DROP_CHANCE) return null;

  // Determine which bodies are above horizon
  const activeBodies = new Set();
  if (skyData) {
    if (skyData.sun.is_above_horizon) activeBodies.add("Sun");
    if (skyData.moon.is_above_horizon) activeBodies.add("Moon");
    skyData.planets.forEach((p) => {
      if (p.is_above_horizon) activeBodies.add(p.name);
    });
  }

  // Build weighted pool
  const pool = [];
  CRYSTALS.forEach((crystal) => {
    // Always include null-affinity crystals
    // Include affinity crystals only if their body is above horizon
    if (crystal.affinity === null || activeBodies.has(crystal.affinity)) {
      const rarityInfo = RARITY[crystal.rarity];
      // Bonus weight if the matching body is up
      const affinityBonus = crystal.affinity && activeBodies.has(crystal.affinity) ? 1.5 : 1;
      pool.push({ crystal, weight: rarityInfo.weight * affinityBonus });
    }
  });

  if (pool.length === 0) return null;

  // Weighted random selection
  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.crystal;
  }
  return pool[pool.length - 1].crystal;
}

// Draw a crystal shape on canvas
function drawCrystalShape(ctx, x, y, size, sides, color, glowColor, timestamp) {
  const pulse = 1 + 0.06 * Math.sin(timestamp / 800 + x * 0.05);
  const s = size * pulse;

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
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function azimuthToAngle(azDeg) {
  return ((azDeg - 90) * Math.PI) / 180;
}

function altitudeToIntensity(altDeg) {
  if (altDeg <= 0) return 0;
  if (altDeg >= 60) return 1;
  return 0.3 + 0.7 * (altDeg / 60);
}

// ─── DEBUG LOG ───────────────────────────────────────────────────────────────
function DebugLog({ entries }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "150px",
        overflow: "auto",
        background: "rgba(0,0,0,0.85)",
        color: "#7f8",
        fontFamily: "monospace",
        fontSize: "11px",
        padding: "8px",
        zIndex: 1000,
      }}
    >
      {entries.map((e, i) => (
        <div key={i}>
          <span style={{ color: "#888" }}>[{e.time}]</span> {e.msg}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
function App() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const bodyPositionsRef = useRef([]);
  const clickEffectsRef = useRef([]);
  const floatingTextsRef = useRef([]);
  const fieldCrystalsRef = useRef([]);

  const [skyData, setSkyData] = useState(null);
  const [location, setLocation] = useState(null);
  const [hoveredBody, setHoveredBody] = useState(null);
  const [hoveredCrystal, setHoveredCrystal] = useState(null);
  const [energy, setEnergy] = useState({ Solar: 0, Lunar: 0 });
  const [logs, setLogs] = useState([]);
  const [clickPower, setClickPower] = useState(1); // upgradable later
  const [inventory, setInventory] = useState([]); // collected crystals
  const [showInventory, setShowInventory] = useState(false);

  const log = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-30), { time, msg }]);
    console.log(`[${time}] ${msg}`);
  }, []);

  // ─── Geolocation ──────────────────────────────────────────────────────
  useEffect(() => {
    log("Requesting geolocation...");
    if (!navigator.geolocation) {
      log("ERROR: Geolocation not supported by browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        log(`Location acquired: ${loc.lat.toFixed(4)}°, ${loc.lon.toFixed(4)}°`);
        setLocation(loc);
      },
      (err) => {
        log(`ERROR: Geolocation failed - ${err.message} (code: ${err.code})`);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [log]);

  // ─── Fetch sky data ───────────────────────────────────────────────────
  useEffect(() => {
    if (!location) return;

    const fetchSky = async () => {
      const url = `${API_BASE}/sky?lat=${location.lat}&lon=${location.lon}`;
      log(`Fetching sky data: ${url}`);
      try {
        const res = await fetch(url);
        log(`API response status: ${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const aboveHorizon = [
          data.sun.is_above_horizon ? "Sun" : null,
          data.moon.is_above_horizon ? "Moon" : null,
          ...data.planets
            .filter((p) => p.is_above_horizon)
            .map((p) => p.name),
        ].filter(Boolean);

        log(`Sky data received. Above horizon: ${aboveHorizon.join(", ") || "none"}`);
        log(
          `Moon phase: ${data.moon.phase_name} (${(data.moon.illuminated_fraction * 100).toFixed(0)}%)`
        );
        setSkyData(data);
      } catch (e) {
        log(`ERROR: Sky fetch failed - ${e.message}`);
      }
    };

    fetchSky();
    const interval = setInterval(fetchSky, SKY_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [location, log]);

  // ─── Energy accumulation (idle - Solar only to start) ──────────────
  useEffect(() => {
    if (!skyData) return;
    const interval = setInterval(() => {
      setEnergy((prev) => {
        const next = { ...prev };
        if (skyData.sun.is_above_horizon) {
          next.Solar += 0.5 * altitudeToIntensity(skyData.sun.altitude_degrees);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [skyData]);

  // ─── Canvas draw ──────────────────────────────────────────────────────
  const draw = useCallback(
    (timestamp) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W = canvas.width;
      const H = canvas.height;
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
      if (!skyData) return;

      const bodies = [];
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

      bodyPositionsRef.current = bodies;

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

        // Particles
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

      // ── Field crystals ──
      fieldCrystalsRef.current.forEach((fc) => {
        if (fc.collected) return;
        const age = timestamp - fc.spawnTime;
        // Fade in over 500ms
        const fadeIn = Math.min(1, age / 500);
        const fx = cx + fc.fieldX;
        const fy = cy + fc.fieldY;
        ctx.globalAlpha = fadeIn;
        drawCrystalShape(ctx, fx, fy, 10, fc.sides, fc.color, fc.glowColor, timestamp);
        ctx.globalAlpha = 1;
      });

      // ── Click effects ──
      const now = timestamp;

      // Ripple effects
      clickEffectsRef.current = clickEffectsRef.current.filter((fx) => {
        const age = now - fx.startTime;
        if (age < 0) return true; // not started yet
        if (age > fx.duration) return false;
        const progress = age / fx.duration;

        if (fx.type === "ripple") {
          const rippleRadius = Math.max(0, fx.maxRadius * progress);
          const alpha = 0.5 * (1 - progress);
          const rColor = fx.color || "255, 215, 0";
          ctx.strokeStyle = fx.color
            ? `${fx.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
            : `rgba(255, 215, 0, ${alpha})`;
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
          ctx.fillStyle = fx.color
            ? `${fx.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
            : `rgba(255, 215, 0, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
        return true;
      });

      // Floating text effects
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        const age = now - ft.startTime;
        if (age > ft.duration) return false;
        const progress = age / ft.duration;
        const alpha = 1 - progress;
        const yOffset = -40 * progress;

        ctx.font = `bold ${14 + 4 * (1 - progress)}px "Palatino", Georgia, serif`;
        ctx.fillStyle = ft.color
          ? `${ft.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
          : `rgba(255, 215, 0, ${alpha})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ft.text, ft.x, ft.y + yOffset);
        return true;
      });

      // Horizon label
      ctx.font = '10px "Palatino", Georgia, serif';
      ctx.fillStyle = "rgba(80, 90, 110, 0.5)";
      ctx.textAlign = "center";
      ctx.fillText("— HORIZON —", cx, cy + radius + 35);
    },
    [skyData]
  );

  // ─── Animation loop ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const size = Math.min(window.innerWidth - 32, window.innerHeight - 250, 700);
      canvas.width = size;
      canvas.height = size;
    };
    resize();
    window.addEventListener("resize", resize);

    let running = true;
    const loop = (ts) => {
      if (!running) return;
      draw(ts);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  // ─── Mouse hover ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    let foundBody = null;
    bodyPositionsRef.current.forEach((body) => {
      const dx = mx - body.x;
      const dy = my - body.y;
      if (Math.sqrt(dx * dx + dy * dy) < body.config.size * 2.5) {
        foundBody = body;
      }
    });

    // Check field crystals
    let foundCrystal = null;
    fieldCrystalsRef.current.forEach((fc) => {
      if (fc.collected) return;
      const fx = cx + fc.fieldX;
      const fy = cy + fc.fieldY;
      const dx = mx - fx;
      const dy = my - fy;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        foundCrystal = fc;
      }
    });

    // Check center stone
    const dxc = mx - cx;
    const dyc = my - cy;
    const overStone = Math.sqrt(dxc * dxc + dyc * dyc) < PLAYER_STONE.size * 2;

    setHoveredBody(foundBody);
    setHoveredCrystal(foundCrystal);
    canvas.style.cursor = (foundBody || foundCrystal || overStone) ? "pointer" : "default";
  }, []);

  // ─── Click handler (energy + crystal collection) ───────────────────────
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const now = performance.now();

    // Check if clicking a field crystal first
    let clickedCrystal = null;
    fieldCrystalsRef.current.forEach((fc) => {
      if (fc.collected) return;
      const fx = cx + fc.fieldX;
      const fy = cy + fc.fieldY;
      const dx = mx - fx;
      const dy = my - fy;
      if (Math.sqrt(dx * dx + dy * dy) < 18) {
        clickedCrystal = fc;
      }
    });

    if (clickedCrystal) {
      // Collect the crystal
      clickedCrystal.collected = true;
      fieldCrystalsRef.current = fieldCrystalsRef.current.filter((fc) => !fc.collected);

      // Add to inventory
      setInventory((prev) => [
        ...prev,
        {
          id: clickedCrystal.id,
          name: clickedCrystal.name,
          rarity: clickedCrystal.rarity,
          color: clickedCrystal.color,
          glowColor: clickedCrystal.glowColor,
          symbol: clickedCrystal.symbol,
          sides: clickedCrystal.sides,
          affinity: clickedCrystal.affinity,
          hardness: clickedCrystal.hardness,
          desc: clickedCrystal.desc,
          collectedAt: Date.now(),
        },
      ]);

      // Collection effects
      const fx = cx + clickedCrystal.fieldX;
      const fy = cy + clickedCrystal.fieldY;
      const rarityColor = RARITY[clickedCrystal.rarity].color;

      // Ripple at crystal location
      clickEffectsRef.current.push({
        type: "ripple",
        x: fx,
        y: fy,
        maxRadius: 30,
        startTime: now,
        duration: 400,
        color: rarityColor,
      });

      // Particles burst in crystal's color
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.3;
        clickEffectsRef.current.push({
          type: "particle",
          x: fx,
          y: fy,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          size: 2,
          startTime: now,
          duration: 400,
          color: clickedCrystal.color,
        });
      }

      // Floating text with crystal name
      floatingTextsRef.current.push({
        text: clickedCrystal.name,
        x: fx,
        y: fy - 15,
        startTime: now,
        duration: 1200,
        color: rarityColor,
      });

      log(`Collected: ${clickedCrystal.name} (${clickedCrystal.rarity})`);
      setHoveredCrystal(null);
      return;
    }

    // Otherwise check center stone click
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > PLAYER_STONE.size * 2.5) return;

    const earned = clickPower;

    // Add energy
    setEnergy((prev) => ({ ...prev, Solar: prev.Solar + earned }));

    // Spawn ripple effects (2 staggered)
    clickEffectsRef.current.push({
      type: "ripple",
      x: cx,
      y: cy,
      maxRadius: PLAYER_STONE.size * 4,
      startTime: now,
      duration: 600,
    });
    clickEffectsRef.current.push({
      type: "ripple",
      x: cx,
      y: cy,
      maxRadius: PLAYER_STONE.size * 3,
      startTime: now + 80,
      duration: 500,
    });

    // Spawn burst particles
    const particleCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
      const speed = 1.5 + Math.random() * 2.5;
      clickEffectsRef.current.push({
        type: "particle",
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        startTime: now + Math.random() * 50,
        duration: 400 + Math.random() * 300,
      });
    }

    // Floating text
    floatingTextsRef.current.push({
      text: `+${earned}`,
      x: cx + (Math.random() - 0.5) * 20,
      y: cy - PLAYER_STONE.size * 1.5,
      startTime: now,
      duration: 900,
    });

    // Crystal drop chance
    if (fieldCrystalsRef.current.length < MAX_FIELD_CRYSTALS) {
      const drop = rollCrystalDrop(skyData);
      if (drop) {
        // Place crystal at random position between center and edge
        const angle = Math.random() * Math.PI * 2;
        const minDist = PLAYER_STONE.size * 4;
        const canvas = canvasRef.current;
        const fieldRadius = (Math.min(canvas.width, canvas.height) / 2 - 40) * 0.85;
        const dist = minDist + Math.random() * (fieldRadius - minDist);
        fieldCrystalsRef.current.push({
          ...drop,
          fieldX: Math.cos(angle) * dist,
          fieldY: Math.sin(angle) * dist,
          spawnTime: now,
          collected: false,
          fieldId: Date.now() + Math.random(),
        });
        log(`Crystal spawned: ${drop.name} (${drop.rarity})`);
      }
    }
  }, [clickPower, skyData, log]);

  // ─── RENDER ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        background: "#020208",
        color: "#c0c8e0",
        fontFamily: '"Palatino", "Palatino Linotype", "Book Antiqua", Georgia, serif',
        padding: "16px",
      }}
    >
      <h1
        style={{
          fontSize: "1.4rem",
          fontWeight: 400,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "rgba(200, 210, 230, 0.7)",
          marginBottom: "4px",
        }}
      >
        Celestial Attunement
      </h1>
      <p
        style={{
          fontSize: "0.75rem",
          color: "rgba(120, 130, 160, 0.6)",
          marginBottom: "12px",
          letterSpacing: "0.1em",
        }}
      >
        {location
          ? `${location.lat.toFixed(2)}°${location.lat >= 0 ? "N" : "S"}, ${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? "E" : "W"}`
          : "Locating..."}
      </p>

      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "12px",
          fontSize: "0.85rem",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: CELESTIAL_CONFIG.Sun.color }}>☉</span>
          <span>{Math.floor(energy.Solar)} Solar</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: CELESTIAL_CONFIG.Moon.color }}>☽</span>
          <span>{Math.floor(energy.Lunar)} Lunar</span>
        </div>
        <button
          onClick={() => setShowInventory(true)}
          style={{
            background: "rgba(60, 65, 80, 0.4)",
            border: "1px solid rgba(100, 110, 130, 0.4)",
            color: "#c0c8e0",
            padding: "4px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.8rem",
            letterSpacing: "0.05em",
          }}
        >
          ◆ Inventory ({inventory.length})
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredBody(null)}
        onClick={handleClick}
        style={{
          borderRadius: "8px",
          cursor: "default",
        }}
      />

      {hoveredBody && !hoveredCrystal && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px 20px",
            background: "rgba(20, 22, 35, 0.9)",
            border: `1px solid ${hoveredBody.config.color}44`,
            borderRadius: "6px",
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          <div style={{ fontSize: "1.1rem", color: hoveredBody.config.color, marginBottom: "4px" }}>
            {hoveredBody.config.symbol} {hoveredBody.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(160, 170, 200, 0.7)", marginBottom: "6px" }}>
            {hoveredBody.config.desc}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(120, 130, 160, 0.6)" }}>
            Alt: {hoveredBody.altitude_degrees.toFixed(1)}° · Az:{" "}
            {hoveredBody.azimuth_degrees.toFixed(1)}°
            {hoveredBody.distance_au && ` · ${hoveredBody.distance_au.toFixed(3)} AU`}
          </div>
          <div style={{ marginTop: "6px", fontSize: "0.75rem", color: hoveredBody.config.color }}>
            {hoveredBody.config.energy} Energy
          </div>
        </div>
      )}

      {hoveredCrystal && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px 20px",
            background: "rgba(20, 22, 35, 0.9)",
            border: `1px solid ${RARITY[hoveredCrystal.rarity].color}44`,
            borderRadius: "6px",
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          <div style={{ fontSize: "1.1rem", color: hoveredCrystal.color, marginBottom: "4px" }}>
            {hoveredCrystal.symbol} {hoveredCrystal.name}
          </div>
          <div style={{ fontSize: "0.7rem", color: RARITY[hoveredCrystal.rarity].color, marginBottom: "4px" }}>
            {hoveredCrystal.rarity}
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(160, 170, 200, 0.7)", marginBottom: "4px" }}>
            {hoveredCrystal.desc}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(120, 130, 160, 0.6)" }}>
            Hardness: {hoveredCrystal.hardness}
            {hoveredCrystal.affinity && ` · Affinity: ${hoveredCrystal.affinity}`}
          </div>
          <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "rgba(180, 190, 210, 0.5)" }}>
            Click to collect
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(2, 2, 8, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 900,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInventory(false);
          }}
        >
          <div
            style={{
              background: "#0a0a14",
              border: "1px solid rgba(60, 65, 80, 0.6)",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "70vh",
              overflow: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 400, letterSpacing: "0.15em", margin: 0 }}>
                ◆ Crystal Collection
              </h2>
              <button
                onClick={() => setShowInventory(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8090A0",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            {inventory.length === 0 ? (
              <p style={{ color: "rgba(120, 130, 160, 0.5)", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>
                No crystals collected yet. Click the Lodestone to find them.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {/* Group by crystal type and show counts */}
                {Object.values(
                  inventory.reduce((acc, item) => {
                    if (!acc[item.id]) {
                      acc[item.id] = { ...item, count: 0 };
                    }
                    acc[item.id].count++;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => {
                    const rarityOrder = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };
                    return rarityOrder[b.rarity] - rarityOrder[a.rarity] || a.name.localeCompare(b.name);
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        background: "rgba(30, 32, 45, 0.5)",
                        borderRadius: "4px",
                        borderLeft: `3px solid ${RARITY[item.rarity].color}`,
                      }}
                    >
                      <span style={{ fontSize: "1.2rem", color: item.color }}>{item.symbol}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", color: "#c0c8e0" }}>
                          {item.name}
                          <span style={{ color: "rgba(120,130,160,0.5)", marginLeft: "6px" }}>×{item.count}</span>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: RARITY[item.rarity].color }}>
                          {item.rarity}
                          {item.affinity && (
                            <span style={{ color: "rgba(120,130,160,0.5)", marginLeft: "8px" }}>
                              {item.affinity} affinity
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(100,110,130,0.5)" }}>
                        H:{item.hardness}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!skyData && location && (
        <div
          style={{
            marginTop: "40px",
            fontSize: "0.85rem",
            color: "rgba(120, 130, 160, 0.5)",
          }}
        >
          Attuning to the celestial sphere...
        </div>
      )}

      <DebugLog entries={logs} />
    </div>
  );
}

export default App;
