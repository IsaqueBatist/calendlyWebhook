import type { DiscordCommandModule } from "../types";

export const CaseCommand: DiscordCommandModule = {
  name: "case-pedir",
  modalId: "form_edicao",
  buttonPrefixes: ["edicao_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_edicao",
      title: "Pedido de Nova Edição",
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
              label: "CATEGORIA (Obras | Hospitais | Outro)",
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
              label: "OBSERVAÇÕES (Logo, Google Earth, etc)",
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
            title: "🎬 Geração de Case",
            color: 0x9b59b6, // Roxo Marketing
            fields: [
              { name: "Tipo", value: getValue("tipo"), inline: true },
              { name: "Categoria", value: getValue("categoria"), inline: true },
              { name: "Período", value: getValue("periodo"), inline: false },
              {
                name: "Observações Específicas",
                value: getValue("obs"),
                inline: false,
              },
              {
                name: "Status",
                value: "Aguardando fila de edição.",
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
                custom_id: "edicao_produzindo",
                label: "⚙️ Em Produção",
              },
              {
                type: 2,
                style: 3,
                custom_id: "edicao_concluida",
                label: "✅ Concluído (Entregue)",
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
    const newComponents = JSON.parse(
      JSON.stringify(interaction.message.components),
    );

    if (customId === "edicao_produzindo") {
      if (embed.fields[statusIndex].value.includes("Em produção"))
        return {
          type: 7,
          data: { embeds: [embed], components: interaction.message.components },
        };
      embed.color = 0xf1c40f; // Amarelo
      embed.fields[statusIndex].value =
        `⚙️ Em produção (Assumido por <@${(interaction.member?.user || interaction.user).id}>).`;
      newComponents[0].components.find(
        (b: any) => b.custom_id === "edicao_produzindo",
      ).disabled = true;
      return { type: 7, data: { embeds: [embed], components: newComponents } };
    }

    if (customId === "edicao_concluida") {
      embed.color = 0x00ff00;
      embed.fields[statusIndex].value =
        `✅ Edição finalizada e entregue por <@${(interaction.member?.user || interaction.user).id}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } }; // Finaliza
    }
  },
};
