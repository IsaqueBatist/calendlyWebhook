// src/app/api/interactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyKey, InteractionType } from "discord-interactions";
import { EscalarCommand } from "@/discord/commands/escalar";
// import { PedidoCommand } from "@/discord/commands/pedido"; // Supondo que você criou este

// Registro dinâmico de todos os comandos do sistema
const commandRegistry = [EscalarCommand];

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;

export async function POST(req: NextRequest) {
  console.log("PI");
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const rawBody = await req.text();

  if (!verifyKey(rawBody, signature!, timestamp!, PUBLIC_KEY)) {
    return new NextResponse("Assinatura criptográfica inválida", {
      status: 401,
    });
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    console.log("Pong - Respondendo ao Discord");
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ROTEAMENTO DE COMANDOS (Abertura de Modais)
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = interaction.data.name;
    const module = commandRegistry.find((m) => m.name === commandName);

    if (module) {
      return NextResponse.json(module.renderModal());
    }
  }

  // ROTEAMENTO DE SUBMISSÃO (Processamento de Modais)
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    const modalId = interaction.data.custom_id;
    const module = commandRegistry.find((m) => m.modalId === modalId);

    if (module) {
      // Passa a estrutura de Action Rows extraída da raiz da propriedade data
      return NextResponse.json(
        module.handleSubmission(interaction.data.components),
      );
    }
  }

  return new NextResponse("Interação não suportada ou não registrada", {
    status: 400,
  });
}
