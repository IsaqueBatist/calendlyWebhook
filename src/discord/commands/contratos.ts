import type { DiscordCommandModule } from "../types";

export const ContratosCommand: DiscordCommandModule = {
  name: "alertas-contrato", // Ajustado para corresponder ao comando do Discord
  modalId: "form_contratos",
  buttonPrefixes: ["contrato_"],

  renderModal: () => ({
    type: 9, // Modal
    data: {
      custom_id: "form_contratos",
      title: "Alerta de Fim de Contrato (< 3 meses)",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "empresa",
              label: "EMPRESA",
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
              custom_id: "data_fim",
              label: "DATA DE ENCERRAMENTO PREVISTO",
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
              custom_id: "equipamentos",
              label: "NÚMERO DE EQUIPAMENTOS ATIVOS",
              style: 1,
              required: true,
            },
          ],
        },
      ],
    },
  }),

  handleSubmission: (components) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    return {
      type: 4, // ChannelMessage With Source
      data: {
        embeds: [
          {
            title: "⚠️ Contrato Próximo do Fim",
            color: 0xffa500,
            fields: [
              { name: "Empresa", value: getValue("empresa"), inline: true },
              {
                name: "Encerramento",
                value: getValue("data_fim"),
                inline: true,
              },
              {
                name: "Equipamentos",
                value: getValue("equipamentos"),
                inline: false,
              },
              {
                name: "Status Comercial",
                value: "Aguardando ação de retenção.",
                inline: false,
              },
            ],
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3,
                custom_id: "contrato_retido",
                label: "✅ Retido / Renovado",
              },
              {
                type: 2,
                style: 4,
                custom_id: "contrato_perdido",
                label: "❌ Churn (Cancelado)",
              },
            ],
          },
        ],
      },
    };
  },

  handleComponent: (interaction) => {
    const customId = interaction.data.custom_id;
    const embed = interaction.message.embeds[0];
    const statusIndex = embed.fields.findIndex(
      (f: any) => f.name === "Status Comercial",
    );
    const userId = (interaction.member?.user || interaction.user).id;

    if (customId === "contrato_retido") {
      embed.color = 0x00ff00;
      embed.fields[statusIndex].value =
        `✅ Retido com sucesso por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }

    if (customId === "contrato_perdido") {
      embed.color = 0xff0000;
      embed.fields[statusIndex].value = `❌ Perda confirmada por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }
  },
};
