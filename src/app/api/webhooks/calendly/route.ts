import { sendDiscordMessage } from "@/lib/discord";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let subject = "";
    let text = "";

    // Tenta ler como JSON ou Form Data (dependendo de como o Make enviar)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      subject = body.subject || "";
      text = body.text || "";
    } else {
      // application/x-www-form-urlencoded (Muito mais seguro para textos grandes como e-mails)
      const formData = await req.formData();
      subject = formData.get("subject")?.toString() || "";
      text = formData.get("text")?.toString() || "";
    }

    console.log("=== EMAIL RECEBIDO DO MAKE ===");
    console.log("Assunto:", subject);

    if (!text || !subject) {
      return NextResponse.json({
        received: true,
        handled: false,
        reason: "Sem texto ou assunto",
      });
    }

    // Ignora se não for um email de "Novo Evento" disparado pelo Calendly
    if (
      !subject.includes("New Event") &&
      !subject.includes("Novo evento") &&
      !subject.includes("Novo Evento")
    ) {
      return NextResponse.json({
        received: true,
        handled: false,
        reason: "Não é email de agendamento",
      });
    }

    // Expressões Regulares (Regex) para achar os dados no meio do texto (Flexível para PT ou EN)
    const nameMatch = text.match(/(?:Invitee|Convidado|Nome):\s*(.+)/i);
    const emailMatch = text.match(
      /(?:Invitee Email|Email do convidado|Email|E-mail):\s*([^\s<]+)/i,
    );
    const eventMatch = text.match(
      /(?:Event Type|Tipo de evento|Evento):\s*(.+)/i,
    );

    const name = nameMatch ? nameMatch[1].trim() : "Não localizado";
    const email = emailMatch ? emailMatch[1].trim() : "Não localizado";
    const evento = eventMatch ? eventMatch[1].trim() : "Reunião Agendada";

    // Tentar capturar as respostas do formulário (Limpando o final onde ficam os links de cancelar)
    let resumo = "Verifique a caixa de entrada para mais detalhes.";
    const splitCancel = text.split(
      /(?:Cancel this event|Cancelar este evento|Need to make changes)/i,
    );
    if (splitCancel.length > 0) {
      const rawBody = splitCancel[0].trim();
      // Corta o e-mail se ele for gigante para não dar erro de limite no Discord
      resumo =
        rawBody.length > 800 ? rawBody.substring(0, 800) + "..." : rawBody;
    }

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
      console.error("[Webhook] DISCORD_WEBHOOK_URL não configurada.");
      return NextResponse.json(
        { error: "Missing DISCORD_WEBHOOK_URL" },
        { status: 500 },
      );
    }

    // Dispara para o Discord
    await sendDiscordMessage(discordWebhookUrl, {
      embeds: [
        {
          title: "📅 Novo Agendamento (Via E-mail)!",
          color: 0x006bff,
          fields: [
            { name: "👤 Nome", value: name, inline: true },
            { name: "📧 E-mail", value: email, inline: true },
            { name: "📋 Reunião", value: evento, inline: false },
            { name: "📝 Resumo do E-mail", value: resumo, inline: false },
          ],
          footer: { text: "Automação Gmail → Make → Discord" },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    console.log(
      "✅ Webhook de e-mail processado e enviado para o Discord com sucesso.",
    );
    return NextResponse.json({ received: true, handled: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Webhook] Falha ao processar e-mail:", message);
    return NextResponse.json(
      { error: "Falha ao processar", details: message },
      { status: 500 },
    );
  }
}
