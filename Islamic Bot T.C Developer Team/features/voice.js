const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require("@discordjs/voice");
const { getTasbihStatus } = require("./tasbih");
const config = require("../config.json");
const axios = require("axios");

let connection = null;
let isConnecting = false;
let statusInterval = null;
let reconnectTimeout = null;
let reconnectAttempt = 0;
let originalChannelName = null;

async function setVoiceStatus(status, channelId, token) {
  if (!channelId || !token) return;
  try {
    await axios.put(
      `https://discord.com/api/v10/channels/${channelId}/voice-status`,
      { status: status }, 
      { headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ Voice status updated: ${status}`);
  } catch (e) {
    console.error(`❌ Failed to update voice status: ${e.message}`);
  }
}

async function updateVoiceStatus(client) {
  try {
    console.log("🔄 Updating voice status...");
    const status = getTasbihStatus();
    if (!status) {
      console.log("⚠️ No status available!");
      return;
    }

    await setVoiceStatus(status, config.voiceChannelId, config.token);

  } catch (error) {
    console.error("❌ Error updating voice status:", error);
  }
}

function clearReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function scheduleReconnect(client, reason) {
  if (!client || !client.isReady?.() || !config.voiceChannelId) return;
  if (isConnecting) return;
  if (reconnectTimeout) return;

  const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempt));
  reconnectAttempt = Math.min(reconnectAttempt + 1, 5);
  console.log(`🔁 Voice reconnect scheduled in ${delay}ms (${reason || "unknown"})`);

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    joinVoice(client);
  }, delay);
}

async function joinVoice(client) {
  if (!config.voiceChannelId) return;
  if (isConnecting) return;

  try {
    isConnecting = true;
    clearReconnect();

    const channel = await client.channels.fetch(config.voiceChannelId);
    if (!channel || !channel.isVoiceBased()) {
      console.log("Invalid voice channel");
      isConnecting = false;
      return;
    }

    if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
      try {
        connection.destroy();
      } catch (e) {
      }
      connection = null;
    }

    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true
    });

    connection.on(VoiceConnectionStatus.Signalling, () => {
      console.log("Voice signalling...");
    });

    connection.on(VoiceConnectionStatus.Connecting, () => {
      console.log("Voice connecting...");
    });

    connection.on(VoiceConnectionStatus.Ready, async () => {
      console.log("✅ Voice ready!");
      isConnecting = false;
      reconnectAttempt = 0;

      setTimeout(async () => {
        await updateVoiceStatus(client);

        if (statusInterval) clearInterval(statusInterval);
        statusInterval = setInterval(async () => {
          await updateVoiceStatus(client);
        }, 180000); 
      }, 1000);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      isConnecting = false;
      if (statusInterval) clearInterval(statusInterval);
      scheduleReconnect(client, "disconnected");
    });

    connection.on("error", (error) => {
      console.error("Voice connection error:", error);
      isConnecting = false;
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 30000);
    console.log("✅ Successfully joined voice channel");

  } catch (error) {
    console.error("Error joining voice channel:", error.message);
    isConnecting = false;
    scheduleReconnect(client, error?.message || "join error");
  }
}

function startVoice(client) {
  if (!config.voiceChannelId) {
    console.log("No voice channel ID configured");
    return;
  }

  if (client.isReady?.()) {
    console.log("Bot already ready, joining voice channel...");
    joinVoice(client);
  } else {
    client.once("ready", () => {
      console.log("Bot ready, joining voice channel...");
      joinVoice(client);
    });
  }
}

module.exports = {
  startVoice
};
