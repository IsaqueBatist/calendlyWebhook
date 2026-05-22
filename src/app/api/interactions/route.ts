import { NextRequest } from "next/server";
import { verifyKey } from "discord-interactions";
import { EscalarCommand } from "@/discord/commands/escalar";
import { ContatoCommand } from "@/discord/commands/contato"; // <-- Importe o novo módulo

export const runtime = "edge";

// Adicione o ContatoCommand ao registro
const commandRegistry = [EscalarCommand, ContatoCommand];

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");

  if (!signature || !timestamp)
    return new Response("Missing signature headers", { status: 401 });

  const rawBody = await req.text();
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (
    !publicKey ||
    !(await verifyKey(rawBody, signature, timestamp, publicKey))
  ) {
    return new Response("Bad request signature", { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  // 1. PING
  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. COMANDO DE BARRA (/contato)
  if (interaction.type === 2) {
    const commandName = interaction.data.name;
    const module = commandRegistry.find((m) => m.name === commandName);
    if (module && module.renderModal) {
      return new Response(JSON.stringify(module.renderModal()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. CLIQUE EM BOTÃO (MESSAGE_COMPONENT) <-- Nova Lógica
  if (interaction.type === 3) {
    const customId = interaction.data.custom_id;

    // Roteia para o módulo de Contato se o botão tiver o prefixo "contato_"
    if (customId.startsWith("contato_")) {
      return new Response(
        JSON.stringify(ContatoCommand.handleComponent!(interaction)),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // 4. SUBMISSÃO DE MODAL
  if (interaction.type === 5) {
    const modalId = interaction.data.custom_id;
    const module = commandRegistry.find((m) => m.modalId === modalId);
    if (module && module.handleSubmission) {
      return new Response(
        JSON.stringify(module.handleSubmission(interaction.data.components)),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  return new Response("Unknown interaction", { status: 400 });
}
