const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { khatmMenu, khatmResult } = require("../features/quranKhatm");
const { getPrayerTimes } = require("../features/prayerTimes");
const { getDuaaEmbed } = require("../features/duaa");
const { createHalt3lmImage } = require("../features/halt3lm");
const quiz = require("../features/quiz"); 
const halt3lmData = require("../data/halt3lm.json");
const config = require("../config.json");

const userLanguage = new Map(); 

const countryMap = {
    egypt: { city: "Cairo", country: "Egypt" },
    saudi: { city: "Riyadh", country: "Saudi Arabia" },
    kuwait: { city: "Kuwait City", country: "Kuwait" },
    morocco: { city: "Rabat", country: "Morocco" },
    tunisia: { city: "Tunis", country: "Tunisia" },
    algeria: { city: "Algiers", country: "Algeria" },
    uae: { city: "Abu Dhabi", country: "United Arab Emirates" },
    qatar: { city: "Doha", country: "Qatar" },
    jordan: { city: "Amman", country: "Jordan" },
    libya: { city: "Tripoli", country: "Libya" },
    sudan: { city: "Khartoum", country: "Sudan" }
};

const dataPath = path.join(__dirname, "../data/reminders.json");
function loadData() { return JSON.parse(fs.readFileSync(dataPath, "utf8")); }
function saveData(data) { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); }

