const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const duaaPath = path.join(__dirname, "../data/duaa.json");

function loadDuaa() {
  try {
    const data = fs.readFileSync(duaaPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading duaa.json:", error);
    return [];
  }
}

const duaas = loadDuaa();
const sentDuaas = new Set();

function getRandomDuaa() {
  if (duaas.length === 0) return null;

  if (sentDuaas.size >= duaas.length) {
    sentDuaas.clear();
  }

  let duaa;
  do {
    const randomIndex = Math.floor(Math.random() * duaas.length);
    duaa = duaas[randomIndex];
  } while (sentDuaas.has(duaa));

  sentDuaas.add(duaa);
  return duaa;
}

module.exports = {
  getRandomDuaa,
  getDuaaEmbed: (lang = "ar") => {
    const duaa = getRandomDuaa();
    if (!duaa) return null;

    const embed = new EmbedBuilder()
      .setTitle(lang === "ar" ? "ذكر من الأذكار" : "Dhikr from Adhkar")
      .setDescription(`**${duaa}**`)
      .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
      .setColor(0xFFFFFF)
      .setFooter({ text: "• Powered By Thailand Codes" });

    return embed;
  }
};
