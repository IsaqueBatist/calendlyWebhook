#!/usr/bin/env node
// scripts/register-webhook.ts
//
// Run this ONCE to register the webhook subscription on Calendly.
// Usage:
//   npx ts-node scripts/register-webhook.ts
//   (or: npx tsx scripts/register-webhook.ts)
//
// Required environment variables (create a .env.local and load it, or export manually):
//   CALENDLY_TOKEN      — your Personal Access Token
//   CALENDLY_ORG_URI    — https://api.calendly.com/organizations/YOUR_ORG_UUID
//   WEBHOOK_URL         — public URL of your Next.js route, e.g. https://yourdomain.com/api/webhooks/calendly

import "dotenv/config"; // npm install dotenv  (only needed to run this script locally)

const CALENDLY_API = "https://api.calendly.com";

async function main(): Promise<void> {
  const token = process.env.CALENDLY_TOKEN;
  const orgUri = process.env.CALENDLY_ORG_URI;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (!token || !orgUri || !webhookUrl) {
    console.error(
      "Missing required environment variables: CALENDLY_TOKEN, CALENDLY_ORG_URI, WEBHOOK_URL",
    );
    process.exit(1);
  }

  const body = {
    url: webhookUrl,
    events: ["invitee.created", "invitee.canceled"],
    organization: orgUri,
    scope: "organization", // use "user" if you only want your own events
  };

  const response = await fetch(`${CALENDLY_API}/webhook_subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    console.error("Failed to register webhook:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("✅ Webhook registered successfully!");
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
