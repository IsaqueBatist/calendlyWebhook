import type { DiscordCommandModule } from "../types";

export const IntencaoCommand: DiscordCommandModule = {
  name: "intencao-cancelamento",
  modalId: "form_intencao",
  buttonPrefixes: ["intencao_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_intencao",
      title: "Registro de Risco de Churn",
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
              custom_id: "pessoa",
              label: "PESSOA QUE SOLICITOU",
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
              custom_id: "canal_motivo",
              label: "CANAL E MOTIVO",
              style: 2,
              placeholder:
                "Ex: Whatsapp (um dos equipamentos não será mais necessário)",
              required: true,
            },
          ],
        },
      ],
    },
  }),

  handleSubmission: (components, interaction) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    // Captura o ID do usuário que registrou a intenção inicial
    const userId = interaction
      ? (interaction.member?.user || interaction.user).id
      : "sistema";

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "⚠️ Alerta de Risco de Churn",
            color: 0xe67e22, // Laranja escuro / Abóbora
            fields: [
              { name: "Empresa", value: getValue("empresa"), inline: true },
              { name: "Solicitante", value: getValue("pessoa"), inline: true },
              {
                name: "Canal e Detalhes",
                value: getValue("canal_motivo"),
                inline: false,
              },
              {
                name: "Status",
                value: `Aguardando negociação de retenção por <@${userId}>.`,
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
                custom_id: "intencao_retido",
                label: "✅ Cliente Retido",
              },
              {
                type: 2,
                style: 4,
                custom_id: "intencao_cancelado",
                label: "❌ Churn Confirmado",
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
    const statusIndex = embed.fields.findIndex((f: any) => f.name === "Status");
    const userId = (interaction.member?.user || interaction.user).id;

    if (customId === "intencao_retido") {
      embed.color = 0x2ecc71; // Verde Sucesso
      embed.fields[statusIndex].value =
        `✅ Reversão de churn bem-sucedida por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } }; // Purga botões
    }

    if (customId === "intencao_cancelado") {
      embed.color = 0xe74c3c; // Vermelho Falha
      embed.fields[statusIndex].value =
        `❌ Churn inevitável. Cancelamento confirmado por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } }; // Purga botões
    }
  },
};
