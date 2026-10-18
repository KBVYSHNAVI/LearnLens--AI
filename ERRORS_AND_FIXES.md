# LearnLens AI — Error Analysis & Fixes Report

This document details all the issues identified across the codebase and the exact changes made to resolve them.

---

## 📁 Summary of Modified Files

| File Path | Description of Fix |
|---|---|
| [`d:\code files\Learnlens\.github\workflows\static.yml`](.github/workflows/static.yml) | Fixed GitHub Actions workflow: Added Node setup, dependency installation (`npm ci`), Vite build (`npm run build`), and artifact upload from `frontend/dist`. |
| [`d:\code files\Learnlens\frontend\vite.config.ts`](frontend/vite.config.ts) | Added `base: './'` so static assets resolve with relative paths on GitHub Pages. |
| [`d:\code files\Learnlens\frontend\src\services\api.ts`](frontend/src/services/api.ts) | Fixed fallback API base URL to port `8001` (matching backend port); added `runAssignmentCode` service function. |
| [`d:\code files\Learnlens\frontend\src\pages\TopicView.tsx`](frontend/src/pages/TopicView.tsx) | Fixed assignment coding execution and result parsing; connected topic practice "Solve" buttons to `onSolveQuestion`. |
| [`d:\code files\Learnlens\frontend\src\pages\CodingArena.tsx`](frontend/src/pages/CodingArena.tsx) | Upgraded from hardcoded static problem to dynamic question loader with problem selector, custom input runner ("Run"), test cases submit ("Submit"), and language starter code switching. |
| [`d:\code files\Learnlens\frontend\src\App.tsx`](frontend/src/App.tsx) | Wired `codingQuestionId` and `handleSolveQuestion` between `TopicView` and `CodingArena`. |
| [`d:\code files\Learnlens\backend\app\executor.py`](backend/app/executor.py) | Supported both `"expected"` and `"expected_output"` keys in test case evaluation to prevent test case failures. |
| [`d:\code files\Learnlens\backend\app\main.py`](backend/app/main.py) | Added `/api/assignments/{qid}/run` endpoint to execute and validate assignment coding submissions; added safe JSON parsing for assignment question options/hints. |
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
