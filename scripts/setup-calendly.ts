import "dotenv/config";

const CALENDLY_API = "https://api.calendly.com";

async function main() {
  const token = process.env.CALENDLY_TOKEN;
  const orgUri = process.env.CALENDLY_ORG_URI;
  const webhookUrl = process.env.WEBHOOK_URL; // Ex: https://seudominio.com.br/api/webhooks/calendly

  if (!token || !orgUri || !webhookUrl) {
    console.error(
      "❌ Faltando as variáveis de ambiente: CALENDLY_TOKEN, CALENDLY_ORG_URI ou WEBHOOK_URL",
    );
    return;
  }

  console.log("1️⃣ Listando webhooks existentes...");
  const listRes = await fetch(
    `${CALENDLY_API}/webhook_subscriptions?scope=organization&organization=${encodeURIComponent(orgUri)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const listData = await listRes.json();

  if (listData.collection && listData.collection.length > 0) {
    console.log(
      `Foram encontrados ${listData.collection.length} webhooks. Excluindo...`,
    );
    for (const webhook of listData.collection) {
      await fetch(webhook.uri, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`🗑️ Excluído: ${webhook.uri}`);
    }
  } else {
    console.log("Nenhum webhook existente encontrado.");
  }

  console.log("\n2️⃣ Criando o novo webhook limpo...");
  const createRes = await fetch(`${CALENDLY_API}/webhook_subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: webhookUrl,
      events: ["invitee.created"],
      organization: orgUri,
      scope: "organization",
    }),
  });

  if (!createRes.ok) {
    console.error("❌ Erro ao criar webhook:", await createRes.text());
  } else {
    console.log("✅ Webhook criado com sucesso para a URL:", webhookUrl);
  }
}

main();
