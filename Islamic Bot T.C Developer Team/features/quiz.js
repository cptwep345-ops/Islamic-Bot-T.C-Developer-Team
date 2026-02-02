const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

const config = require("../config.json");
const questions = require("../data/question.json");

registerFont(
  path.join(__dirname, "../assets/fonts/Cairo-Bold.ttf"),
  { family: "Cairo" }
);

const ALLOWED_CHANNEL = config.quizChannel;

module.exports = async (interaction) => {
  try {
    // ===== /quiz =====
    if (interaction.isChatInputCommand() && interaction.commandName === "quiz") {
      if (interaction.channelId !== ALLOWED_CHANNEL) {
        return interaction.reply({
          content: `Sorry , هذا الامر مخصص للروم التالي \n <#${ALLOWED_CHANNEL}>`,
          ephemeral: true
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("quiz_lang")
          .setPlaceholder("Select Your Lang - قم بإختيار لغتك")
          .addOptions([
            { label: "اللغة العربية", value: "ar", emoji: "🇸🇦" },
            { label: "English", value: "en", emoji: "🇺🇸" }
          ])
      );

      return interaction.reply({
        content: "",
        components: [row],
        ephemeral: true
      });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "quiz_lang") {
      await interaction.deferReply({ ephemeral: true });

      if (!questions || !questions.length) {
        return interaction.editReply({
          content: "Sorry, مفيش اسأله حالياً",
          components: []
        });
      }

      const lang = interaction.values[0];
      const q = questions[Math.floor(Math.random() * questions.length)];

      if (!q?.question?.[lang]) {
        return interaction.editReply({
          content: "Sorry, يوجد مشكلة بالسؤال أو مش موجود باللغة المخصصه",
          components: []
        });
      }

      const imageBuffer = await drawQuestion(q.question[lang], lang);

      let answers = shuffle([
        { text: q.correct[lang], correct: true },
        ...q.wrong.map(w => ({ text: w[lang], correct: false }))
      ]).slice(0, 4);

      const row = new ActionRowBuilder().addComponents(
        answers.map((a, i) =>
          new ButtonBuilder()
            .setCustomId(`quiz_answer_${lang}_${a.correct}_${i}`)
            .setLabel(a.text)
            .setStyle(ButtonStyle.Secondary)
        )
      );

      const embed = new EmbedBuilder()
        .setImage("attachment://quiz.png")
        .setColor(0xffffff)
        .setFooter({ text: "• Powered By Thailand Codes" });

      return interaction.editReply({
        embeds: [embed],
        files: [{ attachment: imageBuffer, name: "quiz.png" }],
        components: [row]
      });
    }

    if (interaction.isButton() && interaction.customId.startsWith("quiz_answer_")) {
      const row = ActionRowBuilder.from(interaction.message.components[0]);


      const parts = interaction.customId.split('_');
      const lang = parts[2]; 
      const isSelectedCorrect = parts[3] === 'true'; 

      const correctButtonIndex = row.components.findIndex(btn => btn.customId && btn.customId.includes('true'));
      const selectedButtonIndex = row.components.findIndex(btn => btn.customId === interaction.customId);

      row.components.forEach((btn, index) => {
        btn.setDisabled(true);

        if (isSelectedCorrect) {
          if (index === correctButtonIndex) {
            btn.setStyle(ButtonStyle.Danger);
          } else {
            btn.setStyle(ButtonStyle.Danger);
          }
        } else {
          if (index === selectedButtonIndex) {
            btn.setStyle(ButtonStyle.Danger);
          } else {
            btn.setStyle(ButtonStyle.Danger);
          }
        }
      });

      await interaction.update({ components: [row] });

      setTimeout(() => sendFeedbackMessage(interaction, isSelectedCorrect, lang), 100); 
    }

  } catch (err) {
    console.error("QUIZ SYSTEM ERROR:", err);

    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({
        content: "Sorry, حدث خطأ ما.",
        ephemeral: true
      });
    } else {
      interaction.editReply({
        content: "Sorry, حدث خطأ ما.",
        ephemeral: true
      });
    }
  }
};

async function sendFeedbackMessage(interaction, isCorrect, lang) {
  let message = "";
  if (isCorrect) {
    message = lang === "ar" ? "أحسنت ، إجابة صحيحه" : "Well done, correct answer";
  } else {
    const correctButton = interaction.message.components[0].components.find(btn => btn.customId && btn.customId.includes('true'));
    const correctAnswer = correctButton ? correctButton.label : "غير معروف"; // في حالة مش موجود
    message = lang === "ar" ? `حظ أوفر ، اجابة خاطئة` : `Better luck next time, wrong answer`;
  }

  try {
    await interaction.followUp({
      content: message,
      ephemeral: true
    });
  } catch (err) {
    console.error("Failed to send feedback:", err);
    if (err.code === 10062) {
      console.log("Interaction expired, skipping feedback");
    } else {

      try {
        await interaction.editReply({ content: "Sorry . حدث خطا ما في ارسال الرسالة" });
      } catch (editErr) {
        console.error("Edit reply also failed:", editErr);
      }
    }
  }
}

async function drawQuestion(text, lang) {
  const canvas = createCanvas(900, 450);
  const ctx = canvas.getContext("2d");

  const bgPath =
    lang === "ar"
      ? path.join(__dirname, "../assets/quiz/ar.png")
      : path.join(__dirname, "../assets/quiz/en.png");

  const bg = await loadImage(bgPath);
  ctx.drawImage(bg, 0, 0, 900, 450);

  ctx.font = "30px Cairo";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (lang === "ar") ctx.direction = "rtl";

  wrapText(ctx, text, 450, 230, 820, 50);

  return canvas.toBuffer("image/png");
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + (i * lineHeight));
  }
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}