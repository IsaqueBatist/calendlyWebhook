// src/discord/commands/relatorio.ts
import type { DiscordCommandModule } from "../types";

export const RelatorioCommand: DiscordCommandModule = {
  name: "negativacao-relatorio",
  modalId: "form_relatorio",

  renderModal: () => ({
    type: 9,
    data: {
      custom_id: "form_relatorio",
      title: "Relatório Quinzenal de Palavras-Chave",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "periodo",
              label: "PERÍODO",
              style: 1,
              placeholder: "Ex: Últimos 15 dias",
              required: true,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "dados",
              label: "COLE OS DADOS AQUI",
              style: 2,
              placeholder: `"gravar time lapse" - 10 cliques - 15 vezes\n"manutenção" - 2 cliques - 3 vezes`,
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

    // Tratamento estrito de string para garantir formatação em bloco de código (Markdown)
    const rawData = getValue("dados");
    const formattedData = `\`\`\`markdown\n${rawData}\n\`\`\``;

    return {
      type: 4,
      data: {
        embeds: [
          {
            title: "📊 Relatório de Negativação (Ads)",
            description: "Análise de performance e palavras-chave isoladas.",
            color: 0x9b59b6, // Roxo
            fields: [
              {
                name: "Período Analisado",
                value: getValue("periodo"),
                inline: false,
              },
              {
                name: "Métricas Consolidadas",
                value: formattedData,
                inline: false,
              },
            ],
            footer: { text: "Revisão sugerida pelo time de Marketing." },
          },
        ],
      },
    };
  },
};
