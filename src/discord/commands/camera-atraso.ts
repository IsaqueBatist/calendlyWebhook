// src/discord/commands/atraso.ts
import { createChannelMessage } from "@/lib/discord-rest";
import type { DiscordCommandModule } from "../types";
import { ContatoCommand } from "./contato";

const COBRAR_USER_ID = "1490760968039301271";
const GABRIEL_ID = "1437511382370095217";

export const AtrasoCommand: DiscordCommandModule = {
  name: "registrar-camera-atraso",
  modalId: "form_atraso",
  editModalId: "form_atraso_editar",
  crossoverModalId: "form_atraso_para_contato",
  buttonPrefixes: ["atraso_"],

  // Renderiza o formulário de cadastro para a logística
  renderModal: () => ({
    type: 9, // MODAL
    data: {
      custom_id: "form_atraso",
      title: "Registrar Câmera em Atraso",
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
              label: "CÂMERA / UID",
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
              label: "TEMPO DE ATRASO (EX: 5 DIAS)",
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
              custom_id: "telefone",
              label: "NÚMERO DO RESPONSÁVEL",
              style: 1,
              required: false,
            },
          ],
        }, // Novo campo opcional
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "obs",
              label: "OBSERVAÇÕES DO DASHBOARD",
              style: 2,
              required: false,
            },
          ],
        },
      ],
    },
  }),

  // Processa a submissão inicial e monta o painel interativo no canal #cameras-atrasadas
  handleSubmission: (components) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value || "Não informado";

    return {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        embeds: [
          {
            title: "⏰ Alerta: Validação de Câmera em Atraso",
            color: 0xe74c3c, // Vermelho Alerta
            fields: [
              { name: "Cliente", value: getValue("cliente"), inline: true },
              { name: "Câmera / UID", value: getValue("camera"), inline: true },
              {
                name: "Telefone do Responsável",
                value:
                  getValue("telefone") !== "Não informado"
                    ? getValue("telefone")
                    : "Não informado",
                inline: false,
              },
              {
                name: "Tempo de Atraso",
                value: getValue("tempo"),
                inline: false,
              },
              { name: "Observações", value: getValue("obs"), inline: false },
              {
                name: "Histórico de Ações",
                value: "🚨 Registro de atraso publicado pela logística.",
                inline: false,
              },
            ],
          },
        ],
        components: [
          {
            type: 1, // Linha de Ação Operacional
            components: [
              {
                type: 2,
                style: 1,
                custom_id: "atraso_cobrar",
                label: "🔔 Cobrar Responsável",
              },
              {
                type: 2,
                style: 2,
                custom_id: "atraso_editar",
                label: "✏️ Editar Dados",
              },
            ],
          },
          {
            type: 1, // Linha de Fechamento de Estado
            components: [
              {
                type: 2,
                style: 3,
                custom_id: "atraso_resolvido",
                label: "✅ Marcar como Resolvido",
              },
              {
                type: 2,
                style: 4,
                custom_id: "atraso_escalar",
                label: "🔺 Escalar para Gabriel",
              },
              {
                type: 2,
                style: 2,
                custom_id: "atraso_gerar_contato",
                label: "📞 Criar Contato",
              },
            ],
          },
        ],
      },
    };
  },

  // Gerencia cliques nos botões do painel
  handleComponent: (interaction) => {
    const customId = interaction.data.custom_id;
    const embed = interaction.message.embeds[0];
    const historyIndex = embed.fields.findIndex(
      (f: any) => f.name === "Histórico de Ações",
    );
    const userId = (interaction.member?.user || interaction.user).id;

    // Fluxo de Edição: Retorna o Modal com os dados capturados da própria mensagem
    if (customId === "atraso_editar") {
      const getField = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";
      return {
        type: 9,
        data: {
          custom_id: "form_atraso_editar",
          title: "Editar Dados do Registro",
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
                  label: "CÂMERA / UID",
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
                  custom_id: "tempo",
                  label: "TEMPO DE ATRASO",
                  style: 1,
                  required: true,
                  value: getField("Tempo de Atraso"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "telefone",
                  label: "NÚMERO DO RESPONSÁVEL",
                  style: 1,
                  required: false,
                  value:
                    getField("Telefone do Responsável") !== "Não informado"
                      ? getField("Telefone do Responsável")
                      : "",
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
                  value: getField("Observações"),
                },
              ],
            },
          ],
        },
      };
    }

    if (customId === "atraso_resolvido") {
      embed.color = 0x2ecc71;
      embed.fields[historyIndex].value +=
        `\n✅ **Resolvido:** Câmera validada e encerrada por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }

    if (customId === "atraso_escalar") {
      embed.color = 0x34495e;
      embed.fields[historyIndex].value +=
        `\n🔺 **Escalado:** Direcionado para gerência técnica devido ao estouro de SLA.`;
      return {
        type: 7,
        data: {
          content: `🔺 <@${GABRIEL_ID}>, atenção! Chamado de validação de câmera escalado em regime de urgência.`,
          embeds: [embed],
          components: [],
        },
      };
    }

    if (customId === "atraso_cobrar") {
      embed.fields[historyIndex].value +=
        `\n🔔 **Cobrança:** Notificação disparada por <@${userId}>.`;
      return {
        type: 7,
        data: {
          content: `⚠️ <@${COBRAR_USER_ID}>, solicitamos a validação imediata desta câmera pendente informada pela logística!`,
          embeds: [embed],
          components: interaction.message.components,
        },
      };
    }

    if (customId === "atraso_gerar_contato") {
      const getField = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";

      const tempoAtraso = getField("Tempo de Atraso");

      const telefoneOriginal = getField("Telefone do Responsável");
      const telefoneValue =
        telefoneOriginal !== "Não informado" ? telefoneOriginal : "";

      return {
        type: 9,
        data: {
          custom_id: "form_atraso_para_contato",
          title: "Transferir para Rastreio de Contato",
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
                  value: getField("Câmera / UID"),
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "telefone",
                  label: "TELEFONE DO CONTATO",
                  style: 1,
                  required: true,
                  value: telefoneValue, // Auto-preenche se o registro de atraso tiver o número!
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
                  value: `Câmera em atraso reportada pelo dashboard (${tempoAtraso}).`,
                },
              ],
            },
          ],
        },
      };
    }
  },

  // Processa a submissão do modal de edição e atualiza o card sem alterar o histórico de ações
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

    updateField("Cliente", getValue("cliente"));
    updateField("Câmera / UID", getValue("camera"));
    updateField(
      "Telefone do Responsável",
      getValue("telefone") !== "Não informado"
        ? getValue("telefone")
        : "Não informado",
    );
    updateField("Tempo de Atraso", getValue("tempo"));
    updateField("Observações", getValue("obs"));

    return {
      type: 7,
      data: { embeds: [embed], components: interaction.message.components },
    };
  },

  // Adicione a palavra async aqui ⬇️
  handleCrossoverSubmission: async (components, interaction) => {
    const contatoResponse = ContatoCommand.handleSubmission!(
      components,
      interaction,
    );

    // COLOQUE O ID REAL DO CANAL AQUI!
    const CANAL_CONTATOS_ID = "1515025013311541248";

    try {
      // Adicione o await aqui ⬇️ para a Vercel não matar o processo
      await createChannelMessage(CANAL_CONTATOS_ID, contatoResponse.data);
    } catch (error) {
      console.error("Erro no crossover:", error);
    }

    const embed = interaction.message.embeds[0];
    const historyIndex = embed.fields.findIndex(
      (f: any) => f.name === "Histórico de Ações",
    );
    const userId = (interaction.member?.user || interaction.user).id;

    embed.color = 0x9b59b6;
    embed.fields[historyIndex].value +=
      `\n📞 **Contato Gerado:** Transferido para rastreio por <@${userId}>.`;

    return {
      type: 7,
      data: { embeds: [embed], components: interaction.message.components },
    };
  },
};
