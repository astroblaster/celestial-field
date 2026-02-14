import {
  CRYSTALS, RARITY, CRYSTAL_DROP_CHANCE, CRYSTAL_LIFETIME, CRYSTAL_SELL_VALUE,
  SAVE_KEY, OFFLINE_SOLAR_RATE, MAX_OFFLINE_HOURS,
} from "./data";

// ─── CRYSTAL DROP LOGIC ──────────────────────────────────────────────────────

export function rollCrystalDrop(skyData, dropChance = CRYSTAL_DROP_CHANCE) {
  if (Math.random() > dropChance) return null;

  const activeBodies = new Set();
  if (skyData) {
    if (skyData.sun.is_above_horizon) activeBodies.add("Sun");
    if (skyData.moon.is_above_horizon) activeBodies.add("Moon");
    skyData.planets.forEach((p) => {
      if (p.is_above_horizon) activeBodies.add(p.name);
    });
  }

  const pool = [];
  CRYSTALS.forEach((crystal) => {
    if (crystal.affinity === null || activeBodies.has(crystal.affinity)) {
      const rarityInfo = RARITY[crystal.rarity];
      const affinityBonus = crystal.affinity && activeBodies.has(crystal.affinity) ? 1.5 : 1;
      pool.push({ crystal, weight: rarityInfo.weight * affinityBonus });
    }
  });

  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.crystal;
  }
  return pool[pool.length - 1].crystal;
}

export function getCrystalLifetime(rarity) {
  return CRYSTAL_LIFETIME[rarity] || 20000;
}

export function getCrystalSellValue(rarity) {
  return CRYSTAL_SELL_VALUE[rarity] || 1;
}

// ─── SAVE / LOAD ─────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  energy: { Solar: 0, Lunar: 0 },
  inventory: [],
  clickPower: 1,
  totalClicks: 0,
  lastSaveTime: Date.now(),
  location: null,
};

export function saveGame(state) {
  try {
    const saveData = {
      ...state,
      lastSaveTime: Date.now(),
      version: 4, // save format version
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Validate essential fields
    if (!data.energy || typeof data.energy.Solar !== "number") return null;
    return data;
  } catch (e) {
    console.error("Load failed:", e);
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (e) {
    console.error("Clear save failed:", e);
    return false;
  }
}

export function getDefaultState() {
  return { ...DEFAULT_STATE, energy: { ...DEFAULT_STATE.energy }, inventory: [] };
}

// ─── OFFLINE ACCUMULATION ────────────────────────────────────────────────────

export function calculateOfflineEarnings(lastSaveTime) {
  if (!lastSaveTime) return { solar: 0, seconds: 0 };

  const now = Date.now();
  const elapsedMs = now - lastSaveTime;
  const elapsedSeconds = elapsedMs / 1000;
  const maxSeconds = MAX_OFFLINE_HOURS * 3600;
  const cappedSeconds = Math.min(elapsedSeconds, maxSeconds);

  if (cappedSeconds < 10) return { solar: 0, seconds: 0 }; // ignore tiny gaps

  // Rough estimate: assume sun is up ~50% of the time
  // This is a simplification — could be improved with actual sunrise/sunset data
  const sunUpFraction = 0.5;
  const solarEarned = cappedSeconds * OFFLINE_SOLAR_RATE * sunUpFraction;

  return {
    solar: Math.floor(solarEarned),
    seconds: Math.floor(cappedSeconds),
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function azimuthToAngle(azDeg) {
  return ((azDeg - 90) * Math.PI) / 180;
}

export function altitudeToIntensity(altDeg) {
  if (altDeg <= 0) return 0;
  if (altDeg >= 60) return 1;
  return 0.3 + 0.7 * (altDeg / 60);
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
