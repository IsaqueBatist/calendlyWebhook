// ─────────────────────────────────────────────────────────────────────────────
// Discord Notifier
// Sends a formatted message to a Discord channel via Incoming Webhook
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string };
  timestamp?: string;
}

export interface DiscordWebhookBody {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * Sends a message to Discord via an Incoming Webhook URL.
 * Throws an error if the request fails.
 */
export async function sendDiscordMessage(
  webhookUrl: string,
  body: DiscordWebhookBody,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "(no body)");
    throw new Error(`Discord webhook failed [${response.status}]: ${text}`);
  }
}
