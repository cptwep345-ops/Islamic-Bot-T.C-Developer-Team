const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  AttachmentBuilder 
} = require("discord.js");

module.exports.khatmMenu = (lang) => {
  const embed = new EmbedBuilder()
    .setTitle(lang === "ar" ? "ختم القرأن الكريم" : "Seal of the Holy Quran")
    .setDescription(lang === "ar" ? "اختر عدد الختمات" : "Choose the number of seals.")
    .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
    .setColor(0xFFFFFF)
    .setFooter({ text: "• Powered By Thailand Codes" });

  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("khatm_select")
        .setPlaceholder(lang === "ar" ? "اختر عدد الختمات" : "Select number")
        .addOptions([
          { label: lang === "ar" ? "ختم مرة واحدة" : "Once", value: "1" },
          { label: lang === "ar" ? "ختم مرتين" : "Twice", value: "2" },
          { label: lang === "ar" ? "ختم ثلاث مرات" : "Three times", value: "3" },
          { label: lang === "ar" ? "ختم أربع مرات" : "Four times", value: "4" },
          { label: lang === "ar" ? "ختم خمس مرات" : "Five times", value: "5" },
          { label: lang === "ar" ? "ختم ست مرات" : "Six times", value: "6" },
          { label: lang === "ar" ? "ختم سبع مرات" : "Seven times", value: "7" },
          { label: lang === "ar" ? "ختم ثمان مرات" : "Eight times", value: "8" },
          { label: lang === "ar" ? "ختم تسع مرات" : "Nine times", value: "9" },
          { label: lang === "ar" ? "الجدول كامل" : "Full Photo", value: "10" },
        ])
    );

  return { embeds: [embed], components: [row], ephemeral: true };
};

module.exports.khatmResult = (value, lang) => {
  const langFolder = lang === "ar" ? "ar" : "en";
  const filePath = `./assets/10tm/${langFolder}/${value}.png`;

  const file = new AttachmentBuilder(filePath, {
    name: `${value}.png`,
  });

  const embed = new EmbedBuilder()
    .setTitle(
      lang === "ar"
        ? ` ختم القرأن الكريم لعدد - ${value}`
        : `Completing the recitation of the Holy Quran for a number of - ${value}`
    )
    .setDescription(
      lang === "ar"
        ? `عدد مرات الختم: **${value}**`
        : `Number of times stamped: **${value}**`
    )
    .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
    .setColor(0xFFFFFF)
    .setFooter({ text: "• Powered By Thailand Codes" })
    .setImage(`attachment://${value}.png`);

  return { embeds: [embed], files: [file], ephemeral: true };
};