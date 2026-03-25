import { useState } from "react";
import { API_BASE } from "../App";
import ChatPanel from "../components/ChatPanel";

const lexUseCases = [
  {
    label: "Check claim status",
    prompt: "I want to check the status of my claim.",
  },
  {
    label: "Find a provider",
    prompt: "Help me find an in-network provider.",
  },
  {
    label: "Understand my benefits",
    prompt: "Explain my benefits for primary care visits.",
  },
];

function MemberPage({ sessionId }) {
  const [loggedIn, setLoggedIn] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isEscalated, setIsEscalated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginToggle = async () => {
    if (loggedIn) {
      setLoggedIn(false);
      return;
    }
    try {
      await fetch(`${API_BASE}/api/user?session_id=${sessionId}`, {
        method: "POST",
      });
      setLoggedIn(true);
    } catch (e) {
      console.error("Failed to attach demo user", e);
    }
  };

  const sendMessage = async (textOverride) => {
    const text = textOverride ?? input;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, ...data.messages]);
      setIsEscalated(data.escalated);
      if (!textOverride) setInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 32 }}>
      {/* Left panel: welcome + bot + member experience */}
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          Digital Member Support
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>
          Welcome to the live chat experience that combines an intelligent
          chatbot with seamless escalation to a live agent.
        </p>

        {/* Bot avatar + status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 30% 30%, #22d3ee, #1e293b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 20 }}>🤖</span>
            <span
              style={{
                position: "absolute",
                bottom: 2,
                right: 2,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                animation: "pulse 1.5s infinite",
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Chatbot Assistant
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              Online • ready to help with claims, providers, and benefits
            </div>
          </div>
        </div>

        {/* Member experience card */}
        <div
          style={{
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            backgroundColor: "#020617",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              Member experience
            </span>
            <button
              onClick={handleLoginToggle}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #4b5563",
                backgroundColor: loggedIn ? "#16a34a" : "transparent",
                color: loggedIn ? "#f9fafb" : "#e5e7eb",
                cursor: "pointer",
              }}
            >
              {loggedIn ? "Log out (demo)" : "Log in (demo)"}
            </button>
          </div>

          {!loggedIn ? (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              You’re currently browsing as a guest. In a real deployment,
              members would sign in to unlock personalized options powered by
              AWS Lex and their Aetna profile.
            </p>
          ) : (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  marginBottom: 8,
                }}
              >
                You’re logged in as a demo member. Choose a quick action to see
                how the bot could trigger an AWS Lex intent:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {lexUseCases.map((c) => (
                  <ChatQuickAction
                    key={c.label}
                    label={c.label}
                    prompt={c.prompt}
                    onQuickSend={sendMessage}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <p style={{ fontSize: 12, color: "#6b7280" }}>
          In the interview, you can explain how this demo maps to Cognito, Lex,
          and RAG-enabled intents on AWS.
        </p>
      </div>

      {/* Right panel: chat */}
      <div style={{ flex: 1 }}>
        <ChatPanel
          messages={messages}
          isEscalated={isEscalated}
          input={input}
          loading={loading}
          setInput={setInput}
          onSend={() => sendMessage()}
        />
      </div>
    </div>
  );
}

function ChatQuickAction({ label, prompt, onQuickSend }) {
  const handleClick = () => {
    onQuickSend(prompt);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #4b5563",
        backgroundColor: "#111827",
        color: "#e5e7eb",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export default MemberPage;
