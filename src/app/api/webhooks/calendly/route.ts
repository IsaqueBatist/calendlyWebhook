import { NextRequest, NextResponse } from "next/server";
import { sendDiscordMessage } from "@/lib/discord";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Faz o parse do JSON enviado pelo Make
    const body = await req.json();
    const { status, evento, descricao } = body;

    console.log("=== MAKE.COM (GOOGLE CALENDAR) WEBHOOK ===");
    console.log("Status:", status);
    console.log("Evento:", evento);

    // 2. Filtra apenas eventos confirmados (quando a reunião é criada)
    // O Google Calendar envia o status "confirmed" para eventos criados/atualizados
    if (status !== "confirmed") {
      console.log("Evento ignorado. Status:", status);
      return NextResponse.json({ received: true, handled: false, reason: "Status não é confirmed" });
    }

    // 3. Extrai Nome e E-mail de dentro da descrição (gerada pelo Calendly no Google Calendar)
    // Usamos expressões regulares para pescar a informação de dentro do texto gigante
    const nameMatch = descricao?.match(/Nome:\s*(.+)/i) || descricao?.match(/Name:\s*(.+)/i);
    const emailMatch = descricao?.match(/E-mail:\s*([^\s<]+)/i) || descricao?.match(/Email:\s*([^\s<]+)/i);

    const name = nameMatch ? nameMatch[1].trim() : "Não informado";
    const email = emailMatch ? emailMatch[1].trim() : "Não informado";

    // 4. Verifica a URL do Webhook do Discord no seu .env
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
      console.error("[Webhook] DISCORD_WEBHOOK_URL não configurada no .env.");
      return NextResponse.json(
        { error: "Server misconfiguration: missing DISCORD_WEBHOOK_URL" },
        { status: 500 },
      );
    }

    // Formata um pedaço da descrição para colocar no Discord (limite de caracteres)
    const descricaoResumida = descricao
      ? descricao.substring(0, 800) + (descricao.length > 800 ? "..." : "")
      : "Sem detalhes adicionais";

    // 5. Constrói e envia a mensagem para o Discord
    await sendDiscordMessage(discordWebhookUrl, {
      embeds: [
        {
          title: "📅 Novo Agendamento Confirmado!",
          color: 0x006bff, // Azul padrão do Calendly
          fields: [
            { name: "👤 Nome", value: name, inline: true },
            { name: "📧 E-mail", value: email, inline: true },
            { name: "📋 Reunião", value: evento || "Reunião Agendada", inline: false },
            {
              name: "📝 Informações do Agendamento (Respostas / Links)",
              value: descricaoResumida,
              inline: false
            }
          ],
          footer: { text: "Automação Calendly (via Make) → Discord" },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    console.log("✅ Webhook processado e enviado para o Discord com sucesso.");
    return NextResponse.json({ received: true, handled: true });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Webhook] Falha ao processar requisição do Make:", message);
    return NextResponse.json(
      { error: "Failed to process webhook", details: message },
      { status: 500 },
    );
  }
}
