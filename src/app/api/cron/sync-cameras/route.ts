// src/app/api/cron/sync-cameras/route.ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { kv } from "@vercel/kv";
import { createChannelMessage, editChannelMessage } from "@/lib/discord-rest";

// Aumenta o limite de tempo da Vercel para 60 segundos (limite do plano Hobby)
export const maxDuration = 60;

// ID do canal do Discord onde os alertas serão postados
const CANAL_ATRASOS_ID = "COLOQUE_AQUI_O_ID_DO_SEU_CANAL";

export async function GET(req: Request) {
  // 1. Proteção de Segurança: Verifica se quem está chamando tem a senha
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
        cache: "no-store", // Evita que a Vercel faça cache da página antiga
      },
    );

    const html = await response.text();
    const $ = cheerio.load(html);

    // Array para guardar os IDs das câmeras que estão atrasadas NESTE MOMENTO
    const camerasAtrasadasAgora: string[] = [];

    // Lemos as linhas da tabela
    const rows = $("table tbody tr").toArray();

    for (const el of rows) {
      const idNode = $(el).find("td:nth-child(2) a");
      const nameNode = $(el).find("td:nth-child(3) a");
      const delayedNode = $(el).find("td:nth-child(6) span");

      if (idNode.length) {
        const idCamera = idNode.text().trim(); // Ex: "179"
        const nomeCamera = nameNode.text().trim();
        const tempoAtraso = delayedNode.text().trim();
        const urlFotos = idNode.attr("href") || "";

        camerasAtrasadasAgora.push(idCamera);

        // 3. Verifica no Vercel KV se já enviamos alerta para essa câmera
        const msgIdNoDiscord = await kv.get(`camera_atrasada_${idCamera}`);

        // Se NÃO tem mensagem no Discord, é uma câmera NOVA atrasada
        if (!msgIdNoDiscord) {
          // Vamos fazer o scraping do UID e Telefone (tentamos no máximo para não estourar o limite de 60s)
          let uid = "Não localizado";
          let telefone = "Não informado";
          let clienteNome = "Buscar manualmente";

          try {
            // Converte a URL de "fotos" para "edit" para pegar o UID
            const urlEdit = urlFotos.replace("/fotos/", "/edit/");
            const resEdit = await fetch(urlEdit, {
              headers: { Cookie: cookie },
            });
            const htmlEdit = await resEdit.text();
            const $edit = cheerio.load(htmlEdit);

            // Tenta pegar o UID (Ajuse o seletor name= abaixo se não funcionar de primeira)
            const inputUid =
              $edit("input[name='identificacao']").val() ||
              $edit("input[name='url']").val();
            if (inputUid) uid = String(inputUid);

            // Fetch na página de Previsão para pegar o telefone (Simplificado)
            const resPrev = await fetch(
              "https://camera.sentric.com.br/admin/previsao",
              { headers: { Cookie: cookie } },
            );
            const htmlPrev = await resPrev.text();
            // Lógica simplificada: tenta achar o telefone usando regex básico ou cheerio baseado na sua estrutura
            // Como não tenho o HTML da previsão, recomendo inicialmente deixar manual ou refinar depois
          } catch (e) {
            console.error("Erro ao raspar detalhes secundários", e);
          }

          // Monta o Card do Discord
          const embed = {
            title: "⏰ Alerta: Validação de Câmera em Atraso",
            color: 0xe74c3c, // Vermelho
            fields: [
              { name: "Cliente", value: clienteNome, inline: true },
              {
                name: "Câmera / UID",
                value: `${idCamera} ${nomeCamera} / ${uid}`,
                inline: true,
              },
              {
                name: "Telefone do Responsável",
                value: telefone,
                inline: false,
              },
              { name: "Tempo de Atraso", value: tempoAtraso, inline: false },
              { name: "Observações", value: "Não informado", inline: false },
              {
                name: "Histórico de Ações",
                value: "🚨 Registro de atraso publicado pelo sistema.",
                inline: false,
              },
            ],
          };

          // Botões interativos
          const components = [
            {
              type: 1,
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
                {
                  type: 2,
                  style: 3,
                  custom_id: "atraso_resolvido",
                  label: "✅ Resolvido",
                },
              ],
            },
          ];

          // Dispara para o Discord
          const messageData = await createChannelMessage(CANAL_ATRASOS_ID, {
            embeds: [embed],
            components,
          });

          // Se a mensagem foi enviada, salva no Redis!
          if (messageData && messageData.id) {
            await kv.set(`camera_atrasada_${idCamera}`, messageData.id);
          }
        }
      }
    }

    // 4. Fechamento Automático de Câmeras Resolvidas
    // Pegamos todas as câmeras que estão no Redis atualmente
    const chavesNoRedis = await kv.keys("camera_atrasada_*");

    for (const chave of chavesNoRedis) {
      const idCamera = chave.replace("camera_atrasada_", "");

      // Se a câmera está no Redis, mas NÃO está mais na lista de atrasadas do site
      if (!camerasAtrasadasAgora.includes(idCamera)) {
        const msgId = (await kv.get(chave)) as string;

        if (msgId) {
          // Edita a mensagem no Discord avisando que foi resolvido
          const embedAtualizado = {
            title: "⏰ Alerta: Validação de Câmera em Atraso",
            color: 0x2ecc71, // Verde Sucesso
            description: `✅ **A câmera ${idCamera} voltou a ficar online e foi resolvida pelo sistema.**`,
          };

          // Limpa os componentes (tira os botões) e muda o embed
          await editChannelMessage(CANAL_ATRASOS_ID, msgId, {
            embeds: [embedAtualizado],
            components: [],
          });
        }

        // Remove do Banco de Dados para não processar mais
        await kv.del(chave);
      }
    }

    return NextResponse.json({
      success: true,
      processed: camerasAtrasadasAgora.length,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
