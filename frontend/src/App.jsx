import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isEscalated, setIsEscalated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fake login state for now
  const [loggedIn, setLoggedIn] = useState(false);

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
      if (!textOverride) {
        setInput("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
const handleLoginToggle = async () => {
  if (loggedIn) {
    setLoggedIn(false);
    return;
  }
  // Logging in: call backend to attach demo user
  try {
    await fetch(`${API_BASE}/api/user?session_id=${sessionId}`, {
      method: "POST",
    });
    setLoggedIn(true);
  } catch (e) {
    console.error("Failed to attach demo user", e);
  }
};

  // Predefined AWS Lex-style use cases
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

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617", // very dark
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 32 }}>
        {/* Left column: welcome + bot + login */}
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
              {/* pulsing dot */}
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

          {/* Login / Lex use case section */}
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
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
                  You’re logged in as a demo member. Choose a quick action to
                  see how the bot could trigger an AWS Lex intent:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {lexUseCases.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => sendMessage(c.prompt)}
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
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <p style={{ fontSize: 12, color: "#6b7280" }}>
            In the interview, you can explain how this demo maps to Cognito,
            Lex, and RAG-enabled intents on AWS.
          </p>
        </div>

        {/* Right column: chat UI */}
        <div style={{ flex: 1 }}>
          <h2 style={{ textAlign: "center", marginBottom: 8 }}>Live Chat Demo</h2>
          <div
            style={{
              border: "1px solid #4b5563",
              borderRadius: 8,
              padding: 12,
              height: 400,
              overflowY: "auto",
              marginBottom: 12,
              backgroundColor: "#111827",
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent:
                    m.role === "user" ? "flex-end" : "flex-start",
                  margin: "4px 0",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "8px 12px",
                    borderRadius: 12,
                    color: "#e5e7eb",
                    backgroundColor:
                      m.role === "user"
                        ? "#2563eb" // user: blue
                        : m.role === "agent"
                        ? "#16a34a" // agent: green
                        : "#4b5563", // bot: gray
                    fontSize: "14px",
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <strong style={{ fontSize: "11px", opacity: 0.8 }}>
                    {m.role.toUpperCase()}
                  </strong>
                  <div>{m.text}</div>
                </div>
              </div>
            ))}
            {isEscalated && (
              <div
                style={{
                  marginTop: 8,
                  fontStyle: "italic",
                  color: "#22c55e",
                  fontSize: 12,
                }}
              >
                (You are now in simulated live agent mode.)
              </div>
            )}
          </div>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              marginBottom: 8,
              backgroundColor: "#020617",
              color: "#e5e7eb",
              border: "1px solid #4b5563",
              borderRadius: 6,
              padding: 8,
              fontSize: 14,
            }}
            placeholder="Type a message. Try 'check claim status' or 'connect me to an agent'."
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid #4b5563",
              backgroundColor: loading ? "#374151" : "#2563eb",
              color: "#f9fafb",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* simple keyframes for pulse (inject into page) */}
      <style>
        {`@keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.6; }
            100% { transform: scale(1); opacity: 1; }
          }`}
      </style>
    </div>
  );
}

export default App;
