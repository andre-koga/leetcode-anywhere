/// <reference lib="webworker" />
import { transform } from 'sucrase';
import { deepEqual } from '../deepEqual';

const post = (msg) => self.postMessage(msg);

self.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === 'run') runAll(msg);
};

function runAll(req) {
  const { runId, language, code, functionName, tests } = req;

  let js = code;
  if (language === 'typescript') {
    try {
      js = transform(code, { transforms: ['typescript'] }).code;
    } catch (err) {
      post({ type: 'fatal', runId, error: `TypeScript syntax error: ${errMessage(err)}` });
      return;
    }
  }

  let fn;
  const logs = [];
  const fakeConsole = makeConsole(logs);
  try {
    const factory = new Function(
      'console',
      `"use strict";\n${js}\n;return (typeof ${functionName} !== 'undefined' ? ${functionName} : undefined);`,
    );
    fn = factory(fakeConsole);
    if (typeof fn !== 'function') {
      const solutionFactory = new Function(
        'console',
        `"use strict";\n${js}\n;if (typeof Solution === 'undefined') return undefined; const s = new Solution(); return typeof s.${functionName} === 'function' ? s.${functionName}.bind(s) : undefined;`,
      );
      fn = solutionFactory(fakeConsole);
    }
  } catch (err) {
    post({ type: 'fatal', runId, error: errMessage(err) });
    return;
  }
  if (typeof fn !== 'function') {
    post({
      type: 'fatal',
      runId,
      error: `Function \`${functionName}\` is not defined. Define it at the top level or on class Solution.`,
    });
    return;
  }

  for (const test of tests) {
    logs.length = 0;
    const start = performance.now();
    try {
      const args = structuredClone(test.args);
      const raw = fn(...args);
      const timeMs = performance.now() - start;
      const serialized = JSON.stringify(raw === undefined ? null : raw);
      const actual = serialized === undefined ? null : JSON.parse(serialized);
      post({
        type: 'result',
        runId,
        result: {
          testId: test.id,
          status: deepEqual(actual, test.expected) ? 'pass' : 'fail',
          actual: JSON.stringify(actual),
          stdout: logs.length ? logs.join('\n') : undefined,
          timeMs,
        },
      });
    } catch (err) {
      post({
        type: 'result',
        runId,
        result: {
          testId: test.id,
          status: 'error',
          error: errMessage(err),
          stdout: logs.length ? logs.join('\n') : undefined,
          timeMs: performance.now() - start,
        },
      });
    }
  }
  post({ type: 'done', runId });
}

function makeConsole(logs) {
  const write = (...args) => logs.push(args.map((a) => (typeof a === 'string' ? a : safeStringify(a))).join(' '));
  return { log: write, info: write, warn: write, error: write, debug: write };
}

function safeStringify(value) {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function errMessage(err) {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

post({ type: 'ready' });
