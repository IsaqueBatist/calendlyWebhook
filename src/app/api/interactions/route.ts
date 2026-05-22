import { NextRequest } from "next/server";
import { verifyKey } from "discord-interactions";
import { EscalarCommand } from "@/discord/commands/escalar"; // Ajuste o caminho se necessário

// Força a execução em infraestrutura Edge
export const runtime = "edge";

// Registro dinâmico
const commandRegistry = [EscalarCommand];

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) {
    return new Response("Missing signature headers", { status: 401 });
  }

  const rawBody = await req.text();
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!publicKey)
    return new Response("Server configuration error", { status: 500 });

  if (!(await verifyKey(rawBody, signature, timestamp, publicKey))) {
    return new Response("Bad request signature", { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  // 1. Handshake de Validação (InteractionType.PING)
  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Invocação do Comando (InteractionType.APPLICATION_COMMAND)
  if (interaction.type === 2) {
    const commandName = interaction.data.name;
    const module = commandRegistry.find((m) => m.name === commandName);

    if (module) {
      return new Response(JSON.stringify(module.renderModal()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. Submissão do Formulário (InteractionType.MODAL_SUBMIT)
  if (interaction.type === 5) {
    const modalId = interaction.data.custom_id;
    const module = commandRegistry.find((m) => m.modalId === modalId);

    if (module) {
      return new Response(
        JSON.stringify(module.handleSubmission(interaction.data.components)),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  return new Response("Unknown interaction", { status: 400 });
}
