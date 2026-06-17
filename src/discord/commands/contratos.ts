// src/discord/commands/contratos.ts
import type { DiscordCommandModule } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. MÓDULO: NOVO CONTRATO
// ─────────────────────────────────────────────────────────────────────────────
export const NovoContratoCommand: DiscordCommandModule = {
  name: "novo-contrato",
  modalId: "form_novo_contrato",
  buttonPrefixes: ["novo_contrato_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_novo_contrato",
      title: "Solicitação de Novo Contrato",
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
              custom_id: "condicoes",
              label: "Nº DE CÂMERAS E PRAZO (Ex: 5 / 12 meses)",
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
              custom_id: "ficha",
              label: "E-MAIL COM FICHA ENVIADO?",
              style: 1,
              placeholder: "Sim / Não",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "testemunha_1",
              label: "TESTEMUNHA 1 (Nome e CPF)",
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
              custom_id: "testemunha_2",
              label: "TESTEMUNHA 2 (Nome e CPF)",
              style: 1,
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
            title: "📄 Novo Contrato Solicitado",
            color: 0x3498db, // Azul
            fields: [
              { name: "Empresa", value: getValue("empresa"), inline: false },
              {
                name: "Câmeras e Prazo",
                value: getValue("condicoes"),
                inline: true,
              },
              {
                name: "Ficha Cadastral",
                value: getValue("ficha"),
                inline: true,
              },
              {
                name: "Testemunha 1",
                value: getValue("testemunha_1"),
                inline: false,
              },
              {
                name: "Testemunha 2",
                value: getValue("testemunha_2"),
                inline: false,
              },
              {
                name: "Status Atual",
                value: "⏳ Aguardando processamento...",
                inline: false,
              },
              { name: "Solicitado por", value: `<@${userId}>`, inline: false },
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
                custom_id: "novo_contrato_preparacao",
                label: "⏳ Em Preparação",
              },
              {
                type: 2,
                style: 1,
                custom_id: "novo_contrato_enviado",
                label: "📨 Contrato Enviado",
              },
              {
                type: 2,
                style: 3,
                custom_id: "novo_contrato_assinado",
                label: "✅ Contrato Assinado",
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
    const userId = (interaction.member?.user || interaction.user).id;
    const components = JSON.parse(
      JSON.stringify(interaction.message.components),
    );

    const statusIndex = embed.fields.findIndex(
      (f: any) => f.name === "Status Atual",
    );

    if (customId === "novo_contrato_preparacao") {
      embed.color = 0xf1c40f; // Amarelo
      embed.fields[statusIndex].value =
        `⏳ **Em preparação** (Atualizado por <@${userId}>)`;
      return { type: 7, data: { embeds: [embed], components: components } };
    }

    if (customId === "novo_contrato_enviado") {
      embed.color = 0x9b59b6; // Roxo
      embed.fields[statusIndex].value =
        `📨 **Enviado para o cliente** (Atualizado por <@${userId}>)`;
      return { type: 7, data: { embeds: [embed], components: components } };
    }

    if (customId === "novo_contrato_assinado") {
      embed.color = 0x00ff00; // Verde
      embed.fields[statusIndex].value =
        `✅ **Contrato Assinado!** (Finalizado por <@${userId}>)`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. MÓDULO: ALERTA DE CONTRATO VENCENDO
// ─────────────────────────────────────────────────────────────────────────────
export const AlertaContratoCommand: DiscordCommandModule = {
  name: "alerta-contrato",
  modalId: "form_alerta_contrato",
  buttonPrefixes: ["alerta_contrato_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_alerta_contrato",
      title: "Alerta de Fim de Contrato (< 3 meses)",
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
              custom_id: "data_fim",
              label: "DATA DE ENCERRAMENTO PREVISTO",
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
              custom_id: "equipamentos",
              label: "NÚMERO DE EQUIPAMENTOS ATIVOS",
              style: 1,
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
            title: "⚠️ Contrato Próximo do Fim",
            color: 0xffa500, // Laranja
            fields: [
              { name: "Empresa", value: getValue("empresa"), inline: true },
              {
                name: "Encerramento",
                value: getValue("data_fim"),
                inline: true,
              },
              {
                name: "Equipamentos",
                value: getValue("equipamentos"),
                inline: false,
              },
              {
                name: "Status Comercial",
                value: "Aguardando ação de retenção.",
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
                custom_id: "alerta_contrato_retido",
                label: "✅ Retido / Renovado",
              },
              {
                type: 2,
                style: 4,
                custom_id: "alerta_contrato_perdido",
                label: "❌ Churn (Cancelado)",
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
    const statusIndex = embed.fields.findIndex(
      (f: any) => f.name === "Status Comercial",
    );
    const userId = (interaction.member?.user || interaction.user).id;

    if (customId === "alerta_contrato_retido") {
      embed.color = 0x00ff00; // Verde
      embed.fields[statusIndex].value =
        `✅ Retido com sucesso por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }

    if (customId === "alerta_contrato_perdido") {
      embed.color = 0xff0000; // Vermelho
      embed.fields[statusIndex].value = `❌ Perda confirmada por <@${userId}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }
  },
};
