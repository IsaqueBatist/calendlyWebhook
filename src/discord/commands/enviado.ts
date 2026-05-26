import type { DiscordCommandModule } from "../types";

export const EnviadoCommand: DiscordCommandModule = {
  name: "registrar-envio",
  modalId: "form_enviado",
  editModalId: "form_enviado_editar",
  buttonPrefixes: ["enviado_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_enviado",
      title: "Registro de Expedição",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "nome_uid",
              label: "NOME DA CÂMERA E UID",
              style: 1,
              placeholder: "Ex: Obra Centro - A1B2C3D4",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "modelo_tipo",
              label: "MODELO E TIPO (4G ou IP)",
              style: 1,
              placeholder: "Ex: Reolink Trackmix - 4G",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "chip",
              label: "CHIP (Operadora / ICCID)",
              style: 1,
              placeholder: "Ex: Vivo - 8955...",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "alimentacao",
              label: "ALIMENTAÇÃO (Solar ou Elétrica)",
              style: 1,
              placeholder: "Ex: Solar",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "rastreio",
              label: "CÓDIGO DE RASTREIO",
              style: 1,
              placeholder: "Ex: AA123456789BR",
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
        ?.components[0].value;

    const rastreioValue = getValue("rastreio");
    const rastreioTexto =
      rastreioValue && rastreioValue.trim() !== ""
        ? rastreioValue
        : "Não informado";

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "📮 Equipamento Despachado",
            color: 0x2ecc71, // Verde Sucesso
            fields: [
              {
                name: "Câmera / UID",
                value: getValue("nome_uid"),
                inline: false,
              },
              {
                name: "Modelo e Tipo",
                value: getValue("modelo_tipo"),
                inline: true,
              },
              { name: "Chip", value: getValue("chip"), inline: true },
              {
                name: "Alimentação",
                value: getValue("alimentacao"),
                inline: false,
              },
              {
                name: "Código de Rastreio",
                value: rastreioTexto,
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
                custom_id: "enviado_editar",
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

    if (customId === "enviado_editar") {
      const getField = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";

      const currentRastreio = getField("Código de Rastreio");

      return {
        type: 9,
        data: {
          custom_id: "form_enviado_editar",
          title: "Editar Registro de Expedição",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "nome_uid",
                  label: "NOME DA CÂMERA E UID",
                  style: 1,
                  required: true,
                  value: getField("Câmera / UID"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "modelo_tipo",
                  label: "MODELO E TIPO (4G ou IP)",
                  style: 1,
                  required: true,
                  value: getField("Modelo e Tipo"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "chip",
                  label: "CHIP (Operadora / ICCID)",
                  style: 1,
                  required: true,
                  value: getField("Chip"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "alimentacao",
                  label: "ALIMENTAÇÃO (Solar ou Elétrica)",
                  style: 1,
                  required: true,
                  value: getField("Alimentação"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "rastreio",
                  label: "CÓDIGO DE RASTREIO",
                  style: 1,
                  required: false,
                  value:
                    currentRastreio === "Não informado" ? "" : currentRastreio,
                },
              ],
            },
          ],
        },
      };
    }
  },

  handleEditSubmission: (interaction) => {
    const components = interaction.data.components;
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    const embed = interaction.message.embeds[0];

    const updateField = (name: string, val: string) => {
      const idx = embed.fields.findIndex((f: any) => f.name === name);
      if (idx !== -1) embed.fields[idx].value = val;
    };

    const rastreioValue = getValue("rastreio");
    const rastreioTexto =
      rastreioValue && rastreioValue.trim() !== ""
        ? rastreioValue
        : "Não informado";

    updateField("Câmera / UID", getValue("nome_uid"));
    updateField("Modelo e Tipo", getValue("modelo_tipo"));
    updateField("Chip", getValue("chip"));
    updateField("Alimentação", getValue("alimentacao"));
    updateField("Código de Rastreio", rastreioTexto);

    return {
      type: 7, // UPDATE_MESSAGE
      data: {
        embeds: [embed],
        components: interaction.message.components,
      },
    };
  },
};
