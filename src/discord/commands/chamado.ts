import { InteractionResponseType } from "discord-interactions";
import type { DiscordCommandModule } from "../types";

const GABRIEL_ID = "1437511382370095217";

export const ChamadoCommand: DiscordCommandModule = {
  name: "abrir-chamado",
  modalId: "form_chamado",
  editModalId: "form_chamado_editar",
  buttonPrefixes: ["chamado_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_chamado",
      title: "Abertura de Chamado de Suporte",
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
              custom_id: "tipo",
              label: "TIPO (Remoto / Físico / Inicio cliente)",
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

  // Implementação adequada à assinatura global
  handleSubmission: (components, interaction) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    // Captura o ID caso a interação seja fornecida pelo roteador
    const userId = interaction
      ? (interaction.member?.user || interaction.user).id
      : "sistema";

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "🎫 Chamado Aberto",
            color: 0xffa500,
            fields: [
              { name: "Cliente", value: getValue("cliente"), inline: true },
              { name: "Câmera", value: getValue("camera"), inline: true },
              { name: "Tipo", value: getValue("tipo"), inline: false },
              { name: "Problema", value: getValue("problema"), inline: false },
              {
                name: "Histórico de Ações",
                value: `D+0: Chamado aberto por <@${userId}> via WhatsApp.`,
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
                style: 2,
                custom_id: "chamado_agendado",
                label: "📅 Agendado (Calendly)",
              },
              {
                type: 2,
                style: 1,
                custom_id: "chamado_editar",
                label: "✏️ Editar Dados",
              },
            ],
          },
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3,
                custom_id: "chamado_resolvido",
                label: "✅ Resolvido",
              },
              {
                type: 2,
                style: 4,
                custom_id: "chamado_escalar",
                label: "🚨 Escalar para Gabriel",
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
    const historyIndex = embed.fields.findIndex(
      (f: any) => f.name === "Histórico de Ações",
    );
    const historyText = embed.fields[historyIndex].value;
    const userId = (interaction.member?.user || interaction.user).id;

    if (customId === "chamado_editar") {
      const getField = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";
      return {
        type: 9,
        data: {
          custom_id: "form_chamado_editar",
          title: "Editar Chamado",
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
                  value: getField("Cliente"),
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
                  value: getField("Câmera"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "tipo",
                  label: "TIPO (Remoto / Físico / Inicio cliente)",
                  style: 1,
                  required: true,
                  value: getField("Tipo"),
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
                  value: getField("Problema"),
                },
              ],
            },
          ],
        },
      };
    }

    const newComponents = JSON.parse(
      JSON.stringify(interaction.message.components),
    );
    const disableButton = (id: string) => {
      for (const row of newComponents) {
        const btn = row.components.find((b: any) => b.custom_id === id);
        if (btn) {
          btn.disabled = true;
          break;
        }
      }
    };

    if (customId === "chamado_agendado") {
      if (historyText.includes("Agendado via Calendly")) {
        return {
          type: 7,
          data: { embeds: [embed], components: interaction.message.components },
        };
      }
      embed.fields[historyIndex].value +=
        `\n📅 Agendado via Calendly (Registrado por <@${userId}>).`;
      disableButton("chamado_agendado");
      return { type: 7, data: { embeds: [embed], components: newComponents } };
    }

    if (customId === "chamado_resolvido") {
      embed.color = 0x00ff00;
      embed.fields[historyIndex].value += `\n✅ Resolvido — chamado encerrado.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }

    if (customId === "chamado_escalar") {
      embed.color = 0xff0000;
      embed.fields[historyIndex].value += `\n🚨 Escalado para Gabriel.`;
      return {
        type: 7,
        data: {
          content: `🚨 <@${GABRIEL_ID}>, novo chamado escalado! Assuma em até 24h.`,
          embeds: [embed],
          components: [],
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

    updateField("Cliente", getValue("cliente"));
    updateField("Câmera", getValue("camera"));
    updateField("Tipo", getValue("tipo"));
    updateField("Problema", getValue("problema"));

    return {
      type: 7,
      data: { embeds: [embed], components: interaction.message.components },
    };
  },
};
