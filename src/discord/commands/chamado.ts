// src/discord/commands/chamado.ts
import { createChannelMessage } from "@/lib/discord-rest";
import type { DiscordCommandModule } from "../types";

// IDs de Integração
const CANAL_TECNICO_ID = "1511337183938613319";
const GABRIEL_ID = "1437511382370095217";

export const ChamadoCommand: DiscordCommandModule = {
  name: "abrir-chamado",
  modalId: "form_chamado",
  editModalId: "form_chamado_editar",
  crossoverModalId: "form_chamado_escalar", // Usado para pegar o submit do modal técnico
  buttonPrefixes: ["chamado_", "tecnico_"],

  // 1. MODAL INICIAL (Triagem - Nível 1)
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
              placeholder: "Ex: Cliente relatou que a câmera parou de enviar timelapse...",
              required: true,
            },
          ],
        },
      ],
    },
  }),

  // 2. CARD INICIAL GERADO NO CHAT GERAL
  handleSubmission: (components, interaction) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    const userId = interaction ? (interaction.member?.user || interaction.user).id : "sistema";

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "🎫 Atendimento Nível 1",
            color: 0x3498db, // Azul
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
        components: [
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
              {
                type: 2,
                style: 1,
                custom_id: "chamado_editar",
                label: "✏️ Editar",
              },
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
        ],
      },
    };
  },

  // 3. AÇÕES DOS BOTÕES (No Geral e no Canal Técnico)
  handleComponent: (interaction) => {
    const customId = interaction.data.custom_id;
    const embed = interaction.message.embeds[0];
    const userId = (interaction.member?.user || interaction.user).id;

    // --- LÓGICAS DOS BOTÕES NO CANAL TÉCNICO ---
    if (customId === "tecnico_resolvido") {
      embed.color = 0x00ff00; // Verde
      embed.fields.push({
        name: "Resolução",
        value: `✅ Resolvido pelo técnico <@${userId}>.`
      });
      // Limpa os botões e remove o texto de menção (se houver) para deixar o chat limpo
      return { type: 7, data: { content: "", embeds: [embed], components: [] } };
    }

    if (customId === "tecnico_escalar_gabriel") {
      embed.color = 0x9b59b6; // Roxo (Cor de Gestão)
      embed.fields.push({
        name: "Escalação (Nível 3)",
        value: `👑 Escalado para o gestor por <@${userId}>.`
      });

      // Desabilita o botão do Gabriel após clicar
      const newComponents = JSON.parse(JSON.stringify(interaction.message.components));
      for (const row of newComponents) {
        const btn = row.components.find((b: any) => b.custom_id === "tecnico_escalar_gabriel");
        if (btn) { btn.disabled = true; break; }
      }

      return {
        type: 7,
        data: {
          content: `🚨 Atenção <@${GABRIEL_ID}>, um chamado foi escalado para você!`, // Menção no Discord
          embeds: [embed],
          components: newComponents
        }
      };
    }

    // --- LÓGICAS DO CARD DE NÍVEL 1 ---
    const historyIndex = embed.fields.findIndex((f: any) => f.name === "Histórico");
    const historyText = embed.fields[historyIndex]?.value || "";

    // Abrir Modal para preencher detalhes técnicos da Escalação
    if (customId === "chamado_escalar") {
      return {
        type: 9, // Modal
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
                  style: 2, // Caixa grande
                  required: true,
                },
              ],
            }
          ],
        },
      };
    }

    if (customId === "chamado_editar") {
      const getField = (name: string) => embed.fields.find((f: any) => f.name === name)?.value || "";
      return {
        type: 9,
        data: {
          custom_id: "form_chamado_editar",
          title: "Editar Triagem",
          components: [
            { type: 1, components: [{ type: 4, custom_id: "cliente", label: "CLIENTE", style: 1, required: true, value: getField("Cliente") }] },
            { type: 1, components: [{ type: 4, custom_id: "camera", label: "CÂMERA", style: 1, required: true, value: getField("Câmera") }] },
            { type: 1, components: [{ type: 4, custom_id: "origem", label: "ORIGEM", style: 1, required: true, value: getField("Origem") }] },
            { type: 1, components: [{ type: 4, custom_id: "assunto", label: "ASSUNTO INICIAL", style: 2, required: true, value: getField("Assunto") }] },
          ],
        },
      };
    }

    const newComponentsN1 = JSON.parse(JSON.stringify(interaction.message.components));
    const disableButton = (id: string) => {
      for (const row of newComponentsN1) {
        const btn = row.components.find((b: any) => b.custom_id === id);
        if (btn) { btn.disabled = true; break; }
      }
    };

    if (customId === "chamado_agendado") {
      if (historyText.includes("Agendado")) return { type: 7, data: { embeds: [embed], components: interaction.message.components } };
      embed.fields[historyIndex].value += `\n📅 Agendado com cliente (por <@${userId}>).`;
      disableButton("chamado_agendado");
      return { type: 7, data: { embeds: [embed], components: newComponentsN1 } };
    }

    if (customId === "chamado_resolvido") {
      embed.color = 0x00ff00; // Verde
      embed.fields[historyIndex].value += `\n✅ Resolvido no Nível 1 por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }
  },

  // 4. ENVIO DO MODAL DE ESCALAÇÃO (Crossover)
  handleCrossoverSubmission: async (components, interaction) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)?.components[0].value;

    const originalEmbed = interaction.message.embeds[0];
    const getField = (name: string) => originalEmbed.fields.find((f: any) => f.name === name)?.value || "";

    const userId = (interaction.member?.user || interaction.user).id;

    // A. Cria a mensagem que vai para o CANAL DE SUPORTE TÉCNICO
    const techMessage = {
      embeds: [
        {
          title: "🚨 Chamado Técnico Escalado (Nível 2)",
          color: 0xe74c3c, // Vermelho de Alerta Técnico
          fields: [
            { name: "Cliente", value: getField("Cliente"), inline: true },
            { name: "Câmera", value: getField("Câmera"), inline: true },
            { name: "Problema Técnico", value: getValue("problema_tec"), inline: false },
            { name: "Escalado por", value: `<@${userId}>`, inline: false },
          ],
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              custom_id: "tecnico_resolvido",
              label: "✅ Marcar como Resolvido",
            },
            {
              type: 2,
              style: 4, // Vermelho (botão de alerta)
              custom_id: "tecnico_escalar_gabriel",
              label: "👑 Escalar para o Gabriel",
            }
          ]
        }
      ]
    };

    try {
      // Dispara o Card para o chat do suporte técnico Nível 2
      await createChannelMessage(CANAL_TECNICO_ID, techMessage);
    } catch (error) {
      console.error("Erro ao enviar chamado para o canal técnico:", error);
    }

    // B. Atualiza a mensagem original no canal Nível 1 informando que já foi enviado
    const historyIndex = originalEmbed.fields.findIndex((f: any) => f.name === "Histórico");
    originalEmbed.color = 0x95a5a6; // Fica cinza indicando que a bola passou para outra pessoa
    originalEmbed.fields[historyIndex].value += `\n🛠️ **Escalado para Suporte Nível 2** por <@${userId}>.`;

    return {
      type: 7, // Atualiza a mensagem existente onde o botão "Escalar" foi clicado
      data: { embeds: [originalEmbed], components: [] }, // Removemos os botões do Nível 1 pois ele já escalou
    };
  },

  // 5. EDIÇÃO DO CARD NÍVEL 1
  handleEditSubmission: (interaction) => {
    const components = interaction.data.components;
    const getValue = (id: string) => components.find((c: any) => c.components[0].custom_id === id)?.components[0].value;
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
