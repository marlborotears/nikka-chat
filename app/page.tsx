"use client";
import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Msg[] };

const STORAGE_KEY = "nikka_conversas";

export default function Chat() {
  const [conversas, setConversas] = useState<Conversation[]>([]);
  const [ativaId, setAtivaId] = useState<string>("");
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const carregou = useRef(false);

  // Carrega do localStorage ao abrir o site
  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const lista: Conversation[] = JSON.parse(salvo);
      if (lista.length > 0) {
        setConversas(lista);
        setAtivaId(lista[0].id);
        carregou.current = true;
        return;
      }
    }
    criarNovaConversa(true);
    carregou.current = true;
  }, []);

  // Salva no localStorage sempre que algo mudar
  useEffect(() => {
    if (carregou.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversas));
    }
  }, [conversas]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversas, carregando, ativaId]);

  function criarNovaConversa(semSalvarExtra = false) {
    const nova: Conversation = {
      id: crypto.randomUUID(),
      title: "Nova conversa",
      messages: [],
    };
    setConversas((prev) => [nova, ...prev]);
    setAtivaId(nova.id);
    setSidebarAberta(false);
    return nova;
  }

  function apagarConversa(id: string) {
    setConversas((prev) => {
      const restante = prev.filter((c) => c.id !== id);
      if (id === ativaId && restante.length > 0) setAtivaId(restante[0].id);
      if (restante.length === 0) {
        const nova: Conversation = { id: crypto.randomUUID(), title: "Nova conversa", messages: [] };
        setAtivaId(nova.id);
        return [nova];
      }
      return restante;
    });
  }

  const conversaAtiva = conversas.find((c) => c.id === ativaId);

  async function enviar() {
    if (!input.trim() || carregando || !conversaAtiva) return;

    const novoHistorico: Msg[] = [...conversaAtiva.messages, { role: "user", content: input }];
    const novoTitulo =
      conversaAtiva.title === "Nova conversa" ? input.slice(0, 30) : conversaAtiva.title;

    atualizarConversa(ativaId, novoHistorico, novoTitulo);
    setInput("");
    setCarregando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: novoHistorico }),
      });
      const data = await res.json();
      atualizarConversa(ativaId, [...novoHistorico, { role: "assistant", content: data.reply }], novoTitulo);
    } catch {
      atualizarConversa(
        ativaId,
        [...novoHistorico, { role: "assistant", content: "⚠️ Erro ao conectar com a Nikka." }],
        novoTitulo
      );
    } finally {
      setCarregando(false);
    }
  }

  function atualizarConversa(id: string, messages: Msg[], title: string) {
    setConversas((prev) => prev.map((c) => (c.id === id ? { ...c, messages, title } : c)));
  }

  return (
    <div style={estilos.appWrapper}>
      {/* SIDEBAR */}
      {sidebarAberta && (
        <div style={estilos.overlay} onClick={() => setSidebarAberta(false)} />
      )}
      <div style={{ ...estilos.sidebar, transform: sidebarAberta ? "translateX(0)" : "translateX(-100%)" }}>
        <button style={estilos.novoChatBtn} onClick={() => criarNovaConversa()}>
          + Nova conversa
        </button>
        <div style={estilos.listaConversas}>
          {conversas.map((c) => (
            <div
              key={c.id}
              style={{
                ...estilos.itemConversa,
                backgroundColor: c.id === ativaId ? "#2a0a3a" : "transparent",
              }}
              onClick={() => {
                setAtivaId(c.id);
                setSidebarAberta(false);
              }}
            >
              <span style={estilos.itemTexto}>{c.title}</span>
              <span
                style={estilos.itemApagar}
                onClick={(e) => {
                  e.stopPropagation();
                  apagarConversa(c.id);
                }}
              >
                🗑
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT PRINCIPAL */}
      <div style={estilos.container}>
        <header style={estilos.header}>
          <span style={estilos.menuBtn} onClick={() => setSidebarAberta(true)}>☰</span>
          <span style={estilos.headerTitulo}>🖤 Nikka</span>
          <span style={estilos.menuBtn} onClick={() => criarNovaConversa()}>＋</span>
        </header>

        <div style={estilos.chatArea}>
          {(!conversaAtiva || conversaAtiva.messages.length === 0) && (
            <p style={estilos.empty}>fala, o que você quer? 🖤</p>
          )}

          {conversaAtiva?.messages.map((m, i) => (
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
    </div>
  );
}

const estilos: { [k: string]: React.CSSProperties } = {
  appWrapper: {
    position: "relative",
    height: "100dvh",
    maxWidth: 600,
    margin: "0 auto",
    overflow: "hidden",
    backgroundColor: "#0d0d0d",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: "80%",
    maxWidth: 300,
    backgroundColor: "#141414",
    borderRight: "1px solid #330011",
    zIndex: 20,
    transition: "transform 0.25s ease",
    paddingTop: "calc(16px + env(safe-area-inset-top))",
    paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    boxSizing: "border-box",
    padding: "calc(16px + env(safe-area-inset-top)) 12px calc(16px + env(safe-area-inset-bottom)) 12px",
  },
  novoChatBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #7b1fa2",
    backgroundColor: "transparent",
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },
  listaConversas: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    overflowY: "auto",
  },
  itemConversa: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 10px",
    borderRadius: 8,
    cursor: "pointer",
    color: "#e0e0e0",
    fontSize: 14,
  },
  itemTexto: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    flex: 1,
  },
  itemApagar: {
    marginLeft: 8,
    opacity: 0.6,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    color: "#f1f1f1",
    fontFamily: "-apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    fontSize: 18,
    fontWeight: 600,
    borderBottom: "1px solid #330011",
    backgroundColor: "#141414",
    letterSpacing: 1,
  },
  headerTitulo: {
    flex: 1,
    textAlign: "center",
  },
  menuBtn: {
    fontSize: 20,
    width: 32,
    textAlign: "center",
    cursor: "pointer",
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
    paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
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