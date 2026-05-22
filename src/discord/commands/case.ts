import type { DiscordCommandModule } from "../types";

export const CaseCommand: DiscordCommandModule = {
  name: "solicitar-case",
  modalId: "form_case",
  buttonPrefixes: ["case_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_case",
      title: "Pedido de Novo Case de Sucesso",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "tipo",
              label: "TIPO (Timelapse | Institucional | Outro)",
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
              custom_id: "categoria",
              label: "CATEGORIA (Obras | Prédio | Outro)",
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
              custom_id: "obs",
              label: "OBSERVAÇÕES DA EDIÇÃO DO CASE",
              style: 2,
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
      type: 4,
      data: {
        embeds: [
          {
            title: "📚 Nova Solicitação de Case",
            color: 0x34495e,
            fields: [
              { name: "Tipo", value: getValue("tipo"), inline: true },
              { name: "Categoria", value: getValue("categoria"), inline: true },
              { name: "Observações", value: getValue("obs"), inline: false },
              {
                name: "Status",
                value: "Aguardando produção do Marketing.",
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
                style: 1,
                custom_id: "case_produzindo",
                label: "⚙️ Em Produção",
              },
              {
                type: 2,
                style: 3,
                custom_id: "case_concluido",
                label: "✅ Concluído",
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
    const newComponents = JSON.parse(
      JSON.stringify(interaction.message.components),
    );

    if (customId === "case_produzindo") {
      if (embed.fields[statusIndex].value.includes("Em produção")) {
        return {
          type: 7,
          data: { embeds: [embed], components: interaction.message.components },
        };
      }
      embed.color = 0xf1c40f;
      embed.fields[statusIndex].value = `⚙️ Em produção por <@${userId}>.`;
      newComponents[0].components.find(
        (b: any) => b.custom_id === "case_produzindo",
      ).disabled = true;
      return { type: 7, data: { embeds: [embed], components: newComponents } };
    }

    if (customId === "case_concluido") {
      embed.color = 0x00ff00;
      embed.fields[statusIndex].value = `✅ Case concluído por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }
  },
};
