# LearnLens AI — Error Analysis & Fixes Report

This document details all the issues identified across the codebase and the exact changes made to resolve them.

---

## 📁 Summary of Modified Files

| File Path | Description of Fix |
|---|---|
| [`d:\code files\Learnlens\.github\workflows\static.yml`](.github/workflows/static.yml) | Fixed GitHub Actions workflow: Added Node setup, dependency installation (`npm ci`), Vite build (`npm run build`), and artifact upload from `frontend/dist`. |
| [`d:\code files\Learnlens\frontend\vite.config.ts`](frontend/vite.config.ts) | Added `base: './'` so static assets resolve with relative paths on GitHub Pages. |
| [`d:\code files\Learnlens\frontend\src\services\api.ts`](frontend/src/services/api.ts) | Fixed fallback API base URL to port `8001`; added `runAssignmentCode`; implemented offline persistence and HTTP 404/502 fallback for learning paths, topics, questions, and assignments; added update & delete API methods. |
| [`d:\code files\Learnlens\frontend\src\pages\AdminPanel.tsx`](frontend/src/pages/AdminPanel.tsx) | Added full Edit and Delete functionality for Learning Paths and Topics; added inline edit forms, validation, and notification alerts. |
| [`d:\code files\Learnlens\backend\app\main.py`](backend/app/main.py) | Added `/api/assignments/{qid}/run` endpoint; added PUT/DELETE endpoints for `/api/admin/paths/{pid}` and PUT for `/api/admin/topics/{tid}`; auto-generated IDs and UIDs. |
| [`d:\code files\Learnlens\frontend\src\pages\TopicView.tsx`](frontend/src/pages/TopicView.tsx) | Fixed assignment coding execution and result parsing; connected topic practice "Solve" buttons to `onSolveQuestion`. |
| [`d:\code files\Learnlens\frontend\src\pages\CodingArena.tsx`](frontend/src/pages/CodingArena.tsx) | Upgraded from hardcoded static problem to dynamic question loader with problem selector, custom input runner ("Run"), test cases submit ("Submit"), and language starter code switching. |
| [`d:\code files\Learnlens\frontend\src\App.tsx`](frontend/src/App.tsx) | Wired `codingQuestionId` and `handleSolveQuestion` between `TopicView` and `CodingArena`. |
| [`d:\code files\Learnlens\backend\app\executor.py`](backend/app/executor.py) | Supported both `"expected"` and `"expected_output"` keys in test case evaluation to prevent test case failures. |
| [`d:\code files\Learnlens\.gitignore`](.gitignore) | Added comprehensive ignore rules for Python bytecode (`__pycache__`, `*.pyc`), virtual environments, and local SQLite database files. |

---

## 🛠️ Detailed Breakdown of Issues & Solutions

### 1. Assignment Coding Submissions Always Failing
- **Location:** `frontend/src/pages/TopicView.tsx` & `backend/app/main.py`
- **Root Cause:**
  In `TopicView.tsx`, the assignment test runner called the single-run endpoint and expected `r.status === 'Passed'` and `r.passed_count`, but the single-run response returned `{ success, stdout, stderr }`. Consequently:
  - `passed` evaluated to `false` every time.
  - Output was blank because `r.output` and `r.feedback` did not exist on the response.
  - Coding questions in assignments were always graded 0%.
- **Fix:**
  - Added `@app.post("/api/assignments/{qid}/run")` in `backend/app/main.py` which runs the code against the assignment question's test cases using `evaluate_test_cases`.
  - Added `runAssignmentCode` in `frontend/src/services/api.ts`.
  - Updated `TopicView.tsx` to handle both full test case outputs and single-run fallback outputs with proper error messages and pass status.

---

### 2. Test Case Schema Mismatch (`expected` vs `expected_output`)
- **Location:** `backend/app/executor.py`
- **Root Cause:**
  The Admin Panel form placeholder suggested test cases in the format:
  `[{"input":"5\n1 2 3 4 5", "expected_output":"5"}]`
  However, `executor.py` specifically extracted `tc.get("expected")`. Any test case saved with `"expected_output"` had an empty expected output (`""`), causing all correct student answers to fail.
