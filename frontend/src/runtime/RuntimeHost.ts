import { LANGUAGES } from '../lib/languages';
import type { Language, Problem, RunSummary, RunVerdict, TestResult } from '../lib/types';
import type { WorkerRequest, WorkerResponse } from './protocol';
import javaScriptRuntimeWorkerUrl from './workers/js.worker.js?worker&url';
import pythonRuntimeWorkerUrl from './workers/py.worker.js?worker&url';

const DEFAULT_TIMEOUT_MS = 2500;

type HostState = 'booting' | 'ready' | 'running' | 'disposed';

export class RuntimeHost {
  private readonly language: Language;
  private worker: Worker;
  private state: HostState = 'booting';
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  private rejectReady!: (err: Error) => void;
  private runSeq = 0;

  constructor(language: Language) {
    this.language = language;
    this.worker = this.createWorker();
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
  }

  get currentState(): HostState {
    return this.state;
  }

  async ready(): Promise<void> {
    await this.readyPromise;
  }

  async run(problem: Problem, code: string, includeHidden: boolean): Promise<RunSummary> {
    const started = performance.now();
    const runId = ++this.runSeq;
    const tests = problem.tests
      .filter((test) => includeHidden || !test.hidden)
      .map(({ id, args, expected }) => ({ id, args, expected }));

    if (this.state === 'disposed') {
      return fatalSummary('Runtime has been disposed.', tests.length, performance.now() - started);
    }

    try {
      await this.ready();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.refresh();
      return fatalSummary(message, tests.length, performance.now() - started);
    }

    const worker = this.worker;
    this.state = 'running';

    return new Promise<RunSummary>((resolve) => {
      const results: TestResult[] = [];
      let fatalError: string | undefined;
      let settled = false;

      const cleanup = () => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        clearTimeout(timeout);
      };

      const finish = (summary: RunSummary) => {
        if (settled) return;
        settled = true;
        cleanup();
        this.refresh();
        resolve(summary);
      };

      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        const msg = event.data;
        if ('runId' in msg && msg.runId !== runId) return;
        if (msg.type === 'result') {
          results.push(msg.result);
          return;
        }
        if (msg.type === 'fatal') {
          fatalError = msg.error;
          finish(makeSummary(results, tests.length, performance.now() - started, fatalError));
          return;
        }
        if (msg.type === 'done') {
          finish(makeSummary(results, tests.length, performance.now() - started));
        }
      };

      const onError = (event: ErrorEvent) => {
        finish(fatalSummary(event.message || 'Worker error', tests.length, performance.now() - started));
      };

      const timeout = window.setTimeout(() => {
        worker.terminate();
        results.push({
          testId: results.length < tests.length ? tests[results.length].id : -1,
          status: 'timeout',
          error: `Execution exceeded ${DEFAULT_TIMEOUT_MS}ms.`,
          timeMs: DEFAULT_TIMEOUT_MS,
        });
        finish(makeSummary(results, tests.length, performance.now() - started));
      }, DEFAULT_TIMEOUT_MS);

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      worker.postMessage({
        type: 'run',
        runId,
        language: this.language,
        code,
        functionName: problem.functionName,
        tests,
      } satisfies WorkerRequest);
    });
  }

  dispose(): void {
    this.state = 'disposed';
    this.worker.terminate();
  }

  private refresh(): void {
    if (this.state === 'disposed') return;
    this.worker.terminate();
    this.state = 'booting';
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    this.worker = this.createWorker();
  }

  private createWorker(): Worker {
    const url = LANGUAGES[this.language].worker === 'py' ? pythonRuntimeWorkerUrl : javaScriptRuntimeWorkerUrl;
    const worker = new Worker(url, { name: `${this.language}-runtime`, type: 'module' });
    const onReady = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'ready') {
        worker.removeEventListener('message', onReady);
        if (this.state === 'booting') {
          this.state = 'ready';
          this.resolveReady();
        }
      }
      if (event.data.type === 'fatal') {
        worker.removeEventListener('message', onReady);
        if (this.state === 'booting') {
          this.rejectReady(new Error(event.data.error));
        }
      }
    };
    const onBootError = (event: ErrorEvent) => {
      worker.removeEventListener('error', onBootError);
      if (this.state === 'booting') {
        this.rejectReady(new Error(event.message || 'Runtime failed to boot.'));
      }
    };
    worker.addEventListener('message', onReady);
    worker.addEventListener('error', onBootError);
    return worker;
  }
}

function makeSummary(results: TestResult[], total: number, totalTimeMs: number, fatalError?: string): RunSummary {
  const passed = results.filter((r) => r.status === 'pass').length;
  const verdict = verdictFor(results, total, fatalError);
  return { verdict, passed, total, totalTimeMs, results, fatalError };
}

function fatalSummary(error: string, total: number, totalTimeMs: number): RunSummary {
  return {
    verdict: 'error',
    passed: 0,
    total,
    totalTimeMs,
    results: [],
    fatalError: error,
  };
}

function verdictFor(results: TestResult[], total: number, fatalError?: string): RunVerdict {
  if (fatalError) return 'error';
  if (results.some((r) => r.status === 'timeout')) return 'timeout';
  if (results.some((r) => r.status === 'error')) return 'error';
  if (results.length === total && results.every((r) => r.status === 'pass')) return 'accepted';
  return 'wrong-answer';
}
