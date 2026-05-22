import type { DiscordCommandModule } from "../types";

export const CancelamentoCommand: DiscordCommandModule = {
  name: "registrar-cancelamento",
  modalId: "form_cancelamento",

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_cancelamento",
      title: "Registro de Churn (Cancelamento)",
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
              label: "SOLICITANTE",
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
              custom_id: "canal",
              label: "CANAL (Email, WhatsApp, Ligação)",
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
              custom_id: "motivo",
              label: "MOTIVO DO CANCELAMENTO",
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
            title: "🛑 Registro de Cancelamento (Churn)",
            color: 0xed4245, // Vermelho Alerta
            fields: [
              { name: "Empresa", value: getValue("empresa"), inline: true },
              { name: "Solicitante", value: getValue("pessoa"), inline: true },
              {
                name: "Canal de Entrada",
                value: getValue("canal"),
                inline: false,
              },
              {
                name: "Motivo / Diagnóstico",
                value: getValue("motivo"),
                inline: false,
              },
            ],
          },
        ],
      },
    }; // Sem componentes (stateless)
  },
};
