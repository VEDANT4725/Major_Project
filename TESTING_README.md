# WebCraft / Blueprint AI — Testing Guide

This document covers local setup and end-to-end smoke testing for the React frontend and Spring Boot backend.

## Project layout

```
major_project/
├── backend/          # Spring Boot 3.4.5, Java 21, MySQL
├── frontend/         # React 19, Vite 6
├── README.md         # Full project documentation
└── TESTING_README.md
```

## Prerequisites

- Java 21 and Maven 3.9+
- Node.js 20+ and npm
- MySQL 8+
- At least one AI provider API key:
  - `GOOGLE_AI_API_KEY` for the default model `gemini-3.1-flash`
  - `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY` optional
- Optional: GitHub OAuth app for the GitHub integration

Use the same operating environment for `npm install` and `npm run dev/build`. Do not share a Windows `node_modules` folder with WSL; native packages such as Rollup and esbuild are platform-specific.

## 1. Database setup

Create the MySQL database:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS blueprint_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

The backend uses `spring.jpa.hibernate.ddl-auto=update`, so tables are created automatically.

## 2. Backend configuration

The backend loads `backend/.env` at startup.

Required/commonly used keys:

```dotenv
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=replace-with-at-least-32-random-characters
GOOGLE_AI_API_KEY=your_google_key
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=

# Optional GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional
STORAGE_BASE_PATH=./data/blueprint-ai
CORS_ORIGINS=http://localhost:3000
```

Notes:

- `DB_USERNAME` defaults to `root`; `DB_PASSWORD` defaults to `2005`.
- Leave keys empty if unused. A premium model can still be selected only by a Pro user, but generating with it requires its provider key.
- Do not put spaces before key names in `.env`.
- The database URL is `jdbc:mysql://localhost:3306/blueprint_ai`.

## 3. Start the backend

From `backend`:

```bash
mvn spring-boot:run
```

Expected startup: Tomcat listening on `http://localhost:8080`.

Health check:

```bash
curl http://localhost:8080/health
```

If Java is not found, set `JAVA_HOME` to a JDK 21 installation and reopen the terminal.

## 4. Frontend configuration

From `frontend`:

```bash
cp .env.example .env.local
npm install
npm run dev
```

`.env.local` values:

```dotenv
VITE_WORKER_URL=http://localhost:8080
VITE_GITHUB_CLIENT_ID=
```

Open `http://localhost:3000`.

If dependencies were installed on another OS, reinstall them in the current environment:

```bash
rm -rf node_modules
npm install
```

## 5. GitHub OAuth setup (optional)

1. Create a GitHub OAuth App.
2. Set the callback URL to `http://localhost:3000/auth/github/callback`.
3. Put the client ID in frontend `VITE_GITHUB_CLIENT_ID`.
4. Put the same client ID and the client secret in backend `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
5. Restart both servers.

The GitHub integration is not required for the main editor and AI flow.

## 6. API smoke tests

Set up shell variables:

```bash
BASE=http://localhost:8080
EMAIL="tester-$(date +%s)@example.com"
PASSWORD="password123"
```

### 6.1 Register and obtain a token

```bash
curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"tester\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
```

Copy the returned `token`:

```bash
TOKEN="paste-token-here"
```

Verify the session:

```bash
curl -s "$BASE/api/auth/me" -H "Authorization: Bearer $TOKEN"
```

### 6.2 Credits

```bash
curl -s "$BASE/api/credits" -H "Authorization: Bearer $TOKEN"
```

Expected: free users start with 50 credits and plan `FREE`.

### 6.3 Create a project

```bash
curl -s -X POST "$BASE/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test App","model":"gemini-3.1-flash"}'
```

Copy the returned project ID:

```bash
PROJECT_ID="paste-project-id-here"
```

### 6.4 Project files and versions

```bash
curl -s "$BASE/api/projects/$PROJECT_ID/files" -H "Authorization: Bearer $TOKEN"
curl -s "$BASE/api/projects/$PROJECT_ID/versions" -H "Authorization: Bearer $TOKEN"
```

A newly created project should have version `0`.

### 6.5 Create a manual version

This is the same request the editor uses for auto-save/restore.

```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/versions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [{"path":"src/App.tsx","content":"export default function App(){return <div>test</div>}"}],
    "prompt": "Manual smoke test",
    "model": "gemini-3.1-flash",
    "type": "MANUAL",
    "changedFiles": ["src/App.tsx"]
  }'
