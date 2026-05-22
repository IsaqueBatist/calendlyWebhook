// src/discord/commands/contato.ts
import type { DiscordCommandModule } from "../types";

const GABRIEL_ID = "1437511382370095217";

export const ContatoCommand: DiscordCommandModule = {
  name: "contato",
  modalId: "form_contato",

  // 1. Abertura do Formulário Inicial (T1 / D+0)
  renderModal: () => ({
    type: 9, // InteractionResponseType.MODAL
    data: {
      custom_id: "form_contato",
      title: "Registro de Problema (D+0)",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "cliente",
              label: "CLIENTE",
              style: 1,
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "camera",
              label: "CÂMERA",
              style: 1,
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "problema",
              label: "DESCRIÇÃO DO PROBLEMA",
              style: 2,
              required: true,
            },
          ],
        },
      ],
    },
  }),

  // 2. Submissão do Formulário e Criação do Painel Interativo
  handleSubmission: (components) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    return {
      type: 4, // InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        embeds: [
          {
            title: "⏳ Rastreamento de Contato Iniciado",
            color: 0xffa500, // Laranja (Em progresso)
            fields: [
              { name: "Cliente", value: getValue("cliente"), inline: true },
              { name: "Câmera", value: getValue("camera"), inline: true },
              { name: "Problema", value: getValue("problema"), inline: false },
              {
                name: "Histórico de Ações",
                value: "T1 | D+0: Contato inicial realizado (WhatsApp).",
                inline: false,
              },
            ],
          },
        ],
        components: [
          {
            type: 1, // Action Row com os botões
            components: [
              {
                type: 2,
                style: 2,
                custom_id: "contato_t2",
                label: "Registrar T2 (D+1)",
              },
              {
                type: 2,
                style: 2,
                custom_id: "contato_t3",
                label: "Registrar T3 (D+2)",
              },
              {
                type: 2,
                style: 3,
                custom_id: "contato_resolvido",
                label: "✅ Resolvido",
              },
              {
                type: 2,
                style: 4,
                custom_id: "contato_escalar",
                label: "🚨 Escalar (D+3)",
              },
            ],
          },
        ],
      },
    };
  },

  // 3. Processamento do Clique nos Botões
  handleComponent: (interaction) => {
    const customId = interaction.data.custom_id;
    const embed = interaction.message.embeds[0]; // Captura o estado atual da mensagem

    // Encontra o index do campo "Histórico de Ações" para atualizá-mo
    const historyIndex = embed.fields.findIndex(
      (f: any) => f.name === "Histórico de Ações",
    );

    if (customId === "contato_resolvido") {
      embed.color = 0x00ff00; // Verde
      embed.fields[historyIndex].value +=
        `\n✅ **Fechado:** Cliente respondeu e problema foi resolvido.`;

      return {
        type: 7, // UPDATE_MESSAGE (Edita a mensagem no lugar)
        data: { embeds: [embed], components: [] }, // Remove os botões
      };
    }

    if (customId === "contato_escalar") {
      embed.color = 0xff0000; // Vermelho
      embed.fields[historyIndex].value +=
        `\n🚨 **Escalada (D+3):** Sem resposta do cliente.`;

      return {
        type: 7,
        data: {
          content: `🚨 <@${GABRIEL_ID}>, escalada requisitada! Assuma este chamado em até 24h.`,
          embeds: [embed],
          components: [], // Desativa os botões após escalar
        },
      };
    }

    if (customId === "contato_t2") {
      embed.fields[historyIndex].value +=
        `\nT2 | D+1: Ligação telefônica + 2º WhatsApp (Registrado por <@${interaction.member.user.id}>).`;
    }

    if (customId === "contato_t3") {
      embed.fields[historyIndex].value +=
        `\nT3 | D+2: Acionado outro contato da organização (Registrado por <@${interaction.member.user.id}>).`;
    }

    // Retorna a mensagem com o histórico atualizado, mantendo os botões
    return {
      type: 7,
      data: { embeds: [embed], components: interaction.message.components },
    };
  },
};
