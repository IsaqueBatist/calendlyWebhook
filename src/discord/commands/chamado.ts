import type { DiscordCommandModule } from "../types";

export const EdicaoCommand: DiscordCommandModule = {
  name: "solicitar-edicao",
  modalId: "form_edicao",
  editModalId: "form_edicao_editar",
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
              custom_id: "empresa",
              label: "NOME DA EMPRESA",
              style: 1,
              placeholder: "Ex: Construtora Alfa",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "cliente",
              label: "CLIENTE",
              style: 1,
              placeholder: "Ex: João Silva",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "cameras",
              label: "CÂMERAS E UIDs (PODE LISTAR VÁRIAS)",
              style: 2, // Style 2 = Caixa de texto maior (multilinha)
              placeholder:
                "Ex: 3 Câmeras (Cam Norte - UID1, Cam Sul - UID2...)",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "link_drive",
              label: "LINK DO DRIVE (TIMELAPSE CRU)",
              style: 1,
              placeholder: "Ex: https://drive.google.com/...",
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
              label: "OBSERVAÇÕES",
              style: 2,
              placeholder: "Logos, orientações de corte, período, etc...",
              required: false,
            },
          ],
        },
      ],
    },
  }),

  handleSubmission: (components) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value || "Não informado";

    const obsValue = getValue("obs");
    const obsTexto =
      obsValue && obsValue.trim() !== ""
        ? obsValue
        : "Nenhuma observação informada.";

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "🎬 Nova Solicitação de Edição",
            color: 0x9b59b6, // Roxo Marketing
            fields: [
              { name: "Empresa", value: getValue("empresa"), inline: true },
              { name: "Cliente", value: getValue("cliente"), inline: true },
              {
                name: "Câmeras / UIDs",
                value: getValue("cameras"),
                inline: false,
              },
              {
                name: "Link do Drive (Cru)",
                value: getValue("link_drive"),
                inline: false,
              },
              { name: "Observações", value: obsTexto, inline: false },
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
              {
                type: 2,
                style: 2,
                custom_id: "edicao_editar",
                label: "✏️ Editar Dados",
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

    // FLUXO DE EDIÇÃO
    if (customId === "edicao_editar") {
      const getField = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";

      const currentObs = getField("Observações");

      return {
        type: 9,
        data: {
          custom_id: "form_edicao_editar",
          title: "Editar Solicitação de Edição",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "empresa",
                  label: "NOME DA EMPRESA",
                  style: 1,
                  required: true,
                  value: getField("Empresa"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "cliente",
                  label: "CLIENTE",
                  style: 1,
                  required: true,
                  value: getField("Cliente"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "cameras",
                  label: "CÂMERAS E UIDs (PODE LISTAR VÁRIAS)",
                  style: 2,
                  required: true,
                  value: getField("Câmeras / UIDs"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "link_drive",
                  label: "LINK DO DRIVE (TIMELAPSE CRU)",
                  style: 1,
                  required: true,
                  value: getField("Link do Drive (Cru)"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "obs",
                  label: "OBSERVAÇÕES",
                  style: 2,
                  required: false,
                  value: currentObs.includes("Nenhuma observação")
                    ? ""
                    : currentObs,
                },
              ],
            },
          ],
        },
      };
    }

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
      embed.color = 0x00ff00; // Verde
      embed.fields[statusIndex].value =
        `✅ Edição finalizada e entregue por <@${(interaction.member?.user || interaction.user).id}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }
  },

  handleEditSubmission: (interaction) => {
    const components = interaction.data.components;
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value || "Não informado";

    const embed = interaction.message.embeds[0];

    const updateField = (name: string, val: string) => {
      const idx = embed.fields.findIndex((f: any) => f.name === name);
      if (idx !== -1) embed.fields[idx].value = val;
    };

    const obsValue = getValue("obs");
    const obsTexto =
      obsValue && obsValue.trim() !== ""
        ? obsValue
        : "Nenhuma observação informada.";

    updateField("Empresa", getValue("empresa"));
    updateField("Cliente", getValue("cliente"));
    updateField("Câmeras / UIDs", getValue("cameras"));
    updateField("Link do Drive (Cru)", getValue("link_drive"));
    updateField("Observações", obsTexto);

    return {
      type: 7, // UPDATE_MESSAGE
      data: {
        embeds: [embed],
        components: interaction.message.components,
      },
    };
  },
};