- **Fix:**
  Updated `evaluate_test_cases` to check:
  `tc.get("expected") if tc.get("expected") is not None else tc.get("expected_output", "")`.

---

### 3. GitHub Pages Deployment Workflow Was Incomplete
- **Location:** `.github/workflows/static.yml`
- **Root Cause:**
  The workflow was configured to upload `path: '.'` (the repository root). The root has no built `index.html` (the React frontend lives in `frontend/`), and TypeScript/JSX cannot be executed by GitHub Pages without being compiled first. This resulted in deployment failures and 404 errors.
- **Fix:**
  Updated `.github/workflows/static.yml` to:
  1. Set up Node.js 20.
  2. Run `npm ci` in the `frontend` directory.
  3. Run `npm run build` in the `frontend` directory.
  4. Upload `path: 'frontend/dist'`.

---

### 4. Vite Relative Asset Path Issue on GitHub Pages
- **Location:** `frontend/vite.config.ts`
- **Root Cause:**
  When hosted under a GitHub repository subpath (such as `https://<username>.github.io/LearnLens--AI/`), the default absolute base `/` causes scripts and stylesheets (`/assets/index.js`) to look at the root domain, resulting in 404 Not Found.
- **Fix:**
  Added `base: './'` to `vite.config.ts` so all assets are referenced relatively.

---

### 5. API Fallback Port Misconfiguration
- **Location:** `frontend/src/services/api.ts`
- **Root Cause:**
  `start_backend.bat` runs FastAPI on port `8001`, and `frontend/.env` specifies `8001`. However, line 6 of `api.ts` fell back to `http://localhost:8000/api` if `.env` was missing.
- **Fix:**
  Changed the fallback in `api.ts` to `http://localhost:8001/api`.

---

### 6. Coding Arena Limitations & Practice Navigation
- **Location:** `frontend/src/pages/CodingArena.tsx` & `frontend/src/App.tsx`
- **Root Cause:**
  - `CodingArena` had problem #2 hardcoded into the JSX text.
  - Changing programming languages did not change the starter template code.
  - There was no way to test custom inputs before submitting.
  - The "Solve" buttons next to practice questions in `TopicView` had empty `onClick` handlers.
- **Fix:**
  - Upgraded `CodingArena` to dynamically fetch question details from the API.
  - Added a question selector dropdown to choose any coding problem.
  - Added a "Run" button with custom stdin input support alongside the "Submit" button.
  - Language dropdown automatically populates the appropriate starter code (Python, Java, JavaScript).
  - Clicking "Solve" on any practice question in `TopicView` opens that exact problem inside `CodingArena`.

---

### 7. Missing Git Ignore Rules
- **Location:** `.gitignore`
- **Root Cause:**
  Python `__pycache__` directories, `.pyc` files, and virtual environments were untracked and risked being committed.
- **Fix:**
  Added comprehensive ignore patterns for Python, Node, and environment files.

---

### 8. Admin Question & Assignment Creation Not Persisting
- **Location:** `frontend/src/services/api.ts`, `frontend/src/pages/AdminPanel.tsx`, `backend/app/main.py`
- **Root Cause:**
  - In demo / offline mode (including Vercel deployment), `POST /admin/questions` and `POST /admin/assignments` returned static mocks without persisting the newly submitted question, causing questions to disappear immediately after creation.
  - `GET /admin/assignments` returned an overview stats array instead of question objects, causing the questions list to render 0 items.
  - Submitting questions without selecting a topic (`topic_id: 0`) or without a UID caused backend foreign key/duplicate key exceptions.
- **Fix:**
  - Implemented full `localStorage` persistence layer (`learnlens_stored_questions` and `learnlens_stored_assignments`) in `frontend/src/services/api.ts` supporting full offline CRUD (Create, Read, Update, Delete) for questions, assignments, and real-time analytics calculation.
  - Added form validation in `QuestionForm` and `AssignmentTab` ensuring valid topic selection and question title.
  - Added smart auto-generation of unique `question_uid` (e.g. `arrays_findmax_1729...`) so admins never face manual UID collision or blank UID errors.
  - Added input normalization for MCQ options and coding test cases, automatically converting plain text/comma lists to valid JSON arrays.
  - Added backend validation in `backend/app/main.py` verifying topic existence and generating unique question UIDs automatically if omitted.

