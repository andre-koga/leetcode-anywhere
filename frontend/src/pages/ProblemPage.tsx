import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, CheckCircle2, Clock, Loader2, Play, Send, XCircle } from 'lucide-react';
import { marked } from 'marked';
import { Link, Navigate, useParams } from 'react-router';
import { DifficultyBadge, TagBadge } from '../components/Badge';
import { LanguageSelect } from '../components/LanguageSelect';
import { db, getLastLanguage, saveDraft, setLastLanguage } from '../db/db';
import { LANGUAGES } from '../lib/languages';
import type { Language, RunSummary, TestCase, TestResult } from '../lib/types';
import { RuntimeHost } from '../runtime/RuntimeHost';
import { getProblem } from '../problems';

export function ProblemPage() {
  const { problemId } = useParams();
  const problem = problemId ? getProblem(problemId) : undefined;
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [summary, setSummary] = useState<RunSummary | undefined>();
  const [running, setRunning] = useState(false);
  const [runtimeState, setRuntimeState] = useState<'booting' | 'ready' | 'error'>('booting');
  const hostRef = useRef<RuntimeHost | null>(null);

  const draft = useLiveQuery(
    () => (problem ? db.drafts.get([problem.id, language]) : undefined),
    [problem?.id, language],
  );
  const submissions = useLiveQuery(
    () =>
      problem ? db.submissions.where('[problemId+language]').equals([problem.id, language]).reverse().limit(6).toArray() : [],
    [problem?.id, language],
  );

  useEffect(() => {
    getLastLanguage().then((saved) => {
      if (saved) setLanguage(saved);
    });
  }, []);

  useEffect(() => {
    if (!problem) return;
    setCode(draft?.code ?? problem.starterCode[language]);
    setSummary(undefined);
  }, [draft?.code, language, problem]);

  useEffect(() => {
    if (!problem || !code) return;
    const timer = window.setTimeout(() => {
      void saveDraft(problem.id, language, code);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [code, language, problem]);

  useEffect(() => {
    const host = new RuntimeHost(language);
    hostRef.current = host;
    waitForHost(host, setRuntimeState);
    void setLastLanguage(language);
    return () => host.dispose();
  }, [language]);

  const html = useMemo(() => {
    if (!problem) return '';
    return marked.parse(problem.description, { async: false }) as string;
  }, [problem]);

  const extensions = useMemo(
    () => [language === 'python' ? python() : javascript({ typescript: language === 'typescript' }), oneDark],
    [language],
  );

  if (!problem) return <Navigate to="/" replace />;

  async function execute(includeHidden: boolean) {
    if (!problem || !hostRef.current || running) return;
    setRunning(true);
    setRuntimeState('booting');
    const result = await hostRef.current.run(problem, code, includeHidden);
    setSummary(result);
    setRunning(false);
    waitForHost(hostRef.current, setRuntimeState);

    if (includeHidden) {
      await db.submissions.add({
        problemId: problem.id,
        language,
        code,
        verdict: result.verdict,
        passed: result.passed,
        total: result.total,
        timeMs: Math.round(result.totalTimeMs),
        createdAt: Date.now(),
      });
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3 lg:h-full">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-zinc-100">
          <ArrowLeft size={14} />
          Problems
        </Link>
        <RuntimePill state={runtimeState} language={language} />
      </div>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="flex min-h-[22rem] flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/70 lg:min-h-0">
          <div className="shrink-0 border-b border-zinc-800 px-3 py-2">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.tags.map((tag) => (
                <TagBadge key={tag}>{tag}</TagBadge>
              ))}
            </div>
            <h1 className="text-lg font-semibold tracking-tight">{problem.title}</h1>
          </div>
          <article
            className="prose prose-invert prose-sm max-w-none flex-1 overflow-y-auto px-3 py-3 prose-pre:border prose-pre:border-zinc-800 prose-pre:bg-zinc-950"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </section>

        <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/70 lg:min-h-0">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Solution</h2>
              <p className="text-[11px] text-zinc-400">Drafts are saved separately for each language.</p>
            </div>
            <LanguageSelect value={language} onValueChange={setLanguage} />
          </div>

          <div className="min-h-[16rem] flex-1 overflow-hidden lg:min-h-0">
            <CodeMirror
              value={code}
              height="100%"
              className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
              extensions={extensions}
              theme={oneDark}
              basicSetup={{ autocompletion: true, lineNumbers: true, foldGutter: true }}
              onChange={setCode}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-y border-zinc-800 bg-zinc-950/70 px-3 py-2">
            <div className="text-xs text-zinc-400">
              {summary ? (
                <span>
                  Last run: <VerdictText summary={summary} />
                </span>
              ) : (
                'Run visible tests, then submit to include hidden tests.'
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => void execute(false)}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                Run
              </button>
              <button
                onClick={() => void execute(true)}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={14} />
                Submit
              </button>
            </div>
          </div>

          <div className="grid shrink-0 gap-2 overflow-y-auto border-t border-zinc-800 p-2 lg:max-h-[38%] xl:grid-cols-[1.1fr_0.9fr]">
            <ResultsPanel summary={summary} tests={problem.tests} />
            <SubmissionsPanel submissions={submissions ?? []} language={language} />
          </div>
        </section>
      </div>
    </div>
  );
}

function waitForHost(host: RuntimeHost, setRuntimeState: (state: 'booting' | 'ready' | 'error') => void) {
  setRuntimeState('booting');
  host
    .ready()
    .then(() => setRuntimeState('ready'))
    .catch(() => setRuntimeState('error'));
}

function RuntimePill({ state, language }: { state: 'booting' | 'ready' | 'error'; language: Language }) {
  const label = state === 'ready' ? 'Runtime ready' : state === 'error' ? 'Runtime error' : 'Preparing runtime';
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
      {state === 'booting' ? <Loader2 className="animate-spin text-amber-300" size={12} /> : <Clock size={12} />}
      {label}: {LANGUAGES[language].label}
    </div>
  );
}

function VerdictText({ summary }: { summary: RunSummary }) {
  const accepted = summary.verdict === 'accepted';
  return (
    <span className={accepted ? 'font-medium text-emerald-300' : 'font-medium text-rose-300'}>
      {accepted ? 'Accepted' : titleCase(summary.verdict)} ({summary.passed}/{summary.total})
    </span>
  );
}

function ResultsPanel({ summary, tests }: { summary?: RunSummary; tests: TestCase[] }) {
  if (!summary) {
    return (
      <section className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs text-zinc-400">
        Results will appear here after a run.
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold">Results</h3>
        <p className="text-[11px] text-zinc-400">
          {summary.passed}/{summary.total} passed in {Math.round(summary.totalTimeMs)}ms
        </p>
      </div>
      {summary.fatalError && (
        <pre className="max-h-32 overflow-auto rounded-md border border-rose-500/30 bg-rose-950/30 p-2 text-[11px] text-rose-100">
          {summary.fatalError}
        </pre>
      )}
      <div className="space-y-1.5">
        {summary.results.map((result) => (
          <ResultRow key={`${result.testId}-${result.status}`} result={result} test={tests.find((t) => t.id === result.testId)} />
        ))}
      </div>
    </section>
  );
}

function ResultRow({ result, test }: { result: TestResult; test?: TestCase }) {
  const passed = result.status === 'pass';
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {passed ? <CheckCircle2 className="text-emerald-300" size={14} /> : <XCircle className="text-rose-300" size={14} />}
          {test?.hidden ? 'Hidden test' : `Test ${result.testId}`}
        </div>
        <span className="text-[11px] text-zinc-500">{Math.round(result.timeMs)}ms</span>
      </div>
      {!test?.hidden && test && (
        <div className="mt-1.5 grid gap-1 text-[11px] text-zinc-400">
          <CodeLine label="Input" value={JSON.stringify(test.args)} />
          <CodeLine label="Expected" value={JSON.stringify(test.expected)} />
          {result.actual && <CodeLine label="Actual" value={result.actual} />}
        </div>
      )}
      {result.error && <pre className="mt-1.5 overflow-auto rounded bg-zinc-900 p-1.5 text-[11px] text-rose-200">{result.error}</pre>}
      {result.stdout && <pre className="mt-1.5 overflow-auto rounded bg-zinc-900 p-1.5 text-[11px] text-zinc-300">{result.stdout}</pre>}
    </div>
  );
}

function CodeLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mr-1.5 text-zinc-500">{label}:</span>
      <code className="break-all text-zinc-200">{value}</code>
    </div>
  );
}

function SubmissionsPanel({
  submissions,
  language,
}: {
  submissions: Array<{ id?: number; verdict: string; passed: number; total: number; timeMs: number; createdAt: number }>;
  language: Language;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold">Submissions</h3>
        <p className="text-[11px] text-zinc-400">Latest {LANGUAGES[language].label} attempts saved locally.</p>
      </div>
      <div className="space-y-1.5">
        {submissions.length === 0 && (
          <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs text-zinc-400">
            Submit a solution to save an attempt.
          </div>
        )}
        {submissions.map((submission) => (
          <div key={submission.id} className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className={submission.verdict === 'accepted' ? 'font-medium text-emerald-300' : 'font-medium text-rose-300'}>
                {titleCase(submission.verdict)}
              </span>
              <span className="text-[11px] text-zinc-500">{new Date(submission.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-400">
              {submission.passed}/{submission.total} tests, {submission.timeMs}ms
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
