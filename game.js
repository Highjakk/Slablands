(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const hotbarEl = document.getElementById("hotbar");
  const hotbarTopEl = document.getElementById("hotbarTop");
  const gearSlotsEl = document.getElementById("gearSlots");
  const infoPanel = document.getElementById("infoPanel");
  const healthFill = document.getElementById("healthFill");
  const healthText = document.getElementById("healthText");
  const toastEl = document.getElementById("toast");
  const startMenu = document.getElementById("startMenu");
  const continueBtn = document.getElementById("continueBtn");
  const newWorldBtn = document.getElementById("newWorldBtn");
  const menuOverlay = document.getElementById("menuOverlay");
  const menuTitle = document.getElementById("menuTitle");
  const menuBody = document.getElementById("menuBody");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const deathOverlay = document.getElementById("deathOverlay");

  const TILE_W = 32;
  const TILE_H = 16;
  const WORLD_W = 400;
  const WORLD_H = 360;
  const SURFACE_BASE = 250;
  const SPACE_Y = 72;
  const SAVE_KEY = "slabworld_survival_save_v5";
  const MAX_HOTBAR = 10;
  const START_HOTBAR = 8;
  const PLAYER_W = 20;
  const PLAYER_H = 40;

  const B = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    BEDROCK: 4,
    WOOD: 5,
    LEAVES: 6,
    TIN_ORE: 7,
    OBSIDIAN_ORE: 8,
    LADDER_WOOD: 9,
    CHEST: 10,
    TABLE: 11,
    ADV_TABLE: 12,
    CAMPFIRE: 13,
    SMELTER: 14,
    EXCAVATOR: 15,
    BIN: 16,
    WOOD_BRICK: 17,
    STONE_BRICK: 18,
    WOOD_WALL: 19,
    STONE_WALL: 20,
    GROW_PODIUM: 21,
    GROW_COLLECTOR: 22,
    METEOR_PODIUM: 23,
    METEOR_COLLECTOR: 24,
    METEORITE_ORE: 25,
    METEOR_STONE: 26,
    UPGRADE_TABLE: 27,
    GUIDE: 28,
    TURRET: 29,
    WOOD_PROCESSOR: 30,
    LADDER_STONE: 31,
    SANDSTONE: 32,
    CACTUS: 33,
    SANDSTONE_BRICK: 34,
    SANDSTONE_WALL: 35,
    CHARMING_TABLE: 36,
    ARTIFACT_TABLE: 37,
    PORTAL: 38,
    GRAVITY_MANIP: 39,
    TELEPORT_ARTIFACT_BLOCK: 40,
    GRAVITY_ARTIFACT_BLOCK: 41,
    LASER_ARTIFACT_BLOCK: 42
  };

  const ARTIFACT_BLOCKS = [
    B.TELEPORT_ARTIFACT_BLOCK,
    B.GRAVITY_ARTIFACT_BLOCK,
    B.LASER_ARTIFACT_BLOCK
  ];

  const BLOCKS = [];
  const ITEMS = {};
  const MACHINE_BLOCKS = new Set([
    B.CHEST, B.TABLE, B.ADV_TABLE, B.CAMPFIRE, B.SMELTER, B.EXCAVATOR, B.BIN,
    B.GROW_PODIUM, B.GROW_COLLECTOR, B.METEOR_PODIUM, B.METEOR_COLLECTOR,
    B.UPGRADE_TABLE, B.GUIDE, B.TURRET, B.WOOD_PROCESSOR, B.CHARMING_TABLE,
    B.ARTIFACT_TABLE, B.PORTAL, B.GRAVITY_MANIP
  ]);

  function defBlock(id, key, name, options = {}) {
    BLOCKS[id] = {
      id,
      key,
      name,
      solid: options.solid ?? true,
      breakable: options.breakable ?? true,
      ladder: !!options.ladder,
      wall: !!options.wall,
      interactable: !!options.interactable,
      group: options.group || "stone",
      color: options.color || "#888888",
      drop: options.drop ?? key,
      light: options.light || 0
    };
  }

  function defItem(id, name, options = {}) {
    ITEMS[id] = {
      id,
      name,
      stack: options.stack ?? true,
      max: options.max || 99,
      place: options.place ?? null,
      color: options.color || "#d7d1bc",
      toolTier: options.toolTier ?? null,
      speedTier: options.speedTier ?? null,
      vest: options.vest ?? null,
      helmet: options.helmet ?? null,
      weapon: options.weapon ?? null
    };
  }

  defBlock(B.AIR, "air", "Air", { solid: false, breakable: false, drop: null, color: "transparent" });
  defBlock(B.GRASS, "grass", "Grass", { group: "dirt", color: "#4f9a3d", drop: "grass" });
  defBlock(B.DIRT, "dirt", "Dirt", { group: "dirt", color: "#7a4d2d", drop: "dirt" });
  defBlock(B.STONE, "stone", "Stone", { group: "stone", color: "#73777b", drop: "stone" });
  defBlock(B.BEDROCK, "bedrock", "Bedrock", { group: "bedrock", color: "#25282c", breakable: false, drop: null });
  defBlock(B.WOOD, "wood", "Wood", { group: "wood", color: "#8b572a", drop: "wood" });
  defBlock(B.LEAVES, "leaves", "Leaves", { group: "leaves", color: "#3f8d43", drop: null });
  defBlock(B.TIN_ORE, "tin_ore", "Tin Ore", { group: "stone", color: "#899497", drop: "tin_ore" });
  defBlock(B.OBSIDIAN_ORE, "obsidian_ore", "Obsidian Ore", { group: "stone", color: "#3b274f", drop: "obsidian_ore" });
  defBlock(B.LADDER_WOOD, "wood_ladder", "Wood Ladder", { solid: false, ladder: true, group: "wood", color: "#b5823f", drop: "wood_ladder" });
  defBlock(B.CHEST, "chest", "Chest", { interactable: true, group: "wood", color: "#9c682e", drop: "chest" });
  defBlock(B.TABLE, "table", "Table", { interactable: true, group: "wood", color: "#9a6330", drop: "table" });
  defBlock(B.ADV_TABLE, "advanced_table", "Advanced Table", { interactable: true, group: "stone", color: "#48676e", drop: "advanced_table" });
  defBlock(B.CAMPFIRE, "campfire", "Campfire", { interactable: true, group: "wood", color: "#d17631", drop: "campfire", light: 1 });
  defBlock(B.SMELTER, "smelter", "Smelter", { interactable: true, group: "stone", color: "#a85c44", drop: "smelter", light: 1 });
  defBlock(B.EXCAVATOR, "mineral_excavator", "Mineral Excavator", { interactable: true, group: "stone", color: "#4f5964", drop: "mineral_excavator" });
  defBlock(B.BIN, "bin", "Bin", { interactable: true, group: "stone", color: "#506068", drop: "bin" });
  defBlock(B.WOOD_BRICK, "wood_brick", "Wood Brick", { group: "wood", color: "#9f6a32", drop: "wood_brick" });
  defBlock(B.STONE_BRICK, "stone_brick", "Stone Brick", { group: "stone", color: "#84898c", drop: "stone_brick" });
  defBlock(B.WOOD_WALL, "wood_wall", "Wood Wallpaper", { solid: false, wall: true, group: "wood", color: "#6d4726", drop: "wood_wall" });
  defBlock(B.STONE_WALL, "stone_wall", "Stone Wallpaper", { solid: false, wall: true, group: "stone", color: "#5e6467", drop: "stone_wall" });
  defBlock(B.GROW_PODIUM, "grow_podium", "Grow Podium", { interactable: true, group: "wood", color: "#579141", drop: "grow_podium" });
  defBlock(B.GROW_COLLECTOR, "grow_collector", "Grow Collector", { interactable: true, group: "stone", color: "#657f4e", drop: "grow_collector" });
  defBlock(B.METEOR_PODIUM, "meteor_podium", "Meteorite Podium", { interactable: true, group: "stone", color: "#5b5963", drop: "meteor_podium" });
  defBlock(B.METEOR_COLLECTOR, "meteor_collector", "Meteor Collector", { interactable: true, group: "stone", color: "#655c72", drop: "meteor_collector" });
  defBlock(B.METEORITE_ORE, "meteorite_ore", "Meteorite Ore", { group: "stone", color: "#44454b", drop: "meteorite_ore" });
  defBlock(B.METEOR_STONE, "meteor_stone", "Meteor Stone", { group: "stone", color: "#4d4f55", drop: "stone_brick" });
  defBlock(B.UPGRADE_TABLE, "upgrade_table", "Upgrades Table", { interactable: true, group: "stone", color: "#536174", drop: "upgrade_table" });
  defBlock(B.GUIDE, "guide", "Guide", { interactable: true, group: "stone", color: "#5a896b", drop: "guide" });
  defBlock(B.TURRET, "turret", "Turret", { interactable: true, group: "stone", color: "#657179", drop: "turret" });
  defBlock(B.WOOD_PROCESSOR, "wood_processor", "Wood Processor", { interactable: true, group: "stone", color: "#726a45", drop: "wood_processor" });
  defBlock(B.LADDER_STONE, "stone_ladder", "Stone Brick Ladder", { solid: false, ladder: true, group: "stone", color: "#9c9f9c", drop: "stone_ladder" });
  defBlock(B.SANDSTONE, "sandstone", "Sandstone", { group: "stone", color: "#caa85d", drop: "sandstone" });
  defBlock(B.CACTUS, "cactus", "Cactus", { group: "wood", color: "#3f935f", drop: "wood" });
  defBlock(B.SANDSTONE_BRICK, "sandstone_brick", "Sandstone Brick", { group: "stone", color: "#d1b06a", drop: "sandstone_brick" });
  defBlock(B.SANDSTONE_WALL, "sandstone_wall", "Sandstone Wallpaper", { solid: false, wall: true, group: "stone", color: "#9e844d", drop: "sandstone_wall" });
  defBlock(B.CHARMING_TABLE, "charming_table", "Charming Table", { interactable: true, group: "stone", color: "#8b5fa2", drop: "charming_table" });
  defBlock(B.ARTIFACT_TABLE, "artifact_table", "Artifacts Table", { interactable: true, group: "stone", color: "#647798", drop: "artifact_table" });
  defBlock(B.PORTAL, "portal", "Portal", { interactable: true, solid: false, group: "stone", color: "#4da0bd", drop: "portal", light: 1 });
  defBlock(B.GRAVITY_MANIP, "gravity_manipulator", "Gravity Manipulator", { interactable: true, group: "stone", color: "#7e6ac8", drop: "gravity_manipulator" });
  defBlock(B.TELEPORT_ARTIFACT_BLOCK, "teleport_artifact_block", "Teleportation Artifact", { group: "artifact", color: "#42bee0", drop: "teleport_artifact" });
  defBlock(B.GRAVITY_ARTIFACT_BLOCK, "gravity_artifact_block", "Gravity Artifact", { group: "artifact", color: "#9d7dff", drop: "gravity_artifact" });
  defBlock(B.LASER_ARTIFACT_BLOCK, "laser_artifact_block", "Laser Artifact", { group: "artifact", color: "#59eb7f", drop: "laser_artifact" });

  function addBlockItem(id, itemId, name, color) {
    defItem(itemId, name, { place: id, color });
  }

  for (const block of BLOCKS) {
    if (!block || block.id === B.AIR || block.drop === null) continue;
    if (!ITEMS[block.drop]) addBlockItem(block.id, block.drop, block.name, block.color);
  }

  defItem("tin_chunk", "Tin Chunk", { color: "#c6d3d1" });
  defItem("obsidian_chunk", "Obsidian Chunk", { color: "#533571" });
  defItem("meteorite_chunk", "Meteorite Chunk", { color: "#3c3d43" });
  defItem("titanium", "Titanium", { color: "#d4d9dd" });
  defItem("alien_tech", "Alien Tech", { color: "#7ef07f" });
  defItem("wood_paxel", "Wooden Paxel", { stack: false, toolTier: 1, speedTier: 1, color: "#b67a39" });
  defItem("stone_paxel", "Stone Paxel", { stack: false, toolTier: 2, speedTier: 2, color: "#9da1a3" });
  defItem("tin_paxel", "Tin Paxel", { stack: false, toolTier: 3, speedTier: 3, color: "#c5d4d2" });
  defItem("obsidian_paxel", "Obsidian Paxel", { stack: false, toolTier: 4, speedTier: 4, color: "#684086" });
  defItem("laser_gun", "Laser Gun", { stack: false, weapon: "laser", color: "#61ec81" });
  defItem("stone_vest", "Stone Vest", { stack: false, vest: "stone", color: "#8a9094" });
  defItem("tin_vest", "Tin Vest", { stack: false, vest: "tin", color: "#c6d4d2" });
  defItem("obsidian_vest", "Obsidian Vest", { stack: false, vest: "obsidian", color: "#5b397a" });
  defItem("wooden_helmet", "Wooden Helmet", { stack: false, helmet: "wood", color: "#a56c31" });
  defItem("stone_brick_helmet", "Stone Brick Helmet", { stack: false, helmet: "stone", color: "#8a8f91" });
  defItem("meteorite_helmet", "Meteorite Helmet", { stack: false, helmet: "meteorite", color: "#4a4b52" });
  defItem("titanium_helmet", "Titanium Helmet", { stack: false, helmet: "titanium", color: "#e0e3e5" });
  defItem("teleport_artifact", "Teleportation Artifact", { stack: false, color: "#42bee0" });
  defItem("gravity_artifact", "Gravity Artifact", { stack: false, color: "#9d7dff" });
  defItem("laser_artifact", "Laser Artifact", { stack: false, color: "#59eb7f" });
  defItem("hand_display", "Hand", { stack: false, color: "#e7c29a" });

  const RECIPES = [
    r("starter", "Wooden Paxel", [["wood", 5]], ["wood_paxel", 1]),
    r("starter", "Table", [["wood", 2]], ["table", 1]),
    r("starter", "Chest", [["wood", 3]], ["chest", 1]),
    r("starter", "Wood Ladder", [["wood", 1]], ["wood_ladder", 4]),
    r("starter", "Wood Brick", [["wood", 4]], ["wood_brick", 2]),
    r("starter", "Campfire", [["wood", 2], ["stone", 1]], ["campfire", 1]),
    r("starter", "Wooden Helmet", [["wood", 5]], ["wooden_helmet", 1]),

    r("table", "Stone Paxel", [["wood", 2], ["stone", 5]], ["stone_paxel", 1]),
    r("table", "Tin Paxel", [["wood", 2], ["tin_chunk", 5]], ["tin_paxel", 1]),
    r("table", "Advanced Table", [["stone_brick", 2], ["tin_chunk", 2]], ["advanced_table", 1]),
    r("table", "Stone Brick", [["stone", 4]], ["stone_brick", 2]),
    r("table", "Stone Brick Ladder", [["stone_brick", 1]], ["stone_ladder", 4]),
    r("table", "Wood Wallpaper", [["wood_brick", 2]], ["wood_wall", 4]),
    r("table", "Stone Wallpaper", [["stone_brick", 2]], ["stone_wall", 4]),
    r("table", "Bin", [["stone", 3]], ["bin", 1]),
    r("table", "Stone Vest", [["stone", 10]], ["stone_vest", 1]),
    r("table", "Stone Brick Helmet", [["stone_brick", 5]], ["stone_brick_helmet", 1]),
    r("table", "Sandstone Brick", [["sandstone", 4]], ["sandstone_brick", 2]),
    r("table", "Sandstone Wallpaper", [["sandstone_brick", 2]], ["sandstone_wall", 4]),

    r("advanced", "Obsidian Paxel", [["wood", 2], ["obsidian_chunk", 5]], ["obsidian_paxel", 1]),
    r("advanced", "Mineral Excavator", [["obsidian_chunk", 5], ["tin_paxel", 1]], ["mineral_excavator", 1]),
    r("advanced", "Upgrades Table", [["meteorite_chunk", 2], ["stone_brick", 2]], ["upgrade_table", 1]),
    r("advanced", "Guide", [["tin_chunk", 5]], ["guide", 1]),
    r("advanced", "Grow Podium", [["wood_brick", 2], ["obsidian_chunk", 2]], ["grow_podium", 1]),
    r("advanced", "Grow Collector", [["obsidian_chunk", 2], ["stone_brick", 2]], ["grow_collector", 1]),
    r("advanced", "Tin Vest", [["tin_chunk", 10]], ["tin_vest", 1]),
    r("advanced", "Obsidian Vest", [["obsidian_chunk", 10]], ["obsidian_vest", 1]),
    r("advanced", "Meteorite Helmet", [["meteorite_chunk", 10]], ["meteorite_helmet", 1]),
    r("advanced", "Titanium Helmet", [["titanium", 10]], ["titanium_helmet", 1]),

    r("locked", "Smelter", [["meteorite_chunk", 3], ["titanium", 5], ["campfire", 1]], ["smelter", 1]),
    r("locked", "Meteor Collector", [["titanium", 15], ["meteorite_chunk", 5], ["grow_collector", 1]], ["meteor_collector", 1]),
    r("locked", "Turret", [["titanium", 25], ["tin_paxel", 1], ["guide", 1]], ["turret", 1]),

    r("artifact:teleport", "Portal", [["meteorite_chunk", 5], ["alien_tech", 5], ["stone_ladder", 2]], ["portal", 1]),
    r("artifact:gravity", "Gravity Manipulator", [["advanced_table", 1], ["alien_tech", 2], ["titanium", 5]], ["gravity_manipulator", 1]),
    r("artifact:laser", "Laser Gun", [["alien_tech", 15], ["obsidian_paxel", 1], ["stone_brick", 2]], ["laser_gun", 1])
  ];

  function r(station, name, req, out) {
    return { station, name, req: req.map(([id, count]) => ({ id, count })), out: { id: out[0], count: out[1] } };
  }

  const state = {
    mode: "start",
    seed: 1,
    world: null,
    surface: [],
    desert: { start: 0, end: 0 },
    dungeon: { x: 0, y: 0 },
    structures: {},
    machines: {},
    droids: [],
    lasers: [],
    particles: [],
    player: null,
    currentMenu: null,
    camera: { x: 0, y: 0 },
    mining: null,
    upgrades: null,
    saveTimer: 0,
    spawnTimer: 0,
    time: 0
  };

  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, wx: 0, wy: 0, left: false, right: false };
  let lastTime = performance.now();
  let toastTimer = 0;
  let hudLayoutKey = "";
  let dragPayload = null;
  let lastMenuDropAt = 0;
  let audioCtx = null;

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  function hash01(x, y = 0, seed = state.seed) {
    let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
    n = (n ^ (n >>> 13)) | 0;
    n = Math.imul(n, 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function randRange(seed, a, b) {
    return Math.floor(a + hash01(seed, seed * 7 + 11, seed) * (b - a + 1));
  }

  function idx(x, y) {
    return y * WORLD_W + x;
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H;
  }

  function getBlock(x, y) {
    if (!inBounds(x, y)) return B.BEDROCK;
    return state.world[idx(x, y)];
  }

  function setBlock(x, y, id) {
    if (!inBounds(x, y)) return;
    const old = getBlock(x, y);
    state.world[idx(x, y)] = id;
    const key = mkey(x, y);
    if (old !== id && MACHINE_BLOCKS.has(old) && !MACHINE_BLOCKS.has(id)) delete state.machines[key];
    if (MACHINE_BLOCKS.has(id)) ensureMachine(x, y);
  }

  function mkey(x, y) {
    return `${x},${y}`;
  }

  function parseKey(key) {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }

  function isSolid(id) {
    const b = BLOCKS[id];
    return !!b && b.solid;
  }

  function isLadder(id) {
    return !!BLOCKS[id]?.ladder;
  }

  function isWall(id) {
    return !!BLOCKS[id]?.wall;
  }

  function tileAtPixel(px, py) {
    return { x: Math.floor(px / TILE_W), y: Math.floor(py / TILE_H) };
  }

  function itemName(id) {
    return ITEMS[id]?.name || id || "Empty";
  }

  function shadeColor(color, amount) {
    if (!color || color[0] !== "#" || color.length < 7) return color || "#999999";
    const value = Number.parseInt(color.slice(1, 7), 16);
    const r = Math.max(0, Math.min(255, (value >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (value & 255) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function itemIconKind(id) {
    if (id === "hand_display") return "hand";
    if (ITEMS[id]?.toolTier) return "paxel";
    if (ITEMS[id]?.vest) return "vest";
    if (ITEMS[id]?.helmet) return "helmet";
    if (ITEMS[id]?.weapon) return "laser";
    if (id?.includes("artifact")) return "artifact";
    if (id?.includes("chunk") || id === "titanium" || id === "alien_tech") return "chunk";
    if (id?.includes("ore")) return "ore";
    if (id?.includes("ladder")) return "ladder";
    if (ITEMS[id]?.place && MACHINE_BLOCKS.has(ITEMS[id].place)) return "machine";
    return "block";
  }

  function itemIconMarkup(id) {
    const item = ITEMS[id] || ITEMS.hand_display;
    const base = item?.color || "#aaaaaa";
    const dark = shadeColor(base, -42);
    const light = shadeColor(base, 42);
    const kind = itemIconKind(id);
    const svg = inner => `<svg class="item-icon" viewBox="0 0 32 28" aria-hidden="true" shape-rendering="crispEdges">${inner}</svg>`;
    const rect = (x, y, w, h, fill = base) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
    const outline = (x, y, w, h) => `${rect(x, y, w, h, dark)}${rect(x + 2, y + 2, w - 4, h - 4, base)}${rect(x + 4, y + 4, Math.max(1, w - 8), 2, light)}`;
    const brick = (mortar = dark) => `${outline(5, 6, 22, 16)}${rect(7, 13, 18, 1, mortar)}${rect(14, 8, 1, 5, mortar)}${rect(20, 14, 1, 6, mortar)}`;
    const machineBox = (mark, glow = light) => svg(`${rect(5, 6, 22, 16, dark)}${rect(7, 8, 18, 12, base)}${rect(8, 9, 16, 2, light)}${mark}${rect(8, 20, 5, 2, dark)}${rect(20, 20, 5, 2, dark)}`);
    if (id === "grass") return svg(`${outline(5, 7, 22, 15)}${rect(7, 7, 18, 4, "#66b84a")}${rect(8, 11, 16, 9, "#7a4d2d")}${rect(9, 12, 2, 2, "#4e301c")}${rect(18, 16, 3, 2, "#4e301c")}`);
    if (id === "dirt") return svg(`${outline(6, 7, 20, 15)}${rect(10, 11, 3, 2, dark)}${rect(17, 15, 4, 2, dark)}${rect(22, 10, 2, 2, light)}`);
    if (id === "stone") return svg(`${outline(5, 7, 22, 15)}${rect(8, 11, 8, 2, dark)}${rect(18, 10, 7, 2, dark)}${rect(11, 17, 12, 2, light)}`);
    if (id === "wood") return svg(`${outline(7, 5, 18, 19)}${rect(11, 6, 2, 16, dark)}${rect(18, 6, 2, 16, dark)}${rect(12, 10, 7, 2, light)}${rect(13, 17, 8, 2, "#4d2c17")}`);
    if (id === "leaves") return svg(`${rect(6, 7, 20, 14, dark)}${rect(8, 6, 16, 16, base)}${rect(10, 9, 6, 3, light)}${rect(18, 12, 5, 3, "#2d6f35")}${rect(13, 17, 7, 2, light)}`);
    if (id === "cactus") return svg(`${rect(9, 8, 6, 15, dark)}${rect(17, 5, 6, 18, dark)}${rect(10, 9, 4, 13, base)}${rect(18, 6, 4, 16, base)}${rect(8, 13, 4, 3, base)}${rect(22, 15, 4, 3, base)}${rect(19, 9, 1, 2, "#cde8b7")}`);
    if (id === "sandstone") return svg(`${outline(5, 7, 22, 15)}${rect(8, 11, 10, 2, "#8c6a34")}${rect(15, 16, 9, 2, "#efd080")}${rect(10, 18, 3, 2, "#8c6a34")}`);
    if (id === "wood_brick") return svg(brick("#5b3518"));
    if (id === "stone_brick") return svg(brick("#4f5558"));
    if (id === "sandstone_brick") return svg(brick("#967436"));
    if (id === "wood_wall" || id === "stone_wall" || id === "sandstone_wall") return svg(`${brick(dark)}${rect(7, 8, 18, 12, "rgba(0,0,0,0.18)")}${rect(8, 18, 16, 1, light)}`);
    if (id === "tin_ore") return svg(`${outline(5, 7, 22, 15)}${rect(9, 11, 4, 3, "#e2eeee")}${rect(18, 15, 5, 3, "#c8d9d7")}${rect(21, 9, 3, 2, "#f3ffff")}`);
    if (id === "obsidian_ore") return svg(`${outline(5, 7, 22, 15)}${rect(9, 10, 5, 4, "#a979d8")}${rect(18, 14, 6, 4, "#5e3a84")}${rect(20, 9, 3, 2, "#d7a8ff")}`);
    if (id === "meteorite_ore") return svg(`${outline(5, 7, 22, 15)}${rect(9, 10, 5, 4, "#20232a")}${rect(17, 14, 7, 4, "#191b20")}${rect(20, 9, 3, 2, "#777b84")}`);
    if (id === "tin_chunk") return svg(`${rect(8, 9, 15, 4, dark)}${rect(6, 13, 20, 8, dark)}${rect(10, 10, 11, 3, base)}${rect(8, 14, 16, 5, base)}${rect(13, 12, 4, 2, "#f2ffff")}`);
    if (id === "obsidian_chunk") return svg(`${rect(10, 6, 10, 4, dark)}${rect(7, 10, 18, 12, dark)}${rect(11, 8, 8, 3, base)}${rect(9, 12, 14, 8, base)}${rect(17, 10, 3, 8, "#8e57bd")}`);
    if (id === "meteorite_chunk") return svg(`${rect(9, 8, 13, 4, "#1f2228")}${rect(7, 12, 18, 9, "#191b20")}${rect(11, 10, 8, 3, base)}${rect(12, 14, 3, 2, "#7b7f8a")}${rect(20, 17, 3, 2, "#0f1114")}`);
    if (id === "titanium") return svg(`${rect(8, 8, 16, 4, "#9ba4a9")}${rect(6, 12, 20, 9, "#7f8a90")}${rect(10, 9, 12, 3, base)}${rect(9, 13, 16, 5, base)}${rect(13, 14, 8, 2, "#ffffff")}`);
    if (id === "alien_tech") return svg(`${rect(7, 9, 18, 12, "#183623")}${rect(10, 6, 12, 6, dark)}${rect(11, 10, 10, 8, base)}${rect(13, 12, 3, 3, "#d9ff8a")}${rect(18, 12, 3, 3, "#d9ff8a")}${rect(15, 18, 4, 2, "#34b95a")}`);
    if (id === "chest") return machineBox(`${rect(8, 11, 16, 2, "#5a351c")}${rect(14, 13, 4, 4, "#f0c15c")}`, "#f0c15c");
    if (id === "table") return svg(`${rect(6, 10, 20, 4, dark)}${rect(8, 8, 16, 4, base)}${rect(9, 14, 3, 8, dark)}${rect(21, 14, 3, 8, dark)}${rect(11, 9, 6, 1, light)}`);
    if (id === "advanced_table") return machineBox(`${rect(9, 11, 5, 3, "#5fc7d2")}${rect(16, 13, 5, 3, "#5fc7d2")}${rect(22, 11, 2, 7, "#9ff4ff")}`, "#5fc7d2");
    if (id === "campfire") return svg(`${rect(7, 18, 18, 3, "#5a351c")}${rect(10, 15, 13, 3, "#7a4a24")}${rect(14, 7, 4, 10, "#ffcd57")}${rect(11, 11, 4, 6, "#f26b2f")}${rect(18, 11, 4, 6, "#f26b2f")}`);
    if (id === "smelter") return machineBox(`${rect(10, 12, 12, 7, "#f17731")}${rect(13, 13, 6, 4, "#ffd46a")}${rect(8, 8, 16, 2, "#6c7173")}`, "#f17731");
    if (id === "wood_processor") return machineBox(`${rect(12, 10, 8, 8, "#d7d1ba")}${rect(15, 9, 2, 10, "#4b4e51")}${rect(11, 13, 10, 2, "#4b4e51")}`, "#d7d1ba");
    if (id === "mineral_excavator") return machineBox(`${rect(8, 12, 4, 4, "#5bc4d3")}${rect(14, 8, 10, 4, "#b8c3c7")}${rect(12, 12, 8, 6, "#88979f")}`, "#5bc4d3");
    if (id === "bin") return machineBox(`${rect(8, 9, 16, 3, "#91a5ac")}${rect(10, 13, 12, 4, "#0e1316")}${rect(13, 18, 6, 1, "#0e1316")}`, "#91a5ac");
    if (id === "grow_podium" || id === "grow_collector") return machineBox(`${rect(14, 8, 4, 10, "#68bd58")}${rect(10, 11, 5, 3, "#68bd58")}${rect(18, 11, 5, 3, "#68bd58")}${id === "grow_collector" ? rect(23, 8, 2, 11, "#d7d1ba") : ""}`, "#68bd58");
    if (id === "meteor_podium" || id === "meteor_collector") return machineBox(`${rect(14, 8, 4, 5, "#8e73d8")}${rect(11, 12, 10, 2, "#8e73d8")}${id === "meteor_collector" ? rect(8, 9, 2, 9, "#c6d6e0") + rect(22, 9, 2, 9, "#c6d6e0") : ""}`, "#8e73d8");
    if (id === "upgrade_table") return machineBox(`${rect(15, 8, 3, 11, "#ffd262")}${rect(11, 12, 11, 3, "#ffd262")}`, "#ffd262");
    if (id === "guide") return svg(`${rect(8, 6, 16, 16, "#6b4728")}${rect(10, 5, 13, 16, "#d4b06d")}${rect(12, 9, 8, 2, "#314047")}${rect(12, 13, 6, 2, "#314047")}${rect(12, 17, 9, 1, "#8a5d30")}`);
    if (id === "turret") return machineBox(`${rect(14, 5, 5, 8, "#2a3034")}${rect(18, 7, 9, 3, "#2a3034")}${rect(13, 13, 7, 4, "#dbe5d2")}`, "#dbe5d2");
    if (id === "charming_table") return machineBox(`${rect(14, 7, 4, 11, "#be80e8")}${rect(10, 12, 12, 3, "#be80e8")}${rect(15, 8, 2, 2, "#fff0ff")}`, "#be80e8");
    if (id === "artifact_table") return machineBox(`${rect(9, 10, 4, 6, "#59eb7f")}${rect(15, 8, 4, 8, "#42bee0")}${rect(21, 10, 4, 6, "#9d7dff")}`, "#42bee0");
    if (id === "portal") return svg(`${rect(6, 7, 20, 15, dark)}<ellipse cx="16" cy="14" rx="8" ry="6" fill="none" stroke="#7af4ff" stroke-width="2"/><rect x="14" y="11" width="4" height="6" fill="#67d7ff"/>`);
    if (id === "gravity_manipulator") return svg(`${rect(6, 7, 20, 15, dark)}<circle cx="16" cy="14" r="7" fill="none" stroke="#b69cff" stroke-width="1"/><circle cx="16" cy="14" r="4" fill="none" stroke="#b69cff" stroke-width="1"/>${rect(15, 11, 2, 6, "#d9ceff")}`);
    if (id === "teleport_artifact") return svg(`${rect(14, 4, 4, 4, dark)}${rect(9, 8, 14, 12, dark)}<ellipse cx="16" cy="14" rx="7" ry="4" fill="none" stroke="#8df4ff" stroke-width="2"/>${rect(14, 11, 4, 6, base)}${rect(15, 12, 2, 4, "#e7ffff")}`);
    if (id === "gravity_artifact") return svg(`${rect(14, 4, 4, 4, dark)}${rect(8, 9, 16, 12, dark)}<circle cx="16" cy="15" r="6" fill="none" stroke="#d4c4ff" stroke-width="1"/><circle cx="16" cy="15" r="3" fill="none" stroke="#d4c4ff" stroke-width="1"/>${rect(15, 12, 2, 6, base)}`);
    if (id === "laser_artifact") return svg(`${rect(14, 4, 4, 4, dark)}${rect(8, 10, 16, 10, dark)}${rect(10, 12, 12, 6, base)}${rect(13, 13, 6, 4, "#d9ff8a")}${rect(22, 13, 6, 2, "#59eb7f")}`);
    if (kind === "hand") {
      return svg(`${rect(8, 8, 4, 14, dark)}${rect(12, 5, 4, 17, dark)}${rect(16, 6, 4, 16, dark)}${rect(20, 9, 4, 13, dark)}${rect(6, 16, 18, 8, dark)}${rect(9, 9, 2, 9, base)}${rect(13, 6, 2, 12, base)}${rect(17, 7, 2, 11, base)}${rect(21, 10, 2, 8, base)}${rect(9, 18, 13, 4, base)}${rect(10, 20, 10, 2, light)}`);
    }
    if (kind === "paxel") {
      return svg(`${rect(10, 20, 4, 4, "#6f4725")}${rect(14, 16, 4, 4, "#7f5129")}${rect(18, 12, 4, 4, "#8f5b2e")}${rect(16, 4, 12, 4, dark)}${rect(20, 8, 8, 4, dark)}${rect(14, 8, 6, 6, base)}${rect(18, 6, 8, 4, base)}${rect(22, 10, 4, 2, light)}`);
    }
    if (kind === "vest") {
      return svg(`${rect(8, 6, 6, 4, dark)}${rect(18, 6, 6, 4, dark)}${rect(6, 10, 20, 14, dark)}${rect(10, 10, 12, 12, base)}${rect(8, 12, 4, 8, base)}${rect(20, 12, 4, 8, base)}${rect(15, 10, 2, 12, dark)}${rect(11, 14, 10, 2, light)}`);
    }
    if (kind === "helmet") {
      return svg(`${rect(8, 8, 16, 4, dark)}${rect(6, 12, 20, 8, dark)}${rect(8, 10, 16, 8, base)}${rect(10, 18, 12, 3, dark)}${rect(12, 11, 8, 2, light)}`);
    }
    if (kind === "laser") {
      return svg(`${rect(5, 14, 16, 6, dark)}${rect(9, 18, 8, 5, dark)}${rect(20, 12, 8, 4, dark)}${rect(7, 15, 13, 3, base)}${rect(22, 13, 6, 2, "#80ff90")}${rect(11, 18, 4, 3, light)}`);
    }
    if (kind === "artifact") {
      return svg(`${rect(14, 3, 4, 3, dark)}${rect(10, 6, 12, 4, dark)}${rect(8, 10, 16, 10, dark)}${rect(12, 20, 8, 4, dark)}${rect(12, 8, 8, 3, base)}${rect(10, 11, 12, 8, base)}${rect(14, 12, 4, 6, light)}`);
    }
    if (kind === "chunk") {
      return svg(`${rect(10, 8, 12, 4, dark)}${rect(8, 12, 16, 8, dark)}${rect(12, 20, 8, 4, dark)}${rect(12, 10, 8, 3, base)}${rect(10, 13, 12, 6, base)}${rect(14, 12, 4, 2, light)}`);
    }
    if (kind === "ore") {
      return svg(`${outline(6, 6, 20, 18)}${rect(10, 11, 4, 3, light)}${rect(18, 15, 5, 3, light)}${rect(20, 9, 3, 3, base)}`);
    }
    if (kind === "ladder") {
      return svg(`${rect(9, 4, 4, 20, dark)}${rect(20, 4, 4, 20, dark)}${rect(10, 5, 2, 18, base)}${rect(21, 5, 2, 18, base)}${rect(10, 8, 13, 3, base)}${rect(10, 15, 13, 3, base)}${rect(10, 22, 13, 2, base)}`);
    }
    if (kind === "machine") {
      return svg(`${outline(5, 6, 22, 17)}${rect(9, 10, 14, 5, dark)}${rect(11, 18, 4, 3, light)}${rect(20, 18, 4, 3, base)}`);
    }
    return svg(`${outline(7, 6, 18, 18)}${rect(9, 8, 14, 3, light)}${rect(9, 17, 14, 2, dark)}${rect(15, 8, 2, 14, dark)}`);
  }

  function cloneStack(stack) {
    if (!stack) return null;
    return { id: stack.id, count: stack.count, meta: stack.meta ? structuredClone(stack.meta) : undefined };
  }

  function makeInv(n) {
    return Array.from({ length: n }, () => null);
  }

  function visibleHotbarSlots() {
    return START_HOTBAR + (state.upgrades?.invSlots || 0);
  }

  function normalizeHotbarRow(row) {
    const next = Array.isArray(row) ? row : makeInv(MAX_HOTBAR);
    while (next.length < MAX_HOTBAR) next.push(null);
    for (let i = 0; i < next.length; i++) {
      if (next[i] && (!Number.isFinite(next[i].count) || next[i].count <= 0)) next[i] = null;
    }
    next[0] = null;
    return next;
  }

  function normalizeHotbar() {
    const p = state.player;
    if (!p) return;
    p.hotbar = normalizeHotbarRow(p.hotbar);
    p.altHotbar = normalizeHotbarRow(p.altHotbar);
    if (p.selected >= visibleHotbarSlots()) p.selected = 0;
  }

  function playerHotbars(player = state.player) {
    return [player.hotbar, player.altHotbar];
  }

  function pickupHotbarOrder(player = state.player) {
    return [player.hotbar, player.altHotbar];
  }

  function cloneHotbarRows(rows = playerHotbars()) {
    return rows.map(row => row.map(cloneStack));
  }

  function assignPlayerHotbars(rows) {
    state.player.hotbar = rows[0];
    state.player.altHotbar = rows[1];
    normalizeHotbar();
  }

  function addToInventoryPartial(inv, id, count = 1, meta = undefined, options = {}) {
    const start = options.reserveHand ? 1 : 0;
    const end = options.limit ?? inv.length;
    const max = ITEMS[id]?.max || 99;
    let remaining = count;
    if (remaining <= 0) return 0;
    if (isStackable(id) && !meta) {
      for (let i = start; i < end; i++) {
        const slot = inv[i];
        if (slot && slot.id === id && !slot.meta && slot.count < max) {
          const add = Math.min(remaining, max - slot.count);
          slot.count += add;
          remaining -= add;
          if (remaining <= 0) return 0;
        }
      }
    }
    for (let i = start; i < end; i++) {
      if (!inv[i]) {
        const add = isStackable(id) && !meta ? Math.min(remaining, max) : 1;
        inv[i] = { id, count: add, meta: meta ? structuredClone(meta) : undefined };
        remaining -= add;
        if (remaining <= 0) return 0;
      }
    }
    return remaining;
  }

  function addToInventories(invs, id, count = 1, meta = undefined, options = {}) {
    const test = invs.map(inv => inv.map(cloneStack));
    let testRemaining = count;
    for (const inv of test) {
      testRemaining = addToInventoryPartial(inv, id, testRemaining, meta, options);
      if (testRemaining <= 0) break;
    }
    if (testRemaining > 0) return false;
    let remaining = count;
    for (const inv of invs) {
      remaining = addToInventoryPartial(inv, id, remaining, meta, options);
      if (remaining <= 0) return true;
    }
    return remaining <= 0;
  }

  function addToExistingStacksPartial(inv, id, count = 1, meta = undefined, options = {}) {
    if (count <= 0) return 0;
    if (!isStackable(id) || meta) return count;
    const start = options.reserveHand ? 1 : 0;
    const end = options.limit ?? inv.length;
    const max = ITEMS[id]?.max || 99;
    let remaining = count;
    for (let i = start; i < end; i++) {
      const slot = inv[i];
      if (slot && slot.id === id && !slot.meta && slot.count < max) {
        const add = Math.min(remaining, max - slot.count);
        slot.count += add;
        remaining -= add;
        if (remaining <= 0) return 0;
      }
    }
    return remaining;
  }

  function addToPickupHotbars(rows, id, count = 1, meta = undefined, options = {}) {
    const test = cloneHotbarRows(rows);
    let testRemaining = addToExistingStacksPartial(test[1], id, count, meta, options);
    testRemaining = addToInventoryPartial(test[0], id, testRemaining, meta, options);
    if (testRemaining > 0) return false;
    let remaining = addToExistingStacksPartial(rows[1], id, count, meta, options);
    remaining = addToInventoryPartial(rows[0], id, remaining, meta, options);
    return remaining <= 0;
  }

  function removeFromInventories(invs, id, count, options = {}) {
    let remaining = count;
    for (const inv of invs) {
      const start = options.reserveHand ? 1 : 0;
      const end = options.limit ?? inv.length;
      for (let i = start; i < end; i++) {
        const slot = inv[i];
        if (!slot || slot.id !== id) continue;
        const take = Math.min(remaining, slot.count);
        slot.count -= take;
        remaining -= take;
        if (slot.count <= 0) inv[i] = null;
        if (remaining <= 0) return true;
      }
    }
    return false;
  }

  function countInInventories(invs, id, options = {}) {
    return invs.reduce((total, inv) => total + countInInventory(inv, id, options), 0);
  }

  function isStackable(id) {
    return ITEMS[id]?.stack !== false;
  }

  function canAddToInventory(inv, id, count, meta, options = {}) {
    const copy = inv.map(cloneStack);
    return addToInventory(copy, id, count, meta, { ...options, dry: false });
  }

  function addToInventory(inv, id, count = 1, meta = undefined, options = {}) {
    const start = options.reserveHand ? 1 : 0;
    const end = options.limit ?? inv.length;
    const max = ITEMS[id]?.max || 99;
    let remaining = count;
    if (remaining <= 0) return true;
    if (isStackable(id) && !meta) {
      for (let i = start; i < end; i++) {
        const slot = inv[i];
        if (slot && slot.id === id && !slot.meta && slot.count < max) {
          const add = Math.min(remaining, max - slot.count);
          if (!options.dry) slot.count += add;
          remaining -= add;
          if (remaining <= 0) return true;
        }
      }
    }
    for (let i = start; i < end; i++) {
      if (!inv[i]) {
        const add = isStackable(id) && !meta ? Math.min(remaining, max) : 1;
        if (!options.dry) inv[i] = { id, count: add, meta: meta ? structuredClone(meta) : undefined };
        remaining -= add;
        if (remaining <= 0) return true;
      }
    }
    return false;
  }

  function addPlayerItem(id, count = 1, meta = undefined) {
    normalizeHotbar();
    const ok = addToPickupHotbars(pickupHotbarOrder(), id, count, meta, { reserveHand: true, limit: visibleHotbarSlots() });
    if (!ok) showToast("Inventory full");
    return ok;
  }

  function canAddPlayerItem(id, count = 1, meta = undefined) {
    const copy = cloneHotbarRows();
    return addToPickupHotbars(copy, id, count, meta, { reserveHand: true, limit: visibleHotbarSlots() });
  }

  function canAddPlayerDrops(drops) {
    const copy = cloneHotbarRows();
    for (const drop of drops) {
      if (!addToPickupHotbars(copy, drop.id, drop.count, drop.meta, { reserveHand: true, limit: visibleHotbarSlots() })) return false;
    }
    return true;
  }

  function addDropsToPlayer(drops) {
    for (const drop of drops) addPlayerItem(drop.id, drop.count, drop.meta);
  }

  function countInInventory(inv, id, options = {}) {
    let total = 0;
    const start = options.reserveHand ? 1 : 0;
    const end = options.limit ?? inv.length;
    for (let i = start; i < end; i++) {
      if (inv[i]?.id === id) total += inv[i].count;
    }
    return total;
  }

  function countPlayer(id) {
    return countInInventories(playerHotbars(), id, { reserveHand: true, limit: visibleHotbarSlots() });
  }

  function removeFromInventory(inv, id, count, options = {}) {
    let remaining = count;
    const start = options.reserveHand ? 1 : 0;
    const end = options.limit ?? inv.length;
    for (let i = start; i < end; i++) {
      const slot = inv[i];
      if (!slot || slot.id !== id) continue;
      const take = Math.min(remaining, slot.count);
      slot.count -= take;
      remaining -= take;
      if (slot.count <= 0) inv[i] = null;
      if (remaining <= 0) return true;
    }
    return false;
  }

  function hasRequirements(req) {
    return req.every(item => countPlayer(item.id) >= item.count);
  }

  function tryCraft(recipe) {
    if (!hasRequirements(recipe.req)) {
      showToast("Missing materials");
      return;
    }
    const temp = cloneHotbarRows();
    for (const need of recipe.req) {
      if (!removeFromInventories(temp, need.id, need.count, { reserveHand: true, limit: visibleHotbarSlots() })) {
        showToast("Missing materials");
        return;
      }
    }
    if (!addToInventories(temp, recipe.out.id, recipe.out.count, undefined, { reserveHand: true, limit: visibleHotbarSlots() })) {
      showToast("Inventory full");
      return;
    }
    assignPlayerHotbars(temp);
    showToast(`Crafted ${itemName(recipe.out.id)}`);
    playTone("craft");
    renderCurrentMenu();
  }

  function surfaceHeight(x, seed = state.seed) {
    const a = Math.sin((x + seed * 0.07) * 0.037) * 13;
    const b = Math.sin((x + seed * 0.13) * 0.113) * 7;
    const c = (hash01(Math.floor(x / 5), 12, seed) - 0.5) * 9;
    return Math.max(205, Math.min(292, Math.floor(SURFACE_BASE + a + b + c)));
  }

  function generateWorld(seed) {
    state.seed = seed;
    state.world = new Uint8Array(WORLD_W * WORLD_H);
    state.surface = Array.from({ length: WORLD_W }, (_, x) => surfaceHeight(x, seed));
    state.machines = {};
    state.structures = {};
    state.droids = [];
    state.lasers = [];
    state.upgrades = {
      invSlots: 0,
      fov: false,
      doubleJump: false,
      mineRange: 0,
      lockedRecipes: false,
      artifacts: { teleport: false, gravity: false, laser: false }
    };

    const desertStart = randRange(seed + 19, 90, 275);
    const desertWidth = randRange(seed + 31, 34, 55);
    state.desert = { start: desertStart, end: Math.min(WORLD_W - 22, desertStart + desertWidth) };

    for (let x = 0; x < WORLD_W; x++) {
      const surface = state.surface[x];
      const wilds = x >= state.desert.start && x <= state.desert.end;
      for (let y = 0; y < WORLD_H; y++) {
        let id = B.AIR;
        if (y >= WORLD_H - 2) id = B.BEDROCK;
        else if (y > surface + 5) id = B.STONE;
        else if (y > surface) id = wilds ? B.SANDSTONE : B.DIRT;
        else if (y === surface) id = wilds ? B.SANDSTONE : B.GRASS;
        state.world[idx(x, y)] = id;
      }
    }

    for (let x = 2; x < WORLD_W - 2; x++) {
      const surface = state.surface[x];
      for (let y = surface + 12; y < WORLD_H - 7; y++) {
        const cave = Math.sin(x * 0.14 + y * 0.08 + seed * 0.01)
          + Math.cos(x * 0.045 - y * 0.12 + seed * 0.02)
          + Math.sin((x + y) * 0.065 + seed * 0.04);
        if (cave > 1.72 && hash01(x, y, seed) > 0.18) state.world[idx(x, y)] = B.AIR;
      }
    }

    for (let x = 1; x < WORLD_W - 1; x++) {
      const surface = state.surface[x];
      const wilds = x >= state.desert.start && x <= state.desert.end;
      for (let y = surface + 6; y < WORLD_H - 4; y++) {
        if (state.world[idx(x, y)] !== B.STONE) continue;
        const h = hash01(x, y, seed + 99);
        if (!wilds && h < 0.0027) state.world[idx(x, y)] = B.TIN_ORE;
        else if (wilds && y > WORLD_H - 92 && h > 0.9972) state.world[idx(x, y)] = B.OBSIDIAN_ORE;
      }
    }

    generateTreesAndCacti(seed);
    generateDungeon(seed);
    generatePyramid(seed);
    generateLab(seed);
    generateMeteorites(seed);
    spawnInitialDroids(seed);
  }

  function generateTreesAndCacti(seed) {
    let lastTree = -20;
    for (let x = 4; x < WORLD_W - 4; x++) {
      const surface = state.surface[x];
      const wilds = x >= state.desert.start && x <= state.desert.end;
      if (wilds) {
        if (hash01(x, 88, seed) < 0.055 && getBlock(x, surface) === B.SANDSTONE) {
          const h = 3 + Math.floor(hash01(x, 89, seed) * 3);
          for (let i = 1; i <= h; i++) setBlock(x, surface - i, B.CACTUS);
        }
        continue;
      }
      if (x - lastTree < 6) continue;
      if (hash01(x, 55, seed) < 0.078 && getBlock(x, surface) === B.GRASS) {
        makeTree(x, surface - 1, 4 + Math.floor(hash01(x, 56, seed) * 3));
        lastTree = x;
      }
    }
  }

  function makeTree(x, baseY, h = 5) {
    for (let i = 0; i < h; i++) {
      if (inBounds(x, baseY - i)) setBlock(x, baseY - i, B.WOOD);
    }
    const top = baseY - h;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const d = Math.abs(dx) + Math.abs(dy) * 0.85;
        if (d <= 2.7 && inBounds(x + dx, top + dy) && getBlock(x + dx, top + dy) === B.AIR) {
          setBlock(x + dx, top + dy, B.LEAVES);
        }
      }
    }
  }

  function fillRectBlocks(x0, y0, w, h, id) {
    for (let x = x0; x < x0 + w; x++) {
      for (let y = y0; y < y0 + h; y++) setBlock(x, y, id);
    }
  }

  function hollowRect(x0, y0, w, h, wallId, innerId = B.AIR) {
    for (let x = x0; x < x0 + w; x++) {
      for (let y = y0; y < y0 + h; y++) {
        const edge = x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + h - 1;
        setBlock(x, y, edge ? wallId : innerId);
      }
    }
  }

  function fillBackgroundWalls(x0, y0, w, h, wallId) {
    for (let x = x0 + 1; x < x0 + w - 1; x++) {
      for (let y = y0 + 1; y < y0 + h - 1; y++) {
        if (getBlock(x, y) === B.AIR) setBlock(x, y, wallId);
      }
    }
  }

  function generateDungeon(seed) {
    const x = randRange(seed + 300, 70, 330);
    const surface = state.surface[x];
    const y = Math.min(WORLD_H - 62, surface + 48);
    state.dungeon = { x, y };
    hollowRect(x - 15, y, 31, 13, B.STONE_BRICK);
    hollowRect(x - 34, y + 6, 19, 11, B.STONE_BRICK);
    hollowRect(x + 16, y + 5, 21, 12, B.STONE_BRICK);
    for (let i = x - 15; i <= x + 16; i++) setBlock(i, y + 6, B.AIR);
    fillBackgroundWalls(x - 15, y, 31, 13, B.STONE_WALL);
    fillBackgroundWalls(x - 34, y + 6, 19, 11, B.STONE_WALL);
    fillBackgroundWalls(x + 16, y + 5, 21, 12, B.STONE_WALL);
    setBlock(x - 25, y + 12, B.SMELTER);
    setBlock(x - 21, y + 12, B.WOOD_PROCESSOR);
    setBlock(x + 24, y + 11, B.TABLE);
    setBlock(x + 28, y + 11, B.CHEST);
    ensureMachine(x - 25, y + 12);
    ensureMachine(x - 21, y + 12);
    ensureMachine(x + 28, y + 11);

    for (let yy = surface - 1; yy <= y + 2; yy++) {
      for (let dx = -1; dx <= 1; dx++) setBlock(x + dx, yy, B.AIR);
      setBlock(x, yy, B.LADDER_WOOD);
    }
    for (let dx = -1; dx <= 1; dx++) {
      for (let yy = surface - 24; yy <= surface - 1; yy++) setBlock(x + dx, yy, B.WOOD);
    }
    for (let yy = surface - 24; yy <= surface - 1; yy++) setBlock(x, yy, B.LADDER_WOOD);
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = -5; dy <= 3; dy++) {
        if (Math.abs(dx) + Math.abs(dy) * 0.8 < 6.2) setBlock(x + dx, surface - 28 + dy, B.LEAVES);
      }
    }
    setBlock(x, surface - 33, B.GRAVITY_ARTIFACT_BLOCK);
    state.structures.gravityArtifact = { x, y: surface - 33 };
  }

  function generatePyramid() {
    const mid = Math.floor((state.desert.start + state.desert.end) / 2);
    const surface = state.surface[mid];
    const baseY = surface;
    for (let layer = 0; layer < 24; layer++) {
      const w = 49 - layer * 2;
      const x0 = mid - Math.floor(w / 2);
      for (let x = x0; x < x0 + w; x++) setBlock(x, baseY - layer, B.SANDSTONE_BRICK);
    }
    hollowRect(mid - 10, baseY - 12, 21, 12, B.SANDSTONE_BRICK);
    for (let y = baseY - 11; y <= baseY - 1; y++) setBlock(mid, y, B.AIR);
    fillBackgroundWalls(mid - 10, baseY - 12, 21, 12, B.SANDSTONE_WALL);
    setBlock(mid - 7, baseY - 1, B.SMELTER);
    setBlock(mid + 7, baseY - 1, B.CHARMING_TABLE);
    setBlock(mid, baseY - 4, B.TELEPORT_ARTIFACT_BLOCK);
    ensureMachine(mid - 7, baseY - 1);
    ensureMachine(mid + 7, baseY - 1);
    state.structures.pyramid = { x: mid, y: baseY };
    state.structures.teleportArtifact = { x: mid, y: baseY - 4 };
  }

  function generateLab(seed) {
    const x = randRange(seed + 700, 55, WORLD_W - 70);
    const y = WORLD_H - 36;
    hollowRect(x, y, 42, 20, B.STONE_BRICK);
    for (let xx = x + 1; xx < x + 41; xx++) {
      for (let yy = y + 1; yy < y + 19; yy++) {
        if ((xx + yy) % 2 === 0) setBlock(xx, yy, B.SANDSTONE_WALL);
        else setBlock(xx, yy, B.STONE_WALL);
      }
    }
    fillRectBlocks(x + 1, y + 16, 40, 3, B.SANDSTONE_BRICK);
    setBlock(x + 20, y + 15, B.ARTIFACT_TABLE);
    setBlock(x + 24, y + 15, B.LASER_ARTIFACT_BLOCK);
    ensureMachine(x + 20, y + 15);
    state.structures.lab = { x, y };
    state.structures.laserArtifact = { x: x + 24, y: y + 15 };
  }

  function generateMeteorites(seed) {
    for (let i = 0; i < 3; i++) {
      const cx = randRange(seed + 900 + i * 13, 35, WORLD_W - 35);
      const cy = randRange(seed + 940 + i * 17, 18, 54);
      const r = randRange(seed + 970 + i, 4, 7);
      makeMeteor(cx, cy, r, i === 0);
    }
  }

  function makeMeteor(cx, cy, r, withPodium = false) {
    const cells = [];
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const d = Math.sqrt(dx * dx + dy * dy * 1.8);
        if (d <= r + hash01(cx + dx, cy + dy) * 0.8) {
          const id = hash01(cx + dx, cy + dy, state.seed + 2000) < 0.33 ? B.METEORITE_ORE : B.METEOR_STONE;
          setBlock(cx + dx, cy + dy, id);
          cells.push({ x: cx + dx, y: cy + dy });
        }
      }
    }
    if (withPodium) {
      setBlock(cx, cy, B.METEOR_PODIUM);
      ensureMachine(cx, cy);
    }
    return cells;
  }

  function normalizeStructureArtifacts() {
    clearArtifactBlocks();
    const pyramidX = Math.floor((state.desert.start + state.desert.end) / 2);
    const pyramidY = state.surface[pyramidX];
    placeStructureArtifact(pyramidX, pyramidY - 4, B.TELEPORT_ARTIFACT_BLOCK, "teleportArtifact");

    const treeX = state.dungeon?.x || 40;
    const treeSurface = state.surface[treeX] || SURFACE_BASE;
    placeStructureArtifact(treeX, treeSurface - 33, B.GRAVITY_ARTIFACT_BLOCK, "gravityArtifact");

    const labTable = findBlock(B.ARTIFACT_TABLE);
    if (labTable) placeStructureArtifact(labTable.x + 4, labTable.y, B.LASER_ARTIFACT_BLOCK, "laserArtifact");
  }

  function clearArtifactBlocks() {
    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        if (ARTIFACT_BLOCKS.includes(getBlock(x, y))) setBlock(x, y, B.AIR);
      }
    }
  }

  function placeStructureArtifact(x, y, id, key) {
    if (!inBounds(x, y)) return;
    setBlock(x, y, id);
    if (key) state.structures[key] = { x, y };
  }

  function findBlock(blockId) {
    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        if (getBlock(x, y) === blockId) return { x, y };
      }
    }
    return null;
  }

  function spawnInitialDroids(seed) {
    for (let i = 0; i < 8; i++) {
      const x = randRange(seed + 1100 + i, 20, WORLD_W - 20);
      const y = randRange(seed + 1150 + i, 20, SPACE_Y - 8);
      if (getBlock(x, y) === B.AIR) addDroid(x * TILE_W, y * TILE_H);
    }
  }

  function createPlayer() {
    const spawnXTile = 40;
    const sy = state.surface[spawnXTile] - 4;
    return {
      x: spawnXTile * TILE_W,
      y: sy * TILE_H - PLAYER_H,
      spawnX: spawnXTile * TILE_W,
      spawnY: sy * TILE_H - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      hp: 100,
      maxHp: 100,
      selected: 0,
      hotbar: makeInv(MAX_HOTBAR),
      altHotbar: makeInv(MAX_HOTBAR),
      vest: null,
      helmet: null,
      fallPeak: 0,
      doubleUsed: false,
      walkTime: 0,
      portalCooldown: 0
    };
  }

  function newWorld() {
    generateWorld(Date.now() % 1000000000);
    state.player = createPlayer();
    state.mode = "play";
    normalizeHotbar();
    startMenu.classList.add("hidden");
    hud.classList.remove("hidden");
    deathOverlay.classList.add("hidden");
    state.currentMenu = null;
    closeMenu();
    saveGame();
  }

  function startContinue() {
    if (!loadGame()) return;
    state.mode = "play";
    startMenu.classList.add("hidden");
    hud.classList.remove("hidden");
    deathOverlay.classList.toggle("hidden", state.player.hp > 0);
  }

  function encodeWorld() {
    let out = "";
    for (let i = 0; i < state.world.length; i++) out += state.world[i].toString(36).padStart(2, "0");
    return out;
  }

  function decodeWorld(text) {
    const arr = new Uint8Array(WORLD_W * WORLD_H);
    for (let i = 0; i < arr.length; i++) arr[i] = parseInt(text.slice(i * 2, i * 2 + 2), 36) || 0;
    return arr;
  }

  function saveGame() {
    if (!state.world || !state.player || state.mode === "start") return;
    normalizeHotbar();
    const data = {
      version: 9,
      seed: state.seed,
      world: encodeWorld(),
      surface: state.surface,
      desert: state.desert,
      dungeon: state.dungeon,
      structures: state.structures,
      machines: state.machines,
      droids: state.droids,
      upgrades: state.upgrades,
      player: {
        x: state.player.x,
        y: state.player.y,
        spawnX: state.player.spawnX,
        spawnY: state.player.spawnY,
        hp: state.player.hp,
        hotbar: state.player.hotbar,
        altHotbar: state.player.altHotbar,
        vest: state.player.vest,
        helmet: state.player.helmet,
        selected: state.player.selected
      }
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    continueBtn.disabled = false;
  }

  function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      state.seed = data.seed;
      state.world = decodeWorld(data.world);
      state.surface = data.surface || Array.from({ length: WORLD_W }, (_, x) => surfaceHeight(x, data.seed));
      state.desert = data.desert || { start: 0, end: 0 };
      state.dungeon = data.dungeon || { x: 0, y: 0 };
      state.structures = data.structures || {};
      state.machines = data.machines || {};
      state.droids = data.droids || [];
      state.upgrades = data.upgrades || { invSlots: 0, fov: false, doubleJump: false, mineRange: 0, lockedRecipes: false, artifacts: {} };
      state.upgrades.artifacts ||= { teleport: false, gravity: false, laser: false };
      if ((data.version || 0) < 8) normalizeStructureArtifacts();
      state.player = createPlayer();
      Object.assign(state.player, data.player || {});
      normalizeHotbar();
      recalcMaxHp();
      return true;
    } catch (err) {
      console.error(err);
      showToast("Save could not be loaded");
      return false;
    }
  }

  continueBtn.disabled = !localStorage.getItem(SAVE_KEY);
  continueBtn.addEventListener("click", startContinue);
  newWorldBtn.addEventListener("click", newWorld);
  closeMenuBtn.addEventListener("click", closeMenu);
  window.addEventListener("beforeunload", saveGame);

  function ensureMachine(x, y) {
    const key = mkey(x, y);
    if (state.machines[key]) return state.machines[key];
    const id = getBlock(x, y);
    let machine = null;
    if (id === B.CHEST) machine = { type: "chest", inv: makeInv(16) };
    else if (id === B.CAMPFIRE) machine = { type: "campfire", input: null, output: makeInv(4), progress: 0 };
    else if (id === B.SMELTER) machine = { type: "smelter", input: null, output: makeInv(6), progress: 0 };
    else if (id === B.WOOD_PROCESSOR) machine = { type: "wood_processor", input: null, output: makeInv(6), progress: 0 };
    else if (id === B.EXCAVATOR) machine = { type: "excavator", input: null, output: makeInv(8), progress: 0 };
    else if (id === B.BIN) machine = { type: "bin" };
    else if (id === B.GROW_PODIUM) machine = { type: "grow_podium", timer: 60 };
    else if (id === B.GROW_COLLECTOR) machine = { type: "grow_collector", inv: makeInv(12), targets: [], tick: 0 };
    else if (id === B.METEOR_PODIUM) machine = { type: "meteor_podium", timer: 300, active: [] };
    else if (id === B.METEOR_COLLECTOR) machine = { type: "meteor_collector", inv: makeInv(12), targets: [], tick: 0, filter: "meteorite" };
    else if (id === B.GUIDE) machine = { type: "guide", dir: "right", buffer: null, tick: 0 };
    else if (id === B.TURRET) machine = { type: "turret", fuel: null, output: makeInv(8), fuelTimer: 0, shot: 0 };
    else if (id === B.CHARMING_TABLE) machine = { type: "charming_table", slot: null };
    else if (id === B.ARTIFACT_TABLE) machine = { type: "artifact_table" };
    else if (id === B.PORTAL) machine = { type: "portal", channel: "" };
    else if (id === B.GRAVITY_MANIP) machine = { type: "gravity_manip", mode: "low", height: 20 };
    else if (MACHINE_BLOCKS.has(id)) machine = { type: BLOCKS[id].key };
    if (machine) state.machines[key] = machine;
    return machine;
  }

  function selectedStack() {
    normalizeHotbar();
    return state.player.selected === 0 ? null : state.player.hotbar[state.player.selected];
  }

  function selectedItemDef() {
    const stack = selectedStack();
    return stack ? ITEMS[stack.id] : null;
  }

  function selectedToolTier() {
    return selectedItemDef()?.toolTier || 0;
  }

  function selectedSpeedTier() {
    return selectedItemDef()?.speedTier || 0;
  }

  function recalcMaxHp() {
    const vest = state.player.vest?.id;
    let max = 100;
    if (vest === "stone_vest") max = 150;
    else if (vest === "tin_vest") max = 200;
    else if (vest === "obsidian_vest") max = 250;
    state.player.maxHp = max;
    state.player.hp = Math.min(state.player.hp, max);
  }

  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    toastTimer = 2.3;
  }

  function playTone(kind) {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const map = {
        craft: [560, 0.06, 0.035, "triangle"],
        break: [180, 0.05, 0.045, "square"],
        hit: [120, 0.08, 0.05, "sawtooth"],
        laser: [780, 0.04, 0.03, "square"],
        hurt: [90, 0.08, 0.06, "triangle"]
      };
      const [freq, dur, vol, type] = map[kind] || map.hit;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {
      // Audio is optional and can be blocked by browser policy.
    }
  }

  function addParticle(x, y, color, options = {}) {
    state.particles.push({
      x,
      y,
      vx: options.vx ?? (Math.random() - 0.5) * 95,
      vy: options.vy ?? (Math.random() - 0.8) * 90,
      life: options.life ?? 0.45,
      maxLife: options.life ?? 0.45,
      size: options.size ?? 3,
      color,
      gravity: options.gravity ?? 300
    });
  }

  function spawnBlockParticles(x, y, blockId) {
    const color = BLOCKS[blockId]?.color || "#cccccc";
    const cx = x * TILE_W + TILE_W / 2;
    const cy = y * TILE_H + TILE_H / 2;
    for (let i = 0; i < 11; i++) {
      addParticle(cx + (Math.random() - 0.5) * TILE_W, cy + (Math.random() - 0.5) * TILE_H, i % 3 === 0 ? shadeColor(color, 35) : color, {
        life: 0.35 + Math.random() * 0.25,
        size: 2 + Math.floor(Math.random() * 3)
      });
    }
  }

  function spawnSpark(x, y, color = "#7cff8b") {
    for (let i = 0; i < 5; i++) {
      addParticle(x, y, color, {
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 120,
        life: 0.18 + Math.random() * 0.18,
        size: 2,
        gravity: 0
      });
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function worldMouse() {
    const zoom = currentZoom();
    const rect = canvas.getBoundingClientRect();
    mouse.wx = state.camera.x + (mouse.x - rect.left) / zoom;
    mouse.wy = state.camera.y + (mouse.y - rect.top) / zoom;
  }

  canvas.addEventListener("mousemove", evt => {
    mouse.x = evt.clientX;
    mouse.y = evt.clientY;
    if (state.world) worldMouse();
  });

  canvas.addEventListener("contextmenu", evt => evt.preventDefault());

  canvas.addEventListener("mousedown", evt => {
    if (state.mode !== "play" || state.currentMenu || state.player.hp <= 0) return;
    worldMouse();
    if (evt.button === 0) {
      mouse.left = true;
      handleLeftPress();
    } else if (evt.button === 2) {
      mouse.right = true;
      placeSelectedBlock();
    }
  });

  window.addEventListener("mouseup", evt => {
    if (evt.button === 0) {
      mouse.left = false;
      state.mining = null;
    }
    if (evt.button === 2) mouse.right = false;
  });

  window.addEventListener("keydown", evt => {
    if (evt.repeat) return;
    keys.add(evt.key.toLowerCase());
    pressed.add(evt.key.toLowerCase());
    const key = evt.key.toLowerCase();
    if (key >= "1" && key <= "9") {
      const n = Number(key) - 1;
      if (state.player && n < visibleHotbarSlots()) state.player.selected = n;
    }
    if (key === "0" && state.player && visibleHotbarSlots() >= 10) state.player.selected = 9;
    if (key === "c" && state.mode === "play" && state.player.hp > 0) {
      if (state.currentMenu) closeMenu();
      else openCrafting("starter");
    }
    if (key === "escape" && state.currentMenu) closeMenu();
    if (key === "r" && state.player) {
      if (state.player.hp <= 0) respawnPlayer();
      else if (state.mode === "play") {
        swapActiveHotbar();
        evt.preventDefault();
      }
    }
  });

  window.addEventListener("keyup", evt => keys.delete(evt.key.toLowerCase()));

  function handleLeftPress() {
    const tile = tileAtPixel(mouse.wx, mouse.wy);
    const block = getBlock(tile.x, tile.y);
    if (state.player.selected === 0 && BLOCKS[block]?.interactable && withinReach(tile.x, tile.y)) {
      openBlock(tile.x, tile.y);
      return;
    }
    const stack = selectedStack();
    if (stack && ITEMS[stack.id]?.weapon === "laser") {
      firePlayerLaser(mouse.wx, mouse.wy);
      return;
    }
    if (tryHitDroid(mouse.wx, mouse.wy)) return;
    state.mining = { x: tile.x, y: tile.y, progress: 0, duration: 1 };
  }

  function openBlock(x, y) {
    const id = getBlock(x, y);
    if (!withinReach(x, y)) {
      showToast("Too far away");
      return;
    }
    const machine = ensureMachine(x, y);
    if (id === B.TABLE) openCrafting("table", x, y);
    else if (id === B.ADV_TABLE) openCrafting("advanced", x, y);
    else if (id === B.UPGRADE_TABLE) openUpgradeTable(x, y);
    else if (id === B.CHEST) openStorage("Chest", machine, x, y);
    else if (id === B.CAMPFIRE || id === B.SMELTER || id === B.WOOD_PROCESSOR) openProcessor(machine, x, y);
    else if (id === B.EXCAVATOR) openExcavator(machine, x, y);
    else if (id === B.BIN) openBin(machine, x, y);
    else if (id === B.GROW_COLLECTOR || id === B.METEOR_COLLECTOR || id === B.TURRET) openCollector(machine, x, y);
    else if (id === B.GUIDE) openGuide(machine, x, y);
    else if (id === B.CHARMING_TABLE) openCharming(machine, x, y);
    else if (id === B.ARTIFACT_TABLE) openArtifactTable(machine, x, y);
    else if (id === B.PORTAL) openPortal(machine, x, y);
    else if (id === B.GRAVITY_MANIP) openGravity(machine, x, y);
    else if (id === B.GROW_PODIUM || id === B.METEOR_PODIUM) openPodium(machine, x, y);
  }

  function currentZoom() {
    return state.upgrades?.fov ? 1.0 : 1.5;
  }

  function baseMineRange() {
    const base = 125;
    const mult = [1, 1.25, 1.75, 2.5][state.upgrades?.mineRange || 0];
    return base * mult;
  }

  function withinReach(tx, ty) {
    const px = state.player.x + state.player.w / 2;
    const py = state.player.y + state.player.h / 2;
    const bx = tx * TILE_W + TILE_W / 2;
    const by = ty * TILE_H + TILE_H / 2;
    return Math.hypot(px - bx, py - by) <= baseMineRange();
  }

  function raySolidCount(tx, ty) {
    const sx = state.player.x + state.player.w / 2;
    const sy = state.player.y + state.player.h / 2;
    const ex = tx * TILE_W + TILE_W / 2;
    const ey = ty * TILE_H + TILE_H / 2;
    const steps = Math.max(1, Math.ceil(Math.hypot(ex - sx, ey - sy) / 8));
    let count = 0;
    let last = "";
    for (let i = 1; i < steps; i++) {
      const px = sx + (ex - sx) * (i / steps);
      const py = sy + (ey - sy) * (i / steps);
      const t = tileAtPixel(px, py);
      const key = `${t.x},${t.y}`;
      if (key === last || (t.x === tx && t.y === ty)) continue;
      last = key;
      const id = getBlock(t.x, t.y);
      if (isSolid(id)) count++;
    }
    return count;
  }

  function lineOfSightClear(x1, y1, x2, y2) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 8));
    for (let i = 1; i < steps; i++) {
      const x = x1 + (x2 - x1) * (i / steps);
      const y = y1 + (y2 - y1) * (i / steps);
      const id = getBlock(Math.floor(x / TILE_W), Math.floor(y / TILE_H));
      if (isSolid(id) && !isLadder(id) && !isWall(id)) return false;
    }
    return true;
  }

  function miningDuration(blockId) {
    const block = BLOCKS[blockId];
    if (!block || !block.breakable) return Infinity;
    if (blockId === B.LEAVES) return 0.02;
    const tier = selectedSpeedTier();
    const woodTimes = [3, 0.85, 0.55, 0.14, 0.07];
    const stoneTimes = [5, 2.8, 1.8, 0.9, 0.45];
    const dirtTimes = [2.2, 0.7, 0.45, 0.16, 0.08];
    let t = stoneTimes[Math.min(tier, 4)];
    if (block.group === "wood" || block.group === "leaves") t = woodTimes[Math.min(tier, 4)];
    if (block.group === "dirt") t = dirtTimes[Math.min(tier, 4)];
    if (block.group === "artifact") t = Math.max(1, t);
    const helmet = state.player.helmet?.id;
    if (helmet === "wooden_helmet" && block.group === "wood") t *= 0.65;
    if (helmet === "stone_brick_helmet" && (block.group === "stone" || block.group === "artifact")) t *= 0.7;
    return t;
  }

  function updateMining(dt) {
    if (!mouse.left || state.currentMenu || state.player.hp <= 0) return;
    const tile = tileAtPixel(mouse.wx, mouse.wy);
    const id = getBlock(tile.x, tile.y);
    if (!BLOCKS[id]?.breakable || id === B.AIR) {
      state.mining = null;
      return;
    }
    if (!withinReach(tile.x, tile.y)) {
      state.mining = null;
      return;
    }
    if (raySolidCount(tile.x, tile.y) > 5) {
      state.mining = null;
      showToast("Too much rock is in the way");
      return;
    }
    if (!state.mining || state.mining.x !== tile.x || state.mining.y !== tile.y) {
      state.mining = { x: tile.x, y: tile.y, progress: 0, duration: miningDuration(id) };
    }
    state.mining.duration = miningDuration(id);
    if (!Number.isFinite(state.mining.duration)) return;
    state.mining.progress += dt;
    if (state.mining.progress >= state.mining.duration) {
      completeMining(tile.x, tile.y);
      state.mining = null;
    }
  }

  function dropsForBlock(id) {
    const block = BLOCKS[id];
    if (!block || block.drop === null || id === B.LEAVES) return [];
    const tier = selectedToolTier();
    if ((id === B.STONE || id === B.METEOR_STONE || id === B.STONE_BRICK || id === B.STONE_WALL || id === B.SANDSTONE_BRICK || id === B.SANDSTONE_WALL) && tier < 1) return [];
    if (id === B.TIN_ORE && tier < 2) return [];
    if (id === B.OBSIDIAN_ORE && tier < 3) return [];
    if (id === B.METEORITE_ORE && tier < 3) return [];
    let count = 1;
    const stack = selectedStack();
    if (stack?.meta?.charm === "carpentry" && block.group === "wood" && Math.random() < 0.1) count = 2;
    return [{ id: block.drop, count }];
  }

  function machineHasContents(machine) {
    if (!machine) return false;
    const slots = ["inv", "output"];
    for (const key of slots) {
      if (Array.isArray(machine[key]) && machine[key].some(Boolean)) return true;
    }
    if (machine.input || machine.fuel || machine.slot || machine.buffer) return true;
    return false;
  }

  function completeMining(x, y, force = false) {
    const id = getBlock(x, y);
    if (!BLOCKS[id]?.breakable || id === B.AIR) return false;
    const machine = state.machines[mkey(x, y)];
    if (machineHasContents(machine)) {
      showToast("Empty this block first");
      return false;
    }
    const targets = [{ x, y, id }];
    const stack = selectedStack();
    if (stack?.id === "obsidian_paxel" && id === B.STONE) {
      for (const yy of [y - 1, y + 1]) {
        if (getBlock(x, yy) === B.STONE) targets.push({ x, y: yy, id: B.STONE });
      }
    }
    if (stack?.meta?.charm === "tree_chopper" && (id === B.WOOD || id === B.CACTUS)) {
      for (const t of connectedTreeBlocks(x, y)) {
        if (!targets.some(o => o.x === t.x && o.y === t.y)) targets.push(t);
      }
    }
    const drops = [];
    for (const target of targets) {
      drops.push(...dropsForBlock(target.id));
    }
    if (!force && drops.length && !canAddPlayerDrops(drops)) {
      showToast("Inventory full");
      return false;
    }
    for (const target of targets) {
      spawnBlockParticles(target.x, target.y, target.id);
      setBlock(target.x, target.y, B.AIR);
    }
    playTone("break");
    addDropsToPlayer(drops);
    return true;
  }

  function connectedTreeBlocks(x, y) {
    const out = [];
    const seen = new Set();
    const stack = [{ x, y }];
    while (stack.length && out.length < 90) {
      const p = stack.pop();
      const key = mkey(p.x, p.y);
      if (seen.has(key)) continue;
      seen.add(key);
      const id = getBlock(p.x, p.y);
      if (id !== B.WOOD && id !== B.LEAVES && id !== B.CACTUS) continue;
      out.push({ x: p.x, y: p.y, id });
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) stack.push({ x: p.x + d[0], y: p.y + d[1] });
    }
    return out;
  }

  function placeSelectedBlock() {
    const stack = selectedStack();
    if (!stack) return;
    const def = ITEMS[stack.id];
    if (!def?.place) {
      showToast("That item cannot be placed");
      return;
    }
    const tile = tileAtPixel(mouse.wx, mouse.wy);
    if (!withinReach(tile.x, tile.y)) {
      showToast("Too far away");
      return;
    }
    if (getBlock(tile.x, tile.y) !== B.AIR) {
      showToast("Space is occupied");
      return;
    }
    if (rectIntersectsTile(state.player, tile.x, tile.y)) {
      showToast("Cannot place inside yourself");
      return;
    }
    setBlock(tile.x, tile.y, def.place);
    stack.count--;
    if (stack.count <= 0) state.player.hotbar[state.player.selected] = null;
  }

  function rectIntersectsTile(rect, tx, ty) {
    const ax = tx * TILE_W;
    const ay = ty * TILE_H;
    return rect.x < ax + TILE_W && rect.x + rect.w > ax && rect.y < ay + TILE_H && rect.y + rect.h > ay;
  }

  function addDroid(x, y) {
    state.droids.push({
      x, y, vx: 0, vy: 0, w: 24, h: 24, hp: 10, shot: hash01(Math.floor(x), Math.floor(y)) * 1.8, trail: []
    });
  }

  function tryHitDroid(wx, wy) {
    const stack = selectedStack();
    if (!stack || !ITEMS[stack.id]?.toolTier) return false;
    const px = state.player.x + state.player.w / 2;
    const py = state.player.y + state.player.h / 2;
    let target = null;
    let best = Infinity;
    for (const d of state.droids) {
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      const distCursor = Math.hypot(wx - cx, wy - cy);
      const distPlayer = Math.hypot(px - cx, py - cy);
      if (distCursor < 36 && distPlayer < baseMineRange() && distCursor < best && lineOfSightClear(px, py, cx, cy)) {
        best = distCursor;
        target = d;
      }
    }
    if (!target) return false;
    const tier = ITEMS[stack.id].toolTier;
    let damage = [0, 1.2, 2.2, 4, 6.5][tier] || 1;
    if (stack.meta?.charm === "critical" && Math.random() < 0.1) damage *= 2;
    target.hp -= damage;
    if (target.hp <= 0) killDroid(target, "player");
    return true;
  }

  function killDroid(droid, collector = "player") {
    const i = state.droids.indexOf(droid);
    if (i >= 0) state.droids.splice(i, 1);
    spawnSpark(droid.x + droid.w / 2, droid.y + droid.h / 2, "#aef2ff");
    playTone("break");
    const drops = [{ id: "titanium", count: 1 + Math.floor(Math.random() * 3) }];
    if (Math.random() < 0.04) drops.push({ id: "alien_tech", count: 1 });
    if (collector && collector !== "player") {
      for (const drop of drops) addToInventory(collector.output, drop.id, drop.count);
    } else if (canAddPlayerDrops(drops)) addDropsToPlayer(drops);
    else showToast("Inventory full");
  }

  function firePlayerLaser(wx, wy) {
    const px = state.player.x + state.player.w / 2;
    const py = state.player.y + state.player.h / 2;
    const a = Math.atan2(wy - py, wx - px);
    state.lasers.push({ x: px, y: py, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, life: 0.7, from: "player", damage: 4 });
    playTone("laser");
  }

  function respawnPlayer() {
    const p = state.player;
    p.x = p.spawnX;
    p.y = p.spawnY;
    p.vx = 0;
    p.vy = 0;
    recalcMaxHp();
    p.hp = p.maxHp;
    deathOverlay.classList.add("hidden");
    state.mode = "play";
    saveGame();
  }

  function swapActiveHotbar() {
    const p = state.player;
    normalizeHotbar();
    [p.hotbar, p.altHotbar] = [p.altHotbar, p.hotbar];
    if (p.selected >= visibleHotbarSlots()) p.selected = 0;
    invalidateHud();
    showToast("Hotbar switched");
    renderCurrentMenu();
  }

  function handlePlayerDeath() {
    createDeathChest();
    closeMenu();
    deathOverlay.classList.remove("hidden");
    state.mining = null;
    invalidateHud();
    saveGame();
  }

  function createDeathChest() {
    const p = state.player;
    normalizeHotbar();
    const inv = makeInv(24);
    for (let i = 1; i < MAX_HOTBAR; i++) inv[i] = cloneStack(p.hotbar[i]);
    for (let i = 1; i < MAX_HOTBAR; i++) inv[MAX_HOTBAR + i] = cloneStack(p.altHotbar[i]);
    if (p.vest) inv[MAX_HOTBAR * 2] = cloneStack(p.vest);
    if (p.helmet) inv[MAX_HOTBAR * 2 + 1] = cloneStack(p.helmet);

    const tx = Math.floor((p.x + p.w / 2) / TILE_W);
    const ty = Math.floor((p.y + p.h - 2) / TILE_H);
    const spot = findDeathChestSpot(tx, ty);
    setBlock(spot.x, spot.y, B.CHEST);
    state.machines[mkey(spot.x, spot.y)] = { type: "chest", inv, deathChest: true };

    p.hotbar = makeInv(MAX_HOTBAR);
    p.altHotbar = makeInv(MAX_HOTBAR);
    p.vest = null;
    p.helmet = null;
    p.selected = 0;
    recalcMaxHp();
  }

  function findDeathChestSpot(tx, ty) {
    const baseX = Math.max(1, Math.min(WORLD_W - 2, tx));
    const baseY = Math.max(0, Math.min(WORLD_H - 3, ty));
    for (let r = 0; r <= 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = baseX + dx;
          const y = baseY + dy;
          if (!inBounds(x, y) || y >= WORLD_H - 2) continue;
          const id = getBlock(x, y);
          if (id === B.AIR || isWall(id)) return { x, y };
        }
      }
    }
    return { x: baseX, y: baseY };
  }

  function update(dt) {
    state.time += dt;
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toastEl.classList.add("hidden");
    }
    if (state.mode !== "play" || !state.player) return;
    worldMouse();
    recalcMaxHp();
    if (state.player.hp > 0 && !state.currentMenu) updatePlayer(dt);
    updateMining(dt);
    updateMachines(dt);
    updateDroids(dt);
    updateLasers(dt);
    updateParticles(dt);
    updatePortalTeleport(dt);
    updateCamera();
    state.saveTimer += dt;
    if (state.saveTimer > 12) {
      state.saveTimer = 0;
      saveGame();
    }
    pressed.clear();
  }

  function updatePlayer(dt) {
    const p = state.player;
    p.hurtTimer = Math.max(0, (p.hurtTimer || 0) - dt);
    const ladderInfo = ladderOverlap();
    const grav = gravityAtPlayer();
    const inZeroG = Math.abs(grav) < 1;
    const accel = p.vest?.id === "obsidian_vest" ? 950 : 720;
    const maxSpeed = p.vest?.id === "obsidian_vest" ? 230 : 160;
    const spaceHelmet = p.helmet?.id === "titanium_helmet" && tileAtPixel(p.x, p.y).y < SPACE_Y;
    const speedBonus = spaceHelmet ? 1.45 : 1;

    if (keys.has("a") || keys.has("arrowleft")) {
      p.vx -= accel * dt;
      p.facing = -1;
    }
    if (keys.has("d") || keys.has("arrowright")) {
      p.vx += accel * dt;
      p.facing = 1;
    }

    if (ladderInfo.on) {
      const ladderSpeed = ladderInfo.stone ? 190 : 95;
      p.vy = 0;
      if (keys.has("w") || keys.has("arrowup")) p.vy = -ladderSpeed;
      if (keys.has("s") || keys.has("arrowdown")) p.vy = ladderSpeed;
      p.doubleUsed = false;
    } else if (inZeroG) {
      const thrust = 520;
      if (keys.has("w") || keys.has(" ") || keys.has("arrowup")) p.vy -= thrust * dt;
      if (keys.has("s") || keys.has("arrowdown")) p.vy += thrust * dt;
      p.vy *= Math.pow(0.94, dt * 60);
    } else {
      p.vy += grav * dt;
    }

    const jumpPressed = pressed.has(" ") || pressed.has("w") || pressed.has("arrowup");
    if (jumpPressed && !ladderInfo.on && !inZeroG) {
      if (p.grounded) {
        p.vy = -315;
        p.grounded = false;
        p.doubleUsed = false;
      } else if (state.upgrades.doubleJump && !p.doubleUsed) {
        p.vy = -300;
        p.doubleUsed = true;
      }
    }

    p.vx = Math.max(-maxSpeed * speedBonus, Math.min(maxSpeed * speedBonus, p.vx));
    if (!keys.has("a") && !keys.has("arrowleft") && !keys.has("d") && !keys.has("arrowright")) {
      p.vx *= Math.pow(p.grounded ? 0.78 : 0.92, dt * 60);
    }
    if (inZeroG) p.vx *= Math.pow(0.95, dt * 60);

    const oldVy = p.vy;
    moveAxis("x", p.vx * dt);
    moveAxis("y", p.vy * dt);
    if (p.grounded) {
      p.doubleUsed = false;
      if (oldVy > 900) {
        let damage = Math.floor((oldVy - 900) / 28);
        if (p.helmet?.id === "meteorite_helmet") damage = Math.floor(damage * 0.5);
        if (damage > 0) hurtPlayer(damage);
      }
    }
    if (p.vest?.id === "tin_vest" || p.vest?.id === "obsidian_vest") {
      p.hp = Math.min(p.maxHp, p.hp + (p.vest.id === "obsidian_vest" ? 4 : 2) * dt);
    }
    if (Math.abs(p.vx) > 8 && p.grounded) p.walkTime += dt * 10;
  }

  function gravityAtPlayer() {
    const p = state.player;
    const tx = Math.floor((p.x + p.w / 2) / TILE_W);
    const ty = Math.floor((p.y + p.h / 2) / TILE_H);
    for (const [key, machine] of Object.entries(state.machines)) {
      if (machine.type !== "gravity_manip") continue;
      const pos = parseKey(key);
      if (Math.abs(pos.x - tx) <= 2 && ty < pos.y && ty >= pos.y - (machine.height || 20)) {
        if (machine.mode === "none") return 0;
        if (machine.mode === "low") return 280;
        if (machine.mode === "strong") return 1450;
        if (machine.mode === "reverse") return -600;
      }
    }
    if (ty < SPACE_Y) {
      if (ty < SPACE_Y * 0.58) return 0;
      const t = (ty - SPACE_Y * 0.58) / (SPACE_Y * 0.42);
      return 900 * smoothstep(t);
    }
    return 900;
  }

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  function hurtPlayer(amount) {
    const p = state.player;
    if (p.hp <= 0) return;
    p.hp = Math.max(0, p.hp - amount);
    p.hurtTimer = 0.25;
    spawnSpark(p.x + p.w / 2, p.y + p.h / 2, "#ff6b5f");
    playTone("hurt");
    if (p.hp <= 0) handlePlayerDeath();
  }

  function ladderOverlap() {
    const p = state.player;
    const minX = Math.floor(p.x / TILE_W);
    const maxX = Math.floor((p.x + p.w) / TILE_W);
    const minY = Math.floor(p.y / TILE_H);
    const maxY = Math.floor((p.y + p.h) / TILE_H);
    let on = false;
    let stone = false;
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const id = getBlock(x, y);
        if (isLadder(id)) {
          on = true;
          if (id === B.LADDER_STONE) stone = true;
        }
      }
    }
    return { on, stone };
  }

  function moveAxis(axis, amount) {
    const p = state.player;
    if (axis === "x") p.x += amount;
    else {
      p.y += amount;
      p.grounded = false;
    }
    const hits = collidingTiles(p);
    for (const hit of hits) {
      const tx = hit.x * TILE_W;
      const ty = hit.y * TILE_H;
      if (axis === "x") {
        if (amount > 0) p.x = tx - p.w - 0.001;
        else if (amount < 0) p.x = tx + TILE_W + 0.001;
        p.vx = 0;
      } else {
        if (amount > 0) {
          p.y = ty - p.h - 0.001;
          p.grounded = true;
        } else if (amount < 0) p.y = ty + TILE_H + 0.001;
        p.vy = 0;
      }
    }
    p.x = Math.max(0, Math.min(WORLD_W * TILE_W - p.w, p.x));
    p.y = Math.max(0, Math.min(WORLD_H * TILE_H - p.h, p.y));
  }

  function collidingTiles(rect) {
    const out = [];
    const minX = Math.floor(rect.x / TILE_W);
    const maxX = Math.floor((rect.x + rect.w - 0.001) / TILE_W);
    const minY = Math.floor(rect.y / TILE_H);
    const maxY = Math.floor((rect.y + rect.h - 0.001) / TILE_H);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (isSolid(getBlock(x, y))) out.push({ x, y });
      }
    }
    return out;
  }

  function updateCamera() {
    const zoom = currentZoom();
    const viewW = innerWidth / zoom;
    const viewH = innerHeight / zoom;
    const targetX = state.player.x + state.player.w / 2 - viewW / 2;
    const targetY = state.player.y + state.player.h / 2 - viewH / 2;
    const maxX = WORLD_W * TILE_W - viewW;
    const maxY = WORLD_H * TILE_H - viewH;
    state.camera.x += (Math.max(0, Math.min(maxX, targetX)) - state.camera.x) * 0.1;
    state.camera.y += (Math.max(0, Math.min(maxY, targetY)) - state.camera.y) * 0.1;
  }

  function updateMachines(dt) {
    for (const [key, machine] of Object.entries(state.machines)) {
      const pos = parseKey(key);
      if (machine.type === "campfire" || machine.type === "smelter" || machine.type === "wood_processor") updateProcessorMachine(machine, dt);
      else if (machine.type === "excavator") updateExcavator(machine, dt);
      else if (machine.type === "grow_podium") updateGrowPodium(pos.x, pos.y, machine, dt);
      else if (machine.type === "grow_collector") updateGrowCollector(machine, dt);
      else if (machine.type === "meteor_podium") updateMeteorPodium(pos.x, pos.y, machine, dt);
      else if (machine.type === "meteor_collector") updateMeteorCollector(machine, dt);
      else if (machine.type === "guide") updateGuide(pos.x, pos.y, machine, dt);
      else if (machine.type === "turret") updateTurret(pos.x, pos.y, machine, dt);
    }
  }

  function processorRecipe(machine) {
    const id = machine.input?.id;
    if (machine.type === "wood_processor") {
      if (id === "wood") return { out: "stone", count: 5, time: 3 };
      return null;
    }
    if (id === "tin_ore") return { out: "tin_chunk", count: machine.type === "smelter" ? 3 : 1, time: machine.type === "smelter" ? 3 : 5 };
    if (id === "obsidian_ore") return { out: "obsidian_chunk", count: machine.type === "smelter" ? 3 : 1, time: machine.type === "smelter" ? 4 : 6 };
    if (id === "meteorite_ore") return { out: "meteorite_chunk", count: machine.type === "smelter" ? 3 : 1, time: machine.type === "smelter" ? 4 : 6 };
    return null;
  }

  function updateProcessorMachine(machine, dt) {
    const recipe = processorRecipe(machine);
    if (!recipe || !machine.input) {
      machine.progress = 0;
      return;
    }
    if (!canAddToInventory(machine.output, recipe.out, recipe.count)) return;
    machine.progress += dt;
    if (machine.progress >= recipe.time) {
      machine.progress = 0;
      machine.input.count--;
      if (machine.input.count <= 0) machine.input = null;
      addToInventory(machine.output, recipe.out, recipe.count);
    }
  }

  function updateExcavator(machine, dt) {
    if (!machine.input || !["tin_chunk", "obsidian_chunk"].includes(machine.input.id)) {
      machine.progress = 0;
      return;
    }
    if (!canAddToInventory(machine.output, machine.input.id, 1)) return;
    machine.progress += dt;
    if (machine.progress >= 300) {
      machine.progress = 0;
      addToInventory(machine.output, machine.input.id, 1);
    }
  }

  function updateGrowPodium(x, y, machine, dt) {
    machine.timer -= dt;
    if (machine.timer > 0) return;
    const collector = state.machines[mkey(x, y + 1)];
    if (collector?.type === "grow_collector") {
      const targets = spawnTreeForHarvest(x, y - 1);
      collector.targets.push(...targets.sort((a, b) => (a.id === B.LEAVES ? -1 : 1) - (b.id === B.LEAVES ? -1 : 1)));
      machine.timer = 60;
      return;
    }
    if (canGrowTree(x, y - 1)) {
      makeTree(x, y - 1, 5);
      machine.timer = 60;
    } else {
      machine.timer = 8;
    }
  }

  function canGrowTree(x, y) {
    for (let yy = y - 8; yy <= y; yy++) {
      for (let xx = x - 3; xx <= x + 3; xx++) {
        if (!inBounds(xx, yy) || getBlock(xx, yy) !== B.AIR) return false;
      }
    }
    return true;
  }

  function spawnTreeForHarvest(x, baseY) {
    if (!canGrowTree(x, baseY)) return [];
    makeTree(x, baseY, 5);
    return connectedTreeBlocks(x, baseY);
  }

  function updateGrowCollector(machine, dt) {
    if (!machine.targets?.length) return;
    machine.tick += dt;
    const delay = Math.max(0.15, 20 / Math.max(1, machine.targets.length));
    if (machine.tick < delay) return;
    machine.tick = 0;
    const target = machine.targets.shift();
    const id = getBlock(target.x, target.y);
    if (id !== B.WOOD && id !== B.LEAVES && id !== B.CACTUS) return;
    if ((id === B.WOOD || id === B.CACTUS) && !canAddToInventory(machine.inv, "wood", 1)) {
      machine.targets.unshift(target);
      return;
    }
    setBlock(target.x, target.y, B.AIR);
    if (id === B.WOOD || id === B.CACTUS) addToInventory(machine.inv, "wood", 1);
  }

  function updateMeteorPodium(x, y, machine, dt) {
    machine.timer -= dt;
    if (machine.timer > 0) return;
    const clear = getBlock(x, y - 1) === B.AIR && getBlock(x, y - 2) === B.AIR;
    if (!clear) {
      machine.timer = 30;
      return;
    }
    const cells = makeMeteor(x, y - 7, 5, false);
    machine.active = cells;
    const collector = state.machines[mkey(x, y + 1)];
    if (collector?.type === "meteor_collector") collector.targets.push(...cells);
    machine.timer = 300;
  }

  function updateMeteorCollector(machine, dt) {
    if (!machine.targets?.length) return;
    machine.tick += dt;
    if (machine.tick < 1) return;
    machine.tick = 0;
    const target = machine.targets.shift();
    const id = getBlock(target.x, target.y);
    if (id !== B.METEORITE_ORE && id !== B.METEOR_STONE && id !== B.STONE_BRICK) return;
    const item = id === B.METEORITE_ORE ? "meteorite_ore" : "stone_brick";
    if (machine.filter === "meteorite" && item !== "meteorite_ore") {
      setBlock(target.x, target.y, B.AIR);
      return;
    }
    if (machine.filter === "stone" && item !== "stone_brick") {
      setBlock(target.x, target.y, B.AIR);
      return;
    }
    if (!canAddToInventory(machine.inv, item, 1)) {
      machine.targets.unshift(target);
      return;
    }
    setBlock(target.x, target.y, B.AIR);
    addToInventory(machine.inv, item, 1);
  }

  const DIRS = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0]
  };

  function updateGuide(x, y, machine, dt) {
    machine.tick = (machine.tick || 0) + dt;
    if (machine.tick < 0.75) return;
    machine.tick = 0;
    const dir = DIRS[machine.dir] || DIRS.right;
    const sourcePos = { x: x - dir[0], y: y - dir[1] };
    const destPos = { x: x + dir[0], y: y + dir[1] };
    if (!machine.buffer) machine.buffer = extractFromMachine(sourcePos.x, sourcePos.y);
    if (machine.buffer && insertIntoMachine(destPos.x, destPos.y, machine.buffer)) machine.buffer = null;
  }

  function firstItemFromInv(inv) {
    for (let i = 0; i < inv.length; i++) {
      if (inv[i]) {
        const item = { id: inv[i].id, count: 1, meta: inv[i].meta ? structuredClone(inv[i].meta) : undefined };
        inv[i].count--;
        if (inv[i].count <= 0) inv[i] = null;
        return item;
      }
    }
    return null;
  }

  function extractFromMachine(x, y) {
    const m = state.machines[mkey(x, y)];
    if (!m) return null;
    if (m.type === "guide") {
      const item = m.buffer;
      m.buffer = null;
      return item;
    }
    if (m.type === "chest" || m.type === "grow_collector" || m.type === "meteor_collector") return firstItemFromInv(m.inv);
    if (m.type === "campfire" || m.type === "smelter" || m.type === "wood_processor" || m.type === "excavator") return firstItemFromInv(m.output);
    if (m.type === "turret") return firstItemFromInv(m.output);
    return null;
  }

  function insertIntoMachine(x, y, item) {
    const m = state.machines[mkey(x, y)];
    if (!m) return false;
    if (m.type === "guide") {
      if (m.buffer) return false;
      m.buffer = item;
      return true;
    }
    if (m.type === "chest" || m.type === "grow_collector" || m.type === "meteor_collector") return addToInventory(m.inv, item.id, item.count, item.meta);
    if (m.type === "campfire" || m.type === "smelter") return addToInputSlot(m, item, ["tin_ore", "obsidian_ore", "meteorite_ore"]);
    if (m.type === "wood_processor") return addToInputSlot(m, item, ["wood"]);
    if (m.type === "excavator") return addToInputSlot(m, item, ["tin_chunk", "obsidian_chunk"], 1);
    if (m.type === "turret") return addToFuelSlot(m, item);
    return false;
  }

  function addToInputSlot(machine, item, allowed, max = 99) {
    if (!allowed.includes(item.id)) return false;
    if (!machine.input) {
      machine.input = cloneStack(item);
      machine.input.count = Math.min(item.count, max);
      return true;
    }
    if (machine.input.id === item.id && machine.input.count < max) {
      machine.input.count += item.count;
      return true;
    }
    return false;
  }

  function addToFuelSlot(machine, item) {
    if (item.id !== "meteorite_chunk") return false;
    if (!machine.fuel) {
      machine.fuel = cloneStack(item);
      return true;
    }
    if (machine.fuel.id === item.id && machine.fuel.count < 99) {
      machine.fuel.count += item.count;
      return true;
    }
    return false;
  }

  function updateTurret(x, y, machine, dt) {
    machine.fuelTimer -= dt;
    if (machine.fuelTimer <= 0) {
      if (machine.fuel?.id === "meteorite_chunk" && machine.fuel.count > 0) {
        machine.fuel.count--;
        if (machine.fuel.count <= 0) machine.fuel = null;
        machine.fuelTimer = 120;
      } else {
        machine.fuelTimer = 0;
        return;
      }
    }
    machine.shot = Math.max(0, (machine.shot || 0) - dt);
    if (machine.shot > 0) return;
    const cx = x * TILE_W + TILE_W / 2;
    const cy = y * TILE_H + TILE_H / 2;
    let target = null;
    let best = 360;
    for (const d of state.droids) {
      const dx = d.x + d.w / 2;
      const dy = d.y + d.h / 2;
      const dist = Math.hypot(cx - dx, cy - dy);
      if (dist < best && lineOfSightClear(cx, cy, dx, dy)) {
        best = dist;
        target = d;
      }
    }
    if (!target) return;
    machine.shot = 0.45;
    target.hp -= 4;
    state.lasers.push({ x: cx, y: cy, vx: ((target.x + target.w / 2) - cx) * 4, vy: ((target.y + target.h / 2) - cy) * 4, life: 0.2, from: "turret", damage: 0 });
    if (target.hp <= 0) killDroid(target, machine);
  }

  function updateDroids(dt) {
    state.spawnTimer += dt;
    const pTile = tileAtPixel(state.player.x, state.player.y);
    if (pTile.y < SPACE_Y + 20 && state.spawnTimer > 8 && state.droids.length < 16) {
      state.spawnTimer = 0;
      for (let tries = 0; tries < 20; tries++) {
        const tx = Math.max(4, Math.min(WORLD_W - 5, pTile.x + randRange(state.seed + Math.floor(state.time * 10) + tries, -22, 22)));
        const ty = randRange(state.seed + Math.floor(state.time * 13) + tries, 16, SPACE_Y - 8);
        if (getBlock(tx, ty) === B.AIR) {
          addDroid(tx * TILE_W, ty * TILE_H);
          break;
        }
      }
    }
    const px = state.player.x + state.player.w / 2;
    const py = state.player.y + state.player.h / 2;
    for (const d of state.droids) {
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist < 520 && lineOfSightClear(cx, cy, px, py)) {
        d.vx += Math.sign(px - cx) * 30 * dt;
        d.vy += Math.sign(py - cy) * 20 * dt;
        d.shot -= dt;
        if (d.shot <= 0) {
          d.shot = 1.7;
          const a = Math.atan2(py - cy, px - cx);
          state.lasers.push({ x: cx, y: cy, vx: Math.cos(a) * 410, vy: Math.sin(a) * 410, life: 1.2, from: "droid", damage: 18 });
        }
      } else {
        d.vx += (hash01(Math.floor(d.x), Math.floor(state.time * 3)) - 0.5) * 40 * dt;
        d.vy += (hash01(Math.floor(d.y), Math.floor(state.time * 4)) - 0.5) * 30 * dt;
      }
      d.vx *= Math.pow(0.96, dt * 60);
      d.vy *= Math.pow(0.96, dt * 60);
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y / TILE_H > SPACE_Y - 3) d.y = (SPACE_Y - 3) * TILE_H;
      d.x = Math.max(0, Math.min(WORLD_W * TILE_W - d.w, d.x));
      d.y = Math.max(0, Math.min(SPACE_Y * TILE_H - d.h, d.y));
      if (collidesWorld(d)) {
        d.x -= d.vx * dt;
        d.y -= d.vy * dt;
        d.vx *= -0.4;
        d.vy *= -0.4;
      }
      d.trail ||= [];
      for (let i = d.trail.length - 1; i >= 0; i--) {
        d.trail[i].life -= dt;
        if (d.trail[i].life <= 0) d.trail.splice(i, 1);
      }
      if (Math.hypot(d.vx, d.vy) > 10) {
        d.trail.unshift({ x: d.x + d.w / 2, y: d.y + d.h / 2, life: 0.45 });
        if (d.trail.length > 9) d.trail.pop();
      }
    }
  }

  function collidesWorld(rect) {
    return collidingTiles(rect).length > 0;
  }

  function updateLasers(dt) {
    for (let i = state.lasers.length - 1; i >= 0; i--) {
      const l = state.lasers[i];
      l.life -= dt;
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      const id = getBlock(Math.floor(l.x / TILE_W), Math.floor(l.y / TILE_H));
      if (l.life <= 0 || (isSolid(id) && !isLadder(id) && !isWall(id))) {
        spawnSpark(l.x, l.y, l.from === "droid" ? "#7cff8b" : "#8dfcff");
        state.lasers.splice(i, 1);
        continue;
      }
      if (l.from === "droid") {
        const p = state.player;
        if (l.x >= p.x && l.x <= p.x + p.w && l.y >= p.y && l.y <= p.y + p.h) {
          hurtPlayer(l.damage);
          spawnSpark(l.x, l.y, "#7cff8b");
          state.lasers.splice(i, 1);
        }
      } else if (l.from === "player") {
        for (const d of state.droids) {
          if (l.x >= d.x && l.x <= d.x + d.w && l.y >= d.y && l.y <= d.y + d.h) {
            d.hp -= l.damage;
            spawnSpark(l.x, l.y, "#8dfcff");
            if (d.hp <= 0) killDroid(d, "player");
            state.lasers.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function updatePortalTeleport(dt) {
    const p = state.player;
    p.portalCooldown = Math.max(0, (p.portalCooldown || 0) - dt);
    if (p.portalCooldown > 0) return;
    const tx = Math.floor((p.x + p.w / 2) / TILE_W);
    const ty = Math.floor((p.y + p.h / 2) / TILE_H);
    if (getBlock(tx, ty) !== B.PORTAL) return;
    const here = state.machines[mkey(tx, ty)];
    if (!here?.channel) return;
    for (const [key, m] of Object.entries(state.machines)) {
      if (m.type !== "portal" || m === here || m.channel !== here.channel) continue;
      const pos = parseKey(key);
      p.x = pos.x * TILE_W + TILE_W / 2 - p.w / 2;
      p.y = pos.y * TILE_H - p.h;
      p.portalCooldown = 1;
      showToast(`Portal ${here.channel}`);
      return;
    }
  }

  function openCrafting(station, x = null, y = null) {
    state.currentMenu = { type: "craft", station, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function closeMenu() {
    state.currentMenu = null;
    menuOverlay.classList.add("hidden");
    menuBody.innerHTML = "";
  }

  function renderCurrentMenu() {
    if (!state.currentMenu) return;
    const m = state.currentMenu;
    menuOverlay.dataset.theme = menuThemeForMenu(m);
    if (m.type === "craft") renderCraftMenu(m.station);
    else if (m.type === "storage") renderStorageMenu(m.title, m.machine);
    else if (m.type === "processor") renderProcessorMenu(m.machine);
    else if (m.type === "excavator") renderExcavatorMenu(m.machine);
    else if (m.type === "bin") renderBinMenu(m.machine);
    else if (m.type === "collector") renderCollectorMenu(m.machine);
    else if (m.type === "guide") renderGuideMenu(m.machine);
    else if (m.type === "upgrades") renderUpgradeMenu();
    else if (m.type === "charming") renderCharmingMenu(m.machine);
    else if (m.type === "artifact") renderArtifactMenu();
    else if (m.type === "portal") renderPortalMenu(m.machine);
    else if (m.type === "gravity") renderGravityMenu(m.machine);
    else if (m.type === "podium") renderPodiumMenu(m.machine);
  }

  function menuThemeForMenu(m) {
    if (m.type === "craft") return m.station === "advanced" ? "advanced" : "craft";
    if (m.type === "storage") return "chest";
    if (m.type === "processor") {
      if (m.machine.type === "campfire") return "campfire";
      if (m.machine.type === "smelter") return "smelter";
      return "wood-processor";
    }
    if (m.type === "excavator") return "excavator";
    if (m.type === "bin") return "bin";
    if (m.type === "collector") return m.machine.type === "meteor_collector" ? "meteor" : m.machine.type === "turret" ? "turret" : "grow";
    if (m.type === "guide") return "guide";
    if (m.type === "upgrades") return "upgrades";
    if (m.type === "charming") return "charming";
    if (m.type === "artifact") return "artifact";
    if (m.type === "portal") return "portal";
    if (m.type === "gravity") return "gravity";
    if (m.type === "podium") return m.machine.type === "meteor_podium" ? "meteor" : "grow";
    return "machine";
  }

  function recipeIsAvailable(recipe, station) {
    if (station === "starter") return recipe.station === "starter";
    if (station === "table") return recipe.station === "starter" || recipe.station === "table";
    if (station === "advanced") {
      if (recipe.station === "locked") return state.upgrades.lockedRecipes;
      if (recipe.station.startsWith("artifact:")) {
        const art = recipe.station.split(":")[1];
        return !!state.upgrades.artifacts[art];
      }
      return recipe.station === "starter" || recipe.station === "table" || recipe.station === "advanced";
    }
    return false;
  }

  function renderCraftMenu(station) {
    menuTitle.textContent = station === "starter" ? "Crafting" : station === "table" ? "Table" : "Advanced Table";
    menuBody.innerHTML = `<div class="menu-grid"></div>`;
    const grid = menuBody.querySelector(".menu-grid");
    for (const recipe of RECIPES.filter(rp => recipeIsAvailable(rp, station))) {
      const can = hasRequirements(recipe.req);
      const reqText = recipe.req.map(req => `${req.count} ${itemName(req.id)}`).join(", ");
      const card = document.createElement("div");
      card.className = "recipe";
      card.innerHTML = `<h3>${recipe.name}</h3><p>${reqText}</p><p>Creates ${recipe.out.count} ${itemName(recipe.out.id)}</p>`;
      const btn = document.createElement("button");
      btn.textContent = "Craft";
      btn.disabled = !can;
      btn.addEventListener("click", () => tryCraft(recipe));
      card.appendChild(btn);
      grid.appendChild(card);
    }
    appendHotbarPanel();
  }

  function openStorage(title, machine, x, y) {
    state.currentMenu = { type: "storage", title, machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderStorageMenu(title, machine) {
    menuTitle.textContent = title;
    menuBody.innerHTML = "";
    const chest = panel("Storage");
    renderInvGrid(chest, machine.inv, (i, all) => moveFromMachineToPlayer(machine.inv, i, all), {
      dragPayload: (i) => machine.inv[i] ? { source: "machine-inv", inv: machine.inv, index: i } : null,
      canDrop: payload => payload?.source === "hotbar",
      onDrop: payload => moveFromPlayerToInventory(payload.index, machine.inv, true, payload.row)
    });
    const player = panel("Hotbar, Vest, Helmet");
    renderPlayerInventory(player, (i, all, rowName) => moveFromPlayerToInventory(i, machine.inv, all, rowName));
    menuBody.append(chest, player);
  }

  function openProcessor(machine, x, y) {
    state.currentMenu = { type: "processor", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderProcessorMenu(machine) {
    const title = machine.type === "campfire" ? "Campfire" : machine.type === "smelter" ? "Smelter" : "Wood Processor";
    menuTitle.textContent = title;
    menuBody.innerHTML = "";
    const p = panel("Processing");
    const recipe = processorRecipe(machine);
    const pct = recipe ? Math.min(100, machine.progress / recipe.time * 100) : 0;
    const allowed = machine.type === "wood_processor" ? ["wood"] : ["tin_ore", "obsidian_ore", "meteorite_ore"];
    p.insertAdjacentHTML("beforeend", `<p>${recipe ? `Making ${recipe.count} ${itemName(recipe.out)}` : "Add a valid input item."}</p><div class="progress-line"><span style="width:${pct}%"></span></div>`);
    const inputBox = document.createElement("div");
    inputBox.innerHTML = `<h3>Input</h3>`;
    renderInvGrid(inputBox, [machine.input], (i, all) => {
      if (machine.input) {
        if (moveSingleStackToPlayer(machine, "input", all)) renderCurrentMenu();
      }
    }, {
      dragPayload: () => machine.input ? { source: "machine-slot", machine, key: "input" } : null,
      canDrop: payload => payload?.source === "hotbar",
      onDrop: payload => moveFromPlayerToInput(payload.index, machine, allowed, true, 99, payload.row)
    });
    const outBox = document.createElement("div");
    outBox.innerHTML = `<h3>Output</h3>`;
    renderInvGrid(outBox, machine.output, (i, all) => moveFromMachineToPlayer(machine.output, i, all), {
      dragPayload: (i) => machine.output[i] ? { source: "machine-inv", inv: machine.output, index: i } : null
    });
    const player = panel("Hotbar");
    renderPlayerInventory(player, (i, all, rowName) => moveFromPlayerToInput(i, machine, allowed, all, 99, rowName));
    menuBody.append(p, inputBox, outBox, player);
  }

  function openExcavator(machine, x, y) {
    state.currentMenu = { type: "excavator", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderExcavatorMenu(machine) {
    menuTitle.textContent = "Mineral Excavator";
    menuBody.innerHTML = "";
    const p = panel("Generator");
    const pct = Math.min(100, machine.progress / 300 * 100);
    p.insertAdjacentHTML("beforeend", `<p>Accepts Tin Chunk or Obsidian Chunk only. Generates one item every five minutes.</p><div class="progress-line"><span style="width:${pct}%"></span></div>`);
    const inputBox = document.createElement("div");
    inputBox.innerHTML = `<h3>Seed Slot</h3>`;
    renderInvGrid(inputBox, [machine.input], () => {
      if (machine.input && moveSingleStackToPlayer(machine, "input", true)) renderCurrentMenu();
    }, {
      dragPayload: () => machine.input ? { source: "machine-slot", machine, key: "input" } : null,
      canDrop: payload => payload?.source === "hotbar",
      onDrop: payload => moveFromPlayerToInput(payload.index, machine, ["tin_chunk", "obsidian_chunk"], true, 1, payload.row)
    });
    const outBox = document.createElement("div");
    outBox.innerHTML = `<h3>Output</h3>`;
    renderInvGrid(outBox, machine.output, (i, all) => moveFromMachineToPlayer(machine.output, i, all), {
      dragPayload: (i) => machine.output[i] ? { source: "machine-inv", inv: machine.output, index: i } : null
    });
    const player = panel("Hotbar");
    renderPlayerInventory(player, (i, all, rowName) => moveFromPlayerToInput(i, machine, ["tin_chunk", "obsidian_chunk"], all, 1, rowName));
    menuBody.append(p, inputBox, outBox, player);
  }

  function openBin(machine, x, y) {
    state.currentMenu = { type: "bin", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderBinMenu() {
    menuTitle.textContent = "Bin";
    menuBody.innerHTML = "";
    const p = panel("Delete Items");
    p.insertAdjacentHTML("beforeend", "<p>Click a hotbar item to delete one. Hold the click or hold Shift to delete the whole stack.</p>");
    renderPlayerInventory(p, (i, all, rowName) => {
      if (i === 0) return;
      const row = hotbarByName(rowName);
      const slot = row[i];
      if (!slot) return;
      if (all || slot.count <= 1) row[i] = null;
      else slot.count--;
      renderCurrentMenu();
    });
    menuBody.appendChild(p);
  }

  function openCollector(machine, x, y) {
    state.currentMenu = { type: "collector", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderCollectorMenu(machine) {
    menuTitle.textContent = machine.type === "turret" ? "Turret" : machine.type === "meteor_collector" ? "Meteor Collector" : "Grow Collector";
    menuBody.innerHTML = "";
    if (machine.type === "meteor_collector") {
      const p = panel("Filter");
      const select = document.createElement("select");
      for (const value of [["meteorite", "Meteorite Ore"], ["stone", "Stone Brick"]]) {
        const opt = document.createElement("option");
        opt.value = value[0];
        opt.textContent = value[1];
        select.appendChild(opt);
      }
      select.value = machine.filter || "meteorite";
      select.addEventListener("change", () => { machine.filter = select.value; });
      p.appendChild(select);
      menuBody.appendChild(p);
    }
    if (machine.type === "turret") {
      const p = panel("Fuel");
      p.insertAdjacentHTML("beforeend", `<p>${machine.fuelTimer > 0 ? Math.ceil(machine.fuelTimer) + "s powered" : "Needs Meteorite Chunk fuel"}</p>`);
      renderInvGrid(p, [machine.fuel], () => {
        if (machine.fuel && moveSingleStackToPlayer(machine, "fuel", true)) renderCurrentMenu();
      }, {
        dragPayload: () => machine.fuel ? { source: "machine-slot", machine, key: "fuel" } : null,
        canDrop: payload => payload?.source === "hotbar",
        onDrop: payload => moveFromPlayerToFuel(payload.index, machine, true, payload.row)
      });
      renderPlayerInventory(p, (i, all, rowName) => moveFromPlayerToFuel(i, machine, all, rowName));
      menuBody.appendChild(p);
    }
    const inv = panel("Storage");
    const storageInv = machine.inv || machine.output;
    renderInvGrid(inv, storageInv, (i, all) => moveFromMachineToPlayer(storageInv, i, all), {
      dragPayload: (i) => storageInv[i] ? { source: "machine-inv", inv: storageInv, index: i } : null,
      canDrop: payload => payload?.source === "hotbar",
      onDrop: payload => moveFromPlayerToInventory(payload.index, storageInv, true, payload.row)
    });
    const player = panel("Hotbar");
    renderPlayerInventory(player, (i, all, rowName) => moveFromPlayerToInventory(i, storageInv, all, rowName));
    menuBody.append(inv, player);
  }

  function openGuide(machine, x, y) {
    state.currentMenu = { type: "guide", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderGuideMenu(machine) {
    menuTitle.textContent = "Guide";
    menuBody.innerHTML = "";
    const p = panel("Direction");
    const row = document.createElement("div");
    row.className = "toolbar";
    for (const dir of ["up", "down", "left", "right"]) {
      const btn = document.createElement("button");
      btn.textContent = dir.toUpperCase();
      btn.disabled = machine.dir === dir;
      btn.addEventListener("click", () => {
        machine.dir = dir;
        renderCurrentMenu();
      });
      row.appendChild(btn);
    }
    p.appendChild(row);
    p.insertAdjacentHTML("beforeend", `<p>Buffer: ${machine.buffer ? `${machine.buffer.count} ${itemName(machine.buffer.id)}` : "empty"}</p>`);
    menuBody.appendChild(p);
    appendHotbarPanel();
  }

  function openUpgradeTable(x, y) {
    state.currentMenu = { type: "upgrades", x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderUpgradeMenu() {
    menuTitle.textContent = "Upgrades Table";
    menuBody.innerHTML = `<div class="menu-grid"></div>`;
    const obsidianReady = state.upgrades.invSlots >= 2 && state.upgrades.fov;
    const obsidianLock = "Buy both inventory upgrades and the FOV upgrade first";
    const upgrades = [
      { key: "inv1", name: "Inventory 8 to 9", cost: [["obsidian_chunk", 80]], active: state.upgrades.invSlots >= 1, buy: () => { state.upgrades.invSlots = Math.max(state.upgrades.invSlots, 1); }, refund: () => { if (state.upgrades.invSlots === 1) state.upgrades.invSlots = 0; }, reversible: true },
      { key: "inv2", name: "Inventory 9 to 10", cost: [["obsidian_chunk", 140]], active: state.upgrades.invSlots >= 2, locked: state.upgrades.invSlots < 1, lockReason: "Buy Inventory 8 to 9 first", buy: () => { state.upgrades.invSlots = 2; }, refund: () => { if (state.upgrades.invSlots === 2) state.upgrades.invSlots = 1; }, reversible: true },
      { key: "fov", name: "FOV Upgrade", cost: [["obsidian_chunk", 160]], active: state.upgrades.fov, buy: () => { state.upgrades.fov = true; }, refund: () => { state.upgrades.fov = false; }, reversible: true },
      { key: "double", name: "Double Jump", cost: [["meteorite_chunk", 120]], active: state.upgrades.doubleJump, locked: !obsidianReady, lockReason: obsidianLock, buy: () => { state.upgrades.doubleJump = true; } },
      { key: "range1", name: "Mining Reach 125%", cost: [["meteorite_chunk", 90]], active: state.upgrades.mineRange >= 1, locked: !obsidianReady, lockReason: obsidianLock, buy: () => { state.upgrades.mineRange = Math.max(state.upgrades.mineRange, 1); } },
      { key: "range2", name: "Mining Reach 175%", cost: [["meteorite_chunk", 160]], active: state.upgrades.mineRange >= 2, locked: !obsidianReady || state.upgrades.mineRange < 1, lockReason: !obsidianReady ? obsidianLock : "Buy Mining Reach 125% first", buy: () => { state.upgrades.mineRange = Math.max(state.upgrades.mineRange, 2); } },
      { key: "range3", name: "Mining Reach 250%", cost: [["meteorite_chunk", 260]], active: state.upgrades.mineRange >= 3, locked: !obsidianReady || state.upgrades.mineRange < 2, lockReason: !obsidianReady ? obsidianLock : "Buy Mining Reach 175% first", buy: () => { state.upgrades.mineRange = 3; } },
      { key: "locked", name: "Locked Recipes", cost: [["meteorite_chunk", 140], ["obsidian_chunk", 80]], active: state.upgrades.lockedRecipes, locked: !obsidianReady, lockReason: obsidianLock, buy: () => { state.upgrades.lockedRecipes = true; } }
    ];
    const grid = menuBody.querySelector(".menu-grid");
    for (const up of upgrades) {
      const req = up.cost.map(([id, c]) => ({ id, count: c }));
      const card = document.createElement("div");
      card.className = "recipe";
      card.innerHTML = `<h3>${up.name}</h3><p>${up.cost.map(([id, c]) => `${c} ${itemName(id)}`).join(", ")}</p><p>${up.active ? "Purchased" : up.locked ? up.lockReason || "Previous upgrade required" : "Available"}</p>`;
      if (up.active && up.reversible) {
        const btn = document.createElement("button");
        btn.textContent = "Refund";
        btn.addEventListener("click", () => {
          if (!canAddPlayerDrops(up.cost.map(([id, count]) => ({ id, count })))) {
            showToast("Inventory full");
            return;
          }
          up.refund();
          for (const [id, count] of up.cost) addPlayerItem(id, count);
          renderCurrentMenu();
        });
        card.appendChild(btn);
      } else {
        const btn = document.createElement("button");
        btn.textContent = up.active ? "Owned" : "Buy";
        btn.disabled = up.active || up.locked || !hasRequirements(req);
        btn.addEventListener("click", () => {
          const temp = cloneHotbarRows();
          for (const need of req) removeFromInventories(temp, need.id, need.count, { reserveHand: true, limit: visibleHotbarSlots() });
          assignPlayerHotbars(temp);
          up.buy();
          renderCurrentMenu();
        });
        card.appendChild(btn);
      }
      grid.appendChild(card);
    }
    appendHotbarPanel();
  }

  function openCharming(machine, x, y) {
    state.currentMenu = { type: "charming", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderCharmingMenu(machine) {
    menuTitle.textContent = "Charming Table";
    menuBody.innerHTML = "";
    const p = panel("Paxel Charm");
    p.insertAdjacentHTML("beforeend", "<p>Insert a paxel. Replacing an existing charm refunds 5 Tin Chunks.</p>");
    renderInvGrid(p, [machine.slot], () => {
      if (machine.slot && moveSingleStackToPlayer(machine, "slot", true)) renderCurrentMenu();
    }, {
      dragPayload: () => machine.slot ? { source: "machine-slot", machine, key: "slot" } : null,
      canDrop: payload => payload?.source === "hotbar",
      onDrop: payload => moveFromPlayerToCharmingSlot(payload.index, machine, payload.row)
    });
    const row = document.createElement("div");
    row.className = "toolbar";
    for (const [charm, label] of [["tree_chopper", "Tree Chopper"], ["critical", "Critical Damage"], ["carpentry", "Carpenter's Fortuity"]]) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.disabled = !machine.slot || !ITEMS[machine.slot.id]?.toolTier || countPlayer("tin_chunk") < 5;
      btn.addEventListener("click", () => {
        if (!machine.slot) return;
        removeFromInventories(playerHotbars(), "tin_chunk", 5, { reserveHand: true, limit: visibleHotbarSlots() });
        machine.slot.meta = { ...(machine.slot.meta || {}), charm };
        renderCurrentMenu();
      });
      row.appendChild(btn);
    }
    p.appendChild(row);
    const player = panel("Hotbar");
    renderPlayerInventory(player, (i, all, rowName) => moveFromPlayerToCharmingSlot(i, machine, rowName));
    menuBody.append(p, player);
  }

  function openArtifactTable(machine, x, y) {
    state.currentMenu = { type: "artifact", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderArtifactMenu() {
    menuTitle.textContent = "Artifacts Table";
    menuBody.innerHTML = `<div class="menu-grid"></div>`;
    const arts = [
      ["teleport", "teleport_artifact", "Portal recipe"],
      ["gravity", "gravity_artifact", "Gravity Manipulator recipe"],
      ["laser", "laser_artifact", "Laser Gun recipe"]
    ];
    const grid = menuBody.querySelector(".menu-grid");
    for (const [key, item, label] of arts) {
      const card = document.createElement("div");
      card.className = "recipe";
      card.innerHTML = `<h3>${itemName(item)}</h3><p>${label}</p><p>${state.upgrades.artifacts[key] ? "Unlocked" : "Bring the artifact here."}</p>`;
      const btn = document.createElement("button");
      btn.textContent = state.upgrades.artifacts[key] ? "Unlocked" : "Unlock";
      btn.disabled = state.upgrades.artifacts[key] || countPlayer(item) < 1;
      btn.addEventListener("click", () => {
        removeFromInventories(playerHotbars(), item, 1, { reserveHand: true, limit: visibleHotbarSlots() });
        state.upgrades.artifacts[key] = true;
        renderCurrentMenu();
      });
      card.appendChild(btn);
      grid.appendChild(card);
    }
    appendHotbarPanel();
  }

  function openPortal(machine, x, y) {
    state.currentMenu = { type: "portal", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderPortalMenu(machine) {
    menuTitle.textContent = "Portal";
    menuBody.innerHTML = "";
    const p = panel("Channel");
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "9999";
    input.value = machine.channel || "";
    input.addEventListener("input", () => { machine.channel = input.value.trim(); });
    p.append(input);
    p.insertAdjacentHTML("beforeend", "<p>Portals with the same number link together.</p>");
    menuBody.appendChild(p);
    appendHotbarPanel();
  }

  function openGravity(machine, x, y) {
    state.currentMenu = { type: "gravity", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderGravityMenu(machine) {
    menuTitle.textContent = "Gravity Manipulator";
    menuBody.innerHTML = "";
    const p = panel("Field");
    const mode = document.createElement("select");
    for (const value of [["none", "No Gravity"], ["low", "Low Gravity"], ["strong", "Strong Gravity"], ["reverse", "Reverse Gravity"]]) {
      const opt = document.createElement("option");
      opt.value = value[0];
      opt.textContent = value[1];
      mode.appendChild(opt);
    }
    mode.value = machine.mode || "low";
    mode.addEventListener("change", () => { machine.mode = mode.value; });
    const height = document.createElement("input");
    height.type = "number";
    height.min = "3";
    height.max = "80";
    height.value = machine.height || 20;
    height.addEventListener("input", () => { machine.height = Math.max(3, Math.min(80, Number(height.value) || 20)); });
    p.append(mode, height);
    p.insertAdjacentHTML("beforeend", "<p>Applies in a vertical column above the block.</p>");
    menuBody.appendChild(p);
    appendHotbarPanel();
  }

  function openPodium(machine, x, y) {
    state.currentMenu = { type: "podium", machine, x, y };
    menuOverlay.classList.remove("hidden");
    renderCurrentMenu();
  }

  function renderPodiumMenu(machine) {
    menuTitle.textContent = machine.type === "meteor_podium" ? "Meteorite Podium" : "Grow Podium";
    menuBody.innerHTML = "";
    const p = panel("Timer");
    p.insertAdjacentHTML("beforeend", `<p>Next spawn in ${Math.ceil(machine.timer)} seconds.</p>`);
    menuBody.appendChild(p);
    appendHotbarPanel();
  }

  function panel(title) {
    const el = document.createElement("section");
    el.className = "panel";
    el.innerHTML = `<h3>${title}</h3>`;
    return el;
  }

  function isMachinePayload(payload) {
    return payload?.source === "machine-inv" || payload?.source === "machine-slot";
  }

  function machineStackFromPayload(payload) {
    if (payload?.source === "machine-inv") return payload.inv?.[payload.index] || null;
    if (payload?.source === "machine-slot") return payload.machine?.[payload.key] || null;
    return null;
  }

  function removeFromMachinePayload(payload, amount) {
    if (payload?.source === "machine-inv") {
      const stack = payload.inv?.[payload.index];
      if (!stack) return;
      stack.count -= amount;
      if (stack.count <= 0) payload.inv[payload.index] = null;
    } else if (payload?.source === "machine-slot") {
      const stack = payload.machine?.[payload.key];
      if (!stack) return;
      stack.count -= amount;
      if (stack.count <= 0) payload.machine[payload.key] = null;
    }
  }

  function moveMachinePayloadToHotbar(payload, targetIndex, rowName = "main", all = true) {
    const source = machineStackFromPayload(payload);
    const row = hotbarByName(rowName);
    if (!source || targetIndex <= 0 || targetIndex >= visibleHotbarSlots()) return false;
    const target = row[targetIndex];
    const desired = all ? source.count : 1;
    if (target) {
      if (!canMergeStacks(source, target)) {
        showToast("Slot is full");
        return false;
      }
      const max = ITEMS[target.id]?.max || 99;
      const amount = Math.min(desired, max - target.count);
      if (amount <= 0) return false;
      target.count += amount;
      removeFromMachinePayload(payload, amount);
    } else {
      const max = ITEMS[source.id]?.max || 99;
      const amount = isStackable(source.id) && !source.meta ? Math.min(desired, max) : 1;
      row[targetIndex] = { id: source.id, count: amount, meta: source.meta ? structuredClone(source.meta) : undefined };
      removeFromMachinePayload(payload, amount);
    }
    normalizeHotbar();
    invalidateHud();
    renderCurrentMenu();
    return true;
  }

  function moveFromMachinePayloadToPlayer(payload, all = true) {
    if (payload?.source === "machine-inv") {
      moveFromMachineToPlayer(payload.inv, payload.index, all);
      return true;
    }
    if (payload?.source === "machine-slot") {
      if (moveSingleStackToPlayer(payload.machine, payload.key, all)) renderCurrentMenu();
      return true;
    }
    return false;
  }

  function renderInvGrid(parent, inv, onClick = () => {}, options = {}) {
    const grid = document.createElement("div");
    grid.className = "inv-grid";
    inv.forEach((slot, i) => {
      const el = document.createElement("div");
      el.className = `inv-slot${slot ? "" : " empty"}`;
      el.innerHTML = slot ? `${itemIconMarkup(slot.id)}<div>${itemName(slot.id)}${slot.meta?.charm ? "<br>" + charmName(slot.meta.charm) : ""}</div><div>x${slot.count}</div>` : "Empty";
      const dragPayloadForSlot = slot && options.dragPayload ? options.dragPayload(i, slot) : null;
      if (dragPayloadForSlot) {
        el.draggable = true;
        el.addEventListener("dragstart", evt => beginSlotDrag(evt, dragPayloadForSlot));
        el.addEventListener("dragend", endSlotDrag);
      }
      if (options.onDrop) {
        el.addEventListener("dragover", evt => {
          const payload = dragDataFromEvent(evt);
          if (payload && (!options.canDrop || options.canDrop(payload, i, slot))) {
            evt.preventDefault();
            el.classList.add("drag-over");
          }
        });
        el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
        el.addEventListener("drop", evt => {
          const payload = dragDataFromEvent(evt);
          el.classList.remove("drag-over");
          if (payload && (!options.canDrop || options.canDrop(payload, i, slot))) {
            evt.preventDefault();
            lastMenuDropAt = performance.now();
            options.onDrop(payload, i, slot);
          }
          endSlotDrag();
        });
      }
      let down = 0;
      el.addEventListener("mousedown", evt => {
        down = performance.now();
        if (!dragPayloadForSlot) evt.preventDefault();
      });
      el.addEventListener("mouseup", evt => {
        if (performance.now() - lastMenuDropAt < 80) return;
        const all = evt.shiftKey || performance.now() - down > 350;
        onClick(i, all);
      });
      grid.appendChild(el);
    });
    parent.appendChild(grid);
  }

  function charmName(charm) {
    return charm === "tree_chopper" ? "Tree Chopper" : charm === "critical" ? "Critical" : charm === "carpentry" ? "Fortuity" : charm;
  }

  function renderInventoryHotbar(parent, label, rowName, startIndex, onClick) {
    const title = document.createElement("div");
    title.className = "inventory-title";
    title.textContent = label;
    parent.appendChild(title);
    const visible = visibleHotbarSlots();
    const row = hotbarByName(rowName);
    const inv = row.slice(startIndex, visible);
    if (startIndex === 0) inv[0] = { id: "hand_display", count: 1 };
    renderInvGrid(parent, inv, (localIndex, all) => {
      const i = localIndex + startIndex;
      if (i === 0) return;
      onClick(i, all, rowName);
    }, {
      dragPayload: (localIndex, slot) => {
        const i = localIndex + startIndex;
        if (i === 0 || slot.id === "hand_display") return null;
        return { source: "hotbar", row: rowName, index: i };
      },
      canDrop: (payload, localIndex) => {
        const i = localIndex + startIndex;
        return i > 0 && (payload?.source === "hotbar" || isMachinePayload(payload) || payload?.source === "gear");
      },
      onDrop: (payload, localIndex) => {
        const i = localIndex + startIndex;
        if (i <= 0) return;
        if (payload?.source === "hotbar") moveHotbarStack(payload.row, payload.index, rowName, i);
        else if (isMachinePayload(payload)) moveMachinePayloadToHotbar(payload, i, rowName, true);
        else if (payload?.source === "gear") moveGearToHotbar(payload.kind, i, rowName);
      }
    });
  }

  function renderPlayerInventory(parent, onClick) {
    renderInventoryHotbar(parent, "Bottom Hotbar", "main", 0, onClick);
    renderInventoryHotbar(parent, "Top Hotbar", "alt", 1, onClick);
    const gear = document.createElement("div");
    gear.className = "inv-grid";
    for (const [label, stack, handler] of [
      ["Vest", state.player.vest, () => unequip("vest")],
      ["Helmet", state.player.helmet, () => unequip("helmet")]
    ]) {
      const el = document.createElement("div");
      el.className = `inv-slot${stack ? "" : " empty"}`;
      el.innerHTML = stack ? `${itemIconMarkup(stack.id)}<div>${label}<br>${itemName(stack.id)}</div>` : `${label}<br>Empty`;
      el.addEventListener("click", handler);
      gear.appendChild(el);
    }
    parent.appendChild(gear);
    const equipHint = document.createElement("p");
    equipHint.textContent = "Click armor in the hotbar to equip it.";
    parent.appendChild(equipHint);
  }

  function appendHotbarPanel(title = "Hotbars") {
    const player = panel(title);
    renderPlayerInventory(player, (i, all, rowName) => {
      const slot = hotbarByName(rowName)[i];
      const def = slot ? ITEMS[slot.id] : null;
      if (def?.vest || def?.helmet) equipFromHotbar(i, null, rowName);
    });
    menuBody.appendChild(player);
  }

  function unequip(kind) {
    const stack = state.player[kind];
    if (!stack) return;
    if (!canAddPlayerItem(stack.id, 1, stack.meta)) {
      showToast("Inventory full");
      return;
    }
    addPlayerItem(stack.id, 1, stack.meta);
    state.player[kind] = null;
    recalcMaxHp();
    invalidateHud();
    renderCurrentMenu();
  }

  function moveFromMachineToPlayer(inv, i, all) {
    const slot = inv[i];
    if (!slot) return;
    const amount = all ? slot.count : 1;
    if (!canAddPlayerItem(slot.id, amount, slot.meta)) {
      showToast("Inventory full");
      return;
    }
    addPlayerItem(slot.id, amount, slot.meta);
    slot.count -= amount;
    if (slot.count <= 0) inv[i] = null;
    renderCurrentMenu();
  }

  function moveFromPlayerToInventory(i, inv, all, rowName = "main") {
    const row = hotbarByName(rowName);
    const slot = row[i];
    if (!slot) return;
    const def = ITEMS[slot.id];
    if (def?.vest || def?.helmet) {
      equipFromHotbar(i, null, rowName);
      return;
    }
    const amount = all ? slot.count : 1;
    if (!canAddToInventory(inv, slot.id, amount, slot.meta)) {
      showToast("Inventory full");
      return;
    }
    addToInventory(inv, slot.id, amount, slot.meta);
    slot.count -= amount;
    if (slot.count <= 0) row[i] = null;
    renderCurrentMenu();
  }

  function equipFromHotbar(i, requiredKind = null, rowName = "main") {
    const p = state.player;
    const row = hotbarByName(rowName);
    const slot = row[i];
    if (!slot) return;
    const def = ITEMS[slot.id];
    const kind = def.vest ? "vest" : def.helmet ? "helmet" : null;
    if (!kind || (requiredKind && kind !== requiredKind)) {
      showToast(requiredKind === "vest" ? "That slot needs a vest" : requiredKind === "helmet" ? "That slot needs a helmet" : "That item cannot be equipped");
      return false;
    }
    const tempHotbars = cloneHotbarRows();
    const rowIndex = rowName === "alt" ? 1 : 0;
    tempHotbars[rowIndex][i].count--;
    if (tempHotbars[rowIndex][i].count <= 0) tempHotbars[rowIndex][i] = null;
    const old = p[kind];
    if (old && !addToInventories(tempHotbars, old.id, 1, old.meta, { reserveHand: true, limit: visibleHotbarSlots() })) {
      showToast("Inventory full");
      return false;
    }
    assignPlayerHotbars(tempHotbars);
    p[kind] = cloneStack(slot);
    p[kind].count = 1;
    recalcMaxHp();
    invalidateHud();
    renderCurrentMenu();
    return true;
  }

  function moveGearToHotbar(kind, targetIndex, rowName = "main") {
    if (targetIndex <= 0 || targetIndex >= visibleHotbarSlots()) return false;
    const stack = state.player[kind];
    const row = hotbarByName(rowName);
    if (!stack) return false;
    if (row[targetIndex]) {
      showToast("Drop on an empty hotbar slot");
      return false;
    }
    row[targetIndex] = cloneStack(stack);
    state.player[kind] = null;
    recalcMaxHp();
    invalidateHud();
    renderCurrentMenu();
    return true;
  }

  function invalidateHud() {
    hudLayoutKey = "";
  }

  function moveFromPlayerToInput(i, machine, allowed, all, max = 99, rowName = "main") {
    const row = hotbarByName(rowName);
    const slot = row[i];
    if (!slot) return;
    if (!allowed.includes(slot.id)) {
      showToast("That item does not fit");
      return;
    }
    const amount = all ? slot.count : 1;
    const existing = machine.input?.id === slot.id ? machine.input.count : 0;
    if ((machine.input && machine.input.id !== slot.id) || existing + amount > max) {
      showToast("Input slot is full");
      return;
    }
    if (!machine.input) machine.input = { id: slot.id, count: 0, meta: slot.meta ? structuredClone(slot.meta) : undefined };
    machine.input.count += amount;
    slot.count -= amount;
    if (slot.count <= 0) row[i] = null;
    renderCurrentMenu();
  }

  function moveFromPlayerToFuel(i, machine, all, rowName = "main") {
    const row = hotbarByName(rowName);
    const slot = row[i];
    if (!slot || slot.id !== "meteorite_chunk") {
      showToast("Needs Meteorite Chunk");
      return;
    }
    const amount = all ? slot.count : 1;
    if (!machine.fuel) machine.fuel = { id: "meteorite_chunk", count: 0 };
    machine.fuel.count += amount;
    slot.count -= amount;
    if (slot.count <= 0) row[i] = null;
    renderCurrentMenu();
  }

  function moveFromPlayerToCharmingSlot(i, machine, rowName = "main") {
    const row = hotbarByName(rowName);
    const slot = row[i];
    if (!slot || !ITEMS[slot.id]?.toolTier || machine.slot) return;
    machine.slot = cloneStack(slot);
    row[i] = null;
    if (machine.slot.meta?.charm) {
      machine.slot.meta = {};
      addPlayerItem("tin_chunk", 5);
      showToast("Old charm refunded");
    }
    renderCurrentMenu();
  }

  function moveSingleStackToPlayer(machine, key, all) {
    const slot = machine[key];
    if (!slot) return false;
    const amount = all ? slot.count : 1;
    if (!canAddPlayerItem(slot.id, amount, slot.meta)) {
      showToast("Inventory full");
      return false;
    }
    addPlayerItem(slot.id, amount, slot.meta);
    slot.count -= amount;
    if (slot.count <= 0) machine[key] = null;
    return true;
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    drawBackground();
    if (state.world && state.player) {
      const zoom = currentZoom();
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-state.camera.x, -state.camera.y);
      drawWorld();
      drawParticles();
      drawLasers();
      drawDroids();
      drawPlayer();
      drawMiningProgress();
      drawLightingOverlay();
      ctx.restore();
      updateHud();
    }
  }

  function drawBackground() {
    const pY = state.player ? tileAtPixel(state.player.x, state.player.y).y : SURFACE_BASE;
    const spaceFade = smoothstep((130 - pY) / 86);
    const surfaceGrad = ctx.createLinearGradient(0, 0, 0, innerHeight);
    surfaceGrad.addColorStop(0, "#80c2e4");
    surfaceGrad.addColorStop(0.45, "#a9d2bc");
    surfaceGrad.addColorStop(1, "#5f7f58");
    ctx.fillStyle = surfaceGrad;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    if (spaceFade < 0.98) {
      ctx.globalAlpha = 1 - spaceFade;
      drawParallaxSurface();
      ctx.globalAlpha = 1;
    }
    if (spaceFade > 0.01) {
      const spaceGrad = ctx.createLinearGradient(0, 0, 0, innerHeight);
      spaceGrad.addColorStop(0, "#010207");
      spaceGrad.addColorStop(0.5, "#07101a");
      spaceGrad.addColorStop(1, "#172b42");
      ctx.globalAlpha = spaceFade;
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      for (let i = 0; i < 90; i++) {
        const x = (hash01(i, 1, state.seed) * innerWidth + state.time * (i % 3)) % innerWidth;
        const y = hash01(i, 2, state.seed) * innerHeight;
        ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
      }
      ctx.fillStyle = "rgba(104, 139, 170, 0.18)";
      for (let i = 0; i < 5; i++) {
        const x = (hash01(i, 22, state.seed) * innerWidth - state.camera.x * 0.04) % (innerWidth + 180);
        ctx.fillRect(x, 80 + i * 52, 86, 8);
        ctx.fillRect(x + 18, 72 + i * 52, 44, 8);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawParallaxSurface() {
    const offset1 = -(state.camera.x * 0.08) % 240;
    const offset2 = -(state.camera.x * 0.14) % 190;
    ctx.fillStyle = "rgba(83, 127, 116, 0.36)";
    drawHillLayer(offset1, innerHeight * 0.62, 240, 70);
    ctx.fillStyle = "rgba(56, 92, 82, 0.34)";
    drawHillLayer(offset2, innerHeight * 0.68, 190, 54);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    for (let i = 0; i < 5; i++) {
      const x = (i * 230 - state.camera.x * 0.05) % (innerWidth + 240);
      const y = 58 + (i % 3) * 28;
      ctx.fillRect(x, y, 54, 8);
      ctx.fillRect(x + 14, y - 8, 32, 8);
      ctx.fillRect(x + 42, y + 4, 36, 6);
    }
  }

  function drawHillLayer(offset, baseY, span, height) {
    ctx.beginPath();
    ctx.moveTo(-span, innerHeight);
    for (let x = -span; x <= innerWidth + span; x += span) {
      ctx.lineTo(x + offset, baseY);
      ctx.lineTo(x + offset + span / 2, baseY - height);
      ctx.lineTo(x + offset + span, baseY);
    }
    ctx.lineTo(innerWidth + span, innerHeight);
    ctx.closePath();
    ctx.fill();
  }

  function drawWorld() {
    const zoom = currentZoom();
    const startX = Math.max(0, Math.floor(state.camera.x / TILE_W) - 2);
    const endX = Math.min(WORLD_W, Math.ceil((state.camera.x + innerWidth / zoom) / TILE_W) + 2);
    const startY = Math.max(0, Math.floor(state.camera.y / TILE_H) - 2);
    const endY = Math.min(WORLD_H, Math.ceil((state.camera.y + innerHeight / zoom) / TILE_H) + 2);
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const id = getBlock(x, y);
        if (id !== B.AIR) drawBlock(id, x * TILE_W, y * TILE_H, x, y);
      }
    }
  }

  function oreIsHidden(id, tx, ty) {
    if (id !== B.TIN_ORE && id !== B.OBSIDIAN_ORE) return false;
    if (!state.player) return false;
    const px = (state.player.x + state.player.w / 2) / TILE_W;
    const py = (state.player.y + state.player.h / 2) / TILE_H;
    return Math.hypot(px - tx, py - ty) > 5.5;
  }

  function drawBlock(id, px, py, tx, ty) {
    const hiddenOre = oreIsHidden(id, tx, ty);
    const drawId = hiddenOre ? B.STONE : id;
    const block = BLOCKS[drawId];
    const base = block.color;
    ctx.save();
    drawMaterialBase(px, py, base, tx, ty);
    if (drawId === B.GRASS) drawGrassTexture(px, py, tx, ty);
    else if (drawId === B.DIRT) drawPebbles(px, py, tx, ty, "#5d3921", 7);
    else if (drawId === B.STONE || drawId === B.BEDROCK || drawId === B.METEOR_STONE) drawStoneTexture(px, py, tx, ty, drawId === B.BEDROCK);
    else if (drawId === B.LEAVES) drawLeafTexture(px, py, tx, ty);
    else if (drawId === B.WOOD) drawWoodTexture(px, py, tx, ty);
    else if (drawId === B.CACTUS) drawCactusTexture(px, py);
    else if (drawId === B.SANDSTONE) drawSandstoneTexture(px, py, tx, ty);
    else if (isLadder(drawId)) drawLadderTexture(drawId, px, py);
    else if (isWall(drawId)) drawWallTexture(drawId, px, py, tx, ty);
    else if ([B.STONE_BRICK, B.WOOD_BRICK, B.SANDSTONE_BRICK].includes(drawId)) drawBrickTexture(drawId, px, py);
    else if (block.group === "artifact") drawArtifactBlock(id, px, py, tx, ty);
    else if (block.group === "stone") drawStoneTexture(px, py, tx, ty, false);

    if (!hiddenOre && (id === B.TIN_ORE || id === B.OBSIDIAN_ORE || id === B.METEORITE_ORE)) drawOreSparkles(id, px, py, tx, ty);
    if (MACHINE_BLOCKS.has(id)) drawMachineFace(id, px, py);
    drawTileEdges(px, py);
    const depth = ty - (state.surface[tx] || SURFACE_BASE);
    if (depth > 18) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.45, depth / 190)})`;
      ctx.fillRect(px, py, TILE_W, TILE_H);
    }
    ctx.restore();
  }

  function drawMaterialBase(px, py, color, tx, ty) {
    ctx.fillStyle = color;
    ctx.fillRect(px, py, TILE_W, TILE_H);
    ctx.fillStyle = shadeColor(color, 26);
    ctx.fillRect(px, py, TILE_W, 3);
    ctx.fillStyle = shadeColor(color, -28);
    ctx.fillRect(px, py + TILE_H - 4, TILE_W, 4);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(px + 2, py + 2, TILE_W - 4, 1);
  }

  function drawTileEdges(px, py) {
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, TILE_W - 1, TILE_H - 1);
  }

  function drawGrassTexture(px, py, tx, ty) {
    ctx.fillStyle = "#67b84a";
    ctx.fillRect(px, py, TILE_W, 4);
    ctx.fillStyle = "#4f9d3b";
    for (let x = 0; x < TILE_W; x += 4) ctx.fillRect(px + x, py + 3, 2, 3);
    ctx.fillStyle = "#754a28";
    ctx.fillRect(px, py + 6, TILE_W, TILE_H - 6);
    drawPebbles(px, py + 6, tx, ty, "#54331d", 5);
  }

  function drawPebbles(px, py, tx, ty, color, count) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.42;
    const pattern = [[4, 3], [13, 7], [23, 4], [29, 10], [8, 11], [18, 12], [2, 8]];
    for (let i = 0; i < Math.min(count, pattern.length); i++) {
      const [sx, sy] = pattern[(i + tx + ty) % pattern.length];
      ctx.fillRect(px + sx, py + sy % Math.max(3, TILE_H - 2), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawStoneTexture(px, py, tx, ty, bedrock) {
    ctx.fillStyle = bedrock ? "rgba(0,0,0,0.24)" : "rgba(0,0,0,0.12)";
    ctx.fillRect(px + 3, py + 5, 8, 2);
    ctx.fillRect(px + 15, py + 3, 12, 2);
    ctx.fillRect(px + 9, py + 11, 13, 2);
    ctx.fillStyle = bedrock ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.11)";
    ctx.fillRect(px + 4, py + 4, 7, 1);
    ctx.fillRect(px + 16, py + 2, 10, 1);
    if (bedrock) {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      for (let i = 0; i < 4; i++) ctx.fillRect(px + i * 8, py, 2, TILE_H);
    }
  }

  function drawLeafTexture(px, py, tx, ty) {
    ctx.fillStyle = "#34783d";
    ctx.fillRect(px, py, TILE_W, TILE_H);
    ctx.fillStyle = "#469b4a";
    ctx.fillRect(px + 2, py + 2, 8, 4);
    ctx.fillRect(px + 12, py + 5, 9, 4);
    ctx.fillRect(px + 22, py + 2, 7, 5);
    ctx.fillStyle = "#69bd5a";
    ctx.fillRect(px + 6, py + 3, 4, 2);
    ctx.fillRect(px + 17, py + 6, 4, 2);
  }

  function drawWoodTexture(px, py, tx, ty) {
    ctx.fillStyle = "#6d3f1e";
    ctx.fillRect(px + 5, py, 4, TILE_H);
    ctx.fillRect(px + 16, py, 3, TILE_H);
    ctx.fillRect(px + 25, py, 2, TILE_H);
    ctx.fillStyle = "#a8662d";
    ctx.fillRect(px + 9, py + 3, 7, 2);
    ctx.fillRect(px + 18, py + 10, 7, 2);
    ctx.fillStyle = "#4b2a14";
    ctx.fillRect(px + 10, py + 7, 9, 2);
  }

  function drawCactusTexture(px, py) {
    ctx.fillStyle = "#2f734d";
    ctx.fillRect(px + 5, py, 3, TILE_H);
    ctx.fillRect(px + 16, py, 3, TILE_H);
    ctx.fillStyle = "#bfe6b0";
    ctx.fillRect(px + 9, py + 3, 1, 2);
    ctx.fillRect(px + 23, py + 9, 1, 2);
  }

  function drawSandstoneTexture(px, py, tx, ty) {
    ctx.fillStyle = "rgba(96,67,29,0.22)";
    ctx.fillRect(px + 3, py + 4, 12, 2);
    ctx.fillRect(px + 18, py + 8, 11, 2);
    ctx.fillRect(px + 7, py + 12, 17, 2);
    ctx.fillStyle = "rgba(255,235,158,0.18)";
    ctx.fillRect(px + 4, py + 3, 10, 1);
    ctx.fillRect(px + 18, py + 7, 9, 1);
    drawPebbles(px, py, tx, ty, "#8c6a34", 5);
  }

  function drawBrickTexture(id, px, py) {
    drawMortar(px, py);
    ctx.fillStyle = id === B.WOOD_BRICK ? "rgba(79,43,18,0.22)" : "rgba(0,0,0,0.13)";
    ctx.fillRect(px + 1, py + 8, TILE_W - 2, 1);
  }

  function drawWallTexture(id, px, py, tx, ty) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    if (id === B.WOOD_WALL) drawWoodTexture(px, py, tx, ty);
    else if (id === B.SANDSTONE_WALL) drawSandstoneTexture(px, py, tx, ty);
    else drawStoneTexture(px, py, tx, ty, false);
    drawMortar(px, py);
    ctx.strokeStyle = "rgba(0,0,0,0.26)";
    ctx.beginPath();
    ctx.moveTo(px + 2, py + TILE_H - 1);
    ctx.lineTo(px + TILE_W - 2, py + 1);
    ctx.stroke();
    ctx.restore();
  }

  function drawLadderTexture(id, px, py) {
    const rail = id === B.LADDER_STONE ? "#d0d0c8" : "#d49b51";
    const shade = id === B.LADDER_STONE ? "#777c78" : "#70461f";
    ctx.fillStyle = shade;
    ctx.fillRect(px + 7, py, 5, TILE_H);
    ctx.fillRect(px + 20, py, 5, TILE_H);
    ctx.fillStyle = rail;
    ctx.fillRect(px + 8, py, 3, TILE_H);
    ctx.fillRect(px + 21, py, 3, TILE_H);
    for (const y of [4, 11]) {
      ctx.fillStyle = shade;
      ctx.fillRect(px + 8, py + y + 1, 17, 2);
      ctx.fillStyle = rail;
      ctx.fillRect(px + 8, py + y, 16, 3);
    }
  }

  function drawOreSparkles(id, px, py, tx, ty) {
    ctx.fillStyle = id === B.TIN_ORE ? "#dce9e8" : id === B.OBSIDIAN_ORE ? "#b17add" : "#1f2228";
    for (let i = 0; i < 5; i++) {
      const sx = px + 4 + hash01(tx + i, ty, state.seed) * 23;
      const sy = py + 3 + hash01(tx, ty + i, state.seed) * 9;
      ctx.fillRect(sx, sy, 3, 2);
    }
  }

  function drawArtifactBlock(id, px, py) {
    const color = BLOCKS[id].color;
    ctx.fillStyle = shadeColor(color, -25);
    ctx.fillRect(px + 5, py + 2, 22, 12);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 2);
    ctx.lineTo(px + 26, py + 8);
    ctx.lineTo(px + 16, py + 15);
    ctx.lineTo(px + 6, py + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shadeColor(color, 45);
    ctx.fillRect(px + 14, py + 6, 4, 5);
  }

  function drawMortar(px, py) {
    ctx.strokeStyle = "rgba(20,20,20,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + 8);
    ctx.lineTo(px + TILE_W, py + 8);
    ctx.moveTo(px + 10, py);
    ctx.lineTo(px + 10, py + 8);
    ctx.moveTo(px + 22, py + 8);
    ctx.lineTo(px + 22, py + TILE_H);
    ctx.stroke();
  }

  function drawMachineFace(id, px, py) {
    const base = BLOCKS[id].color;
    const dark = shadeColor(base, -45);
    const light = shadeColor(base, 38);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(px + 3, py + 12, 26, 3);

    if (id === B.TABLE) {
      ctx.fillStyle = "#5a361c";
      ctx.fillRect(px + 7, py + 6, 18, 3);
      ctx.fillRect(px + 9, py + 9, 3, 5);
      ctx.fillRect(px + 21, py + 9, 3, 5);
      ctx.fillStyle = "#c0843d";
      ctx.fillRect(px + 6, py + 4, 20, 4);
      ctx.fillRect(px + 10, py + 3, 5, 1);
      ctx.fillRect(px + 18, py + 3, 5, 1);
    } else if (id === B.ADV_TABLE) {
      ctx.fillStyle = dark;
      ctx.fillRect(px + 5, py + 5, 22, 8);
      ctx.fillStyle = "#5fc7d2";
      ctx.fillRect(px + 8, py + 6, 5, 2);
      ctx.fillRect(px + 15, py + 8, 5, 2);
      ctx.fillRect(px + 22, py + 6, 3, 5);
      ctx.fillStyle = light;
      ctx.fillRect(px + 7, py + 4, 18, 2);
    } else if (id === B.CAMPFIRE) {
      ctx.fillStyle = "#5a351c";
      ctx.fillRect(px + 7, py + 11, 18, 3);
      ctx.fillRect(px + 10, py + 9, 13, 3);
      ctx.fillStyle = "#ffcd57";
      ctx.fillRect(px + 14, py + 4, 4, 7);
      ctx.fillStyle = "#f26b2f";
      ctx.fillRect(px + 11, py + 7, 4, 5);
      ctx.fillRect(px + 18, py + 7, 4, 5);
    } else if (id === B.SMELTER) {
      ctx.fillStyle = "#25282b";
      ctx.fillRect(px + 6, py + 3, 20, 11);
      ctx.fillStyle = "#6c7173";
      ctx.fillRect(px + 8, py + 4, 16, 2);
      ctx.fillStyle = "#f17731";
      ctx.fillRect(px + 11, py + 8, 10, 5);
      ctx.fillStyle = "#ffd46a";
      ctx.fillRect(px + 14, py + 9, 4, 3);
    } else if (id === B.WOOD_PROCESSOR) {
      ctx.fillStyle = "#3d3020";
      ctx.fillRect(px + 5, py + 4, 22, 10);
      ctx.fillStyle = "#d7d1ba";
      ctx.fillRect(px + 12, py + 5, 8, 8);
      ctx.fillStyle = "#4b4e51";
      ctx.fillRect(px + 15, py + 4, 2, 10);
      ctx.fillRect(px + 11, py + 8, 10, 2);
    } else if (id === B.EXCAVATOR) {
      ctx.fillStyle = "#242b31";
      ctx.fillRect(px + 5, py + 5, 22, 8);
      ctx.fillStyle = "#b8c3c7";
      ctx.beginPath();
      ctx.moveTo(px + 11, py + 4);
      ctx.lineTo(px + 23, py + 8);
      ctx.lineTo(px + 11, py + 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#5bc4d3";
      ctx.fillRect(px + 8, py + 7, 4, 3);
    } else if (id === B.BIN) {
      ctx.fillStyle = "#20282d";
      ctx.fillRect(px + 7, py + 5, 18, 9);
      ctx.fillStyle = "#91a5ac";
      ctx.fillRect(px + 6, py + 3, 20, 3);
      ctx.fillStyle = "#0e1316";
      ctx.fillRect(px + 10, py + 7, 12, 3);
    } else if (id === B.GROW_PODIUM || id === B.GROW_COLLECTOR) {
      ctx.fillStyle = dark;
      ctx.fillRect(px + 6, py + 8, 20, 6);
      ctx.fillStyle = "#68bd58";
      ctx.fillRect(px + 14, py + 4, 4, 7);
      ctx.fillRect(px + 10, py + 6, 5, 3);
      ctx.fillRect(px + 18, py + 6, 5, 3);
      if (id === B.GROW_COLLECTOR) {
        ctx.fillStyle = "#d7d1ba";
        ctx.fillRect(px + 23, py + 4, 3, 9);
      }
    } else if (id === B.METEOR_PODIUM || id === B.METEOR_COLLECTOR) {
      ctx.fillStyle = "#25272f";
      ctx.fillRect(px + 6, py + 8, 20, 6);
      ctx.fillStyle = "#8e73d8";
      ctx.fillRect(px + 14, py + 4, 4, 4);
      ctx.fillRect(px + 12, py + 6, 8, 2);
      if (id === B.METEOR_COLLECTOR) {
        ctx.strokeStyle = "#c6d6e0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + 16, py + 8, 8, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
    } else if (id === B.UPGRADE_TABLE) {
      ctx.fillStyle = dark;
      ctx.fillRect(px + 6, py + 5, 20, 8);
      ctx.fillStyle = "#ffd262";
      ctx.fillRect(px + 15, py + 4, 3, 8);
      ctx.fillRect(px + 12, py + 6, 9, 3);
      ctx.fillStyle = light;
      ctx.fillRect(px + 8, py + 4, 5, 2);
    } else if (id === B.GUIDE) {
      ctx.fillStyle = "#d4b06d";
      ctx.fillRect(px + 8, py + 4, 16, 9);
      ctx.fillStyle = "#314047";
      ctx.fillRect(px + 11, py + 6, 8, 2);
      ctx.fillRect(px + 17, py + 8, 3, 2);
      ctx.fillStyle = "#5a351c";
      ctx.fillRect(px + 15, py + 13, 3, 2);
    } else if (id === B.CHARMING_TABLE) {
      ctx.fillStyle = dark;
      ctx.fillRect(px + 5, py + 7, 22, 7);
      ctx.fillStyle = "#be80e8";
      ctx.fillRect(px + 14, py + 3, 4, 8);
      ctx.fillRect(px + 11, py + 6, 10, 3);
      ctx.fillStyle = "#fff0ff";
      ctx.fillRect(px + 15, py + 4, 2, 2);
    } else if (id === B.ARTIFACT_TABLE) {
      ctx.fillStyle = dark;
      ctx.fillRect(px + 5, py + 7, 22, 7);
      ctx.fillStyle = "#59eb7f";
      ctx.fillRect(px + 10, py + 5, 4, 5);
      ctx.fillStyle = "#42bee0";
      ctx.fillRect(px + 15, py + 4, 4, 6);
      ctx.fillStyle = "#9d7dff";
      ctx.fillRect(px + 20, py + 5, 4, 5);
    } else if (id === B.GRAVITY_MANIP) {
      ctx.fillStyle = dark;
      ctx.fillRect(px + 5, py + 4, 22, 10);
      ctx.strokeStyle = "#b69cff";
      ctx.lineWidth = 1;
      for (let r = 3; r <= 8; r += 3) {
        ctx.beginPath();
        ctx.arc(px + 16, py + 9, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (id === B.TURRET) {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(px + 5, py + 3, 22, 10);
      ctx.fillStyle = light;
      ctx.fillRect(px + 7, py + 4, 18, 2);
      ctx.fillStyle = "#dbe5d2";
      ctx.fillRect(px + 13, py + 6, 6, 4);
      ctx.fillStyle = "#2a3034";
      ctx.fillRect(px + 13, py - 3, 6, 8);
      ctx.fillRect(px + 19, py - 1, 10, 3);
    } else if (id === B.PORTAL) {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(px + 5, py + 3, 22, 10);
      ctx.fillStyle = "#67d7ff";
      ctx.fillRect(px + 13, py + 6, 6, 4);
      ctx.strokeStyle = "#7af4ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 8, 8, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (id === B.CHEST) {
      ctx.fillStyle = "#5a351c";
      ctx.fillRect(px + 5, py + 5, 22, 9);
      ctx.fillStyle = "#b97932";
      ctx.fillRect(px + 6, py + 4, 20, 4);
      ctx.fillStyle = "#f0c15c";
      ctx.fillRect(px + 15, py + 8, 4, 4);
      ctx.fillStyle = "#2a1d13";
      ctx.fillRect(px + 6, py + 9, 20, 2);
    } else {
      const glow = BLOCKS[id].light ? "#ffb24f" : "#dbe5d2";
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(px + 5, py + 3, 22, 10);
      ctx.fillStyle = light;
      ctx.fillRect(px + 7, py + 4, 18, 2);
      ctx.fillStyle = glow;
      ctx.fillRect(px + 13, py + 6, 6, 4);
    }
  }

  function drawPlayer() {
    const p = state.player;
    const moving = Math.abs(p.vx) > 12 && p.grounded;
    const bob = moving ? Math.sin(p.walkTime) * 1.4 : 0;
    const legSwing = moving ? Math.sin(p.walkTime) * 3 : 0;
    const mining = !!state.mining && mouse.left;
    const armSwing = mining ? Math.sin(state.time * 24) * 5 : Math.sin(p.walkTime) * 1.2;
    const hurtFlash = (p.hurtTimer || 0) > 0 && Math.floor(p.hurtTimer * 32) % 2 === 0;
    const skin = hurtFlash ? "#ffdfcf" : "#d7a36f";
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(p.x + 1, p.y + p.h - 2, p.w - 2, 3);
    ctx.fillStyle = "#202b35";
    ctx.fillRect(p.x + 3 - Math.max(0, legSwing), p.y + 28 + bob, 5, 11);
    ctx.fillRect(p.x + 12 + Math.max(0, legSwing), p.y + 28 - bob * 0.3, 5, 11);
    ctx.fillStyle = "#37586a";
    ctx.fillRect(p.x + 1, p.y + 14 + bob, p.w - 2, 16);
    ctx.fillStyle = "#203744";
    ctx.fillRect(p.x + 3, p.y + 27 + bob, p.w - 6, 5);
    ctx.fillStyle = skin;
    ctx.fillRect(p.x + 2, p.y + 2 + bob, p.w - 4, 13);
    ctx.fillStyle = "#4b2d1c";
    ctx.fillRect(p.x + 2, p.y + bob, p.w - 4, 4);
    ctx.fillStyle = "#243845";
    const frontArmX = p.facing > 0 ? p.x + p.w - 1 : p.x - 3;
    const backArmX = p.facing > 0 ? p.x - 2 : p.x + p.w - 1;
    ctx.fillRect(backArmX, p.y + 17 + bob - armSwing * 0.15, 4, 11);
    ctx.fillRect(frontArmX, p.y + 17 + bob + armSwing * 0.35, 4, 12);
    if (mining) {
      ctx.fillStyle = "#79512b";
      const toolX = p.facing > 0 ? p.x + p.w + 2 : p.x - 9;
      ctx.fillRect(toolX, p.y + 15 + bob + armSwing * 0.35, 7, 3);
      ctx.fillStyle = "#c9d0d2";
      ctx.fillRect(toolX + (p.facing > 0 ? 6 : -2), p.y + 13 + bob + armSwing * 0.35, 4, 6);
    }
    ctx.fillStyle = "#11171b";
    const eyeX = p.facing > 0 ? p.x + p.w - 7 : p.x + 5;
    ctx.fillRect(eyeX, p.y + 5 + bob, 3, 2);
    if (p.vest) {
      ctx.fillStyle = ITEMS[p.vest.id].color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(p.x + 2, p.y + 16 + bob, p.w - 4, 12);
      ctx.fillStyle = shadeColor(ITEMS[p.vest.id].color, -35);
      ctx.fillRect(p.x + 9, p.y + 16 + bob, 2, 12);
      ctx.globalAlpha = 1;
    }
    if (p.helmet) {
      ctx.fillStyle = ITEMS[p.helmet.id].color;
      ctx.fillRect(p.x + 1, p.y - 2 + bob, p.w - 2, 6);
      ctx.fillStyle = shadeColor(ITEMS[p.helmet.id].color, -35);
      ctx.fillRect(p.x + 3, p.y + 3 + bob, p.w - 6, 2);
    }
    if (hurtFlash) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(p.x - 1, p.y + bob, p.w + 2, p.h);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.32)";
    ctx.strokeRect(p.x + 0.5, p.y + 2 + bob, p.w - 1, p.h - 3);
  }

  function drawDroids() {
    for (const d of state.droids) {
      if (d.trail?.length) {
        for (let i = d.trail.length - 1; i >= 0; i--) {
          const t = d.trail[i];
          ctx.globalAlpha = Math.max(0, t.life / 0.45) * (0.08 + (1 - i / d.trail.length) * 0.18);
          ctx.fillStyle = "#63ff7d";
          ctx.fillRect(t.x - 6, t.y - 4, 12, 8);
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "rgba(0,0,0,0.26)";
      ctx.fillRect(d.x + 2, d.y + d.h - 1, d.w - 4, 3);
      ctx.fillStyle = "#313b43";
      ctx.fillRect(d.x + 3, d.y + 6, d.w - 6, d.h - 8);
      ctx.fillStyle = "#69757d";
      ctx.fillRect(d.x + 5, d.y + 3, d.w - 10, 7);
      ctx.fillRect(d.x + 7, d.y + 14, d.w - 14, 7);
      ctx.fillStyle = "#151b20";
      ctx.fillRect(d.x + 6, d.y + 10, d.w - 12, 4);
      ctx.fillStyle = "#65ff77";
      ctx.fillRect(d.x + 8, d.y + 11, d.w - 16, 2);
      ctx.fillStyle = "#9fb0b7";
      ctx.fillRect(d.x + 2, d.y + 12, 4, 6);
      ctx.fillRect(d.x + d.w - 6, d.y + 12, 4, 6);
      ctx.fillStyle = "#65ff77";
      ctx.fillRect(d.x + 5, d.y + d.h - 3, 4, 2);
      ctx.fillRect(d.x + d.w - 9, d.y + d.h - 3, 4, 2);
      ctx.fillStyle = "#d44";
      ctx.fillRect(d.x + 1, d.y - 5, (d.w - 2) * Math.max(0, d.hp / 10), 2);
    }
  }

  function drawLasers() {
    ctx.lineWidth = 3;
    for (const l of state.lasers) {
      ctx.strokeStyle = l.from === "droid" ? "#5eff6c" : "#8dfcff";
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - l.vx * 0.035, l.y - l.vy * 0.035);
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawMiningProgress() {
    const m = state.mining;
    if (!m) return;
    const pct = Math.max(0, Math.min(1, m.progress / m.duration));
    drawCracks(m.x * TILE_W, m.y * TILE_H, pct);
  }

  function drawCracks(px, py, pct) {
    if (pct <= 0.05) return;
    ctx.strokeStyle = `rgba(20, 17, 14, ${0.35 + pct * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 4);
    ctx.lineTo(px + 14, py + 8);
    if (pct > 0.35) {
      ctx.moveTo(px + 18, py + 3);
      ctx.lineTo(px + 15, py + 9);
      ctx.lineTo(px + 21, py + 13);
    }
    if (pct > 0.68) {
      ctx.moveTo(px + 7, py + 12);
      ctx.lineTo(px + 13, py + 9);
      ctx.lineTo(px + 11, py + 15);
      ctx.moveTo(px + 23, py + 6);
      ctx.lineTo(px + 27, py + 11);
    }
    ctx.stroke();
  }

  function drawLightingOverlay() {
    const p = state.player;
    const tile = tileAtPixel(p.x + p.w / 2, p.y + p.h / 2);
    const depth = tile.y - (state.surface[tile.x] || SURFACE_BASE);
    const space = tile.y < SPACE_Y;
    const darkness = space ? 0.22 : Math.max(0, Math.min(0.58, (depth - 8) / 95));
    if (darkness <= 0.02) return;
    const zoom = currentZoom();
    const viewW = innerWidth / zoom;
    const viewH = innerHeight / zoom;
    const x0 = state.camera.x;
    const y0 = state.camera.y;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    ctx.fillRect(x0, y0, viewW, viewH);
    ctx.globalCompositeOperation = "lighter";
    drawGlow(p.x + p.w / 2, p.y + p.h / 2, 115, "rgba(118,166,170,0.13)");
    const startX = Math.max(0, Math.floor(x0 / TILE_W) - 2);
    const endX = Math.min(WORLD_W, Math.ceil((x0 + viewW) / TILE_W) + 2);
    const startY = Math.max(0, Math.floor(y0 / TILE_H) - 2);
    const endY = Math.min(WORLD_H, Math.ceil((y0 + viewH) / TILE_H) + 2);
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const id = getBlock(x, y);
        if (BLOCKS[id]?.light || id === B.PORTAL || id === B.ARTIFACT_TABLE || id === B.GRAVITY_MANIP) {
          drawGlow(x * TILE_W + TILE_W / 2, y * TILE_H + TILE_H / 2, BLOCKS[id]?.light ? 150 : 85, BLOCKS[id]?.light ? "rgba(255,170,70,0.18)" : "rgba(100,180,255,0.14)");
        }
      }
    }
    for (const l of state.lasers) drawGlow(l.x, l.y, 55, l.from === "droid" ? "rgba(100,255,120,0.16)" : "rgba(120,240,255,0.16)");
    ctx.restore();
  }

  function drawGlow(x, y, radius, color) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function stackSignature(stack) {
    if (!stack) return "";
    return `${stack.id}:${stack.count}:${stack.meta ? JSON.stringify(stack.meta) : ""}`;
  }

  function dragDataFromEvent(evt) {
    if (dragPayload) return dragPayload;
    try {
      const raw = evt.dataTransfer?.getData("text/plain");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function beginSlotDrag(evt, payload) {
    dragPayload = payload;
    evt.dataTransfer.effectAllowed = "move";
    const safePayload = {
      source: payload.source,
      row: payload.row,
      index: payload.index,
      kind: payload.kind,
      key: payload.key
    };
    evt.dataTransfer.setData("text/plain", JSON.stringify(safePayload));
  }

  function endSlotDrag() {
    dragPayload = null;
    document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
  }

  function hotbarByName(rowName) {
    return rowName === "alt" ? state.player.altHotbar : state.player.hotbar;
  }

  function canMergeStacks(a, b) {
    if (!a || !b || a.id !== b.id || a.meta || b.meta || !isStackable(a.id)) return false;
    return b.count < (ITEMS[b.id]?.max || 99);
  }

  function moveHotbarStack(sourceRow, sourceIndex, targetRow, targetIndex) {
    if (sourceIndex <= 0 || targetIndex <= 0 || sourceIndex >= visibleHotbarSlots() || targetIndex >= visibleHotbarSlots()) return false;
    const from = hotbarByName(sourceRow);
    const to = hotbarByName(targetRow);
    if (!from?.[sourceIndex]) return false;
    if (from === to && sourceIndex === targetIndex) return false;
    const moving = from[sourceIndex];
    const held = to[targetIndex];
    if (canMergeStacks(moving, held)) {
      const max = ITEMS[held.id]?.max || 99;
      const amount = Math.min(moving.count, max - held.count);
      held.count += amount;
      moving.count -= amount;
      if (moving.count <= 0) from[sourceIndex] = null;
      normalizeHotbar();
      invalidateHud();
      renderCurrentMenu();
      return true;
    }
    if (held?.id === moving.id && isStackable(moving.id) && !held.meta && !moving.meta) return false;
    to[targetIndex] = from[sourceIndex];
    from[sourceIndex] = held || null;
    normalizeHotbar();
    invalidateHud();
    renderCurrentMenu();
    return true;
  }

  function canDropGearPayload(payload, kind) {
    if (!payload || payload.source !== "hotbar") return false;
    const row = hotbarByName(payload.row);
    const stack = row?.[payload.index];
    if (!stack) return false;
    const item = ITEMS[stack.id];
    return kind === "vest" ? !!item?.vest : !!item?.helmet;
  }

  function renderHotbarRow(container, row, visible, rowName, active, startIndex = 0) {
    const p = state.player;
    container.innerHTML = "";
    for (let i = 0; i < startIndex; i++) {
      const spacer = document.createElement("div");
      spacer.className = "hotbar-spacer";
      spacer.setAttribute("aria-hidden", "true");
      container.appendChild(spacer);
    }
    for (let i = startIndex; i < visible; i++) {
      const stack = i === 0 ? null : row[i];
      const slot = document.createElement("div");
      slot.className = `slot${active && i === p.selected ? " selected" : ""}`;
      slot.dataset.hotbarIndex = String(i);
      slot.dataset.hotbarRow = rowName;
      const key = active ? (i === 9 ? 0 : i + 1) : "";
      const iconId = i === 0 ? "hand_display" : stack?.id || null;
      const name = i === 0 ? "Hand" : stack ? itemName(stack.id) : "Empty";
      slot.title = active ? name : `Upper: ${name}`;
      slot.innerHTML = `<div class="slot-key">${key}</div>${iconId ? itemIconMarkup(iconId) : `<div class="item-icon"></div>`}<div class="slot-name">${name}</div>${stack && stack.count > 1 ? `<div class="slot-count">${stack.count}</div>` : ""}`;
      slot.addEventListener("click", () => {
        if (active && i < visible) p.selected = i;
      });
      if (stack && i > 0) {
        slot.draggable = true;
        slot.addEventListener("dragstart", evt => beginSlotDrag(evt, { source: "hotbar", row: rowName, index: i }));
        slot.addEventListener("dragend", endSlotDrag);
      }
      slot.addEventListener("dragover", evt => {
        const payload = dragDataFromEvent(evt);
        if ((payload?.source === "hotbar" && i > 0) || (payload?.source === "gear" && i > 0 && !row[i])) {
          evt.preventDefault();
          slot.classList.add("drag-over");
        }
      });
      slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
      slot.addEventListener("drop", evt => {
        const payload = dragDataFromEvent(evt);
        slot.classList.remove("drag-over");
        if (payload?.source === "hotbar") {
          evt.preventDefault();
          moveHotbarStack(payload.row, payload.index, rowName, i);
        } else if (payload?.source === "gear") {
          evt.preventDefault();
          moveGearToHotbar(payload.kind, i, rowName);
        }
        endSlotDrag();
      });
      container.appendChild(slot);
    }
  }

  function renderHotbarAndGear(visible) {
    renderHotbarRow(hotbarTopEl, state.player.altHotbar, visible, "alt", false, 1);
    renderHotbarRow(hotbarEl, state.player.hotbar, visible, "main", true);
    gearSlotsEl.innerHTML = "";
    const p = state.player;

    for (const [kind, label] of [["helmet", "Helmet"], ["vest", "Vest"]]) {
      const stack = p[kind];
      const slot = document.createElement("div");
      slot.className = "slot gear-slot";
      slot.dataset.gearKind = kind;
      slot.title = stack ? `${label}: ${itemName(stack.id)}` : `${label}: Empty`;
      slot.innerHTML = `<div class="slot-key">${label}</div>${stack ? itemIconMarkup(stack.id) : `<div class="item-icon"></div>`}<div class="slot-name">${stack ? itemName(stack.id) : "Empty"}</div>`;
      slot.addEventListener("click", () => {
        if (stack) unequip(kind);
      });
      if (stack) {
        slot.draggable = true;
        slot.addEventListener("dragstart", evt => beginSlotDrag(evt, { source: "gear", kind }));
        slot.addEventListener("dragend", endSlotDrag);
      }
      slot.addEventListener("dragover", evt => {
        const payload = dragDataFromEvent(evt);
        if (canDropGearPayload(payload, kind)) {
          evt.preventDefault();
          slot.classList.add("drag-over");
        }
      });
      slot.addEventListener("dragleave", () => slot.classList.remove("drag-over"));
      slot.addEventListener("drop", evt => {
        const payload = dragDataFromEvent(evt);
        slot.classList.remove("drag-over");
        if (canDropGearPayload(payload, kind)) {
          evt.preventDefault();
          equipFromHotbar(payload.index, kind, payload.row);
        }
        endSlotDrag();
      });
      gearSlotsEl.appendChild(slot);
    }
  }

  function updateHud() {
    const p = state.player;
    healthFill.style.width = `${Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100))}%`;
    healthText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    const tile = tileAtPixel(p.x + p.w / 2, p.y + p.h / 2);
    infoPanel.innerHTML = `<span>X ${tile.x}</span><span>Y ${tile.y}</span>`;
    const visible = visibleHotbarSlots();
    const nextKey = [
      visible,
      p.selected,
      ...p.hotbar.slice(0, visible).map(stackSignature),
      ...p.altHotbar.slice(0, visible).map(stackSignature),
      stackSignature(p.vest),
      stackSignature(p.helmet)
    ].join("|");
    if (nextKey !== hudLayoutKey) {
      hudLayoutKey = nextKey;
      renderHotbarAndGear(visible);
    }
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
