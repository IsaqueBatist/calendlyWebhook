// src/app/api/webhooks/calendly/route.ts
//
// Next.js App Router API Route
// Receives Calendly webhook events and notifies Discord.
//
// Endpoint: POST /api/webhooks/calendly

import { NextRequest, NextResponse } from "next/server";
import type { CalendlyWebhookPayload } from "@/lib/calendly.types";
import { sendDiscordMessage } from "@/lib/discord";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats an ISO 8601 date string to a human-readable BR format.
 * e.g. "2025-06-01T14:00:00.000000Z" → "01/06/2025 às 14:00 (UTC)"
 */
function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return iso;
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse body
  let payload: CalendlyWebhookPayload;
  try {
    payload = (await req.json()) as CalendlyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("=== CALENDLY WEBHOOK ===");
  console.log("event:", payload.event);
  console.log("DISCORD_WEBHOOK_URL:", process.env.DISCORD_WEBHOOK_URL);
  console.log("payload.payload.name:", payload.payload?.name);

  // 2. Only handle invitee.created events
  if (payload.event !== "invitee.created") {
    // Acknowledge but do nothing for other event types
    return NextResponse.json({ received: true, handled: false });
  }

  // 3. Extract data from the payload
  const invitee = payload.payload;
  const event = invitee.scheduled_event;

  const name = invitee.name;
  const email = invitee.email;
  const meetingName = event.name;
  const startTime = formatDate(event.start_time);
  const endTime = formatDate(event.end_time);
  const timezone = invitee.timezone;

  // Optional: meeting link (e.g. Google Meet, Zoom)
  const joinUrl = event.location?.join_url ?? event.location?.location ?? null;

  // 4. Build and send Discord message
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!discordWebhookUrl) {
    console.error("[Calendly Webhook] DISCORD_WEBHOOK_URL is not set.");
    return NextResponse.json(
      { error: "Server misconfiguration: missing DISCORD_WEBHOOK_URL" },
      { status: 500 },
    );
  }

  try {
    await sendDiscordMessage(discordWebhookUrl, {
      embeds: [
        {
          title: "📅 Novo Agendamento Confirmado!",
          color: 0x006bff, // Calendly blue
          fields: [
            { name: "👤 Nome", value: name, inline: true },
            { name: "📧 E-mail", value: email, inline: true },
            { name: "📋 Reunião", value: meetingName, inline: false },
            { name: "🕐 Início", value: startTime, inline: true },
            { name: "🕑 Término", value: endTime, inline: true },
            {
              name: "🌎 Fuso horário do convidado",
              value: timezone,
              inline: false,
            },
            ...(joinUrl
              ? [{ name: "🔗 Link da reunião", value: joinUrl, inline: false }]
              : []),
          ],
          footer: { text: "Calendly → Discord" },
          timestamp: payload.created_at,
        },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      "[Calendly Webhook] Failed to send Discord message:",
      message,
    );
    return NextResponse.json(
      { error: "Failed to notify Discord", details: message },
      { status: 502 },
    );
  }

  return NextResponse.json({ received: true, handled: true });
}
