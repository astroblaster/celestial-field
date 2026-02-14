// ─── API & TIMING ────────────────────────────────────────────────────────────
export const API_BASE = "/api/sky";
export const SKY_POLL_INTERVAL = 60000;
export const SAVE_KEY = "celestial_attunement_save";
export const SAVE_INTERVAL = 5000; // auto-save every 5s

// ─── GAME BALANCE ────────────────────────────────────────────────────────────
export const CRYSTAL_DROP_CHANCE = 0.02; // 2% base, upgradeable
export const MAX_FIELD_CRYSTALS = 5;
export const CRYSTAL_BASE_SIZE = 14;

// ─── UPGRADES ────────────────────────────────────────────────────────────────
export const UPGRADES = {
  clickPower: {
    id: "clickPower",
    name: "Lodestone Resonance",
    desc: "Increases Solar energy per click",
    symbol: "☉↑",
    maxLevel: 10,
    costs: [10, 25, 50, 100, 200, 400, 800, 1600, 3200, 6400],
    effect: (level) => 1 + level, // base 1 + level bonus
    effectLabel: (level) => `+${1 + level} Solar/click`,
  },
  dropChance: {
    id: "dropChance",
    name: "Crystal Attunement",
    desc: "Increases chance of finding crystals",
    symbol: "◇↑",
    maxLevel: 8,
    costs: [50, 100, 200, 400, 800, 1600, 3200, 6400],
    effect: (level) => 0.02 + level * 0.01, // 2% base + 1% per level
    effectLabel: (level) => `${((0.02 + level * 0.01) * 100).toFixed(0)}% drop chance`,
  },
}; // larger than before

// Crystal expiration (ms) — rarer = shorter window
export const CRYSTAL_LIFETIME = {
  Common: 25000,
  Uncommon: 18000,
  Rare: 12000,
  Legendary: 7000,
};

// Crystal sell values (Solar energy)
export const CRYSTAL_SELL_VALUE = {
  Common: 5,
  Uncommon: 20,
  Rare: 75,
  Legendary: 300,
};

// Offline energy rate (Solar per second, applied when sun was likely up)
export const OFFLINE_SOLAR_RATE = 0.3;
export const MAX_OFFLINE_HOURS = 12;

// ─── CELESTIAL BODIES ────────────────────────────────────────────────────────
export const CELESTIAL_CONFIG = {
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

// ─── PLAYER STONE ────────────────────────────────────────────────────────────
export const PLAYER_STONE = {
  color: "#A0A8B8",
  coreColor: "#D0D8E8",
  size: 24,
};

// ─── RARITY ──────────────────────────────────────────────────────────────────
export const RARITY = {
  Common: { label: "Common", color: "#8090A0", weight: 60 },
  Uncommon: { label: "Uncommon", color: "#4CAF50", weight: 25 },
  Rare: { label: "Rare", color: "#7C4DFF", weight: 12 },
  Legendary: { label: "Legendary", color: "#FFD700", weight: 3 },
};

// ─── CRYSTAL CATALOG ─────────────────────────────────────────────────────────
export const CRYSTALS = [
  // ── Always available ──
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
