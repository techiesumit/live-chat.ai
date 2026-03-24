import { useState } from "react";
import { API_BASE } from "../App";

function AdminEventsPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/events?limit=100`);
      const data = await res.json();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={loadEvents}
        style={{
          marginBottom: 8,
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #4b5563",
          backgroundColor: "#111827",
          color: "#e5e7eb",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {loading ? "Loading..." : "Load latest events"}
      </button>
      <div
        style={{
          border: "1px solid #4b5563",
          borderRadius: 8,
          padding: 8,
          height: 420,
          overflowY: "auto",
          backgroundColor: "#111827",
          fontSize: 12,
        }}
      >
        {events.length === 0 && !loading && (
          <div style={{ color: "#6b7280" }}>
            No events yet. Trigger some chats or logins.
          </div>
        )}
        {events.map((e) => (
          <div
            key={e.id}
            style={{
              borderBottom: "1px solid #1f2937",
              padding: "4px 0",
            }}
          >
            <div style={{ fontWeight: 600 }}>{e.event_type}</div>
            <div style={{ color: "#9ca3af" }}>
              session: {e.session_id ?? "—"} • user: {e.user_id ?? "—"}
            </div>
            {e.detail && (
              <div style={{ color: "#e5e7eb" }}>{e.detail}</div>
            )}
            <div style={{ color: "#6b7280" }}>{e.created_at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminEventsPanel;
