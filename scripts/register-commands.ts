import "dotenv/config";

const DISCORD_API = "https://discord.com/api/v10";
const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
  {
    name: "solicitar-envio",
    description: "Solicita a preparação e envio de equipamentos à Logística.",
    type: 1,
  },
];

async function registerCommands() {
  if (!APP_ID || !BOT_TOKEN) {
    throw new Error("Variáveis DISCORD_APP_ID ou DISCORD_BOT_TOKEN ausentes.");
  }

  const endpoint = `${DISCORD_API}/applications/${APP_ID}/commands`;

  const response = await fetch(endpoint, {
    method: "PUT", // O PUT sobrescreve todos e apaga os que não estão na lista
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${BOT_TOKEN}`,
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Erro ao registrar comandos:", error);
    process.exit(1);
  }

  console.log("Comandos registrados e limpos com sucesso na API do Discord.");
}

registerCommands();
