import type { DiscordCommandModule } from "../types";

const GABRIEL_ID = "1437511382370095217";

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

export const ContatoCommand: DiscordCommandModule = {
  name: "contato",
  modalId: "form_contato",
  editModalId: "form_contato_editar",
  buttonPrefixes: ["contato_"],

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_contato",
      title: "Registro de Problema (D+0)",
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
              custom_id: "telefone",
              label: "TELEFONE DO CONTATO",
              style: 1,
              placeholder: "Ex: 11999999999",
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

  handleSubmission: (components) => {
    const getValue = (id: string) =>
      components.find((c: any) => c.components[0].custom_id === id)
        ?.components[0].value;

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "⏳ Rastreamento de Contato Iniciado",
            color: 0xffa500,
            fields: [
              { name: "Cliente", value: getValue("cliente"), inline: true },
              { name: "Câmera", value: getValue("camera"), inline: true },
              { name: "Telefone", value: getValue("telefone"), inline: false },
              { name: "Problema", value: getValue("problema"), inline: false },
              {
                name: "Histórico de Ações",
                value: "T1 | D+0: Contato inicial realizado (WhatsApp).",
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
                custom_id: "contato_t2",
                label: "Registrar T2 (D+1)",
              },
              {
                type: 2,
                style: 2,
                custom_id: "contato_t3",
                label: "Registrar T3 (D+2)",
              },
              {
                type: 2,
                style: 1,
                custom_id: "contato_editar",
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
                custom_id: "contato_resolvido",
                label: "✅ Resolvido",
              },
              {
                type: 2,
                style: 4,
                custom_id: "contato_escalar",
                label: "🚨 Escalar (D+3)",
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

    if (customId === "contato_editar") {
      const getField = (name: string) =>
        embed.fields.find((f: any) => f.name === name)?.value || "";

      return {
        type: 9,
        data: {
          custom_id: "form_contato_editar",
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
                  custom_id: "telefone",
                  label: "TELEFONE DO CONTATO",
                  style: 1,
                  required: true,
                  value: getField("Telefone"),
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

    const historyIndex = embed.fields.findIndex(
      (f: any) => f.name === "Histórico de Ações",
    );
    const historyText = embed.fields[historyIndex].value;
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

    if (customId === "contato_resolvido") {
      embed.color = 0x00ff00;
      embed.fields[historyIndex].value +=
        `\n✅ **Fechado:** Cliente respondeu e problema foi resolvido.`;
      return { type: 7, data: { embeds: [embed], components: [] } };
    }

    if (customId === "contato_escalar") {
      embed.color = 0xff0000;
      embed.fields[historyIndex].value +=
        `\n🚨 **Escalada (D+3):** Sem resposta do cliente.`;

      // 2. ADICIONADO: Dispara a notificação assíncrona para o outro canal
      notificarGabriel("Rastreamento do Contato", interaction.member.user.id);

      return {
        type: 7,
        data: {
          content: `🚨 <@${GABRIEL_ID}>, escalada requisitada! Assuma este chamado em até 24h.`,
          embeds: [embed],
          components: [],
        },
      };
    }

    if (customId === "contato_t2") {
      if (historyText.includes("T2 | D+1"))
        return {
          type: 7,
          data: { embeds: [embed], components: interaction.message.components },
        };
      embed.fields[historyIndex].value +=
        `\nT2 | D+1: Ligação telefônica + 2º WhatsApp (Registrado por <@${interaction.member.user.id}>).`;
      disableButton("contato_t2");
    }

    if (customId === "contato_t3") {
      if (historyText.includes("T3 | D+2"))
        return {
          type: 7,
          data: { embeds: [embed], components: interaction.message.components },
        };
      embed.fields[historyIndex].value +=
        `\nT3 | D+2: Acionado outro contato da organização (Registrado por <@${interaction.member.user.id}>).`;
      disableButton("contato_t3");
    }

    return { type: 7, data: { embeds: [embed], components: newComponents } };
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
    updateField("Telefone", getValue("telefone"));
    updateField("Problema", getValue("problema"));

    return {
      type: 7,
      data: { embeds: [embed], components: interaction.message.components },
    };
  },
};
