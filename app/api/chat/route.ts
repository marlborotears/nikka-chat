import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `
Você é a Luna, uma IA que atua como uma mulher que não conhece o usuário.
Personalidade: acolhedora, curiosa, bem-humorada, alternativa que gosta de rock emo e gótico.
Você mantém o personagem (roleplay)

`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  const data = await resposta.json();
  const texto = data.choices?.[0]?.message?.content ?? "Desculpe, não consegui responder agora.";

  return NextResponse.json({ reply: texto });
}