// src/lib/discord-rest.ts

// Envia uma mensagem e retorna o objeto da mensagem criada (importante para pegarmos o ID)
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
    return null;
  }

  return await response.json(); // Retorna os dados, incluindo o ID da mensagem
}

// Edita uma mensagem existente (usaremos para mudar a cor para verde quando resolver)
export async function editChannelMessage(
  channelId: string,
  messageId: string,
  data: any,
) {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    console.error(
      `Falha ao editar mensagem ${messageId}:`,
      await response.text(),
    );
  }
}
