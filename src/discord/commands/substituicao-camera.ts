import { DiscordCommandModule } from "@/discord/types";
import { createChannelMessage, editChannelMessage } from "@/lib/discord-rest";

const CANAL_LOGISTICA = "1483820330802741340";
const GABRIEL_ID = "1437511382370095217";

const getValue = (components: any[], id: string) => {
  for (const row of components) {
    const comp = row.components?.find((c: any) => c.custom_id === id);
    if (comp) return comp.value;
  }
  return undefined;
};

const SubstituicaoCameraModule: DiscordCommandModule = {
  name: "solicitar-substituicao",
  modalId: "substituicao_modal",
  buttonPrefixes: ["substituicao_"],

  // 1. /solicitar-substituicao -> abre modal (type: 9)
  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "substituicao_modal",
      title: "Solicitar Substituição de Câmera",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "empresa_cnpj",
              label: "Empresa e CNPJ",
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
              label: "Câmera (Nome/UID)",
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
              custom_id: "motivo",
              label: "Motivo da substituição",
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
              custom_id: "garantia_dano",
              label: "Garantia (sem cobrança) ou Dano (com cobrança)?",
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
              custom_id: "endereco",
              label: "Endereço completo (CEP)",
              style: 1,
              required: true,
            },
          ],
        },
      ],
    },
  }),

  // 2. submissão do modal -> cria card pendente em #aprovacao-substituicao (type: 4)
  handleSubmission: async (components, interaction) => {
    const empresa = getValue(components, "empresa_cnpj");
    const camera = getValue(components, "camera");
    const motivo = getValue(components, "motivo");
    const garantiaDano = getValue(components, "garantia_dano");
    const endereco = getValue(components, "endereco");
    const solicitante = interaction.member.user.id;

    const embed = {
      title: "🔧 Solicitação de Substituição de Câmera — Pendente",
      color: 0xf1c40f,
      fields: [
        { name: "Empresa/CNPJ", value: empresa },
        { name: "Câmera", value: camera },
        { name: "Motivo", value: motivo },
        { name: "Garantia/Dano", value: garantiaDano },
        { name: "Endereço", value: endereco },
        { name: "Solicitado por", value: `<@${solicitante}>` },
      ],
      footer: {
        text: `EMPRESA:${empresa}|CAMERA:${camera}|MOTIVO:${motivo}|GD:${garantiaDano}|END:${endereco}|SOL:${solicitante}`,
      },
    };

    return {
      type: 4,
      data: {
        content: `<@${GABRIEL_ID}> nova solicitação de substituição aguardando aprovação.`,
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3,
                custom_id: "substituicao_aprovar",
                label: "✅ Aprovar",
              },
              {
                type: 2,
                style: 4,
                custom_id: "substituicao_rejeitar",
                label: "❌ Rejeitar",
              },
            ],
          },
        ],
      },
    };
  },

  handleComponent: async (interaction) => {
    const customId = interaction.data.custom_id;
    const footer = interaction.message.embeds[0].footer.text;

    const get = (key: string) =>
      footer.match(new RegExp(`${key}:(.*?)(\\||$)`))?.[1] || "";
    const empresa = get("EMPRESA");
    const camera = get("CAMERA");
    const motivo = get("MOTIVO");
    const garantiaDano = get("GD");
    const endereco = get("END");
    const solicitante = get("SOL");

    if (customId === "substituicao_aprovar") {
      await createChannelMessage(CANAL_LOGISTICA, {
        embeds: [
          {
            title: "📦 Pedido de Logística (Substituição Aprovada)",
            color: 0x3498db,
            fields: [
              { name: "Vendedor/Responsável", value: `<@${solicitante}>` },
              { name: "Empresa/CNPJ", value: empresa },
              { name: "Câmera a enviar", value: camera },
              {
                name: "Nº de Equipamentos & Motivo",
                value: `1 / Suporte Técnico — ${motivo}`,
              },
              { name: "Garantia/Dano", value: garantiaDano },
              { name: "Endereço completo", value: endereco },
              { name: "Nota fiscal emitida?", value: "Pendente" },
              { name: "Aprovação", value: `Aprovado por <@${GABRIEL_ID}>` },
            ],
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                custom_id: "logistica_separacao",
                label: "🚧 Em Separação",
              },
              {
                type: 2,
                style: 1,
                custom_id: "logistica_enviado",
                label: "🚚 Enviado",
              },
            ],
          },
        ],
      });

      return {
        type: 7,
        data: {
          embeds: [
            {
              ...interaction.message.embeds[0],
              title: "✅ Substituição de Câmera — Aprovada",
              color: 0x00ff00,
              description: `Aprovado por <@${GABRIEL_ID}>. Garantia/Dano: ${garantiaDano}. Card criado em <#${CANAL_LOGISTICA}>.`,
            },
          ],
          components: [],
        },
      };
    }

    if (customId === "substituicao_rejeitar") {
      return {
        type: 7,
        data: {
          embeds: [
            {
              ...interaction.message.embeds[0],
              title: "❌ Substituição de Câmera — Rejeitada",
              color: 0x95a5a6,
              description: `Rejeitado por <@${GABRIEL_ID}>.`,
            },
          ],
          components: [],
        },
      };
    }
  },
};

export default SubstituicaoCameraModule;
