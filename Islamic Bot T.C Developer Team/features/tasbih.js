const fs = require("fs");
const path = require("path");
const config = require("../config.json");

const tasbihPath = path.join(__dirname, "../data/tasbih.json");

function loadTasbih() {
  try {
    const data = fs.readFileSync(tasbihPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading tasbih.json:", error);
    return [];
  }
}

let tasbihIndex = 0;
const tasbihs = loadTasbih();

console.log(`Loaded ${tasbihs.length} tasbihs from tasbih.json`);

function getRandomTasbih() {
  if (tasbihs.length === 0) {
    console.log("⚠️ No tasbihs available!");
    return null;
  }
  const tasbih = tasbihs[tasbihIndex];
  tasbihIndex = (tasbihIndex + 1) % tasbihs.length;
  console.log(`Selected tasbih: ${tasbih} (index: ${tasbihIndex})`);
  return tasbih;
}

function getTasbihStatus() {
  const tasbih = getRandomTasbih();
  if (!tasbih) return null;
  const emoji = config.tasbihEmoji || "🕌";
  const status = `${emoji} ${tasbih}`;
  console.log(`Generated status: ${status}`);
  return status;
}

module.exports = {
  getTasbihStatus
};
