// src/lib/discord-rest.ts
export async function createChannelMessage(channelId: string, data: any) {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    console.error("Falha ao enviar mensagem:", await response.text());
  }
}
