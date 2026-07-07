import { sendDiscordMessage } from "@/lib/discord";
import { NextRequest, NextResponse } from "next/server";

// Nova interface tipando exatamente o que o Make vai nos enviar
interface MakeCalendlyPayload {
  status?: string;
  nome?: string;
  email?: string;
  evento?: string;
  respostas?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Recebe o JSON do Make tipado com a nossa interface
    const body = (await req.json()) as MakeCalendlyPayload;

    console.log("=== BODY RECEBIDO DO MAKE ===");
    console.log(JSON.stringify(body, null, 2));

    // Verifica se o evento está confirmado (O Calendly via Make costuma mandar "active" ou "confirmed")
    const status = body.status?.toLowerCase();
    if (status !== "active" && status !== "confirmed") {
      return NextResponse.json({
        received: true,
        handled: false,
        reason: `Status ignorado: ${status}`,
      });
    }

    // Puxa as variáveis mapeadas do Make (ou usa um texto padrão se vier vazio)
    const name = body.nome || "Não informado";
    const email = body.email || "Não informado";
    const evento = body.evento || "Reunião Agendada";
    const respostas = body.respostas || "Sem detalhes adicionais";

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
      console.error("[Webhook] DISCORD_WEBHOOK_URL não configurada no .env.");
      return NextResponse.json(
        { error: "Missing DISCORD_WEBHOOK_URL" },
        { status: 500 },
      );
    }

    const descricaoResumida =
      respostas.length > 800 ? respostas.substring(0, 800) + "..." : respostas;

    // Envia para o Discord
    await sendDiscordMessage(discordWebhookUrl, {
      embeds: [
        {
          title: "📅 Novo Agendamento Confirmado!",
          color: 0x006bff,
          fields: [
            { name: "👤 Nome", value: name, inline: true },
            { name: "📧 E-mail", value: email, inline: true },
            { name: "📋 Reunião", value: evento, inline: false },
            {
              name: "📝 Informações do Formulário",
              value: descricaoResumida,
              inline: false,
            },
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
    console.error("[Webhook] Falha ao processar requisição:", message);
    return NextResponse.json(
      { error: "Failed to process webhook", details: message },
      { status: 500 },
    );
  }
}
