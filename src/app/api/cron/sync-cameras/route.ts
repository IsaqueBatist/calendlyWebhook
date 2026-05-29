// src/app/api/cron/sync-cameras/route.ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Redis } from "@upstash/redis";
import { createChannelMessage, editChannelMessage } from "@/lib/discord-rest";

const redis = Redis.fromEnv();

// Limite de tempo da Vercel para 60 segundos (plano Hobby)
export const maxDuration = 60;

const CANAL_ATRASOS_ID = "1509881188104278046";

export async function GET(req: Request) {
  // 1. Proteção de Segurança
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cookie = process.env.SENTRIC_COOKIE;
  if (!cookie) {
    return NextResponse.json(
      { error: "Cookie não configurado" },
      { status: 500 },
    );
  }

  try {
    // 2. Coletar o HTML da página de câmeras atrasadas
    const response = await fetch(
      "https://camera.sentric.com.br/admin/cameras_delayed",
      {
        headers: { Cookie: cookie },
        cache: "no-store",
      },
    );

    const html = await response.text();
    const $ = cheerio.load(html);

    // Array para o Dashboard consolidado no fim do canal
    const camerasAtrasadasAgora: Array<{
      id: string;
      nome: string;
      tempo: string;
    }> = [];
    const idsCamerasAgora: string[] = [];

    const rows = $("table tbody tr").toArray();

    for (const el of rows) {
      const idNode = $(el).find("td:nth-child(2) a");
      const nameNode = $(el).find("td:nth-child(3) a");
      const delayedNode = $(el).find("td:nth-child(6) span");

      if (idNode.length) {
        const idCamera = idNode.text().trim();
        const nomeCamera = nameNode.text().trim();
        const tempoAtraso = delayedNode.text().trim();
        const urlFotos = idNode.attr("href") || "";

        camerasAtrasadasAgora.push({
          id: idCamera,
          nome: nomeCamera,
          tempo: tempoAtraso,
        });
        idsCamerasAgora.push(idCamera);

        // Realiza o scraping dos dados atuais da câmera no painel administrativo
        let uid = "Não localizado";
        let telefone = "Não informado";
        let clienteNome = "Buscar manualmente";

        try {
          const BASE_URL = "https://camera.sentric.com.br";
          const urlEdit = `${BASE_URL}${urlFotos.replace("/fotos/", "/edit/")}`;
          const resEdit = await fetch(urlEdit, { headers: { Cookie: cookie } });
          const $edit = cheerio.load(await resEdit.text());

          const inputUid = $edit("input[name='camera_uid']").val();
          if (inputUid) uid = String(inputUid);

          const resPrev = await fetch(
            "https://camera.sentric.com.br/admin/previsao",
            { headers: { Cookie: cookie } },
          );
          const $prev = cheerio.load(await resPrev.text());

          const partes = urlFotos.split("/");
          const uuidCamera = partes[partes.length - 1];

          const selectDaCamera = $prev(
            `select.camera_uuid option[value="${uuidCamera}"]`,
          );

          if (selectDaCamera.length) {
            const cardPai = selectDaCamera.closest(".card");
            const numeroInput = cardPai.find("input[name='number']").val();
            if (numeroInput && String(numeroInput).trim() !== "") {
              telefone = String(numeroInput).trim();
            }
            if (telefone === "Não informado") {
              const numeroAdicional = cardPai
                .find("input[name='number_up']")
                .first()
                .val();
              if (numeroAdicional && String(numeroAdicional).trim() !== "") {
                telefone = String(numeroAdicional).trim();
              }
            }
          }
        } catch (e) {
          console.error(
            `Erro ao raspar detalhes secundários da câmera ${idCamera}`,
            e,
          );
        }

        // Definição dos valores esperados nos campos
        const campoUidValor = `${idCamera} ${nomeCamera} / ${uid}`;
        const campoTelefoneValor = telefone;
        const campoTempoValor = tempoAtraso;

        // Verifica se essa câmera já possui um Alerta emitido no canal
        const msgIdNoDiscord = (await redis.get(
          `camera_atrasada_${idCamera}`,
        )) as string;

        // Configuração dos Botões (Incluindo o novo "Gerar Contato")
        const components = [
          {
            type: 1, // Linha 1: Operações de campo
            components: [
              {
                type: 2,
                style: 1,
                custom_id: "atraso_cobrar",
                label: "🔔 Cobrar",
              },
              {
                type: 2,
                style: 2,
                custom_id: "atraso_editar",
                label: "✏️ Editar",
              },
            ],
          },
          {
            type: 1, // Linha 2: Resoluções e Fluxos cruzados
            components: [
              {
                type: 2,
                style: 3,
                custom_id: "atraso_resolvido",
                label: "✅ Resolvido",
              },
              {
                type: 2,
                style: 2,
                custom_id: "atraso_gerar_contato",
                label: "📞 Gerar Contato",
              },
            ],
          },
        ];

        if (!msgIdNoDiscord) {
          // --- CÂMERA NOVA: Criar Card do zero ---
          const embed = {
            title: "⏰ Alerta: Validação de Câmera em Atraso",
            color: 0xe74c3c,
            fields: [
              { name: "Cliente", value: clienteNome, inline: true },
              { name: "Câmera / UID", value: campoUidValor, inline: true },
              {
                name: "Telefone do Responsável",
                value: campoTelefoneValor,
                inline: false,
              },
              {
                name: "Tempo de Atraso",
                value: campoTempoValor,
                inline: false,
              },
              { name: "Observações", value: "Não informado", inline: false },
              {
                name: "Histórico de Ações",
                value: "🚨 Registro de atraso publicado pelo sistema.",
                inline: false,
              },
            ],
          };

          const messageData = await createChannelMessage(CANAL_ATRASOS_ID, {
            embeds: [embed],
            components,
          });
          if (messageData && messageData.id) {
            await redis.set(`camera_atrasada_${idCamera}`, messageData.id);
          }
        } else {
          // --- CÂMERA JÁ EXISTENTE: Verificar Atualizações de Campos ---
          try {
            const resMsg = await fetch(
              `https://discord.com/api/v10/channels/${CANAL_ATRASOS_ID}/messages/${msgIdNoDiscord}`,
              {
                headers: {
                  Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
              },
            );

            if (resMsg.ok) {
              const msgJson = await resMsg.json();
              const currentEmbed = msgJson.embeds?.[0];

              if (currentEmbed) {
                // Captura o estado atual do texto presente no Discord
                const atualUid =
                  currentEmbed.fields.find(
                    (f: any) => f.name === "Câmera / UID",
                  )?.value || "";
                const atualTelefone =
                  currentEmbed.fields.find(
                    (f: any) => f.name === "Telefone do Responsável",
                  )?.value || "";
                const atualTempo =
                  currentEmbed.fields.find(
                    (f: any) => f.name === "Tempo de Atraso",
                  )?.value || "";

                // Se houver qualquer discrepância (como o telefone que foi cadastrado depois)
                if (
                  atualUid !== campoUidValor ||
                  atualTelefone !== campoTelefoneValor ||
                  atualTempo !== campoTempoValor
                ) {
                  // Atualiza cirurgicamente apenas os valores mutáveis
                  const idxUid = currentEmbed.fields.findIndex(
                    (f: any) => f.name === "Câmera / UID",
                  );
                  if (idxUid !== -1)
                    currentEmbed.fields[idxUid].value = campoUidValor;

                  const idxTel = currentEmbed.fields.findIndex(
                    (f: any) => f.name === "Telefone do Responsável",
                  );
                  if (idxTel !== -1)
                    currentEmbed.fields[idxTel].value = campoTelefoneValor;

                  const idxTempo = currentEmbed.fields.findIndex(
                    (f: any) => f.name === "Tempo de Atraso",
                  );
                  if (idxTempo !== -1)
                    currentEmbed.fields[idxTempo].value = campoTempoValor;

                  // Atualiza o card mantendo botões, cores e histórico intactos
                  await editChannelMessage(CANAL_ATRASOS_ID, msgIdNoDiscord, {
                    embeds: [currentEmbed],
                    components: msgJson.components, // Preserva estado atual de botões desabilitados se houver
                  });
                  console.log(
                    `[Sync] Card da câmera ${idCamera} atualizado com novos dados.`,
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `Erro ao verificar atualização no Discord para câmera ${idCamera}`,
              error,
            );
          }
        }
      }
    }

    // 3. Fechamento Automático de Câmeras Resolvidas
    const chavesNoRedis = await redis.keys("camera_atrasada_*");
    for (const chave of chavesNoRedis) {
      const idCamera = chave.replace("camera_atrasada_", "");

      if (!idsCamerasAgora.includes(idCamera)) {
        const msgId = (await redis.get(chave)) as string;
        if (msgId) {
          const embedAtualizado = {
            title: "⏰ Alerta: Validação de Câmera em Atraso",
            color: 0x2ecc71,
            description: `✅ **A câmera ${idCamera} voltou a ficar online e foi resolvida pelo sistema.**`,
          };

          await editChannelMessage(CANAL_ATRASOS_ID, msgId, {
            embeds: [embedAtualizado],
            components: [],
          });
        }
        await redis.del(chave);
      }
    }

    // ====================================================================
    // 4. Painel Geral Fixado (Live Dashboard) - Evita poluição visual
    // ====================================================================
    const total = camerasAtrasadasAgora.length;
    let dashboardDesc = `Monitoramento em tempo real do ecossistema.\n\n**Total de Câmeras em Atraso Hoje: ${total}**\n\n`;

    if (total > 0) {
      dashboardDesc += camerasAtrasadasAgora
        .map((c) => `• **[ID: ${c.id}]** ${c.nome} — *(Atraso: ${c.tempo})*`)
        .join("\n");
    } else {
      dashboardDesc +=
        "🎉 *Excelente! Todas as câmeras estão operando normalmente.*";
    }

    if (dashboardDesc.length > 4000) {
      dashboardDesc =
        dashboardDesc.substring(0, 3900) +
        "\n\n... *(Truncado por limite do Discord)*";
    }

    const dashboardEmbed = {
      title: "📊 Dashboard Central: Status das Câmeras",
      description: dashboardDesc,
      color: total > 0 ? 0xe67e22 : 0x2ecc71,
      timestamp: new Date().toISOString(),
      footer: { text: "Atualizado via Cron Job" },
    };

    const dashboardMsgId = (await redis.get(
      "dashboard_atrasos_msg_id",
    )) as string;
    if (dashboardMsgId) {
      await editChannelMessage(CANAL_ATRASOS_ID, dashboardMsgId, {
        embeds: [dashboardEmbed],
      });
    } else {
      const newDashboard = await createChannelMessage(CANAL_ATRASOS_ID, {
        embeds: [dashboardEmbed],
      });
      if (newDashboard && newDashboard.id) {
        await redis.set("dashboard_atrasos_msg_id", newDashboard.id);
      }
    }

    return NextResponse.json({ success: true, processed: total });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