---

### 9. Learning Path and Topic Creation Not Persisting
- **Location:** `frontend/src/services/api.ts`, `frontend/src/pages/AdminPanel.tsx`, `backend/app/main.py`
- **Root Cause:**
  - In demo / offline mode (including Vercel deployment), `POST /admin/paths` and `POST /admin/topics` returned static `mockPaths` without saving the new learning path or topic, causing them to disappear on reload.
  - Student views `/paths` and `/topics/:topic_key` only returned hardcoded mock paths rather than dynamic stored paths.
  - Blank `path_key` or `topic_key` inputs in forms caused duplicate empty key integrity errors on the backend.
- **Fix:**
  - Implemented full `localStorage` persistence layer (`learnlens_stored_paths`) in `frontend/src/services/api.ts` supporting full offline CRUD for learning paths, topics, and resource links.
  - Linked student `/paths` and `/topics/:topic_key` endpoints to `getStoredPaths()`, allowing immediate access to new paths and topics across the entire app.
  - Added smart auto-generation of clean kebab-case `path_key` and `topic_key` from titles on both frontend and backend.
  - Connected `onPathsUpdated` callback in `AdminPanel.tsx` so adding a new topic immediately updates topic selector dropdowns across Questions and Assignments tabs without a manual reload.

---

### 10. Learning Paths and Topics Cannot Be Updated or Added (Vercel 404 & Missing Edit Support)
- **Location:** `frontend/src/services/api.ts`, `frontend/src/pages/AdminPanel.tsx`, `backend/app/main.py`
- **Root Cause:**
  1. On Vercel deployments, the backend is not running on the same server, so API requests to `/api/admin/paths` return HTTP `404 Not Found` (or `405`/`502`). The existing frontend `request<T>` helper only caught network errors (`TypeError: Failed to fetch`). An HTTP `404` was thrown as a normal `Error("Status 404: ...")`, bypassing offline fallback handling and preventing paths or topics from being saved.
  2. The Admin Panel UI completely lacked Edit (`PUT`) and Delete (`DELETE`) buttons and forms for existing learning paths and topics. Once created, admins had no interface to modify titles, taglines, descriptions, difficulties, order, or estimated durations.
  3. The backend `backend/app/main.py` lacked endpoints for `PUT /api/admin/paths/{pid}`, `DELETE /api/admin/paths/{pid}`, and `PUT /api/admin/topics/{tid}`.
- **Fix:**
  1. **HTTP Error Fallback in `api.ts`:** Enhanced `request<T>` in `api.ts` to inspect HTTP status codes (`404`, `405`, `502`, `503`). When the backend returns any of these statuses, it immediately falls back to `handleOfflineFallback`, ensuring seamless local CRUD persistence via `localStorage` even in standalone Vercel deployments.
  2. **Admin UI Edit & Delete Controls (`AdminPanel.tsx`):**
     - Added an inline modal/form for Learning Paths allowing editing of title, tagline, description, icon, color, and display order.
     - Added a Delete button with confirmation for Learning Paths.
     - Added an inline Edit modal/form for Topics allowing editing of title, category, difficulty, order, estimated minutes, and description.
     - Added distinct green success and red error alerts with auto-dismiss timers.
  3. **Backend CRUD Endpoints (`main.py`):** Added `PUT /api/admin/paths/{pid}`, `DELETE /api/admin/paths/{pid}`, and `PUT /api/admin/topics/{tid}` with database persistence and authentication checks.
  4. **Frontend API methods:** Added `adminUpdatePath`, `adminDeletePath`, and `adminUpdateTopic` in `api.ts` with offline fallback handlers.

---

## 🚀 How to Run the Project

### Start the Backend
Double-click [`start_backend.bat`](start_backend.bat) or run in terminal:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### Start the Frontend
Double-click [`start_frontend.bat`](start_frontend.bat) or run in terminal:
```bash
cd frontend
npm run dev
```
Open browser at: `http://localhost:5173`
