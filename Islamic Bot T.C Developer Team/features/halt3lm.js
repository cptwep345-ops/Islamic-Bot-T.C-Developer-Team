const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const config = require('../config.json');
const data = require('../data/halt3lm.json');

const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'Cairo-Bold.ttf');
if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'CairoBold');
} else {
    console.log("DeveloperSystem: الخط غير موجود" + fontPath);
}


async function createHalt3lmImage(text, isEnglish = false) {
    if (!text) {
        text = isEnglish ? "ThailandCodes ComingSoon" : "ThailandCodes ComingSoon";
    }

    const imgFileName = isEnglish ? 'halt3lmEn.png' : 'halt3lmAr.png';
    const imgPath = path.join(__dirname, '..', 'assets', 'halt3lm', imgFileName);
    
    if (!fs.existsSync(imgPath)) {
        throw new Error(`الصورة غير موجودة بالمسار ${imgPath}`);
    }

    const imageBuffer = fs.readFileSync(imgPath);
    const image = await loadImage(imageBuffer);

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    ctx.font = '40px CairoBold';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    const words = text.toString().split(' ');
    let line = '';
    let lines = [];
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > (canvas.width - 150) && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    let startY = y - ((lines.length - 1) * 30); 
    lines.forEach((l, i) => {
        ctx.fillText(l.trim(), x, startY + (i * 60));
    });

    return canvas.toBuffer('image/png');
}

/**
 * وظيفة الإرسال التلقائي
 */
function startAutoPost(client) {
    cron.schedule('0 */8 * * *', async () => {
                try {
            console.log("Tln Sys : جاري ارسال هل تعليم جديده");
            const channel = await client.channels.fetch(config.halt3lmChannelId);
            if (!channel) return console.log("DeveloperSystem : لم يتم العثور علي الروم راجع الكونفج");

            if (!data || data.length === 0) return console.log("DeveloperSystem : لايوجد هل تعلم  Json");

            const randomIndex = Math.floor(Math.random() * data.length);
            const fact = data[randomIndex];

            const textToSend = fact.ar || "ThailandCodes ComingSoon";

            const buffer = await createHalt3lmImage(textToSend, false);
            const attachment = new AttachmentBuilder(buffer, { name: 'halt3lmAr.png' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`halt3lm_en_${randomIndex}`)
                    .setLabel('English')
                    .setEmoji('🇺🇸')
                    .setStyle(ButtonStyle.Secondary)
            );

            const embed = new EmbedBuilder()
                .setTitle('ThailandCodes - هل تعلم')
                .setImage('attachment://halt3lmAr.png')
                .setColor('#FFFFFF')
            await channel.send({ embeds: [embed], files: [attachment], components: [row] });
            console.log("Tln Sys : تم ارسال هل تعلم بنجاح");
        } catch (err) {
            console.error("Sorry , يوجد خطأ ما", err.message);
        }
    });
}

module.exports = { startAutoPost, createHalt3lmImage };