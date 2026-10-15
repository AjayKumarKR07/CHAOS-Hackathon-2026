# JARVIS — Personal AI Agent

> **Verified Multi-Step Automation with Independent State Verification, Idempotency, and Failure Recovery**  
> *CHAOS Hackathon 2026 Project* • [GitHub Repository](https://github.com/AjayKumarKR07/CHAOS-Hackathon-2026)

---

## Overview

**JARVIS** is a personal AI agent engineered for verified, multi-step productivity automation. Rather than simply generating text or presuming external operations succeed, JARVIS translates natural-language requests into structured plans, executes actions via strict allowlisted tools, independently verifies real document state changes directly within **MongoDB Atlas**, and guarantees safe, idempotent recovery when workflows encounter partial failures.

---

## Table of Contents

- [1. Problem Statement](#1-problem-statement)
- [2. Our Solution](#2-our-solution)
- [3. Problems JARVIS Solves](#3-problems-jarvis-solves)
- [4. What We Built](#4-what-we-built)
- [5. Example Workflow](#5-example-workflow)
- [6. Failure Recovery and Reliability](#6-failure-recovery-and-reliability)
- [7. System Architecture](#7-system-architecture)
- [8. Technology Stack](#8-technology-stack)
- [9. Testing and Validation](#9-testing-and-validation)
- [10. Project Structure](#10-project-structure)
- [11. Getting Started](#11-getting-started)
- [12. Security & Data Integrity](#12-security--data-integrity)
- [13. Current Limitations and Future Improvements](#13-current-limitations-and-future-improvements)
- [14. Hackathon Impact](#14-hackathon-impact)
- [15. License](#15-license)

---

## 1. Problem Statement

Modern knowledge workers lose significant time executing routine tasks across different workflows—creating follow-up tasks, recording structured audit notes, and drafting status updates. Traditional scripts and basic automation tools struggle with:

1. **Multi-Step Dependencies**: Failing to sequence operations where later steps depend on the verified outputs of earlier steps.
2. **Partial Failures & Cascading Errors**: Continuing downstream actions blindly even after an upstream operation fails.
3. **Duplicate Side Effects on Retries**: Creating duplicate records when a user or system retries an interrupted task.
4. **Lack of Truthful Verification**: Most LLM agents report that an action "succeeded" based purely on model generation without independently verifying that changes were committed to storage.

The challenge is to build an automation agent that can decompose multi-step requests, enforce execution order, detect failures, recover without duplication, and provide cryptographic/database proof of every outcome.

---

## 2. Our Solution

JARVIS resolves this through a controlled, 5-stage execution pipeline:

$$\text{Plan} \longrightarrow \text{Execute} \longrightarrow \text{Verify} \longrightarrow \text{Recover (when needed)} \longrightarrow \text{Report}$$

1. **Plan**: Decomposes natural-language instructions into validated, permitted tool calls.
2. **Execute**: Runs tools within a sandbox against MongoDB Atlas with user isolation.
3. **Verify**: Issues an independent database query to prove the document was committed and matches requested inputs.
4. **Recover**: Halts downstream steps on failure, preserves idempotency tokens, and permits safe manual retry with automated resumption of downstream tasks.
5. **Report**: Compiles an audit trail detailing completed, failed, and skipped actions, complete with document IDs and verification query logs.

> **Note on Scope**: Cross-application and cross-device automations require real-world API integrations. JARVIS currently focuses on robust task management, notes persistence, and workload analytics, avoiding unsupported claims of arbitrary external software automation.

---

## 3. Problems JARVIS Solves

| Problem | How JARVIS Solves It |
| :--- | :--- |
| **Repetitive task & note management** | Converts natural-language instructions into structured task documents with priorities and categorized notes automatically. |
| **Manual execution of multi-step chains** | Automatically coordinates chained actions (`task.create` $\rightarrow$ `note.create` $\rightarrow$ `summary.generate`) in a single request. |
| **Uncertainty about database persistence** | An independent verifier queries MongoDB Atlas post-execution to confirm the document physically exists before reporting success. |
| **Duplicate records caused by retries** | Generates deterministic SHA-256 idempotency tokens per step; tools check for existing tokens and reuse matching records instead of creating duplicates. |
| **Cascading errors after an early failure** | If Step 1 fails, downstream steps are immediately halted and marked as `SKIPPED` with explanatory messages. |
| **Difficulty diagnosing workflow faults** | Records error messages, attempt counts, execution duration, and failure origin (`TEST_MODE_SIMULATION` vs. `GENUINE_OPERATIONAL`). |
| **Limited visibility into recovery history** | Dedicated Smart Recovery Analytics tracks total failures, recovery rate, unresolved errors, and retry attempts using real database records. |
| **Ambiguity of in-memory vs. saved data** | Evidence Inspector clearly displays **Storage Mode**: `Atlas Persisted` vs. `In-Memory Only`, alongside exact MongoDB query summaries. |

---

## 4. What We Built

* **Natural-Language Task Execution**: Accepts high-level human prompts and converts them into structured plans.
* **Controlled Tool Execution**: Executes only allowlisted actions (`task.create`, `task.update`, `task.list`, `note.create`, `note.list`, `summary.generate`, `notification.simulate`). Arbitrary code/shell execution is prevented.
* **Priority-Aware Task Creation**: Persists tasks with `LOW`, `MEDIUM`, `HIGH`, or `URGENT` priority levels, due dates, and statuses (`TODO`, `IN_PROGRESS`, `DONE`).
* **Categorized Notes Management**: Creates structured notes linked to the authenticated user with title verification and content tracking.
* **Workload Summary Generation**: Evaluates active tasks, urgent items, and note counts. **Runs in-memory by default** unless note persistence is explicitly enabled via `save_as_note: true`.
* **MongoDB Atlas Persistence & Verification**: All entities are stored in MongoDB Atlas collections (`users`, `tasks`, `notes`, `agent_runs`, `agent_steps`). Verification queries inspect physical collections independently.
* **Visual Agent Workflow**: Interactive pipeline visualizer displaying the 5 lifecycle stages, tool dependencies, and step statuses (`PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `SKIPPED`).
* **Execution Timeline**: Chronological log with expandable diagnostic payloads, tool outputs, and idempotency keys.
* **Evidence Inspector**: Modal inspector displaying document IDs (`#task_id`, `#note_id`), MongoDB query summaries (`db.notes.find_one(...)`), verified timestamps, and storage mode indicators.
* **Failure Simulation Mode**: Controlled test-mode checkbox on the dashboard to test error handling, downstream step halting, and recovery without causing real service downtime.
* **Manual Retry & Downstream Resumption**: One-click recovery on failed steps that automatically unblocks and resumes downstream `SKIPPED` steps in order.
* **Idempotency Protection**: Deterministic tokens prevent duplicate tasks and notes across retries.
* **Smart Recovery Analytics**: Tracks operational failure metrics, deduplicates retry events, and displays `N/A` with `"No failures yet"` when zero failures exist (avoiding misleading 100% metrics).
* **JWT Authentication & User Isolation**: Full user registration/login flow; every database query enforces `{"user_id": current_user["id"]}` so users cannot read or modify another user's data.
* **Execution History**: Persistent list of past agent runs, execution durations, and final status reports.

---

## 5. Example Workflow

Consider the following natural-language instruction:

```text
"Create an urgent task to review API security, save a note containing the audit findings, and generate a summary of my workload"
```

### Execution Lifecycle

1. **Step 1 — `task.create`**:
   * Creates a task titled `"Review API Security"` with priority set to `URGENT`.
   * **Verification**: Verifies that the task exists in `db.tasks` for the authenticated user and matches the title.
2. **Step 2 — `note.create`**:
   * Saves a note titled `"API Security - Audit Findings"` containing actionable security review findings (JWT expiration, RBAC enforcement, and rate-limiting safeguards).
   * **Verification**: Confirms document creation in `db.notes` with matching title and content length.
3. **Step 3 — `summary.generate`**:
   * Evaluates total tasks, pending items, urgent priorities, and total saved notes.
   * **Verification**: Verifies the summary computation payload. Sets `note_persisted: false` to represent in-memory generation without creating an unnecessary duplicate note.

If Step 1 encounters a failure, Steps 2 and 3 are automatically assigned `SKIPPED` status. Once Step 1 is retried and verified, Steps 2 and 3 resume and complete the run.

---

## 6. Failure Recovery and Reliability

* **Deterministic Test-Mode Simulation**: Users can check **"Simulate Injected Failure (Test Mode)"** on the Command Center to test failure handling. The agent flags the run with `test_mode: true` and logs `[Simulated Injected Failure]`. These are simulated software tests, not real cloud provider outages.
* **Skipped Step Protection**: Dependent actions downstream of a failure are never marked as succeeded; they are safely marked `SKIPPED`.
* **Safe Manual Retry**: Users can retry any failed step from the Visual Workflow, Timeline, or Recovery Analytics panel.
* **Ordered Downstream Resumption**: Upon successful recovery of a step, the executor automatically finds downstream `SKIPPED` steps and executes them in sequence.
* **Idempotency Keys**: Steps compute `sha256(user_id:run_id:step_order:action_type:inputs)`. Tools query for existing tokens first, preventing duplicate documents.
* **Non-Retriable Error Guard**: `is_retry_eligible()` classifies validation errors (`ValidationError`), authentication errors (`Unauthorized`, `401/403`), and missing entity errors (`NotFoundError`) as non-retryable, avoiding wasteful automated loops.
* **Honest Audit Metrics**: Simulated failures are tagged `TEST_MODE_SIMULATION`, while system faults are tagged `GENUINE_OPERATIONAL`.

---

## 7. System Architecture

```mermaid
flowchart TD
    User([User]) -->|Natural Language Prompt| Frontend[React 19 Frontend<br/>Command Center & Visualizer]
    Frontend -->|POST /api/agent/runs<br/>Bearer JWT| Backend[FastAPI Backend]
    
    Backend --> Planner[Agent Planner<br/>Decomposes to Steps]
    Planner --> Executor[Allowlisted Tool Executor]
    
    Executor -->|Execute Tool Action| Mongo[(MongoDB Atlas<br/>Database)]
    Mongo -->|Raw Result| Verifier[Independent Verifier]
    Verifier -->|Query Verification<br/>db.collection.find_one| Mongo
    
    Verifier -->|Verification Passed| ReportGen[Execution Reporter]
    Verifier -->|Verification Failed| FaultHandler{Fault Detected?}
    
    FaultHandler -->|Downstream Actions| SkipEngine[Mark Dependent Steps SKIPPED]
    FaultHandler -->|Manual Retry Triggered| Recovery[Recovery Engine<br/>Idempotent Replay & Resumption]
    Recovery -->|Resume Eligible Steps| Executor
    
    SkipEngine --> ReportGen
    ReportGen --> FrontendUI[Evidence Inspector &<br/>Recovery Analytics UI]
    FrontendUI --> User
```

---

## 8. Technology Stack

### Frontend
* **React 19** (`react` `19.2.8`)
* **Vite** (`vite` `8.3.0`)
* **Tailwind CSS** (`tailwindcss` `3.4.17`)
* **React Router** (`react-router-dom` `7.18.4`)
* **Lucide Icons** (`lucide-react` `1.57.0`)

### Backend
* **Python 3.11**
* **FastAPI** (`fastapi` `0.111.0`)
* **Pydantic v2** (`pydantic` `2.7.4`)
* **Uvicorn** (`uvicorn` `0.30.1`)
* **PyMongo** (`pymongo` `4.8.0`)
* **JWT & Cryptography** (`python-jose` `3.3.0`, `passlib` `1.7.4`, `bcrypt` `4.0.1`)

### Database
* **MongoDB Atlas** (Cloud Replica Set `cluster0.gb0mkaf.mongodb.net`)
  * Collections: `users`, `tasks`, `notes`, `agent_runs`, `agent_steps`, `execution_logs`

### Testing & Build Tooling
* **Pytest** (`pytest` `8.2.2`)
* **HTTPX Test Client** (`httpx` `0.27.0`)
* **Vite Production Bundler**

---

## 9. Testing and Validation

All test suites and production builds were executed and verified against live MongoDB Atlas connections.

### Latest Validation Results
* **Backend Test Suite**: **24 passed, 8 warnings in 10.08s**
* **Frontend Production Build**: **Clean build in 1.06s** (`dist/index.html`, `dist/assets/index-*.js`, `dist/assets/index-*.css`)

```text
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.2.2, pluggy-1.6.0
rootdir: C:\Users\ajayk\OneDrive\Desktop\CHAOS-Hackathon-2026\backend

tests/test_agent_engine.py::test_multi_step_agent_execution_mongodb PASSED                 [  4%]
tests/test_agent_engine.py::test_exact_three_step_instruction_execution_and_verification PASSED [  8%]
tests/test_agent_engine.py::test_partial_failure_skipped_steps_and_recovery PASSED        [ 12%]
tests/test_agent_engine.py::test_failed_first_step_and_downstream_skipping_and_resumption PASSED [ 16%]
tests/test_agent_engine.py::test_idempotent_retry_prevents_duplicate_records PASSED       [ 20%]
tests/test_agent_engine.py::test_summary_generation_with_explicit_note_persistence PASSED [ 25%]
tests/test_agent_engine.py::test_zero_failure_analytics_reports_na PASSED                 [ 29%]
tests/test_agent_engine.py::test_genuine_vs_simulated_failure_origin PASSED               [ 33%]
tests/test_auth.py::test_register_and_login_flow PASSED                                 [ 37%]
tests/test_data_isolation.py::test_user_data_isolation PASSED                           [ 41%]
tests/test_evidence_and_analytics.py::test_verification_evidence_endpoint PASSED        [ 45%]
tests/test_evidence_and_analytics.py::test_smart_recovery_analytics_calculations PASSED  [ 50%]
tests/test_evidence_and_analytics.py::test_analytics_date_and_status_filtering PASSED    [ 54%]
tests/test_idempotency.py::test_idempotency_key_deterministic PASSED                    [ 58%]
tests/test_idempotency.py::test_idempotency_key_differentiates_steps PASSED             [ 62%]
tests/test_idempotency.py::test_duplicate_task_creation_prevention PASSED               [ 66%]
tests/test_mongo_connection.py::test_mask_mongo_uri PASSED                              [ 70%]
tests/test_mongo_connection.py::test_create_indexes PASSED                               [ 75%]
tests/test_mongo_connection.py::test_database_ping PASSED                                [ 79%]
tests/test_mongo_connection.py::test_health_check_endpoint PASSED                       [ 83%]
tests/test_mongo_connection.py::test_database_unavailable_scenario PASSED                [ 87%]
tests/test_tools.py::test_tool_allowlist_and_specs PASSED                               [ 91%]
tests/test_verification_and_recovery.py::test_failure_detection_and_safe_recovery_mongodb PASSED [ 95%]
tests/test_verification_and_recovery.py::test_permanent_errors_not_retried_automatically PASSED [100%]

======================= 24 passed, 8 warnings in 10.08s =======================
```

> *Note: These results represent local validation runs against the configured test suite and staging database; broader multi-region edge cases remain subject to real-world cloud conditions.*

---

## 10. Project Structure

```text
CHAOS-Hackathon-2026/
├── LICENSE
├── README.md
├── backend/
│   ├── .env.example
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── run.py
│   ├── app/
│   │   ├── main.py
│   │   ├── agent/
│   │   │   ├── executor.py
│   │   │   ├── planner.py
│   │   │   ├── recovery.py
│   │   │   └── verifier.py
│   │   ├── api/
│   │   │   ├── agent.py
│   │   │   ├── auth.py
│   │   │   ├── deps.py
│   │   │   ├── notes.py
│   │   │   ├── tasks.py
│   │   │   └── tools.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── mongo.py
│   │   │   └── serializers.py
│   │   ├── schemas/
│   │   │   ├── agent.py
│   │   │   ├── auth.py
│   │   │   ├── note.py
│   │   │   └── task.py
│   │   └── tools/
│   │       ├── base.py
│   │       ├── note_tools.py
│   │       ├── notification_tool.py
│   │       ├── registry.py
│   │       ├── summary_tool.py
│   │       └── task_tools.py
│   └── tests/
│       ├── conftest.py
│       ├── test_agent_engine.py
│       ├── test_auth.py
│       ├── test_data_isolation.py
│       ├── test_evidence_and_analytics.py
│       ├── test_idempotency.py
│       ├── test_mongo_connection.py
│       ├── test_tools.py
│       └── test_verification_and_recovery.py
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── components/
        │   ├── AgentWorkflowVisualizer.jsx
        │   ├── ExecutionTimeline.jsx
        │   ├── Footer.jsx
        │   ├── Navbar.jsx
        │   ├── NoteCard.jsx
        │   ├── RecoveryAnalyticsPanel.jsx
        │   ├── Sidebar.jsx
        │   ├── StatusBadge.jsx
        │   ├── TaskCard.jsx
        │   ├── ToolRegistryModal.jsx
        │   └── VerificationEvidenceModal.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── AgentRunsPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── NotesPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── RegisterPage.jsx
        │   ├── SettingsPage.jsx
        │   └── TasksPage.jsx
        └── services/
            ├── agentService.js
            ├── api.js
            ├── authService.js
            ├── noteService.js
            └── taskService.js
```

---

## 11. Getting Started

### Prerequisites
* **Python 3.11** installed
* **Node.js 18+** and **npm** installed
* An active **MongoDB Atlas** cluster connection string

### 1. Environment Configuration
Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Set the required environment variables:
```env
PROJECT_NAME="JARVIS — Personal AI Agent"
SECRET_KEY="your-custom-jwt-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/jarvis_db?retryWrites=true&w=majority
MONGODB_DATABASE=jarvis_db

# Optional Gemini Integration
GEMINI_API_KEY=
```

### 2. Start Backend Service (PowerShell)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* API Docs (Swagger UI): **`http://127.0.0.1:8000/docs`**
* Health Endpoint: **`http://127.0.0.1:8000/api/health`**

### 3. Start Frontend Application (Separate PowerShell Window)
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

* Dashboard UI: **`http://127.0.0.1:5173/dashboard`**
* Landing Page: **`http://127.0.0.1:5173`**

---

## 12. Security & Data Integrity

* **Strict User Isolation**: Every database operation filters by `user_id: current_user["id"]`. Users cannot read, modify, or inspect tasks, notes, or execution evidence belonging to another account.
* **Authentication Controls**: Passwords are encrypted with BCrypt hashing; session authorization uses standard signed JWT tokens (`HS256`).
* **Credential Masking**: Health checks and database logs automatically mask passwords and connection credentials (e.g., `mongodb+srv://user:***@cluster...`).
* **Environment Protection**: `.env` is explicitly declared in `.gitignore` and must never be committed to source control.
* **Tool Allowlisting**: Tools operate in a closed sandbox. Arbitrary shell commands, eval functions, or unrestricted filesystem access are disabled.

---

## 13. Current Limitations and Future Improvements

### Current Limitations
* Cross-application workflows are confined to the integrated personal productivity workspace (tasks, notes, workload summaries).
* Workflow execution runs synchronously per HTTP transaction; background asynchronous job queues are not yet implemented.

### Planned Future Improvements
* **External Productivity Integrations**: Connecting to GitHub Issues, Google Calendar, and Slack via authorized OAuth2 connections.
* **Durable Orchestration & Background Workers**: Asynchronous task scheduling via Celery/Temporal for multi-minute automation jobs.
* **Cross-Device Webhook Triggers**: Syncing workflow events across multiple devices via push notifications and webhooks.
* **Fine-Grained Tool Permissions**: Prompting for user confirmation before executing high-impact actions.

---

## 14. Hackathon Impact

JARVIS demonstrates that AI agents do not have to operate as unpredictable "black boxes." By coupling natural-language understanding with:
1. **Independent database-state verification**,
2. **Idempotency keys that prevent duplicate records on retry**, and
3. **Transparent recovery analytics with clear test-mode boundaries**,

JARVIS offers a repeatable, trustworthy paradigm for multi-step AI automation where users can inspect evidence and trust outcomes.

---

## 15. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.  
Copyright (c) 2026 Ajay Kumar K R.
