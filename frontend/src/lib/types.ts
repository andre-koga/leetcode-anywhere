export type Language = 'javascript' | 'typescript' | 'python';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** A JSON-serializable value - the currency of the language-neutral test harness. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface TestCase {
  id: number;
  /** Arguments passed to the solution function, in order. */
  args: JsonValue[];
  expected: JsonValue;
  /** Hidden tests run on Submit only, and their details are not displayed. */
  hidden?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  /** camelCase name; the Python harness also accepts the snake_case form. */
  functionName: string;
  /** Markdown problem statement. */
  description: string;
  starterCode: Record<Language, string>;
  tests: TestCase[];
}

export type TestStatus = 'pass' | 'fail' | 'error' | 'timeout';

export interface TestResult {
  testId: number;
  status: TestStatus;
  /** JSON-stringified actual return value (absent on error/timeout). */
  actual?: string;
  error?: string;
  stdout?: string;
  timeMs: number;
}

export type RunVerdict = 'accepted' | 'wrong-answer' | 'error' | 'timeout';

export interface RunSummary {
  verdict: RunVerdict;
  passed: number;
  total: number;
  totalTimeMs: number;
  results: TestResult[];
  /** Set when the code failed to compile/parse before any test ran. */
  fatalError?: string;
}
