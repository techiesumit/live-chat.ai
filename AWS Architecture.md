Here’s Step 1: an AWS-style architecture **described as boxes and arrows** you can drop into draw.io / Excalidraw.

***

## Step 1 – Architecture diagram in words

Think of this as a left-to-right flow. Each line is a box, arrows show direction.

### 1. Channels & identity (left side)

- Box: **Member Web & Mobile Clients**
  - “Aetna Health Web SPA (React)”
  - “Mobile app (WebView / native chat)”
  - Arrow → **Amazon CloudFront + S3 (Web Hosting)**  

- Box: **Amazon Cognito (User Pool + IdP)**
  - “OIDC / SAML SSO, MFA”
  - Arrow from Clients → Cognito: “Login / OAuth2”
  - Arrow from Cognito → Clients: “ID Token (JWT)”

The **clients** then call APIs with the Cognito JWT.

Arrow from Clients → **API Gateway (Chat API)**:  
“HTTPS requests with JWT (Authorization: Bearer token)”

***

### 2. API & chat orchestration (center)

- Box: **Amazon API Gateway (HTTP API – Chat)**  
  - Routes:
    - `POST /chat`
    - `POST /session/user`
    - `GET /admin/sessions`
    - `GET /admin/events`

Arrow:  
API Gateway → **Chat Service (ECS Fargate or Lambda)**

- Box: **Chat Service (FastAPI container)**
  - Deployed on:
    - Option A: **ECS Fargate** + Application Load Balancer
    - Option B: **Lambda** (smaller scale)
  - Responsibilities (mirror your local FastAPI):
    - Validate JWT (Cognito).
    - Map `session_id` ↔ `ChatSession`.
    - Attach member profile (`User`) using Cognito `sub`.
    - Route message:
      - To Lex (for intents / FAQ / RAG).
      - To live agent system on escalation.
    - Persist chat messages and sessions in DB.
    - Emit analytics events.

Arrows from Chat Service:

1) Chat Service → **Lex / Bot layer**  
   Label: “RecognizeText / RecognizeUtterance (intent detection, FAQ, RAG)”

2) Chat Service → **Agent Routing**  
   Label: “Escalation event + transcript, member context”

3) Chat Service → **Relational DB**  
   Label: “Sessions, messages, user links (OLTP)”

4) Chat Service → **Event Stream**  
   Label: “chat_events: MESSAGE_SENT, ESCALATION, LOGIN, ERROR”

***

### 3. Conversational AI & RAG (upper-right)

- Box: **Amazon Lex V2 (Chatbot)**
  - Intents:
    - `CheckClaimStatus`
    - `FindProvider`
    - `ExplainBenefits`
  - Channels:
    - API (via Chat Service)
    - Amazon Connect (voice/chat)

Arrow:  
Chat Service ↔ Lex: “Text utterances + session attributes (member id, channel)”

For RAG / deep answers:

- Box: **Amazon Bedrock + Knowledge Bases**
  - Sources:
    - **Amazon S3**: “Benefits PDFs, provider policies, FAQ docs”
  - Bedrock KB + RAG used by:
    - Lex fulfillment Lambda OR
    - Chat Service directly

Arrows:

- Lex → **Lex Fulfillment Lambda (optional)** → Bedrock KB  
  “Get context-grounded answer”
- Bedrock → Lex / Chat Service: “Answer text + citations”

***

### 4. Live agents & contact center (lower-right)

- Box: **Amazon Connect (Contact Center)**  
  - Channels: Voice, Web chat.
  - Uses same Lex bot for IVR / pre-chat flows. [docs.aws.amazon](https://docs.aws.amazon.com/connect/latest/adminguide/amazon-lex.html)

Arrows:

- Chat Service → Connect API:
  - “StartChatContact / StartTaskContact with transcript + member attributes”
- Connect → **Agent Desktop (CCP + CRM)**:
  - Agent sees:
    - Member profile (from CRM / FHIR system).
    - Chat transcript context (from Chat Service).
- Connect → **Contact Lens / analytics** (optional):
  - Conversation sentiment and QA metrics (voice/chat).

If the org uses Twilio Flex or Zendesk instead:

- Box: **Twilio Flex / Zendesk**  
  - Replace “Connect” box with CCaaS platform.
  - Arrow from Chat Service for escalation.

***

### 5. Data & analytics (bottom)

- Box: **Amazon RDS for PostgreSQL**
  - Tables (map from your SQLAlchemy models):
    - `users` (minimal PII, Cognito `sub`, member id)
    - `chat_sessions` (session_token, user_id, created_at)
    - `chat_messages` (session_id, role, text, timestamps)
  - Arrow from Chat Service: “OLTP writes / reads”

- Box: **EventBridge or Amazon Kinesis (Event Bus)**
  - Receives:
    - `chat_events` from Chat Service (MESSAGE_SENT, ESCALATION, LOGIN, ERROR).

Arrow:

- EventBridge/Kinesis → **Kinesis Firehose** → **Amazon S3 (Data Lake)**  
  Label: “Event logs (partitioned by date/channel/intent)”

- Box: **Amazon Athena**
  - Queries over S3 event data and (optionally) over RDS snapshots.

- Box: **Amazon QuickSight**
  - Dashboards:
    - Bot containment rate.
    - Escalation volume by intent.
    - Response latency.
    - Member satisfaction (if enriched with CSAT).

Arrow:  
S3 / Athena → QuickSight: “Datasets for dashboards”

***

### 6. Security, networking, and ops (wrapping all boxes)

- Box: **VPC**
  - Contains:
    - ECS tasks or Lambda VPC endpoints.
    - RDS.
    - VPC endpoints for Lex, Bedrock, S3, Kinesis.
- Security:
  - IAM roles per service (least privilege).
  - KMS for RDS, S3, Kinesis, and any secrets (via Secrets Manager).
  - WAF on CloudFront / ALB for edge protection.
- Observability:
  - CloudWatch metrics & logs for:
    - API Gateway, ECS/Lambda, Lex, Connect, RDS.
  - Alarms for error rate, latency, 5xx, DB connections, etc.
