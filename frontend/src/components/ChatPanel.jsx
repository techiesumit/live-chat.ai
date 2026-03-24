import { useState } from "react";
import { API_BASE } from "../App";

function ChatPanel({ sessionId, onReady }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isEscalated, setIsEscalated] = useState(false);
    const [loading, setLoading] = useState(false);

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
    useEffect(() => {
        if (onReady) {
            onReady(sendMessage);
        }
    }, [onReady, sendMessage]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
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
                                        ? "#2563eb"
                                        : m.role === "agent"
                                            ? "#16a34a"
                                            : "#4b5563",
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
        </>
    );
}

export default ChatPanel;
