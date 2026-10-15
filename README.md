# JARVIS — Personal AI Agent

A verified multi-step personal AI automation agent built with **FastAPI**, **MongoDB Atlas**, **React**, and **Vite**.

Designed for high-reliability personal execution: converts natural language instructions into multi-step plans, executes permitted actions via connected tools, independently verifies real document state in MongoDB Atlas, and provides truthful failure recovery with idempotency guarantees.

---

## Architecture Overview

1. **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Left Sidebar Navigation, Glassmorphism dark aesthetic.
2. **Backend**: FastAPI (Python 3.11), PyMongo connection pool, BSON serialization, JWT authentication, BCrypt password hashing.
3. **Database**: MongoDB Atlas (Cloud Replica Set).
   - Collections: `users`, `tasks`, `notes`, `agent_runs`, `agent_steps`, `execution_logs`.
   - Indexes: Unique email index, user isolation indexes, compound step order indexes, sparse idempotency indexes.
4. **Agent Engine**:
   - 10-stage execution lifecycle.
   - Strict allowlist sandbox policy (`task.create`, `task.update`, `task.list`, `note.create`, `note.list`, `summary.generate`, `notification.simulate`). Arbitrary shell/exec blocked.
   - Independent verification engine querying MongoDB documents post-execution.
   - Truthful failure detection with simulation mode and safe retry recovery.

---

## Advanced Features

1. **Visual Agent Workflow**:
   - 5-stage interactive lifecycle pipeline (**Plan → Execute → Verify → Recover → Report**).
   - Tool action dependency graph mapping real execution states, duration, and dependencies.
   - Transparent distinction between planned actions vs verified, executed steps.
   - Fault detection, dependency halting, and in-place recovery for partial failures.

2. **Verification Evidence Inspector**:
   - One-click evidence inspection on any step across the workflow and execution timeline.
   - Displays real MongoDB document IDs, sanitized verification queries, attempt counts, and latency.
   - Enforces user isolation, returns 404 for unauthorized data access, and masks sensitive credentials.

3. **Smart Failure Recovery Analytics**:
   - Computes total runs, failed steps, retry attempts, recovered failures, unresolved failures, recovery success rate, and average duration.
   - Aggregated from actual MongoDB Atlas execution records with division-by-zero protection.
   - Time range and status filtering with failed step audit trail and one-click safe recovery.

---

## MongoDB Atlas Setup & Configuration

Configure your environment in `backend/.env`:

```env
PROJECT_NAME="JARVIS — Personal AI Agent"
SECRET_KEY="your-secure-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.gb0mkaf.mongodb.net/jarvis_db?retryWrites=true&w=majority
MONGODB_DATABASE=jarvis_db

# Optional Gemini API Key
GEMINI_API_KEY=
```

> **Security Note**: Never commit `.env` or paste credentials into source control. `.env` is excluded in `.gitignore`.

---

## Running the Application

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://127.0.0.1:8000/docs`  
Database Health Check: `http://127.0.0.1:8000/api/health`

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

---

## Running Automated Tests

Run the full automated test suite covering authentication, user isolation, idempotency, agent execution, verification, and database connectivity:

```bash
cd backend
.\venv\Scripts\pytest -v
```

---

## License
MIT License. Built for the CHAOS Hackathon 2026.