module.exports = (client) => {

    client.on("interactionCreate", async (interaction) => {
        
      if (
        (interaction.isChatInputCommand() && interaction.commandName === "quiz") ||
        (interaction.isStringSelectMenu() && interaction.customId === "quiz_lang") ||
        (interaction.isButton() && interaction.customId.startsWith("quiz_answer_"))
      ) {
        return quiz(interaction);
      }

        if (interaction.isButton() && interaction.customId.startsWith('halt3lm_en_')) {
            await interaction.deferReply({ ephemeral: true });
            const index = interaction.customId.split('_')[2];
            const fact = halt3lmData[index];

            if (!fact || !fact.en) return interaction.editReply({ content: 'Error: English text not found.' });

            try {
                const imageBuffer = await createHalt3lmImage(fact.en, true);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'halt3lmEn.png' });
                const embed = new EmbedBuilder()
                    .setTitle('ThailandCodes - Did you know?')
                    .setImage('attachment://halt3lmEn.png')
                    .setColor('#FFFFFF')
                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: 'Tln SYS: نعتذر..حدث خطأ ما' });
            }
            return;
    }
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "setup") {
        if (interaction.user.id !== config.developerId)
          return interaction.reply({ content: "اعتذر ، ليس لديك صلاحيات", ephemeral: true });

        const embed = new EmbedBuilder()
          .setAuthor({
            name: "ThailandCodes - Islamic Bot",
            iconURL: "https://i.thteam.me/pEJrIXPT4Q.gif"
          })
          .setTitle("ThailandCodes - Islamic Bot")
          .setDescription(
            "قم بإختيار لغتك لبدء أستخدام البوت 🇸🇦\n" +
            "Choose your language to start using the bot 🇬🇧"
          )
          .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
          .setColor(0xFFFFFF)
          .setFooter({ text: "• Powered By Thailand Codes" });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("select_lang")
            .setPlaceholder("Select Your Lang - قم بإختيار لغتك")
            .addOptions([
              { label: "اللغة العربية", value: "ar", emoji: "🇸🇦" },
              { label: "English", value: "en", emoji: "🇺🇸" }
            ])
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "select_lang") {
      const lang = interaction.values[0];
      userLanguage.set(interaction.user.id, lang);

      const embed = new EmbedBuilder()
        .setTitle(lang === "ar" ? "ThailandCodes - البوت الإسلامي" : "ThailandCodes - Islamic Bot")
        .setDescription(
          lang === "ar"
            ? "إهلاً ، تم تصميم هذا البوت الاستلامي لشهر رمضان المبارك\n وذالك قد يكون به جميع الاشياء التي تحتاجها خلاص شهر رمضان \n ويشمل به: توقيت الصلاوات بمدينتك ، تذكير لأذان المغرب ، تذكيرن لأذان الفجر ، نظام ختم قرأن \n نتمني ان ينال إعجابكم جميعاً...بالتوفيق"
            : "Hello! This Islamic bot is specially designed for the holy month of Ramadan.\n It includes everything you need during Ramadan,\n including: prayer times in your city, Maghrib Adhan reminder, Fajr Adhan reminder, Quran Khatm system.\n We hope you all enjoy it... Good luck!"
        )
        .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
        .setColor(0xFFFFFF)
        .setFooter({ text: "• Powered By Thailand Codes" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(lang === "ar" ? "طريقة ختم القرآن" : "Seal of the Holy Quran")
          .setCustomId("khatm")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setLabel(lang === "ar" ? "توقيت الصلاة بمدينتك" : "Prayer Times")
          .setCustomId("prayers")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setLabel(lang === "ar" ? "ذكرني بالصلاة" : "Remind me to pray")
          .setCustomId("remind_me")
          .setStyle(ButtonStyle.Secondary)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (interaction.isButton()) {
      const lang = userLanguage.get(interaction.user.id) || "ar";

      if (interaction.customId === "khatm")
        return interaction.reply(khatmMenu(lang));

      if (interaction.customId === "prayers") {
        const embed = new EmbedBuilder()
          .setTitle(lang === "ar" ? "اختار دولتك" : "Choose your country")
          .setDescription(
            lang === "ar"
              ? "قم بإختيار الدولة المراد معرفة توقيت الصلاة بها"
              : "Select your country to view prayer times"
          )
          .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
          .setColor(0xFFFFFF)
          .setFooter({ text: "• Powered By Thailand Codes" });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("select_country")
            .setPlaceholder(lang === "ar" ? "اختر الدولة" : "Select country")
            .addOptions([
              { label: lang === "ar" ? "🇪🇬 مصر" : "🇪🇬 Egypt", value: "egypt" },
              { label: lang === "ar" ? "🇸🇦 السعودية" : "🇸🇦 Saudi Arabia", value: "saudi" },
              { label: lang === "ar" ? "🇰🇼 الكويت" : "🇰🇼 Kuwait", value: "kuwait" },
              { label: lang === "ar" ? "🇲🇦 المغرب" : "🇲🇦 Morocco", value: "morocco" },
              { label: lang === "ar" ? "🇹🇳 تونس" : "🇹🇳 Tunisia", value: "tunisia" },
              { label: lang === "ar" ? "🇩🇿 الجزائر" : "🇩🇿 Algeria", value: "algeria" },
              { label: lang === "ar" ? "🇦🇪 الإمارات" : "🇦🇪 United Arab Emirates", value: "uae" },
              { label: lang === "ar" ? "🇶🇦 قطر" : "🇶🇦 Qatar", value: "qatar" },
              { label: lang === "ar" ? "🇯🇴 الأردن" : "🇯🇴 Jordan", value: "jordan" },
              { label: lang === "ar" ? "🇱🇾 ليبيا" : "🇱🇾 Libya", value: "libya" },
              { label: lang === "ar" ? "🇸🇩 السودان" : "🇸🇩 Sudan", value: "sudan" }
            ])            
        );

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }

      if (interaction.customId === "remind_me") {
        const embed = new EmbedBuilder()
          .setTitle(lang === "ar" ? "نظام التذكير بالصلاة" : "Prayer Reminder System")
          .setDescription(lang === "ar" ? "قم بإختيار الدولة التي بها صلاوتك" : "Choose the country where you pray")
          .setColor(0xFFFFFF)
          .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
          .setFooter({ text: "• Powered By Thailand Codes" });

        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("remind_country")
            .setPlaceholder(lang === "ar" ? "اختر الدولة" : "Choose the country")
            .addOptions([
              { label: lang === "ar" ? "🇪🇬 مصر" : "🇪🇬 Egypt", value: "egypt" },
              { label: lang === "ar" ? "🇸🇦 السعودية" : "🇸🇦 Saudi Arabia", value: "saudi" },
              { label: lang === "ar" ? "🇰🇼 الكويت" : "🇰🇼 Kuwait", value: "kuwait" },
              { label: lang === "ar" ? "🇲🇦 المغرب" : "🇲🇦 Morocco", value: "morocco" },
              { label: lang === "ar" ? "🇹🇳 تونس" : "🇹🇳 Tunisia", value: "tunisia" },
              { label: lang === "ar" ? "🇩🇿 الجزائر" : "🇩🇿 Algeria", value: "algeria" },
              { label: lang === "ar" ? "🇦🇪 الإمارات" : "🇦🇪 United Arab Emirates", value: "uae" },
              { label: lang === "ar" ? "🇶🇦 قطر" : "🇶🇦 Qatar", value: "qatar" },
              { label: lang === "ar" ? "🇯🇴 الأردن" : "🇯🇴 Jordan", value: "jordan" },
              { label: lang === "ar" ? "🇱🇾 ليبيا" : "🇱🇾 Libya", value: "libya" },
              { label: lang === "ar" ? "🇸🇩 السودان" : "🇸🇩 Sudan", value: "sudan" }
            ])  
        );

        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "select_country") {
      const lang = userLanguage.get(interaction.user.id) || "ar";
      const location = countryMap[interaction.values[0]];
      const embed = await getPrayerTimes(location, lang);
      return interaction.update({ embeds: [embed], components: [] });
    }
    if (interaction.isStringSelectMenu() && interaction.customId === "khatm_select") {
      const lang = userLanguage.get(interaction.user.id) || "ar";
      return interaction.reply(khatmResult(interaction.values[0], lang));
    }
    if (interaction.isStringSelectMenu() && interaction.customId === "remind_country") {
      const lang = userLanguage.get(interaction.user.id) || "ar";
      const data = loadData();
      data[interaction.user.id] = { country: interaction.values[0], lang: lang }; 
      saveData(data);

      const embed = new EmbedBuilder()
        .setTitle(lang === "ar" ? "اختر الصلاة" : "Choose the prayer")
        .setDescription(
          lang === "ar"
            ? `قم بإختيار الصلاة المراد تذكيرك بها`
            : `Choose the prayer synonyms to remind you`
        )
        .setColor(0xFFFFFF)
        .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
        .setFooter({ text: "• Powered By Thailand Codes" });

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("remind_prayer")
          .setPlaceholder(lang === "ar" ? "اختر الصلاة" : "Choose the prayer")
          .addOptions([
            { label: lang === "ar" ? "الفجر" : "Fajr", value: "Fajr" },
            { label: lang === "ar" ? "الظهر" : "Dhuhr", value: "Dhuhr" },
            { label: lang === "ar" ? "العصر" : "Asr", value: "Asr" },
            { label: lang === "ar" ? "المغرب" : "Maghrib", value: "Maghrib" },
            { label: lang === "ar" ? "العشاء" : "Isha", value: "Isha" }
          ])
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    const prayerNames = {
      Fajr:    { ar: "الفجر",   en: "Fajr" },
      Dhuhr:   { ar: "الظهر",   en: "Dhuhr" },
      Asr:     { ar: "العصر",   en: "Asr" },
      Maghrib: { ar: "المغرب",  en: "Maghrib" },
      Isha:    { ar: "العشاء",  en: "Isha" }
    };

    if (interaction.isStringSelectMenu() && interaction.customId === "remind_prayer") {
      const data = loadData();
      if (!data[interaction.user.id]) return;

      const lang = data[interaction.user.id]?.lang || "ar";
      const prayerKey = interaction.values[0];

      const prayer =
        prayerNames[prayerKey]?.[lang] ||
        (lang === "ar" ? "الصلاة" : "Prayer");

      data[interaction.user.id].prayer = prayerKey;
      saveData(data);

      const embed = new EmbedBuilder()
        .setTitle(lang === "ar" ? "ThailandCodes - بوت إسلامي" : "ThailandCodes - Islamic Bot")
        .setDescription(
          lang === "ar"
            ? `سيتم تذكيرك عند أذان ${prayer} \n علماً بإن يجب خاصك ان يكون مفتوح حتي يتمكن البوت من الارسال اليك`
            : `You will be reminded at the Adhan of ${prayer} \n Note that your DMs must be open for the bot to send you messages`
        )
        .setColor(0xFFFFFF)
        .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
        .setFooter({ text: "• Powered By Thailand Codes" });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

  });

  setInterval(async () => {
    const data = loadData();

    for (const userId in data) {
      const info = data[userId];
      if (!info.prayer) continue;

      const lang = info.lang || "ar";

      const loc = countryMap[info.country];
      const res = await axios.get("https://api.aladhan.com/v1/timingsByCity", {
        params: { city: loc.city, country: loc.country, method: 5 }
      });

      const time = res.data.data.timings[info.prayer];
      const now = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      });

      if (now === time) {
        const user = await client.users.fetch(userId);

        const embed = new EmbedBuilder()
          .setTitle(lang === "ar" ? `موعد صلاة ${info.prayer}` : `Prayer Time for ${info.prayer}`)
          .setDescription(lang === "ar" ? `صلاة ${info.prayer} أذنت الآن` : `The prayer of ${info.prayer} has been called now`)
          .setThumbnail("https://i.thteam.me/pEJrIXPT4Q.gif")
          .setColor(0xFFFFFF)
          .setFooter({ text: "• Powered By Thailand Codes" });

        user.send({ embeds: [embed] });
      }
    }
  }, 60000);

  setInterval(async () => {
    if (!config.duaaChannelId) return;

    try {
      const channel = await client.channels.fetch(config.duaaChannelId);
      if (!channel || !channel.isTextBased()) return;

      const embed = getDuaaEmbed("ar");
      if (embed) {
        await channel.send({ embeds: [embed] });
        console.log("✅ Duaa sent successfully");
      } else {
        console.log("⚠️ No duaa available");
      }
    } catch (error) {
      console.error("Error sending duaa:", error);
    }
  }, 180000);
};
