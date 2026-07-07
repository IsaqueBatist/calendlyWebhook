import { LogisticaCommand } from "@/discord/commands/logistica";
import { verifyKey } from "discord-interactions";
import { NextRequest } from "next/server";

// Apenas o comando de logística continua registrado
const commandRegistry = [LogisticaCommand];

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

  // 2. COMANDO DE BARRA
  if (interaction.type === 2) {
    const commandName = interaction.data.name;
    const cmdModule = commandRegistry.find((m) => m.name === commandName);
    if (cmdModule && cmdModule.renderModal) {
      return new Response(JSON.stringify(cmdModule.renderModal()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. CLIQUE EM BOTÃO
  if (interaction.type === 3) {
    const customId = interaction.data.custom_id;
    const cmdModule = commandRegistry.find((m) =>
      m.buttonPrefixes?.some((prefix: string) => customId.startsWith(prefix)),
    );

    if (cmdModule && cmdModule.handleComponent) {
      const componentResult = await cmdModule.handleComponent(interaction);
      return new Response(JSON.stringify(componentResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 4. SUBMISSÃO DE MODAL
  if (interaction.type === 5) {
    const modalId = interaction.data.custom_id;

    // Submissão Padrão (Criação)
    const moduleForCreation = commandRegistry.find(
      (m) => m.modalId === modalId,
    );
    if (moduleForCreation && moduleForCreation.handleSubmission) {
      const creationResult = await moduleForCreation.handleSubmission(
        interaction.data.components,
        interaction,
      );
      return new Response(JSON.stringify(creationResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Submissão de Edição
    const moduleForEdit = commandRegistry.find(
      (m) => m.editModalId === modalId,
    );
    if (moduleForEdit && moduleForEdit.handleEditSubmission) {
      const editResult = await moduleForEdit.handleEditSubmission(interaction);
      return new Response(JSON.stringify(editResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Unknown interaction", { status: 400 });
}
