import type { JsonValue, Language, TestResult } from '../lib/types';

export interface RunTestPayload {
  id: number;
  args: JsonValue[];
  expected: JsonValue;
}

export interface RunRequest {
  type: 'run';
  runId: number;
  language: Language;
  code: string;
  functionName: string;
  tests: RunTestPayload[];
}

export type WorkerRequest = RunRequest;

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; runId: number; result: TestResult }
  | { type: 'done'; runId: number }
  /** Code failed to compile/parse/define the expected function - no tests ran. */
  | { type: 'fatal'; runId: number; error: string };
