/// <reference lib="webworker" />
import { camelToSnake } from '../../lib/languages';

const post = (msg) => self.postMessage(msg);

let pyodide;

async function boot() {
  const pyodideModuleUrl = '/pyodide/pyodide.mjs';
  const mod = await import(/* @vite-ignore */ pyodideModuleUrl);
  pyodide = await mod.loadPyodide({ indexURL: '/pyodide/' });
  post({ type: 'ready' });
}

self.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === 'run') void runAll(msg);
};

async function runAll(req) {
  if (!pyodide) {
    post({ type: 'fatal', runId: req.runId, error: 'Python runtime is still starting.' });
    return;
  }

  try {
    pyodide.globals.set('USER_CODE', req.code);
    pyodide.globals.set('FUNCTION_NAME', req.functionName);
    pyodide.globals.set('PY_FUNCTION_NAME', camelToSnake(req.functionName));
    pyodide.globals.set('TESTS_JSON', JSON.stringify(req.tests));

    const raw = pyodide.runPython(PYTHON_HARNESS);
    const payload = JSON.parse(raw);

    if ('fatal' in payload) {
      post({ type: 'fatal', runId: req.runId, error: payload.fatal });
      return;
    }

    for (const result of payload.results) {
      post({ type: 'result', runId: req.runId, result });
    }
    post({ type: 'done', runId: req.runId });
  } catch (err) {
    post({ type: 'fatal', runId: req.runId, error: errMessage(err) });
  }
}

const PYTHON_HARNESS = String.raw`
import contextlib
import io
import json
import sys
import time
import traceback

def _deep_equal(a, b):
    if isinstance(a, (tuple, list)) and isinstance(b, list):
        return len(a) == len(b) and all(_deep_equal(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return set(a.keys()) == set(b.keys()) and all(_deep_equal(a[k], b[k]) for k in a)
    return a == b

def _json_safe(value):
    return json.loads(json.dumps(value))

try:
    _namespace = {}
    exec(USER_CODE, _namespace)
    _fn = _namespace.get(PY_FUNCTION_NAME) or _namespace.get(FUNCTION_NAME)
    if not callable(_fn):
        raise NameError(f"Function '{PY_FUNCTION_NAME}' is not defined. Define it at the top level.")
except Exception:
    _RESULT = json.dumps({"fatal": traceback.format_exc(limit=3)})
else:
    _results = []
    for _test in json.loads(TESTS_JSON):
        _stdout = io.StringIO()
        _start = time.perf_counter()
        try:
            with contextlib.redirect_stdout(_stdout), contextlib.redirect_stderr(_stdout):
                _actual = _json_safe(_fn(*_test["args"]))
            _elapsed = (time.perf_counter() - _start) * 1000
            _results.append({
                "testId": _test["id"],
                "status": "pass" if _deep_equal(_actual, _test["expected"]) else "fail",
                "actual": json.dumps(_actual),
                "stdout": _stdout.getvalue() or None,
                "timeMs": _elapsed,
            })
        except Exception:
            _elapsed = (time.perf_counter() - _start) * 1000
            _results.append({
                "testId": _test["id"],
                "status": "error",
                "error": traceback.format_exc(limit=3),
                "stdout": _stdout.getvalue() or None,
                "timeMs": _elapsed,
            })
    _RESULT = json.dumps({"results": _results})

_RESULT
`;

function errMessage(err) {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

boot().catch((err) => post({ type: 'fatal', runId: 0, error: `Python failed to boot: ${errMessage(err)}` }));