```

Expected response: `{"version":1}`. `GET /api/projects/$PROJECT_ID` should report `currentVersion: 1`.

### 6.6 AI generation over SSE

```bash
curl -N -X POST "$BASE/api/chat/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a simple landing page","model":"gemini-3.1-flash"}'
```

Expected event sequence:

1. `connected` — stream accepted
2. `chunk` — raw model output
3. `task` — task list updates
4. `files` — complete generated file set
5. `done` — includes `version`, `versionId`, `changedFiles`, `creditsRemaining`

If the provider key is missing/invalid, expect an `error` event with a code such as `AUTH_FAILED` or `GENERATION_FAILED`.

### 6.7 Chat history

```bash
curl -s "$BASE/api/chat/$PROJECT_ID" -H "Authorization: Bearer $TOKEN"
```

### 6.8 Premium model lock

Free users should receive `PREMIUM_MODEL_LOCKED` when requesting a premium model such as `claude-sonnet-4-5`:

```bash
curl -N -X POST "$BASE/api/chat/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","model":"claude-sonnet-4-5"}'
```

### 6.9 Analytics, rename, and delete

```bash
curl -s "$BASE/api/analytics" -H "Authorization: Bearer $TOKEN"

curl -s -X PATCH "$BASE/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Renamed Smoke Test"}'

curl -s -X DELETE "$BASE/api/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## 7. Browser end-to-end checklist

### Auth and navigation

- [ ] Open `/dashboard` without logging in; it redirects to `/login`.
- [ ] Register a new user and land on the dashboard.
- [ ] Refresh the page; the session is validated through `/api/auth/me` and remains signed in.
- [ ] Log out; protected pages redirect to `/login`.

### Dashboard

- [ ] Create a project; it appears in the dashboard.
- [ ] Open the project; the editor loads project files, chat history, credits, and versions.
- [ ] Free users see a 3-project limit error when creating a fourth project.

### Editor and AI

- [ ] Send a prompt with the default model.
- [ ] Task statuses update in the preview/loading UI.
- [ ] Generated files appear in the code editor and preview.
- [ ] The version number advances and the history tab refreshes.
- [ ] Chat history persists after refreshing the editor.
- [ ] Change the model with the selector below the chat input; refresh and confirm it is saved on the project.
- [ ] Free users cannot select a premium model; they see an upgrade toast.
- [ ] Insufficient credits / credit exhaustion surfaces an error toast.

### Version history and manual edits

- [ ] Edit a file in the code editor and wait about 1.2 seconds; a new manual version is created.
- [ ] Open the history tab; the new version appears with file count, model, type, and timestamp.
- [ ] View an older version; the code editor becomes read-only and the history panel shows “Back to current”.
- [ ] Click “Back to current”; the latest files return.
- [ ] View an older version and click “Restore”; it is saved as a new restore version and `currentVersion` advances.
- [ ] Rename the project from the project menu; the title updates after refresh.
- [ ] Delete the project from the menu; it returns to the dashboard and disappears from the list.

### Settings

- [ ] GitHub status loads without an error.
- [ ] If OAuth credentials are configured, connect/disconnect GitHub successfully.
- [ ] Analytics loads credits, plan, projects, and usage values.

## 8. Build and lint checks

Frontend production build:

```bash
cd frontend
npm run build
```

Backend compile/package:

```bash
cd backend
mvn clean package
```

Backend tests, when present:

```bash
mvn test
```

There are currently no frontend unit/E2E tests and no backend test classes in the repository, so the checklist above is the primary verification path.

## 9. Troubleshooting

| Symptom | Check |
| --- | --- |
| `JAVA_HOME` / `java` not found | Install JDK 21 and point `JAVA_HOME` at it |
| `Communications link failure` | MySQL is running and `blueprint_ai` exists |
| `Access denied for user` | `DB_USERNAME` / `DB_PASSWORD` in backend `.env` |
| CORS error in browser | Frontend origin must match `CORS_ORIGINS` (default `http://localhost:3000`) |
| `401` on API calls | Missing/expired token; log in again |
| AI returns `AUTH_FAILED` | Provider API key for the selected model is missing/invalid |
| AI returns `RATE_LIMITED` | Provider quota; wait and retry |
| Premium model fails immediately | Expected for free users; upgrade the account or use a fast-tier model |
| Version list empty after AI run | Check backend logs and `data/blueprint-ai` storage permissions |
| `Cannot find module @rollup/rollup-linux-x64-gnu` | Reinstall `node_modules` in the same OS/WSL environment |
| GitHub connect says “Client ID is not configured” | Set `VITE_GITHUB_CLIENT_ID` in `.env.local` and restart Vite |
| GitHub OAuth callback fails | Callback URL must exactly match `http://localhost:3000/auth/github/callback` |

## 10. Cleanup

- Delete test users/projects through the UI or MySQL if needed.
- Generated files are stored under `backend/data/blueprint-ai`.
- Stop the backend and frontend processes after testing.
