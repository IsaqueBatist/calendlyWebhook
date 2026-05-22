import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) {
    return new NextResponse("Missing signature headers", { status: 401 });
  }

  const rawBody = await req.text();
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!publicKey) {
    console.error("Erro: DISCORD_PUBLIC_KEY não está definida no ambiente.");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  // 1. Validação Criptográfica
  const isValidRequest = verifyKey(rawBody, signature, timestamp, publicKey);
  if (!isValidRequest) {
    return new NextResponse("Bad request signature", { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  // 2. Handshake Exato
  if (interaction.type === 1) {
    // 1 = InteractionType.PING
    console.log("PING recebido. Devolvendo PONG exato.");
    // O uso do NextResponse.json garante os headers e a serialização corretos
    return NextResponse.json({ type: 1 });
  }

  // Se chegar aqui, não era um PING
  return new NextResponse("Unknown interaction", { status: 400 });
}
