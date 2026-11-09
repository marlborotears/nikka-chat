"use client";
import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string; hora: string };
type Conversation = { id: string; title: string; messages: Msg[] };

const STORAGE_KEY = "nikka_conversas";

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const [conversas, setConversas] = useState<Conversation[]>([]);
  const [ativaId, setAtivaId] = useState<string>("");
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [alturaApp, setAlturaApp] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const carregou = useRef(false);

  // --- Corrige altura real quando o teclado do iOS abre/fecha ---
  useEffect(() => {
    function ajustarAltura() {
      const vv = window.visualViewport;
      if (vv) {
        setAlturaApp(vv.height);
      }
    }
    ajustarAltura();
    window.visualViewport?.addEventListener("resize", ajustarAltura);
    window.visualViewport?.addEventListener("scroll", ajustarAltura);
    return () => {
      window.visualViewport?.removeEventListener("resize", ajustarAltura);
      window.visualViewport?.removeEventListener("scroll", ajustarAltura);
    };
  }, []);

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
    criarNovaConversa();
    carregou.current = true;
  }, []);

  useEffect(() => {
    if (carregou.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversas));
    }
  }, [conversas]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversas, carregando, ativaId, alturaApp]);

  function criarNovaConversa() {
    const nova: Conversation = { id: crypto.randomUUID(), title: "Nova conversa", messages: [] };
    setConversas((prev) => [nova, ...prev]);
    setAtivaId(nova.id);
    setSidebarAberta(false);
    return nova;
  }

  function apagarConversa(id: string) {
    setConversas((prev) => {
      const restante = prev.filter((c) => c.id !== id);
      if (restante.length === 0) {
        const nova: Conversation = { id: crypto.randomUUID(), title: "Nova conversa", messages: [] };
        setAtivaId(nova.id);
        return [nova];
      }
      if (id === ativaId) setAtivaId(restante[0].id);
      return restante;
    });
  }

  const conversaAtiva = conversas.find((c) => c.id === ativaId);

  function ajustarAlturaTextarea() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }

  function aoFocarInput() {
    // Dá um tempinho pro teclado terminar de abrir antes de rolar
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 300);
  }

  async function enviar() {
    if (!input.trim() || carregando || !conversaAtiva) return;

    const novaMsg: Msg = { role: "user", content: input, hora: horaAgora() };
    const novoHistorico: Msg[] = [...conversaAtiva.messages, novaMsg];
    const novoTitulo = conversaAtiva.title === "Nova conversa" ? input.slice(0, 30) : conversaAtiva.title;

    atualizarConversa(ativaId, novoHistorico, novoTitulo);
    setInput("");
    setTimeout(ajustarAlturaTextarea, 0);
    setCarregando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: novoHistorico.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      atualizarConversa(
        ativaId,
        [...novoHistorico, { role: "assistant", content: data.reply, hora: horaAgora() }],
        novoTitulo
      );
    } catch {
      atualizarConversa(
        ativaId,
        [...novoHistorico, { role: "assistant", content: "⚠️ Erro ao conectar com a Nikka.", hora: horaAgora() }],
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
    <div
      style={{
        ...estilos.appWrapper,
        height: alturaApp ? `${alturaApp}px` : "100dvh",
      }}
    >
      {sidebarAberta && <div style={estilos.overlay} onClick={() => setSidebarAberta(false)} />}

      <div style={{ ...estilos.sidebar, transform: sidebarAberta ? "translateX(0)" : "translateX(-100%)" }}>
        <button style={estilos.novoChatBtn} onClick={criarNovaConversa}>+ Nova conversa</button>
        <div style={estilos.listaConversas}>
          {conversas.map((c) => (
            <div
              key={c.id}
              style={{ ...estilos.itemConversa, backgroundColor: c.id === ativaId ? "#2a0a3a" : "transparent" }}
              onClick={() => { setAtivaId(c.id); setSidebarAberta(false); }}
            >
              <span style={estilos.itemTexto}>{c.title}</span>
              <span style={estilos.itemApagar} onClick={(e) => { e.stopPropagation(); apagarConversa(c.id); }}>🗑</span>
            </div>
          ))}
        </div>
      </div>

      <div style={estilos.container}>
        <header style={estilos.header}>
          <div style={estilos.headerEsquerda}>
            <span style={estilos.menuBtn} onClick={() => setSidebarAberta(true)}>☰</span>
            <div style={estilos.avatar}>🖤</div>
            <div>
              <div style={estilos.headerTitulo}>Nikka</div>
              <div style={estilos.headerStatus}>{carregando ? "digitando..." : "online"}</div>
            </div>
          </div>
          <span style={estilos.menuBtn} onClick={criarNovaConversa}>＋</span>
        </header>

        <div style={estilos.chatArea}>
          {(!conversaAtiva || conversaAtiva.messages.length === 0) && (
            <p style={estilos.empty}>fala, o que você quer? 🖤</p>
          )}

          {conversaAtiva?.messages.map((m, i) => (
            <div
              key={i}
              className="msg-animada"
              style={{ ...estilos.bubbleWrapper, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
            >
              <div style={{ ...estilos.bubble, ...(m.role === "user" ? estilos.bubbleUser : estilos.bubbleAssistant) }}>
                <div>{m.content}</div>
                <div style={{ ...estilos.hora, textAlign: m.role === "user" ? "right" : "left" }}>{m.hora}</div>
              </div>
            </div>
          ))}

          {carregando && (
            <div className="msg-animada" style={{ ...estilos.bubbleWrapper, justifyContent: "flex-start" }}>
              <div style={{ ...estilos.bubble, ...estilos.bubbleAssistant, padding: "14px 16px" }}>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div style={estilos.inputArea}>
          <textarea
            ref={textareaRef}
            style={estilos.input}
            value={input}
            rows={1}
            onFocus={aoFocarInput}
            onChange={(e) => { setInput(e.target.value); ajustarAlturaTextarea(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Mensagem..."
          />
          <button style={estilos.botao} onClick={enviar} disabled={carregando || !input.trim()}>➤</button>
        </div>
      </div>
    </div>
  );
}

const estilos: { [k: string]: React.CSSProperties } = {
  appWrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    maxWidth: 600,
    margin: "0 auto",
    overflow: "hidden",
    backgroundColor: "#0d0d0d",
    transition: "height 0.1s ease",
  },
  overlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10 },
  sidebar: {
    position: "fixed", top: 0, left: 0, bottom: 0, width: "80%", maxWidth: 300,
    backgroundColor: "#141414", borderRight: "1px solid #330011", zIndex: 20,
    transition: "transform 0.25s ease", display: "flex", flexDirection: "column", gap: 8,
    boxSizing: "border-box",
    padding: "calc(16px + env(safe-area-inset-top)) 12px calc(16px + env(safe-area-inset-bottom)) 12px",
  },
  novoChatBtn: {
    padding: "10px 14px", borderRadius: 10, border: "1px solid #7b1fa2",
    backgroundColor: "transparent", color: "#fff", fontSize: 14, cursor: "pointer",
  },
  listaConversas: { marginTop: 12, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" },
  itemConversa: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 10px", borderRadius: 8, cursor: "pointer", color: "#e0e0e0", fontSize: 14,
  },
  itemTexto: { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1 },
  itemApagar: { marginLeft: 8, opacity: 0.6 },
  container: {
    display: "flex", flexDirection: "column", height: "100%",
    color: "#f1f1f1", fontFamily: "-apple-system, sans-serif",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px", paddingTop: "calc(10px + env(safe-area-inset-top))",
    borderBottom: "1px solid #330011", backgroundColor: "#141414",
    flexShrink: 0,
  },
  headerEsquerda: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: "50%", backgroundColor: "#2a0a3a",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
  },
  headerTitulo: { fontSize: 16, fontWeight: 600 },
  headerStatus: { fontSize: 11, color: "#9b6fae" },
  menuBtn: { fontSize: 20, width: 32, textAlign: "center", cursor: "pointer" },
  chatArea: { flex: 1, minHeight: 0, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },
  bubbleWrapper: { display: "flex", width: "100%" },
  bubble: {
    maxWidth: "75%", padding: "8px 12px 6px 12px", borderRadius: 16,
    fontSize: 15, lineHeight: 1.4, whiteSpace: "pre-wrap",
  },
  bubbleUser: { backgroundColor: "#7b1fa2", color: "#fff", borderBottomRightRadius: 4 },
  bubbleAssistant: {
    backgroundColor: "#1c1c1c", color: "#e0e0e0", border: "1px solid #330011", borderBottomLeftRadius: 4,
  },
  hora: { fontSize: 10, opacity: 0.6, marginTop: 2 },
  inputArea: {
    display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 14px",
    paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
    borderTop: "1px solid #330011", backgroundColor: "#141414",
    flexShrink: 0,
  },
  input: {
    flex: 1, padding: "10px 16px", borderRadius: 20, border: "1px solid #330011",
    backgroundColor: "#1c1c1c", color: "#fff", fontSize: 15, outline: "none",
    resize: "none", maxHeight: 120, fontFamily: "inherit",
  },
  botao: {
    width: 40, height: 40, borderRadius: "50%", border: "none",
    backgroundColor: "#7b1fa2", color: "#fff", fontSize: 16, cursor: "pointer", flexShrink: 0,
  },
};