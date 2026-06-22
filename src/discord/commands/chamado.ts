// src/discord/commands/chamado.ts
import { createChannelMessage, editChannelMessage } from "@/lib/discord-rest";
import type { DiscordCommandModule } from "../types";

// IDs de Integração
const CANAL_TECNICO_ID = "1511337183938613319";
const GABRIEL_ID = "1437511382370095217";

// ADICIONADO: Função para notificar o Gabriel no canal específico
async function notificarGabriel(origem: string, usuarioQueEscalou: string) {
  const canalNotificacaoId = "1518656020883439756";
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!botToken) {
    console.error("Token do bot não configurado.");
    return;
  }

  try {
    await fetch(
      `https://discord.com/api/v10/channels/${canalNotificacaoId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `🚨 <@${GABRIEL_ID}>, você tem uma nova escalação!\n**Origem:** ${origem}\n**Escalado por:** <@${usuarioQueEscalou}>`,
        }),
      },
    );
  } catch (error) {
    console.error("Erro ao notificar o Gabriel:", error);
  }
}

// Definição global das ações originais do Nível 1 para restauração na devolução
const N1_COMPONENTS = [
  {
    type: 1,
    components: [
      {
        type: 2,
        style: 3,
        custom_id: "chamado_resolvido",
        label: "✅ Resolvido (N1)",
      },
      {
        type: 2,
        style: 2,
        custom_id: "chamado_agendado",
        label: "📅 Agendado",
      },
      { type: 2, style: 1, custom_id: "chamado_editar", label: "✏️ Editar" },
    ],
  },
  {
    type: 1,
    components: [
      {
        type: 2,
        style: 4,
        custom_id: "chamado_escalar",
        label: "🛠️ Escalar p/ Suporte Técnico",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO DO ATENDIMENTO INICIAL (NÍVEL 1)
// ─────────────────────────────────────────────────────────────────────────────
export const ChamadoCommand: DiscordCommandModule = {
  name: "abrir-chamado",
  modalId: "form_chamado",
  editModalId: "form_chamado_editar",
  crossoverModalId: "form_chamado_escalar",
  buttonPrefixes: ["chamado_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_chamado",
      title: "Triagem de Atendimento (Nível 1)",
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
              custom_id: "origem",
              label: "ORIGEM (Cliente chamou / Nós chamamos)",
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
              custom_id: "assunto",
              label: "ASSUNTO INICIAL (Breve)",
              style: 2,
              placeholder:
                "Ex: Cliente relatou que a câmera parou de enviar...",
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
    const userId = interaction
      ? (interaction.member?.user || interaction.user).id
      : "sistema";

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "🎫 Atendimento Nível 1",
            color: 0x3498db,
            fields: [
              { name: "Cliente", value: getValue("cliente"), inline: true },
              { name: "Câmera", value: getValue("camera"), inline: true },
              { name: "Origem", value: getValue("origem"), inline: false },
              { name: "Assunto", value: getValue("assunto"), inline: false },
              {
                name: "Histórico",
                value: `Atendimento iniciado por <@${userId}>.`,
                inline: false,
              },
            ],
          },
        ],
        components: N1_COMPONENTS,
      },
    };
  },

  handleComponent: (interaction) => {
    const customId = interaction.data.custom_id;
    const embed = interaction.message.embeds[0];
    const userId = (interaction.member?.user || interaction.user).id;

    const historyIndex = embed.fields.findIndex(
      (f: any) => f.name === "Histórico",
    );
    const historyText = embed.fields[historyIndex]?.value || "";

    if (customId === "chamado_escalar") {
      return {
        type: 9,
        data: {
          custom_id: "form_chamado_escalar",
          title: "Detalhar Problema Técnico",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "problema_tec",
                  label: "DESCRIÇÃO DETALHADA DO PROBLEMA",
                  style: 2,
                  required: true,
                },
              ],
            },
          ],
        },
      };
    }

    if (customId === "chamado_editar") {
      const getField = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";
      return {
        type: 9,
        data: {
          custom_id: "form_chamado_editar",
          title: "Editar Triagem",
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
                  custom_id: "origem",
                  label: "ORIGEM",
                  style: 1,
                  required: true,
                  value: getField("Origem"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "assunto",
                  label: "ASSUNTO INICIAL",
                  style: 2,
                  required: true,
                  value: getField("Assunto"),
                },
              ],
            },
          ],
        },
      };
    }

    const newComponentsN1 = JSON.parse(
      JSON.stringify(interaction.message.components),
    );
    const disableButton = (id: string) => {
      for (const row of newComponentsN1) {
        const btn = row.components.find((b: any) => b.custom_id === id);
        if (btn) {
          btn.disabled = true;
          break;
        }
      }
    };

    if (customId === "chamado_agendado") {
      if (historyText.includes("Agendado"))
        return {
          type: 7,
          data: { embeds: [embed], components: interaction.message.components },
        };
      embed.fields[historyIndex].value +=
        `\n📅 Agendado com cliente (por <@${userId}>).`;
      disableButton("chamado_agendado");
      return {
        type: 7,
        data: { embeds: [embed], components: newComponentsN1 },
      };
    }

    if (customId === "chamado_resolvido") {
      embed.color = 0x00ff00;
      embed.fields[historyIndex].value +=
        `\n✅ Resolvido no Nível 1 por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }
  },

  handleCrossoverSubmission: async (components, interaction) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;
    const originalEmbed = interaction.message.embeds[0];
    const getField = (name: string) =>
      originalEmbed.fields.find((f: any) => f.name === name)?.value || "";
    const userId = (interaction.member?.user || interaction.user).id;

    // Criamos a carga técnica injetando os metadados de rastreio no footer
    const techMessage = {
      embeds: [
        {
          title: "🚨 Chamado Técnico Escalado (Nível 2)",
          color: 0xe74c3c,
          fields: [
            { name: "Cliente", value: getField("Cliente"), inline: true },
            { name: "Câmera", value: getField("Câmera"), inline: true },
            {
              name: "Problema Técnico",
              value: getValue("problema_tec"),
              inline: false,
            },
            { name: "Escalado por", value: `<@${userId}>`, inline: false },
          ],
          footer: {
            text: `N1_MSG:${interaction.message.id}|N1_CH:${interaction.channel_id}`,
          },
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              custom_id: "tecnico_resolvido",
              label: "✅ Resolvido",
            },
            {
              type: 2,
              style: 2,
              custom_id: "tecnico_add_obs",
              label: "📝 Add Observação",
            },
            {
              type: 2,
              style: 2,
              custom_id: "tecnico_devolver",
              label: "↩️ Devolver p/ Suporte",
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              custom_id: "tecnico_escalar_gabriel",
              label: "👑 Escalar para o Gabriel",
            },
          ],
        },
      ],
    };

    try {
      await createChannelMessage(CANAL_TECNICO_ID, techMessage);
    } catch (error) {
      console.error("Erro ao escalar chamado:", error);
    }

    const historyIndex = originalEmbed.fields.findIndex(
      (f: any) => f.name === "Histórico",
    );
    originalEmbed.color = 0x95a5a6;
    originalEmbed.fields[historyIndex].value +=
      `\n🛠️ **Escalado para Suporte Nível 2** por <@${userId}>.`;

    return {
      type: 7,
      data: { embeds: [originalEmbed], components: [] },
    };
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
    updateField("Origem", getValue("origem"));
    updateField("Assunto", getValue("assunto"));

    return {
      type: 7,
      data: { embeds: [embed], components: interaction.message.components },
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO DO SUPORTE TÉCNICO (NÍVEL 2)
// ─────────────────────────────────────────────────────────────────────────────
export const ChamadoTecnicoCommand: DiscordCommandModule = {
  name: "chamado-tecnico",
  modalId: "form_tecnico_obs", // Modal de adicinar observação
  editModalId: "form_tecnico_devolver", // Modal de motivo de devolução
  buttonPrefixes: ["tecnico_"],

  handleComponent: async (interaction) => {
    const customId = interaction.data.custom_id;

    if (customId === "tecnico_add_obs") {
      return {
        type: 9,
        data: {
          custom_id: "form_tecnico_obs",
          title: "Adicionar Observação no Card",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "observacao",
                  label: "OBSERVAÇÃO",
                  style: 2,
                  required: true,
                },
              ],
            },
          ],
        },
      };
    }

    if (customId === "tecnico_devolver") {
      return {
        type: 9,
        data: {
          custom_id: "form_tecnico_devolver",
          title: "Motivo da Devolução do Chamado",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "motivo_devolucao",
                  label: "EXPLIQUE O MOTIVO DA DEVOLUÇÃO",
                  style: 2,
                  required: true,
                },
              ],
            },
          ],
        },
      };
    }

    const embed = interaction.message.embeds[0];
    const userId = (interaction.member?.user || interaction.user).id;

    if (customId === "tecnico_resolvido") {
      embed.color = 0x00ff00;
      embed.fields.push({
        name: "Resolução",
        value: `✅ Resolvido pelo técnico <@${userId}>.`,
      });
      return {
        type: 7,
        data: { content: "", embeds: [embed], components: [] },
      };
    }

    if (customId === "tecnico_escalar_gabriel") {
      embed.color = 0x9b59b6;
      embed.fields.push({
        name: "Escalação (Nível 3)",
        value: `👑 Escalado para o gestor por <@${userId}>.`,
      });

      const newComponents = JSON.parse(
        JSON.stringify(interaction.message.components),
      );
      for (const row of newComponents) {
        const btn = row.components.find(
          (b: any) => b.custom_id === "tecnico_escalar_gabriel",
        );
        if (btn) {
          btn.disabled = true;
          break;
        }
      }

      // ADICIONADO: Dispara a notificação assíncrona para o outro canal informando "Técnico"
      await notificarGabriel("Técnico", userId);

      return {
        type: 7,
        data: {
          content: `🚨 Atenção <@${GABRIEL_ID}>, chamado escalado de urgência!`,
          embeds: [embed],
          components: newComponents,
        },
      };
    }
  },

  // Processa o Modal de Adicionar Observação (Nível 2)
  handleSubmission: (components, interaction) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;
    const obsText = getValue("observacao");
    const embed = interaction.message.embeds[0];
    const userId = (interaction.member?.user || interaction.user).id;

    let obsField = embed.fields.find(
      (f: any) => f.name === "Observações Técnicas",
    );
    if (!obsField) {
      obsField = { name: "Observações Técnicas", value: "" };
      embed.fields.push(obsField);
    }
    obsField.value += `\n• ${obsText} (por <@${userId}>)`;

    return {
      type: 7,
      data: { embeds: [embed], components: interaction.message.components },
    };
  },

  // Processa o Modal de Devolução (Nível 2 -> Nível 1)
  handleEditSubmission: async (interaction) => {
    const components = interaction.data.components;
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;
    const motivoText = getValue("motivo_devolucao");

    const techEmbed = interaction.message.embeds[0];
    const footerText = techEmbed.footer?.text || "";
    const userId = (interaction.member?.user || interaction.user).id;

    // Resgata os IDs originais guardados de forma oculta no rodapé
    const msgMatch = footerText.match(/N1_MSG:(\d+)/);
    const chMatch = footerText.match(/N1_CH:(\d+)/);

    if (msgMatch && chMatch) {
      const n1MsgId = msgMatch[1];
      const n1ChanId = chMatch[1];

      try {
        // Busca o card original do Nível 1 na API do Discord
        const res = await fetch(
          `https://discord.com/api/v10/channels/${n1ChanId}/messages/${n1MsgId}`,
          {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
          },
        );

        if (res.ok) {
          const n1Msg = await res.json();
          const n1Embed = n1Msg.embeds[0];

          if (n1Embed) {
            const hIdx = n1Embed.fields.findIndex(
              (f: any) => f.name === "Histórico",
            );
            if (hIdx !== -1) {
              n1Embed.fields[hIdx].value +=
                `\n↩️ **Devolvido pelo Técnico:** *${motivoText}* (por <@${userId}>).`;
            }
            n1Embed.color = 0xf1c40f; // Altera a cor de destaque para Amarelo (Atenção/Pendente)

            // Atualiza cirurgicamente o card do Nível 1 reativando os botões e mudando a cor
            await editChannelMessage(n1ChanId, n1MsgId, {
              embeds: [n1Embed],
              components: N1_COMPONENTS,
            });
          }
        }
      } catch (error) {
        console.error("Falha ao comunicar devolução para o card N1:", error);
      }
    }

    // Atualiza o próprio card técnico para registrar que foi devolvido e encerra as ações ali
    techEmbed.color = 0xe67e22; // Laranja Aviso
    techEmbed.fields.push({
      name: "Status Atual",
      value: `↩️ Chamado devolvido para a triagem (N1) pelo motivo: *${motivoText}*`,
    });

    return {
      type: 7,
      data: { content: "", embeds: [techEmbed], components: [] }, // Mata os botões do N2
    };
  },
};
