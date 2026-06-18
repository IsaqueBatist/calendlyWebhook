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
              style: 2,
              required: true,
            },
          ],
        },
      ],
    },
  }),

  // Adicionamos o parâmetro `interaction` opcional para checar se é uma edição
  handleSubmission: (components, interaction?: any) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value || "Não informado";

    // Verifica se a interação possui uma mensagem atrelada (significa que veio do botão Editar)
    const isEdit = interaction && interaction.message;

    // Se for edição, preservamos o status e a cor do embed atual. Se for novo, usamos o padrão.
    let currentStatus = "Pendente de separação.";
    let embedColor = 0x3498db; // Azul
    let btnSeparandoDisabled = false;

    if (isEdit) {
      const oldEmbed = interaction.message.embeds[0];
      const oldStatusField = oldEmbed.fields.find(
        (f: any) => f.name === "Status do Envio",
      );
      if (oldStatusField) currentStatus = oldStatusField.value;
      if (oldEmbed.color) embedColor = oldEmbed.color;

      const oldBtnSeparando =
        interaction.message.components[0]?.components?.find(
          (b: any) => b.custom_id === "log_separando",
        );
      if (oldBtnSeparando?.disabled) btnSeparandoDisabled = true;
    }

    return {
      type: isEdit ? 7 : 4, // 7 = Edita a mensagem existente, 4 = Cria uma nova mensagem
      data: {
        embeds: [
          {
            title: "📦 Novo Pedido para Logística",
            color: embedColor,
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
                value: currentStatus,
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
                disabled: btnSeparandoDisabled,
              },
              {
                type: 2,
                style: 3,
                custom_id: "log_enviado",
                label: "🚚 Enviado",
              },
              {
                type: 2,
                style: 1, // Estilo 1 é Azul (Primary)
                custom_id: "log_editar",
                label: "✏️ Editar",
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

    // Lógica para o botão de Editar
    if (customId === "log_editar") {
      const getFieldValue = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";

      return {
        type: 9, // Retorna um novo Modal
        data: {
          custom_id: "form_logistica", // Usa o mesmo ID para cair no handleSubmission novamente
          title: "Editar Solicitação",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "resp_nota",
                  label: "VENDEDOR RESP. / NF EMITIDA?",
                  style: 1,
                  value: getFieldValue("Vendedor / NF Emitida"), // Preenche com o valor atual
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
                  value: getFieldValue("Empresa / CNPJ"),
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
                  value: getFieldValue("Destinatário"),
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
                  value: getFieldValue("Equipamentos / Detalhes"),
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
                  value: getFieldValue("Endereço"),
                  required: true,
                },
              ],
            },
          ],
        },
      };
    }

    // Lógica existente para Separação e Envio
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
      embed.color = 0x00ff00; // Verde
      embed.fields[statusIndex].value =
        `🚚 Despachado por <@${interaction.member.user.id}>.`;

      return { type: 7, data: { embeds: [embed], components: [] } }; // Finaliza o fluxo removendo os botões (incluindo o de editar)
    }
  },
};
