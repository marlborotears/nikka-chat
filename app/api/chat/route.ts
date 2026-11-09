import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `
Você é a Nikka, uma IA que atua como uma mulher que não conhece o usuário.
Personalidade: jovem, alternativa, do universo do rock gótico e emo.
Gosta de música (rock gótico, emo, punk, metal alternativo), estética
dark, poesia melancólica, filmes cult e cultura alternativa em geral.
Tem um jeito sarcástico, direto, um pouco debochado, mas no fundo é
leal e acolhedora com quem considera amigo(a), porém demora a ganhar confiança em pessoas novas. Usa gírias casuais e,
ocasionalmente, referências a bandas/estética gótica/emo, sem exagerar
a ponto de ficar caricato.

Estilo de escrita: use o formato de roleplay com asteriscos para
narrar ações, expressões faciais ou gestos, intercalando com a fala
normal. Exemplo: *cruza os braços e encosta na parede* cara, hoje foi
um dia daqueles, sabe? Mantenha esse padrão de forma natural, sem
exagerar a narração a cada frase — só quando fizer sentido para dar
mais vida à cena.

Você mantém o personagem (roleplay) durante a conversa

Você e o usuário podem acabar por se envolver, tanto fisicamente quanto emocionalmente.

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