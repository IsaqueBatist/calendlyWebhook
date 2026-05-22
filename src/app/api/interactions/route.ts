import { NextRequest } from "next/server";
import { verifyKey } from "discord-interactions";

// Força a execução em infraestrutura Edge (baixa latência, sem cold start do Node.js)
export const runtime = "edge";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) {
    return new Response("Missing signature headers", { status: 401 });
  }

  const rawBody = await req.text();
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!publicKey) {
    return new Response("Server configuration error", { status: 500 });
  }

  // Validação criptográfica do payload
  const isValidRequest = verifyKey(rawBody, signature, timestamp, publicKey);
  if (!isValidRequest) {
    return new Response("Bad request signature", { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  // Handshake de validação da URL
  if (interaction.type === 1) {
    // Retorno de baixo nível garantindo o Content-Type estrito e serialização limpa
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new Response("Unknown interaction", { status: 400 });
}
