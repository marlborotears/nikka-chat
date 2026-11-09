"use client";
import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, carregando]);

  async function enviar() {
    if (!input.trim() || carregando) return;
    const novoHistorico: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(novoHistorico);
    setInput("");
    setCarregando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: novoHistorico }),
      });
      const data = await res.json();
      setMessages([...novoHistorico, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...novoHistorico, { role: "assistant", content: "⚠️ Erro ao conectar com a Nikka." }]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={estilos.container}>
      <header style={estilos.header}>🖤 Nikka</header>

      <div style={estilos.chatArea}>
        {messages.length === 0 && (
          <p style={estilos.empty}>fala, o que você quer? 🖤</p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...estilos.bubbleWrapper,
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...estilos.bubble,
                ...(m.role === "user" ? estilos.bubbleUser : estilos.bubbleAssistant),
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {carregando && (
          <div style={{ ...estilos.bubbleWrapper, justifyContent: "flex-start" }}>
            <div style={{ ...estilos.bubble, ...estilos.bubbleAssistant }}>
              <i>Nikka está digitando...</i>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div style={estilos.inputArea}>
        <input
          style={estilos.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Digite sua mensagem..."
        />
        <button style={estilos.botao} onClick={enviar} disabled={carregando}>
          ➤
        </button>
      </div>
    </div>
  );
}

const estilos: { [k: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "#0d0d0d",
    color: "#f1f1f1",
    fontFamily: "-apple-system, sans-serif",
  },
  header: {
    padding: "16px",
    fontSize: 20,
    fontWeight: 600,
    borderBottom: "1px solid #330011",
    textAlign: "center",
    backgroundColor: "#141414",
    letterSpacing: 1,
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
  },
  bubbleWrapper: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: 18,
    fontSize: 15,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
  },
  bubbleUser: {
    backgroundColor: "#7b1fa2",
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#1c1c1c",
    color: "#e0e0e0",
    border: "1px solid #330011",
    borderBottomLeftRadius: 4,
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid #330011",
    backgroundColor: "#141414",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 24,
    border: "1px solid #330011",
    backgroundColor: "#1c1c1c",
    color: "#fff",
    fontSize: 15,
    outline: "none",
  },
  botao: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#7b1fa2",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
  },
};