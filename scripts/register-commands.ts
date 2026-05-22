// scripts/register-commands.ts
import "dotenv/config";

// Constantes estruturais extraídas da documentação oficial do Discord
const DISCORD_API = "https://discord.com/api/v10";
const APP_ID = process.env.DISCORD_APP_ID; // Application ID do portal
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Aqui você centraliza a definição de todos os seus comandos
const commands = [
  {
    name: "escalar",
    description: "Abre o formulário de escalonamento de problemas.",
    type: 1, // 1 = CHAT_INPUT (Slash Command)
  },
  {
    name: "pedido",
    description: "Abre o formulário de solicitação de novo pedido.",
    type: 1,
  },
  {
    name: "contato",
    description:
      "Inicia o rastreamento do fluxo de contato com cliente offline (T1 a T3).",
    type: 1,
  },
  {
    name: "contratos-finalizando",
    description:
      "Notifica o comercial sobre contratos a menos de 3 meses do encerramento.",
    type: 1,
  },
  {
    name: "edicao-solicitar",
    description: "Solicita novas edições de vídeo ao time de Marketing.",
    type: 1,
  },
  {
    name: "case-pedir",
    description: "Solicita a geração de cases de sucesso ao Marketing.",
    type: 1,
  },
  {
    name: "pedido-cancelamento",
    description: "Registra pedidos de cancelamento de clientes.",
    type: 1,
  },
  {
    name: "logistica-pedido",
    description: "Solicita a preparação e envio de equipamentos à Logística.",
    type: 1,
  },
  {
    name: "pedido-enviado",
    description: "Registra os dados técnicos das câmeras enviadas (Logística).",
    type: 1,
  },
  {
    name: "negativacao-relatorio",
    description: "Gera o relatório quinzenal de palavras-chave negativadas.",
    type: 1,
  },
];

async function registerCommands() {
  if (!APP_ID || !BOT_TOKEN) {
    throw new Error("Variáveis DISCORD_APP_ID ou DISCORD_BOT_TOKEN ausentes.");
  }

  // Uso da rota global. Para testes imediatos sem cache de 1h, use a rota de Guild (Servidor):
  // /applications/${APP_ID}/guilds/${GUILD_ID}/commands
  const endpoint = `${DISCORD_API}/applications/${APP_ID}/commands`;

  const response = await fetch(endpoint, {
    method: "PUT", // PUT sobrescreve todos os comandos globais existentes
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

  console.log("Comandos registrados com sucesso na API do Discord.");
}

registerCommands();
