```markdown
# Live Chat Support – Local Development Guide

This project is a local prototype of a **Digital Member Support** live chat
experience. It demonstrates:

- A member-facing UI with chatbot and quick actions.
- A FastAPI backend for chat, session, and user handling.
- Event logging and a simple admin view for observability.

This guide covers **local setup and usage** only.

---

## 1. Architecture Overview

### Frontend

- React + Vite single-page application.
- Dark-theme UI with:
  - **Member View**
    - Welcome + chatbot avatar.
    - Demo login toggle.
    - Quick actions that represent AWS Lex intents.
    - Live chat panel (user / bot / agent messages).
  - **Admin View**
    - Event log viewer for recent chat events.

### Backend

- Python 3 + FastAPI.
- SQLAlchemy ORM.
- SQLite database (`chat.db`) for:
  - `users`
  - `chat_sessions`
  - `chat_messages`
  - `chat_events`

### Ports and CORS

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

FastAPI is configured with CORS to allow:

- `http://127.0.0.1:5173`
- `http://localhost:5173`

---

## 2. Project Structure

```text
D:\live-chat.ai
  backend\
    .venv\
    main.py
    database.py
    models.py
    requirements.txt
    chat.db
  frontend\
    package.json
    vite.config.js
    index.html
    src\
      App.jsx
      main.jsx
      pages\
        MemberPage.jsx
        AdminPage.jsx
      components\
        ChatPanel.jsx
        AdminEventsPanel.jsx
```

---

## 3. Backend Setup

### 3.1 Create and activate virtual environment

From PowerShell:

```powershell
Set-Location D:\live-chat.ai\backend

python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3.2 Install dependencies

`requirements.txt` should include at least:

```text
fastapi
uvicorn[standard]
sqlalchemy
pydantic
```

Install:

```powershell
pip install -r requirements.txt
```

### 3.3 Key backend files

#### `database.py`

- Configures SQLite (file-based) database:

  ```python
  SQLALCHEMY_DATABASE_URL = "sqlite:///./chat.db"
  ```

- Creates:

  - `engine`
  - `SessionLocal`
  - `Base`

#### `models.py`

Defines SQLAlchemy models:

- `User`
  - `id`, `external_id`, `name`, `email`
  - Relationship: `sessions`
- `ChatSession`
  - `id`, `session_token`, `user_id`, `created_at`
  - Relationships: `user`, `messages`
- `ChatMessage`
  - `id`, `session_id`, `role`, `text`, `created_at`
  - Relationship: `session`
- `ChatEvent`
  - `id`, `session_id`, `user_id`, `event_type`, `detail`, `created_at`
  - Relationships: `session`, `user`

#### `main.py`

FastAPI application:

- Creates tables via `Base.metadata.create_all(bind=engine)`.
- Adds CORS middleware for local frontend origins.
- Provides:

  - `POST /api/chat`
  - `POST /api/user`
  - `GET /api/admin/sessions`
  - `GET /api/admin/sessions/{session_id}`
  - `GET /api/admin/events?limit=N`

##### `/api/chat`

- Request body:

  ```json
  {
    "session_id": "<uuid>",
    "message": "<user text>"
  }
  ```

- Behavior:

  1. Ensures `ChatSession` for `session_id`.
  2. Adds `ChatMessage` for the user.
  3. Records a `MESSAGE_SENT` entry in `chat_events`.
  4. Escalation:
     - If message contains `agent` or `escalate`:
       - Adds bot escalation message.
       - Adds simulated agent greeting.
       - Records an `ESCALATION` event.
  5. FAQ:
     - `claim` → mock claim answer.
     - `provider` → mock provider directory answer.
     - `benefit` → mock benefits answer.
     - Otherwise → generic help message.

- Response:

  ```json
  {
    "session_id": "<uuid>",
    "messages": [
      { "role": "bot", "text": "..." },
      { "role": "agent", "text": "..." }
    ],
    "escalated": true | false
  }
  ```

##### `/api/user`

- Query parameter: `session_id`.
- Behavior:

  1. Ensures `ChatSession` for `session_id`.
  2. Upserts a demo `User`:
     - `external_id = "DEMO-MEMBER-123"`.
  3. Links the session to that user.
  4. Records a `LOGIN` event in `chat_events`.
  5. Returns basic user info.

##### `/api/admin/sessions`

- Returns list of sessions:

  ```json
  {
    "sessions": [
      { "session_id": "<token>", "message_count": 5 },
      ...
    ]
  }
  ```

##### `/api/admin/sessions/{session_id}`

- Returns full message history for a given session.

##### `/api/admin/events`

- Returns recent `ChatEvent` rows ordered by `created_at` descending.
- Each event includes:
  - `id`
  - `event_type` (`MESSAGE_SENT`, `ESCALATION`, `LOGIN`, etc.)
  - `session_id`
  - `user_id`
  - `detail`
  - `created_at`

### 3.4 Run backend

```powershell
Set-Location D:\live-chat.ai\backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

