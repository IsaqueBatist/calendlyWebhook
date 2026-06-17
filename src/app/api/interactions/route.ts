import { verifyKey } from "discord-interactions";
import { NextRequest } from "next/server";

// Importações dos seus módulos
import {
  NovoContratoCommand,
  AlertaContratoCommand,
} from "@/discord/commands/contratos";
import { LogisticaCommand } from "@/discord/commands/logistica";
import { RelatorioCommand } from "@/discord/commands/relatorio";
import { CaseCommand } from "@/discord/commands/case";
import { EdicaoCommand } from "@/discord/commands/edicao";
import { CancelamentoCommand } from "@/discord/commands/cancelamento";
import { EnviadoCommand } from "@/discord/commands/enviado";
import { ContatoCommand } from "@/discord/commands/contato";
import { AtrasoCommand } from "@/discord/commands/camera-atraso";
import { IntencaoCommand } from "@/discord/commands/intencao";
import {
  ChamadoCommand,
  ChamadoTecnicoCommand,
} from "@/discord/commands/chamado";
import SubstituicaoCameraModule from "@/discord/commands/substituicao-camera";

const commandRegistry = [
  IntencaoCommand,
  ChamadoCommand,
  ChamadoTecnicoCommand,
  AtrasoCommand,
  ContatoCommand,
  NovoContratoCommand,
  AlertaContratoCommand,
  LogisticaCommand,
  RelatorioCommand,
  CaseCommand,
  EdicaoCommand,
  CancelamentoCommand,
  EnviadoCommand,
  SubstituicaoCameraModule,
];

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
    const module = commandRegistry.find((m) => m.name === commandName);
    if (module && module.renderModal) {
      return new Response(JSON.stringify(module.renderModal()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. CLIQUE EM BOTÃO
  if (interaction.type === 3) {
    const customId = interaction.data.custom_id;
    const module = commandRegistry.find((m) =>
      m.buttonPrefixes?.some((prefix: any) => customId.startsWith(prefix)),
    );

    if (module && module.handleComponent) {
      return new Response(JSON.stringify(module.handleComponent(interaction)), {
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
      // ADICIONADO O AWAIT AQUI
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
      // ADICIONADO O AWAIT AQUI (Isso resolve o erro da devolução!)
      const editResult = await moduleForEdit.handleEditSubmission(interaction);
      return new Response(JSON.stringify(editResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Submissão de Crossover (Atraso -> Contato)
    const moduleForCrossover = commandRegistry.find(
      (m) => m.crossoverModalId === modalId,
    );
    if (moduleForCrossover && moduleForCrossover.handleCrossoverSubmission) {
      const crossoverResult =
        await moduleForCrossover.handleCrossoverSubmission(
          interaction.data.components,
          interaction,
        );
      return new Response(JSON.stringify(crossoverResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Unknown interaction", { status: 400 });
}
