// src/discord/commands/escalar.ts
import { InteractionResponseType } from "discord-interactions";
import type { DiscordCommandModule } from "../types";

export const EscalarCommand: DiscordCommandModule = {
  name: "escalar",
  modalId: "form_escalar",

  renderModal: () => ({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: "form_escalar",
      title: "Escalonamento",
      components: [
        {
          type: 1,
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
                  custom_id: "tempo",
                  label: "TEMPO OFFLINE/COM PROBLEMA",
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
                  custom_id: "tentativas",
                  label: "Tentativas (datas/canais)",
                  style: 2,
                  required: true,
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "diagnostico",
                  label: "DIAGNÓSTICO",
                  style: 2,
                  required: true,
                },
              ],
            },
          ],
        },
        // ... (Adicione os demais campos do formulário aqui)
      ],
    },
  }),

  handleSubmission: (components) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    const message = `**ESCALONAMENTO**\n**CLIENTE:** ${getValue("cliente")}\n...`;

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: message },
    };
  },
};
