// src/discord/commands/logistica.ts
import type { DiscordCommandModule } from "../types";

export const LogisticaCommand: DiscordCommandModule = {
  name: "solicitar-envio",
  modalId: "form_logistica",
  buttonPrefixes: ["log_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_logistica",
      title: "Solicitação de Envio",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "resp",
              label: "VENDEDOR RESPONSÁVEL",
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
              custom_id: "empresa",
              label: "EMPRESA E CNPJ",
              style: 1,
              placeholder: "Ex: Sentric - 00.000.000/0001-00",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "equip",
              label: "Nº DE EQUIPAMENTOS & MOTIVO",
              style: 1,
              placeholder: "Ex: 2 Câmeras - Venda Nova",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "endereco",
              label: "ENDEREÇO COMPLETO",
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
              custom_id: "nota",
              label: "NOTA FISCAL EMITIDA?",
              style: 1,
              placeholder: "Sim / Não",
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
            title: "📦 Novo Pedido para Logística",
            color: 0x3498db, // Azul
            fields: [
              { name: "Vendedor", value: getValue("resp"), inline: true },
              {
                name: "Empresa / CNPJ",
                value: getValue("empresa"),
                inline: true,
              },
              {
                name: "Equipamentos / Motivo",
                value: getValue("equip"),
                inline: false,
              },
              { name: "Endereço", value: getValue("endereco"), inline: false },
              { name: "NF Emitida?", value: getValue("nota"), inline: true },
              {
                name: "Status do Envio",
                value: "Pendente de separação.",
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
                custom_id: "log_separando",
                label: "🚧 Em Separação",
              },
              {
                type: 2,
                style: 3,
                custom_id: "log_enviado",
                label: "🚚 Enviado",
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
      (f: any) => f.name === "Status do Envio",
    );

    const newComponents = JSON.parse(
      JSON.stringify(interaction.message.components),
    );
    const btnSeparando = newComponents[0].components.find(
      (b: any) => b.custom_id === "log_separando",
    );

    if (customId === "log_separando") {
      if (embed.fields[statusIndex].value.includes("Em separação"))
        return {
          type: 7,
          data: { embeds: [embed], components: interaction.message.components },
        };
      embed.color = 0xf1c40f; // Amarelo
      embed.fields[statusIndex].value =
        `🚧 Em separação por <@${interaction.member.user.id}>.`;
      if (btnSeparando) btnSeparando.disabled = true;
      return { type: 7, data: { embeds: [embed], components: newComponents } };
    }

    if (customId === "log_enviado") {
      embed.color = 0x00ff00;
      embed.fields[statusIndex].value =
        `🚚 Despachado por <@${interaction.member.user.id}>.`;
      return { type: 7, data: { embeds: [embed], components: [] } }; // Finaliza o fluxo
    }
  },
};
