import os
import sys
import time
import re
import tempfile
import subprocess
from typing import List, Dict, Any, Optional

FORBIDDEN_PATTERNS = [
    r"import\s+os\b", r"from\s+os\b",
    r"import\s+subprocess\b", r"from\s+subprocess\b",
    r"import\s+shutil\b", r"import\s+socket\b",
    r"import\s+ctypes\b", r"open\s*\(",
    r"__import__", r"eval\s*\(", r"exec\s*\(",
    r"ProcessBuilder", r"Runtime\.getRuntime\(\)",
    r"System\.exit", r"java\.io\.File", r"child_process",
]


def check_security(code: str, language: str) -> Optional[str]:
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            return f"Security Restriction: Pattern '{pattern}' is not permitted."
    return None


def execute_code_single_run(language: str, code: str, stdin_input: str = "", timeout_seconds: int = 5) -> Dict[str, Any]:
    sec = check_security(code, language)
    if sec:
        return {"success": False, "stdout": "", "stderr": sec,
                "error_type": "SecurityError", "execution_time_ms": 0.0, "timed_out": False}

    start = time.perf_counter()
    with tempfile.TemporaryDirectory() as td:
        lang = language.lower().strip()
        try:
            if lang in ["python", "py"]:
                with open(os.path.join(td, "solution.py"), "w", encoding="utf-8") as f:
                    f.write(code)
                p = subprocess.run([sys.executable, "-u", "solution.py"],
                                   input=stdin_input, capture_output=True, text=True,
                                   timeout=timeout_seconds, cwd=td)
                return {"success": p.returncode == 0, "stdout": p.stdout, "stderr": p.stderr,
                        "error_type": "RuntimeError" if p.returncode != 0 else None,
                        "execution_time_ms": round((time.perf_counter() - start) * 1000, 2),
                        "timed_out": False}

            elif lang == "java":
                m = re.search(r"public\s+class\s+([A-Za-z0-9_]+)", code)
                cls = m.group(1) if m else "Solution"
                if not m and "class " not in code:
                    code = f"public class Solution {{\n public static void main(String[] a){{\n{code}\n}} }}"
                with open(os.path.join(td, f"{cls}.java"), "w", encoding="utf-8") as f:
                    f.write(code)
                c = subprocess.run(["javac", f"{cls}.java"], capture_output=True, text=True,
                                   timeout=timeout_seconds, cwd=td)
                if c.returncode != 0:
                    return {"success": False, "stdout": "", "stderr": c.stderr,
                            "error_type": "CompileError",
                            "execution_time_ms": round((time.perf_counter() - start) * 1000, 2),
                            "timed_out": False}
                r = subprocess.run(["java", cls], input=stdin_input, capture_output=True, text=True,
                                   timeout=timeout_seconds, cwd=td)
                return {"success": r.returncode == 0, "stdout": r.stdout, "stderr": r.stderr,
                        "error_type": "RuntimeError" if r.returncode != 0 else None,
                        "execution_time_ms": round((time.perf_counter() - start) * 1000, 2),
                        "timed_out": False}

            elif lang in ["javascript", "js", "node"]:
                with open(os.path.join(td, "solution.js"), "w", encoding="utf-8") as f:
                    f.write(code)
                p = subprocess.run(["node", "solution.js"], input=stdin_input, capture_output=True,
                                   text=True, timeout=timeout_seconds, cwd=td)
                return {"success": p.returncode == 0, "stdout": p.stdout, "stderr": p.stderr,
                        "error_type": "RuntimeError" if p.returncode != 0 else None,
                        "execution_time_ms": round((time.perf_counter() - start) * 1000, 2),
                        "timed_out": False}

            else:
                return {"success": False, "stdout": "", "stderr": f"Unsupported language: {language}",
                        "error_type": "UnsupportedLanguage", "execution_time_ms": 0.0, "timed_out": False}

        except subprocess.TimeoutExpired:
            return {"success": False, "stdout": "", "stderr": f"Time Limit Exceeded ({timeout_seconds}s)",
                    "error_type": "TimeoutError",
                    "execution_time_ms": round((time.perf_counter() - start) * 1000, 2),
                    "timed_out": True}
        except Exception as e:
            return {"success": False, "stdout": "", "stderr": f"Environment Error: {e}",
                    "error_type": "EnvironmentError",
                    "execution_time_ms": round((time.perf_counter() - start) * 1000, 2),
                    "timed_out": False}


def evaluate_test_cases(language: str, code: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    results, passed, total_t, status = [], 0, 0.0, "Passed"
    for i, tc in enumerate(test_cases, 1):
        inp = str(tc.get("input", ""))
        raw_exp = tc.get("expected") if tc.get("expected") is not None else tc.get("expected_output", "")
        exp = str(raw_exp).strip()
        hidden = bool(tc.get("hidden", False))
        r = execute_code_single_run(language, code, stdin_input=inp)
        actual = r.get("stdout", "").strip()
        total_t += r.get("execution_time_ms", 0.0)

        if r.get("timed_out"):
            ok, status = False, "Timeout"
        elif not r.get("success"):
            ok = False
            if status == "Passed":
                status = "Compile Error" if r.get("error_type") == "CompileError" else "Runtime Error"
        else:
            ok = actual.replace("\r\n", "\n").strip() == exp.replace("\r\n", "\n").strip()
            if not ok and status == "Passed":
                status = "Failed"

        if ok:
            passed += 1

        results.append({
            "test_case_number": i, "passed": ok,
            "input": "[Hidden]" if hidden else inp,
            "expected_output": "[Hidden]" if hidden else (str(tc.get("expected_output")) if tc.get("expected_output") is not None else exp),
            "actual_output": "[Hidden]" if hidden and not ok else actual,
            "error": r.get("stderr", "") if not hidden else "",
            "execution_time_ms": r.get("execution_time_ms", 0.0),
            "is_hidden": hidden
        })

    avg = round(total_t / len(test_cases), 2) if test_cases else 0.0
    return {
        "status": status,
        "passed_count": passed,
        "total_count": len(test_cases),
        "execution_time_ms": avg,
        "test_results": results,
        "feedback": f"All {len(test_cases)} passed!" if passed == len(test_cases)
                    else f"{passed}/{len(test_cases)} test cases passed."
    }