Open Swagger UI at `http://127.0.0.1:8000/docs`.

---

## 4. Frontend Setup

From PowerShell:

```powershell
Set-Location D:\live-chat.ai\frontend

npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4.1 `App.jsx`

- Exports:

  ```javascript
  export const API_BASE = "http://127.0.0.1:8000";
  ```

- Creates a `sessionId` (UUID) per browser tab.
- Manages toggle between:

  - **Member View**
  - **Admin View**

### 4.2 `MemberPage.jsx`

Left panel:

- Heading: **Digital Member Support**.
- Chatbot avatar with animated “online” status.
- “Member experience” card:
  - Guest text when not logged in.
  - **Log in (demo)** button:
    - Calls `POST /api/user?session_id=<uuid>`.
    - Toggles to “Log out (demo)” on success.
- When logged in, shows quick actions:
  - “Check claim status”
  - “Find a provider”
  - “Understand my benefits”
- Each quick action sends a pre-defined prompt through the chat pipeline.

Right panel:

- `ChatPanel` renders:

  - Chat bubbles:
    - User: blue.
    - Bot: gray.
    - Agent: green.
  - Escalation note when `escalated = true`.
  - Input text area and Send button.

`MemberPage` owns chat state:

- `messages`, `input`, `isEscalated`, `loading`.
- `sendMessage` function posts to `/api/chat` and updates state.

### 4.3 `AdminPage.jsx`

- Introduces the admin view.
- Renders `AdminEventsPanel`.

### 4.4 `AdminEventsPanel.jsx`

- “Load latest events” button:
  - Calls `GET /api/admin/events?limit=100`.
- Displays events:

  - Event type.
  - Session and user ids.
  - Event detail text.
  - Timestamp.

---

## 5. Typical Local Usage

### Member Journey

1. Start backend (`uvicorn`) and frontend (`npm run dev`).
2. Visit `http://localhost:5173` → **Member View**.
3. Click **Log in (demo)**:
   - Session is linked to demo member.
   - `LOGIN` event recorded.
4. Use quick actions (e.g., **Check claim status**):
   - Sends a prefilled message to `/api/chat`.
   - Bot returns mock claim answer.
   - `MESSAGE_SENT` events recorded.
5. Type “connect me to an agent”:
   - Bot escalates to live agent (simulated).
   - `ESCALATION` event recorded.
   - UI shows agent bubble and escalation banner.

### Admin Journey

1. Switch to **Admin View** via top-right toggle.
2. Click **Load latest events**:
   - Events from `chat_events` are loaded and displayed.
   - You can see `LOGIN`, `MESSAGE_SENT`, `ESCALATION` entries.

---

## 6. Mapping to AWS (for Interview Discussion)

This local prototype is designed to map directly to an AWS architecture:

- **React SPA / Mobile app**  
  → Aetna Health web/mobile client (hosted on CloudFront/S3 or behind ALB).

- **FastAPI service + SQLite**  
  → API Gateway → Lambda or ECS/Fargate service, with **Amazon RDS (PostgreSQL)** or **DynamoDB** for `users`, `chat_sessions`, and `chat_messages`.

- **Chatbot FAQ logic**  
  → Amazon Lex bot + Bedrock Knowledge Base / RAG over internal documentation and APIs.

- **Live agent escalation**  
  → Amazon Connect or third-party CCaaS (Twilio Flex, Zendesk) integrated with Lex.

- **Event logging (`chat_events`)**  
  → Kinesis / EventBridge → S3 data lake, queried via Athena / visualized in QuickSight for analytics and reporting.

