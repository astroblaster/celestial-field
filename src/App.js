import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  API_BASE, SKY_POLL_INTERVAL, SAVE_INTERVAL,
  CELESTIAL_CONFIG, PLAYER_STONE, RARITY, CRYSTAL_BASE_SIZE,
  MAX_FIELD_CRYSTALS, CRYSTAL_SELL_VALUE, UPGRADES,
} from "./game/data";
import {
  rollCrystalDrop, getCrystalLifetime, getCrystalSellValue,
  saveGame, loadGame, clearSave, getDefaultState,
  calculateOfflineEarnings, altitudeToIntensity, formatDuration,
  getUpgradeCost, getUpgradeEffect, canAffordUpgrade,
} from "./game/logic";
import { drawField } from "./game/renderer";

// ─── DEBUG LOG ───────────────────────────────────────────────────────────────
function DebugLog({ entries }) {
  const [collapsed, setCollapsed] = React.useState(true);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          background: "rgba(0,0,0,0.85)",
          color: "#7f8",
          fontFamily: "monospace",
          fontSize: "11px",
          padding: "4px 10px",
          cursor: "pointer",
          userSelect: "none",
          borderTopRightRadius: "4px",
          display: "inline-block",
        }}
      >
        {collapsed ? "▶ Log" : "▼ Log"}
      </div>
      {!collapsed && (
        <div
          style={{
            maxHeight: "150px",
            maxWidth: "500px",
            overflow: "auto",
            background: "rgba(0,0,0,0.85)",
            color: "#7f8",
            fontFamily: "monospace",
            fontSize: "11px",
            padding: "8px",
            whiteSpace: "nowrap",
          }}
        >
          {entries.map((e, i) => (
            <div key={i}>
              <span style={{ color: "#888" }}>[{e.time}]</span> {e.msg}
            </div>
          ))}
        </div>
      )}
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
  const [inventory, setInventory] = useState([]);
  const [clickPower, setClickPower] = useState(1);
  const [totalClicks, setTotalClicks] = useState(0);
  const [upgradeLevels, setUpgradeLevels] = useState({ clickPower: 0, dropChance: 0 });
  const [showInventory, setShowInventory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [offlineReport, setOfflineReport] = useState(null);
  const [logs, setLogs] = useState([]);

  const log = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-30), { time, msg }]);
    console.log(`[${time}] ${msg}`);
  }, []);

  // ─── Load saved game on mount ──────────────────────────────────────────
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setEnergy(saved.energy || { Solar: 0, Lunar: 0 });
      setInventory(saved.inventory || []);
      setClickPower(saved.clickPower || 1);
      setTotalClicks(saved.totalClicks || 0);
      setUpgradeLevels(saved.upgradeLevels || { clickPower: 0, dropChance: 0 });
      if (saved.location) setLocation(saved.location);
      log(`Game loaded. Solar: ${Math.floor(saved.energy?.Solar || 0)}, Crystals: ${(saved.inventory || []).length}`);

      // Calculate offline earnings
      const offline = calculateOfflineEarnings(saved.lastSaveTime);
      if (offline.solar > 0) {
        setEnergy((prev) => ({ ...prev, Solar: prev.Solar + offline.solar }));
        setOfflineReport(offline);
        log(`Offline earnings: +${offline.solar} Solar (${formatDuration(offline.seconds)} away)`);
      }
    } else {
      log("No save found. Starting fresh.");
    }
  }, [log]);

  // ─── Auto-save ─────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame({
        energy,
        inventory,
        clickPower,
        totalClicks,
        upgradeLevels,
        location,
      });
    }, SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [energy, inventory, clickPower, totalClicks, upgradeLevels, location]);

  // ─── Save on page close ────────────────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      saveGame({ energy, inventory, clickPower, totalClicks, upgradeLevels, location });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [energy, inventory, clickPower, totalClicks, location]);

  // ─── Geolocation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (location) return;
    log("Requesting geolocation...");
    if (!navigator.geolocation) {
      log("ERROR: Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        log(`Location: ${loc.lat.toFixed(4)}°, ${loc.lon.toFixed(4)}°`);
        setLocation(loc);
      },
      (err) => log(`ERROR: Geolocation failed - ${err.message}`),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [log, location]);

  // ─── Fetch sky data ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!location) return;
    const fetchSky = async () => {
      const url = `${API_BASE}/sky?lat=${location.lat}&lon=${location.lon}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const above = [
          data.sun.is_above_horizon ? "Sun" : null,
          data.moon.is_above_horizon ? "Moon" : null,
          ...data.planets.filter((p) => p.is_above_horizon).map((p) => p.name),
        ].filter(Boolean);
        log(`Sky: ${above.join(", ") || "nothing above horizon"}`);
        setSkyData(data);
      } catch (e) {
        log(`ERROR: Sky fetch - ${e.message}`);
      }
    };
    fetchSky();
    const interval = setInterval(fetchSky, SKY_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [location, log]);

  // ─── Idle energy accumulation ───────────────────────────────────────────
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

  // ─── Crystal expiration ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const before = fieldCrystalsRef.current.length;
      fieldCrystalsRef.current = fieldCrystalsRef.current.filter((fc) => {
        const age = now - fc.spawnTime;
        return age < getCrystalLifetime(fc.rarity);
      });
      const expired = before - fieldCrystalsRef.current.length;
      if (expired > 0) {
        log(`${expired} crystal${expired > 1 ? "s" : ""} faded away...`);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [log]);

  // ─── Canvas draw ────────────────────────────────────────────────────────
  const draw = useCallback(
    (timestamp) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const bodies = drawField(
        ctx, canvas.width, canvas.height, timestamp,
        skyData, fieldCrystalsRef.current,
        clickEffectsRef.current, floatingTextsRef.current
      );
      bodyPositionsRef.current = bodies || [];
    },
    [skyData]
  );

  // ─── Animation loop ────────────────────────────────────────────────────
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

  // ─── Mouse hover ────────────────────────────────────────────────────────
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
      if (Math.sqrt(dx * dx + dy * dy) < body.config.size * 2.5) foundBody = body;
    });

    let foundCrystal = null;
    fieldCrystalsRef.current.forEach((fc) => {
      if (fc.collected) return;
      const dx = mx - (cx + fc.fieldX);
      const dy = my - (cy + fc.fieldY);
      if (Math.sqrt(dx * dx + dy * dy) < CRYSTAL_BASE_SIZE * 2) foundCrystal = fc;
    });

    const dxc = mx - cx;
    const dyc = my - cy;
    const overStone = Math.sqrt(dxc * dxc + dyc * dyc) < PLAYER_STONE.size * 2;

    setHoveredBody(foundBody);
    setHoveredCrystal(foundCrystal);
    canvas.style.cursor = (foundBody || foundCrystal || overStone) ? "pointer" : "default";
  }, []);

  // ─── Click handler ──────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const now = performance.now();

    // Check crystal click first
    let clickedCrystal = null;
    fieldCrystalsRef.current.forEach((fc) => {
      if (fc.collected) return;
      const dx = mx - (cx + fc.fieldX);
      const dy = my - (cy + fc.fieldY);
      if (Math.sqrt(dx * dx + dy * dy) < CRYSTAL_BASE_SIZE * 2) clickedCrystal = fc;
    });

    if (clickedCrystal) {
      clickedCrystal.collected = true;
      fieldCrystalsRef.current = fieldCrystalsRef.current.filter((fc) => !fc.collected);

      setInventory((prev) => [...prev, {
        id: clickedCrystal.id, name: clickedCrystal.name, rarity: clickedCrystal.rarity,
        color: clickedCrystal.color, glowColor: clickedCrystal.glowColor,
        symbol: clickedCrystal.symbol, sides: clickedCrystal.sides,
        affinity: clickedCrystal.affinity, hardness: clickedCrystal.hardness,
        desc: clickedCrystal.desc, collectedAt: Date.now(),
      }]);

      const fx = cx + clickedCrystal.fieldX;
      const fy = cy + clickedCrystal.fieldY;
      const rarityColor = RARITY[clickedCrystal.rarity].color;

      clickEffectsRef.current.push({ type: "ripple", x: fx, y: fy, maxRadius: 30, startTime: now, duration: 400, color: rarityColor });
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.3;
        clickEffectsRef.current.push({ type: "particle", x: fx, y: fy, vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2, size: 2, startTime: now, duration: 400, color: clickedCrystal.color });
      }
      floatingTextsRef.current.push({ text: clickedCrystal.name, x: fx, y: fy - 15, startTime: now, duration: 1200, color: rarityColor });
      log(`Collected: ${clickedCrystal.name} (${clickedCrystal.rarity})`);
      setHoveredCrystal(null);
      return;
    }

    // Center stone click
    const dx = mx - cx;
    const dy = my - cy;
    if (Math.sqrt(dx * dx + dy * dy) > PLAYER_STONE.size * 2.5) return;

    const earned = clickPower;
    setEnergy((prev) => ({ ...prev, Solar: prev.Solar + earned }));
    setTotalClicks((prev) => prev + 1);

    // Ripples
    clickEffectsRef.current.push({ type: "ripple", x: cx, y: cy, maxRadius: PLAYER_STONE.size * 4, startTime: now, duration: 600 });
    clickEffectsRef.current.push({ type: "ripple", x: cx, y: cy, maxRadius: PLAYER_STONE.size * 3, startTime: now + 80, duration: 500 });

    // Particles
    const pCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < pCount; i++) {
      const angle = (Math.PI * 2 * i) / pCount + (Math.random() - 0.5) * 0.4;
      const speed = 1.5 + Math.random() * 2.5;
      clickEffectsRef.current.push({ type: "particle", x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 1.5 + Math.random() * 2, startTime: now + Math.random() * 50, duration: 400 + Math.random() * 300 });
    }

    // Floating text
    floatingTextsRef.current.push({ text: `+${earned}`, x: cx + (Math.random() - 0.5) * 20, y: cy - PLAYER_STONE.size * 1.5, startTime: now, duration: 900 });

    // Crystal drop
    if (fieldCrystalsRef.current.length < MAX_FIELD_CRYSTALS) {
      const dropChance = getUpgradeEffect("dropChance", upgradeLevels.dropChance);
      const drop = rollCrystalDrop(skyData, dropChance);
      if (drop) {
        const angle = Math.random() * Math.PI * 2;
        const minDist = PLAYER_STONE.size * 4;
        const fieldRadius = (Math.min(canvas.width, canvas.height) / 2 - 40) * 0.85;
        const dist = minDist + Math.random() * (fieldRadius - minDist);
        fieldCrystalsRef.current.push({
          ...drop, fieldX: Math.cos(angle) * dist, fieldY: Math.sin(angle) * dist,
          spawnTime: now, collected: false, fieldId: Date.now() + Math.random(),
        });
        log(`Crystal spawned: ${drop.name} (${drop.rarity})`);
      }
    }
  }, [clickPower, skyData, log, upgradeLevels]);

  // ─── Sell crystal ───────────────────────────────────────────────────────
  const handleSell = useCallback((crystalId, count = 1) => {
    setInventory((prev) => {
      const idx = prev.findIndex((c) => c.id === crystalId);
      if (idx === -1) return prev;
      const crystal = prev[idx];
      const value = getCrystalSellValue(crystal.rarity);
      setEnergy((prevE) => ({ ...prevE, Solar: prevE.Solar + value * count }));
      let removed = 0;
      return prev.filter((c) => {
        if (c.id === crystalId && removed < count) {
          removed++;
          return false;
        }
        return true;
      });
    });
  }, []);

  // ─── Purchase upgrade ────────────────────────────────────────────────
  const handleUpgrade = useCallback((upgradeId) => {
    const level = upgradeLevels[upgradeId] || 0;
    const cost = getUpgradeCost(upgradeId, level);
    if (cost === null || energy.Solar < cost) return;

    setEnergy((prev) => ({ ...prev, Solar: prev.Solar - cost }));
    setUpgradeLevels((prev) => {
      const newLevels = { ...prev, [upgradeId]: (prev[upgradeId] || 0) + 1 };
      // Sync clickPower state if it's the click upgrade
      if (upgradeId === "clickPower") {
        setClickPower(getUpgradeEffect("clickPower", newLevels.clickPower));
      }
      return newLevels;
    });
    log(`Upgraded ${UPGRADES[upgradeId].name} to level ${level + 1}`);
  }, [upgradeLevels, energy.Solar, log]);

  // ─── Reset game ─────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    clearSave();
    const fresh = getDefaultState();
    setEnergy(fresh.energy);
    setInventory(fresh.inventory);
    setClickPower(fresh.clickPower);
    setTotalClicks(0);
    setUpgradeLevels(fresh.upgradeLevels);
    fieldCrystalsRef.current = [];
    clickEffectsRef.current = [];
    floatingTextsRef.current = [];
    setShowSettings(false);
    log("Game reset.");
  }, [log]);

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        minHeight: "100vh", background: "#020208", color: "#c0c8e0",
        fontFamily: '"Palatino", "Palatino Linotype", "Book Antiqua", Georgia, serif',
        padding: "16px",
      }}
    >
      <h1 style={{ fontSize: "1.4rem", fontWeight: 400, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(200,210,230,0.7)", marginBottom: "4px" }}>
        Celestial Attunement
      </h1>
      <p style={{ fontSize: "0.75rem", color: "rgba(120,130,160,0.6)", marginBottom: "12px", letterSpacing: "0.1em" }}>
        {location
          ? `${location.lat.toFixed(2)}°${location.lat >= 0 ? "N" : "S"}, ${Math.abs(location.lon).toFixed(2)}°${location.lon >= 0 ? "E" : "W"}`
          : "Locating..."}
      </p>

      {/* Top bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "0.85rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: CELESTIAL_CONFIG.Sun.color }}>☉</span>
          <span>{Math.floor(energy.Solar)} Solar</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: CELESTIAL_CONFIG.Moon.color }}>☽</span>
          <span>{Math.floor(energy.Lunar)} Lunar</span>
        </div>
        <button onClick={() => setShowInventory(true)} style={btnStyle}>
          ◆ Inventory ({inventory.length})
        </button>
        <button onClick={() => setShowSettings(true)} style={btnStyle}>
          ⚙
        </button>
      </div>

      {/* Offline report */}
      {offlineReport && (
        <div style={{
          background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)",
          borderRadius: "6px", padding: "10px 20px", marginBottom: "12px",
          textAlign: "center", maxWidth: "350px",
        }}>
          <div style={{ fontSize: "0.85rem", color: "#FFD700", marginBottom: "4px" }}>Welcome back!</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(200,210,230,0.6)" }}>
            You were away for {formatDuration(offlineReport.seconds)}.
            Earned <span style={{ color: "#FFD700" }}>+{offlineReport.solar}</span> Solar energy.
          </div>
          <button onClick={() => setOfflineReport(null)} style={{ ...btnStyle, marginTop: "8px", fontSize: "0.7rem" }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredBody(null); setHoveredCrystal(null); }}
        onClick={handleClick}
        style={{ borderRadius: "8px", cursor: "default" }}
      />

      {/* Upgrade panel */}
      <div style={{
        display: "flex", gap: "12px", marginTop: "12px",
        flexWrap: "wrap", justifyContent: "center", maxWidth: "500px",
      }}>
        {Object.values(UPGRADES).map((upgrade) => {
          const level = upgradeLevels[upgrade.id] || 0;
          const cost = getUpgradeCost(upgrade.id, level);
          const maxed = level >= upgrade.maxLevel;
          const affordable = cost !== null && energy.Solar >= cost;

          return (
            <button
              key={upgrade.id}
              onClick={() => handleUpgrade(upgrade.id)}
              disabled={maxed || !affordable}
              style={{
                background: maxed
                  ? "rgba(40,45,55,0.3)"
                  : affordable
                    ? "rgba(255,215,0,0.08)"
                    : "rgba(30,32,45,0.4)",
                border: `1px solid ${maxed ? "rgba(60,65,80,0.3)" : affordable ? "rgba(255,215,0,0.3)" : "rgba(60,65,80,0.4)"}`,
                borderRadius: "6px",
                padding: "10px 16px",
                cursor: maxed ? "default" : affordable ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                textAlign: "left",
                minWidth: "200px",
                opacity: maxed ? 0.5 : 1,
                flex: "1 1 200px",
              }}
            >
              <div style={{ fontSize: "0.8rem", color: affordable ? "#FFD700" : "#8090A0", marginBottom: "2px" }}>
                {upgrade.symbol} {upgrade.name}
                <span style={{ float: "right", fontSize: "0.7rem", color: "rgba(120,130,160,0.5)" }}>
                  Lv {level}/{upgrade.maxLevel}
                </span>
              </div>
              <div style={{ fontSize: "0.65rem", color: "rgba(160,170,200,0.6)", marginBottom: "4px" }}>
                {upgrade.effectLabel(level)}
              </div>
              <div style={{ fontSize: "0.7rem", color: maxed ? "rgba(100,110,130,0.4)" : affordable ? "#FFD700" : "rgba(160,130,100,0.6)" }}>
                {maxed ? "MAX" : `Cost: ${cost} ☉`}
              </div>
            </button>
          );
        })}
      </div>

      {/* Celestial body tooltip */}
      {hoveredBody && !hoveredCrystal && (
        <div style={tooltipStyle(hoveredBody.config.color)}>
          <div style={{ fontSize: "1.1rem", color: hoveredBody.config.color, marginBottom: "4px" }}>
            {hoveredBody.config.symbol} {hoveredBody.name}
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(160,170,200,0.7)", marginBottom: "6px" }}>
            {hoveredBody.config.desc}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(120,130,160,0.6)" }}>
            Alt: {hoveredBody.altitude_degrees.toFixed(1)}° · Az: {hoveredBody.azimuth_degrees.toFixed(1)}°
            {hoveredBody.distance_au && ` · ${hoveredBody.distance_au.toFixed(3)} AU`}
          </div>
        </div>
      )}

      {/* Crystal tooltip */}
      {hoveredCrystal && (
        <div style={tooltipStyle(RARITY[hoveredCrystal.rarity].color)}>
          <div style={{ fontSize: "1.1rem", color: hoveredCrystal.color, marginBottom: "4px" }}>
            {hoveredCrystal.symbol} {hoveredCrystal.name}
          </div>
          <div style={{ fontSize: "0.7rem", color: RARITY[hoveredCrystal.rarity].color, marginBottom: "4px" }}>
            {hoveredCrystal.rarity} · Worth {getCrystalSellValue(hoveredCrystal.rarity)} ☉
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(160,170,200,0.7)", marginBottom: "4px" }}>
            {hoveredCrystal.desc}
          </div>
          <div style={{ fontSize: "0.7rem", color: "rgba(180,190,210,0.5)" }}>
            Click to collect
          </div>
        </div>
      )}

      {/* Inventory modal */}
      {showInventory && (
        <Modal onClose={() => setShowInventory(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 400, letterSpacing: "0.15em", margin: 0 }}>◆ Crystal Collection</h2>
            <button onClick={() => setShowInventory(false)} style={closeBtnStyle}>✕</button>
          </div>
          {inventory.length === 0 ? (
            <p style={{ color: "rgba(120,130,160,0.5)", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>
              No crystals yet. Click the Lodestone to find them.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.values(
                inventory.reduce((acc, item) => {
                  if (!acc[item.id]) acc[item.id] = { ...item, count: 0 };
                  acc[item.id].count++;
                  return acc;
                }, {})
              )
                .sort((a, b) => {
                  const ro = { Common: 0, Uncommon: 1, Rare: 2, Legendary: 3 };
                  return ro[b.rarity] - ro[a.rarity] || a.name.localeCompare(b.name);
                })
                .map((item) => (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "8px 12px",
                    background: "rgba(30,32,45,0.5)", borderRadius: "4px",
                    borderLeft: `3px solid ${RARITY[item.rarity].color}`,
                  }}>
                    <span style={{ fontSize: "1.2rem", color: item.color }}>{item.symbol}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", color: "#c0c8e0" }}>
                        {item.name}
                        <span style={{ color: "rgba(120,130,160,0.5)", marginLeft: "6px" }}>×{item.count}</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: RARITY[item.rarity].color }}>
                        {item.rarity}
                        {item.affinity && <span style={{ color: "rgba(120,130,160,0.5)", marginLeft: "8px" }}>{item.affinity}</span>}
                        <span style={{ color: "rgba(120,130,160,0.4)", marginLeft: "8px" }}>
                          {getCrystalSellValue(item.rarity)} ☉ each
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => handleSell(item.id, 1)} style={sellBtnStyle}>Sell 1</button>
                      {item.count > 1 && (
                        <button onClick={() => handleSell(item.id, item.count)} style={sellBtnStyle}>All</button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Modal>
      )}

      {/* Settings modal */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 400, letterSpacing: "0.15em", margin: 0 }}>⚙ Settings</h2>
            <button onClick={() => setShowSettings(false)} style={closeBtnStyle}>✕</button>
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(160,170,200,0.6)", marginBottom: "16px" }}>
            <div>Total clicks: {totalClicks}</div>
            <div>Crystals collected: {inventory.length}</div>
            <div>Click power: {clickPower}</div>
          </div>
          <button
            onClick={() => {
              saveGame({ energy, inventory, clickPower, totalClicks, upgradeLevels, location });
              log("Game saved manually.");
            }}
            style={{ ...btnStyle, marginBottom: "8px", width: "100%" }}
          >
            Save Now
          </button>
          <button
            onClick={() => {
              if (window.confirm("Are you sure? This will erase ALL progress permanently.")) {
                handleReset();
              }
            }}
            style={{ ...btnStyle, width: "100%", borderColor: "rgba(200,60,60,0.4)", color: "rgba(200,100,100,0.8)" }}
          >
            Reset All Progress
          </button>
        </Modal>
      )}

      {!skyData && location && (
        <div style={{ marginTop: "40px", fontSize: "0.85rem", color: "rgba(120,130,160,0.5)" }}>
          Attuning to the celestial sphere...
        </div>
      )}

      <DebugLog entries={logs} />
    </div>
  );
}

// ─── SHARED COMPONENTS & STYLES ──────────────────────────────────────────────

function Modal({ children, onClose }) {
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(2,2,8,0.85)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 900,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0a0a14", border: "1px solid rgba(60,65,80,0.6)",
        borderRadius: "8px", padding: "24px", maxWidth: "500px",
        width: "90%", maxHeight: "70vh", overflow: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

const btnStyle = {
  background: "rgba(60,65,80,0.4)", border: "1px solid rgba(100,110,130,0.4)",
  color: "#c0c8e0", padding: "4px 12px", borderRadius: "4px",
  cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", letterSpacing: "0.05em",
};

const sellBtnStyle = {
  background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)",
  color: "#FFD700", padding: "2px 8px", borderRadius: "3px",
  cursor: "pointer", fontFamily: "inherit", fontSize: "0.65rem",
};

const closeBtnStyle = {
  background: "none", border: "none", color: "#8090A0",
  fontSize: "1.2rem", cursor: "pointer", padding: "4px 8px",
};

function tooltipStyle(borderColor) {
  return {
    marginTop: "12px", padding: "12px 20px",
    background: "rgba(20,22,35,0.9)",
    border: `1px solid ${borderColor}44`,
    borderRadius: "6px", textAlign: "center", maxWidth: "300px",
  };
}

export default App;
