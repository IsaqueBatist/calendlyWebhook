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
              custom_id: "resp_nota",
              label: "VENDEDOR RESP. / NF EMITIDA?",
              style: 1,
              placeholder: "Ex: João Silva - NF: Sim",
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
              custom_id: "destinatario",
              label: "DESTINATÁRIO (Nome, CPF e Tel)",
              style: 1,
              placeholder: "Ex: Carlos Silva, 123.456.789-00, (11) 9999-9999",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "equip_detalhes",
              label: "EQUIPAMENTOS, ALIMENTAÇÃO E MOTIVO",
              style: 1,
              placeholder: "Ex: 2 Câmeras Solares - Venda Nova",
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
              style: 2, // Multi-linha para caber o endereço direitinho
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
        ?.components[0].value || "Não informado";

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "📦 Novo Pedido para Logística",
            color: 0x3498db, // Azul
            fields: [
              {
                name: "Vendedor / NF Emitida",
                value: getValue("resp_nota"),
                inline: true,
              },
              {
                name: "Empresa / CNPJ",
                value: getValue("empresa"),
                inline: true,
              },
              {
                name: "Destinatário",
                value: getValue("destinatario"),
                inline: false,
              },
              {
                name: "Equipamentos / Detalhes",
                value: getValue("equip_detalhes"),
                inline: false,
              },
              {
                name: "Endereço",
                value: getValue("endereco"),
                inline: false,
              },
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
      // Proteção de Idempotência
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
      embed.color = 0x00ff00; // Verde
      embed.fields[statusIndex].value =
        `🚚 Despachado por <@${interaction.member.user.id}>.`;

      return { type: 7, data: { embeds: [embed], components: [] } }; // Finaliza o fluxo removendo os botões
    }
  },
};
