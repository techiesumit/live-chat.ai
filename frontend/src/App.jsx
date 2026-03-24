import { useState } from "react";
import MemberPage from "./pages/MemberPage";
import AdminPage from "./pages/AdminPage";

export const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [activePage, setActivePage] = useState("member"); // 'member' | 'admin'
  const [sessionId] = useState(() => crypto.randomUUID());

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020617",
        color: "#e5e7eb",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Page toggle */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            onClick={() => setActivePage("member")}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              backgroundColor:
                activePage === "member" ? "#2563eb" : "transparent",
              color: "#e5e7eb",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Member View
          </button>
          <button
            onClick={() => setActivePage("admin")}
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #4b5563",
              backgroundColor:
                activePage === "admin" ? "#2563eb" : "transparent",
              color: "#e5e7eb",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Admin View
          </button>
        </div>

        {activePage === "member" ? (
          <MemberPage sessionId={sessionId} />
        ) : (
          <AdminPage />
        )}
      </div>

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
