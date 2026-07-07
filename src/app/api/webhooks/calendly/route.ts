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

    // Expressões Regulares (Regex) cirúrgicas para isolar apenas o que importa
    const nameMatch = text.match(/(?:Invitee|Convidado|Nome):\s*(.+)/i);
    const emailMatch = text.match(
      /(?:Invitee Email|Email do convidado|Email|E-mail):\s*([^\s<]+)/i,
    );
    const eventMatch = text.match(
      /(?:Event Type|Tipo de evento|Evento):\s*(.+)/i,
    );
    const dateTimeMatch = text.match(
      /(?:Event Date\/Time|Data\/Hora do evento|Data\/Horário|Data e Hora):\s*(.+)/i,
    );

    const name = nameMatch ? nameMatch[1].trim() : "Não localizado";
    const email = emailMatch ? emailMatch[1].trim() : "Não localizado";
    const evento = eventMatch ? eventMatch[1].trim() : "Reunião Agendada";
    const dataHora = dateTimeMatch ? dateTimeMatch[1].trim() : "Não localizada";

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
      console.error("[Webhook] DISCORD_WEBHOOK_URL não configurada.");
      return NextResponse.json(
        { error: "Missing DISCORD_WEBHOOK_URL" },
        { status: 500 },
      );
    }

    // Dispara para o Discord com o layout 100% limpo e organizado
    await sendDiscordMessage(discordWebhookUrl, {
      embeds: [
        {
          title: "📅 Novo Agendamento Confirmado!",
          color: 0x006bff, // Azul padrão do Calendly
          fields: [
            { name: "👤 Quem Marcou", value: name, inline: true },
            { name: "📧 E-mail", value: email, inline: true },
            { name: "📋 Tipo de Reunião", value: evento, inline: false },
            { name: "⏰ Data e Horário", value: dataHora, inline: false },
          ],
          footer: { text: "Automação Gmail → Make → Discord" },
          timestamp: new Date().toISOString(),
        },
      ],
    });

    console.log("✅ Mensagem formatada enviada para o Discord com sucesso.");
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
