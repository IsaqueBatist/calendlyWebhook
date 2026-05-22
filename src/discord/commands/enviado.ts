import type { DiscordCommandModule } from "../types";

export const EnviadoCommand: DiscordCommandModule = {
  name: "registrar-envio",
  modalId: "form_enviado",

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
              custom_id: "modelo",
              label: "MODELO",
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
              custom_id: "chip",
              label: "CHIP (Operadora / ICCID)",
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
              custom_id: "tecnologia",
              label: "TIPO (4G/IP) E FONTE (Solar/Energia)",
              style: 1,
              placeholder: "Ex: Reolink IP - Solar",
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
            title: "📮 Equipamento Despachado",
            color: 0x2ecc71, // Verde Sucesso
            fields: [
              {
                name: "Câmera / UID",
                value: getValue("nome_uid"),
                inline: false,
              },
              { name: "Modelo", value: getValue("modelo"), inline: true },
              { name: "Chip", value: getValue("chip"), inline: true },
              {
                name: "Especificações",
                value: getValue("tecnologia"),
                inline: false,
              },
            ],
          },
        ],
      },
    };
  },
};
