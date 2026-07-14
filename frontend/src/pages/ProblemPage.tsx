import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, CheckCircle2, Clock, Loader2, Play, Send, XCircle } from 'lucide-react';
import { marked } from 'marked';
import { Link, Navigate, useParams } from 'react-router';
import { DifficultyBadge } from '../components/Badge';
import { TopicHints } from '../components/TopicHints';
import { LanguageSelect } from '../components/LanguageSelect';
import { useAuth } from '../auth/AuthContext';
import { createClientId, db, getLastLanguage, saveDraft, setLastLanguage } from '../db/db';
import { LANGUAGES } from '../lib/languages';
import { pushDraftNow, pushSubmissionNow } from '../lib/sync';
import type { Language, Problem, RunSummary, TestCase, TestResult } from '../lib/types';
import { RuntimeHost } from '../runtime/RuntimeHost';
import { loadProblem } from '../problems';

export function ProblemPage() {
  const { problemId } = useParams();
  const auth = useAuth();
  const [problem, setProblem] = useState<Problem | null | undefined>(undefined);
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [summary, setSummary] = useState<RunSummary | undefined>();
  const [running, setRunning] = useState(false);
  const [runtimeState, setRuntimeState] = useState<'booting' | 'ready' | 'error'>('booting');
  const hostRef = useRef<RuntimeHost | null>(null);
  const hasTests = Boolean(problem && problem.tests.length > 0);

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
    let cancelled = false;
    setProblem(undefined);
    if (!problemId) {
      setProblem(null);
      return;
    }
    loadProblem(problemId).then((next) => {
      if (!cancelled) setProblem(next ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [problemId]);

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
      void (async () => {
        const updatedAt = Date.now();
        await saveDraft(problem.id, language, code, updatedAt);
        if (auth.user) {
          try {
            await pushDraftNow(auth.user.id, problem.id, language, code, updatedAt);
          } catch {
            // Offline or sync failure — full sync will retry later.
          }
        }
      })();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [auth.user, code, language, problem]);

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

  if (problem === undefined) {
    return (
      <div className="flex h-full items-center gap-2 p-4 text-sm text-fog">
        <Loader2 className="animate-spin text-signal" size={16} />
        Loading problem…
      </div>
    );
  }

  if (!problem) return <Navigate to="/" replace />;

  async function execute(includeHidden: boolean) {
    if (!problem || !hostRef.current || running || problem.tests.length === 0) return;
    setRunning(true);
    setRuntimeState('booting');
    const result = await hostRef.current.run(problem, code, includeHidden);
    setSummary(result);
    setRunning(false);
    waitForHost(hostRef.current, setRuntimeState);

    if (includeHidden) {
      const localId = await db.submissions.add({
        clientId: createClientId(),
        problemId: problem.id,
        language,
        code,
        verdict: result.verdict,
        passed: result.passed,
        total: result.total,
        timeMs: Math.round(result.totalTimeMs),
        createdAt: Date.now(),
      });
      if (auth.user) {
        const saved = await db.submissions.get(localId);
        if (saved) {
          try {
            await pushSubmissionNow(auth.user.id, saved);
          } catch {
            // Offline or sync failure — full sync will retry later.
          }
        }
      }
    }
  }

  return (
    <div className="fade-in flex flex-col gap-2 p-2 sm:p-3 lg:h-full">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-fog transition hover:text-paper">
          <ArrowLeft size={14} />
          Problems
        </Link>
        <RuntimePill state={runtimeState} language={language} />
      </div>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="panel flex min-h-[22rem] flex-col overflow-hidden lg:min-h-0">
          <div className="shrink-0 border-b border-line">
            <div className="px-3 py-2">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                {problem.frontendId && <span className="font-mono text-[11px] text-fog/80">{problem.frontendId}.</span>}
                <DifficultyBadge difficulty={problem.difficulty} />
              </div>
              <h1 className="font-display text-lg font-bold tracking-tight text-paper">{problem.title}</h1>
            </div>
            <TopicHints tags={problem.tags} />
          </div>
          <article
            className="problem-statement flex-1 overflow-y-auto px-3 py-3"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </section>

        <section className="panel flex min-h-[32rem] flex-col overflow-hidden lg:min-h-0">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-paper">Solution</h2>
              <p className="text-[11px] text-fog">Drafts are saved separately for each language.</p>
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

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-y border-line bg-ink/80 px-3 py-2">
            <div className="text-xs text-fog">
              {!hasTests ? (
                'No local tests for this problem yet — you can still draft a solution.'
              ) : summary ? (
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
                disabled={running || !hasTests}
                className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                Run
              </button>
              <button
                onClick={() => void execute(true)}
                disabled={running || !hasTests}
                className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={14} />
                Submit
              </button>
            </div>
          </div>

          <div className="grid shrink-0 gap-2 overflow-y-auto border-t border-line p-2 lg:max-h-[38%] xl:grid-cols-[1.1fr_0.9fr]">
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
    <div className="inline-flex items-center gap-1.5 border border-line bg-ink-elevated px-2 py-1 font-mono text-[11px] text-fog">
      {state === 'booting' ? <Loader2 className="animate-spin text-warn" size={12} /> : <Clock size={12} />}
      {label}: {LANGUAGES[language].label}
    </div>
  );
}

function VerdictText({ summary }: { summary: RunSummary }) {
  const accepted = summary.verdict === 'accepted';
  return (
    <span className={accepted ? 'font-medium text-ok' : 'font-medium text-bad'}>
      {accepted ? 'Accepted' : titleCase(summary.verdict)} ({summary.passed}/{summary.total})
    </span>
  );
}

function ResultsPanel({ summary, tests }: { summary?: RunSummary; tests: TestCase[] }) {
  if (!summary) {
    return (
      <section className="panel-muted p-2.5 text-xs text-fog">Results will appear here after a run.</section>
    );
  }

  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold text-paper">Results</h3>
        <p className="text-[11px] text-fog">
          {summary.passed}/{summary.total} passed in {Math.round(summary.totalTimeMs)}ms
        </p>
      </div>
      {summary.fatalError && (
        <pre className="max-h-32 overflow-auto border border-bad/40 bg-bad/10 p-2 font-mono text-[11px] text-bad">
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
    <div className="panel-muted p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {passed ? <CheckCircle2 className="text-ok" size={14} /> : <XCircle className="text-bad" size={14} />}
          {test?.hidden ? 'Hidden test' : `Test ${result.testId}`}
        </div>
        <span className="font-mono text-[11px] text-fog/80">{Math.round(result.timeMs)}ms</span>
      </div>
      {!test?.hidden && test && (
        <div className="mt-1.5 grid gap-1 font-mono text-[11px] text-fog">
          <CodeLine label="Input" value={JSON.stringify(test.args)} />
          <CodeLine label="Expected" value={JSON.stringify(test.expected)} />
          {result.actual && <CodeLine label="Actual" value={result.actual} />}
        </div>
      )}
      {result.error && <pre className="mt-1.5 overflow-auto bg-ink p-1.5 font-mono text-[11px] text-bad">{result.error}</pre>}
      {result.stdout && <pre className="mt-1.5 overflow-auto bg-ink p-1.5 font-mono text-[11px] text-mist">{result.stdout}</pre>}
    </div>
  );
}

function CodeLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mr-1.5 text-fog/70">{label}:</span>
      <code className="break-all text-mist">{value}</code>
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
        <h3 className="text-sm font-semibold text-paper">Submissions</h3>
        <p className="text-[11px] text-fog">Latest {LANGUAGES[language].label} attempts · synced when signed in.</p>
      </div>
      <div className="space-y-1.5">
        {submissions.length === 0 && (
          <div className="panel-muted p-2.5 text-xs text-fog">Submit a solution to save an attempt.</div>
        )}
        {submissions.map((submission) => (
          <div key={submission.id} className="panel-muted p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className={submission.verdict === 'accepted' ? 'font-medium text-ok' : 'font-medium text-bad'}>
                {titleCase(submission.verdict)}
              </span>
              <span className="font-mono text-[11px] text-fog/80">{new Date(submission.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-fog">
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
