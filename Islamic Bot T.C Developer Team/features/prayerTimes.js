const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports.getPrayerTimes = async ({ city, country }, lang) => {
  const res = await axios.get("https://api.aladhan.com/v1/timingsByCity", {
    params: { city, country, method: 5 }
  });

  const t = res.data.data.timings;

  const description = lang === "ar"
    ? [
        `توقيت صلاة الفجر: ${t.Fajr}`,
        `توقيت صلاة الظهر: ${t.Dhuhr}`,
        `توقيت صلاة العصر: ${t.Asr}`,
        `توقيت صلاة المغرب: ${t.Maghrib}`,
        `توقيت صلاة العشاء: ${t.Isha}`
      ].join("\n")
    : [
        `Fajr: ${t.Fajr}`,
        `Dhuhr: ${t.Dhuhr}`,
        `Asr: ${t.Asr}`,
        `Maghrib: ${t.Maghrib}`,
        `Isha: ${t.Isha}`
      ].join("\n");

  const embed = new EmbedBuilder()
    .setTitle(lang === "ar"
      ? `توقيت الصلاة بدولتك — ${city}`
      : `Prayer times in your country — ${city}`
    )
    .setDescription(description)
    .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
    .setColor(0xFFFFFF)
    .setFooter({ text: "• Powered By Thailand Codes" });

  return embed;
};
