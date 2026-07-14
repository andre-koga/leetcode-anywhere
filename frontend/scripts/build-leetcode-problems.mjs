/**
 * Builds the offline problem catalog from open-source LeetCode datasets:
 * - Catalog + starters: https://github.com/neenza/leetcode-problems
 * - Extra runnable tests: https://github.com/newfacade/LeetCodeDataset
 *
 * Output: frontend/public/data/problems.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createGunzip } from 'node:zlib';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'public/data/problems.json');
const META_OUT = resolve(ROOT, 'src/data/problems-meta.json');

const NEENZA_URL =
  'https://raw.githubusercontent.com/neenza/leetcode-problems/master/merged_problems.json';
const LCD_URLS = [
  'https://github.com/newfacade/LeetCodeDataset/raw/main/data/LeetCodeDataset-v0.3.1-train.jsonl.gz',
  'https://github.com/newfacade/LeetCodeDataset/raw/main/data/LeetCodeDataset-v0.3.1-test.jsonl.gz',
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchGunzipJsonl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const rows = [];
  const gunzip = createGunzip();
  const textStream = Readable.fromWeb(res.body).pipe(gunzip);
  let buffer = '';
  for await (const chunk of textStream) {
    buffer += chunk.toString('utf8');
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (line) rows.push(JSON.parse(line));
    }
  }
  if (buffer.trim()) rows.push(JSON.parse(buffer.trim()));
  return rows;
}

function extractFunctionName(snippets) {
  const js = snippets.javascript || '';
  const ts = snippets.typescript || '';
  const py = snippets.python3 || snippets.python || '';

  const fromJs =
    js.match(/\bvar\s+([A-Za-z_]\w*)\s*=\s*function\b/) ||
    js.match(/\bfunction\s+([A-Za-z_]\w*)\s*\(/) ||
    js.match(/\b(?:const|let)\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?(?:function|\()/);
  if (fromJs) return fromJs[1];

  const fromTs =
    ts.match(/\bfunction\s+([A-Za-z_]\w*)\s*\(/) ||
    ts.match(/\b(?:const|let)\s+([A-Za-z_]\w*)\s*=/);
  if (fromTs) return fromTs[1];

  const fromPy = py.match(/\bdef\s+([A-Za-z_]\w*)\s*\(/);
  if (fromPy) return fromPy[1];

  return 'solve';
}

function ensurePythonBody(code) {
  if (!code) return 'pass\n';
  const trimmed = code.replace(/\s+$/u, '');
  const lastLine = trimmed.split('\n').at(-1) ?? '';
  if (/:\s*$/u.test(lastLine)) {
    const indent = (lastLine.match(/^(\s*)/)?.[1] ?? '') + '    ';
    return `${trimmed}\n${indent}pass\n`;
  }
  return `${trimmed}\n`;
}

function buildDescription(problem) {
  const parts = [];
  if (problem.description?.trim()) parts.push(problem.description.trim());

  for (const example of problem.examples || []) {
    const num = example.example_num ?? '';
    parts.push(`### Example ${num}`.trim());
    const text = String(example.example_text || '').trim();
    if (text) parts.push(`\`\`\`\n${text}\n\`\`\``);
  }

  if (problem.constraints?.length) {
    parts.push('### Constraints');
    for (const constraint of problem.constraints) {
      parts.push(`- ${constraint}`);
    }
  }

  if (problem.follow_ups?.length) {
    parts.push('### Follow-up');
    for (const follow of problem.follow_ups) {
      parts.push(`- ${follow}`);
    }
  }

  return parts.join('\n\n');
}

function parseAssignmentMap(input) {
  const parts = String(input)
    .trim()
    .split(/,\s*(?=[A-Za-z_][\w]*\s*=)/u);
  const out = {};
  for (const part of parts) {
    if (!part.includes('=')) continue;
    const eq = part.indexOf('=');
    const key = part.slice(0, eq).trim();
    const raw = part.slice(eq + 1).trim();
    out[key] = JSON.parse(raw.replace(/\bNone\b/g, 'null').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false'));
  }
  return out;
}

function parseParamsFromPython(starter) {
  const match = starter.match(/def\s+([A-Za-z_]\w*)\s*\(self(?:,\s*(.*))?\)/u);
  if (!match) return { name: null, params: [] };
  const name = match[1];
  const rest = (match[2] || '').trim();
  if (!rest) return { name, params: [] };
  const params = rest.split(',').map((part) => part.trim().split(':')[0].trim()).filter(Boolean);
  return { name, params };
}

function parseExpected(output) {
  const text = String(output).trim();
  if (!text || text === 'None' || /^error:/i.test(text) || /timed out/i.test(text)) return { ok: false };
  try {
    return {
      ok: true,
      value: JSON.parse(text.replace(/\bNone\b/g, 'null').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false')),
    };
  } catch {
    return { ok: false };
  }
}

function parseExampleTests(examples, params) {
  if (!params.length) return [];
  const tests = [];
  for (const example of examples || []) {
    const text = String(example.example_text || '');
    const inputMatch = text.match(/Input:\s*([^\n]+)/i);
    const outputMatch = text.match(/Output:\s*([^\n]+)/i);
    if (!inputMatch || !outputMatch) continue;
    try {
      const mapping = parseAssignmentMap(inputMatch[1]);
      const expected = parseExpected(outputMatch[1]);
      if (!expected.ok) continue;
      const args = params.map((p) => mapping[p]);
      if (args.some((v) => v === undefined)) continue;
      tests.push({ args, expected: expected.value });
    } catch {
      // skip unparsable examples
    }
  }
  return tests;
}

function slugifyTag(tag) {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('Downloading neenza/leetcode-problems catalog...');
  const neenza = await fetchJson(NEENZA_URL);
  const questions = neenza.questions || neenza;
  if (!Array.isArray(questions)) throw new Error('Unexpected neenza format');

  console.log('Downloading newfacade/LeetCodeDataset tests...');
  const lcdRows = [];
  for (const url of LCD_URLS) {
    const rows = await fetchGunzipJsonl(url);
    lcdRows.push(...rows);
  }
  const lcdBySlug = new Map(lcdRows.map((row) => [row.task_id, row]));

  const problems = [];
  let withTests = 0;

  for (const raw of questions) {
    const snippets = raw.code_snippets || {};
    const javascript = snippets.javascript;
    const typescript = snippets.typescript;
    const python = snippets.python3 || snippets.python;
    if (!javascript || !typescript || !python) continue;

    const id = raw.problem_slug;
    if (!id) continue;

    const functionName = extractFunctionName({ javascript, typescript, python3: python });
    const { params } = parseParamsFromPython(python);

    let tests = [];
    const lcd = lcdBySlug.get(id);
    if (lcd?.input_output?.length && params.length) {
      for (const caseRow of lcd.input_output) {
        try {
          const mapping = parseAssignmentMap(caseRow.input);
          const expected = parseExpected(caseRow.output);
          if (!expected.ok) continue;
          const args = params.map((p) => mapping[p]);
          if (args.some((v) => v === undefined)) continue;
          tests.push({ args, expected: expected.value });
        } catch {
          // skip
        }
      }
    }

    if (!tests.length) {
      tests = parseExampleTests(raw.examples || [], params);
    }

    const mappedTests = tests.slice(0, 12).map((test, index) => ({
      id: index + 1,
      args: test.args,
      expected: test.expected,
      hidden: index >= 2,
    }));
    if (mappedTests.length) withTests += 1;

    problems.push({
      id,
      frontendId: String(raw.frontend_id ?? raw.problem_id ?? ''),
      title: raw.title,
      difficulty: String(raw.difficulty || 'medium').toLowerCase(),
      tags: (raw.topics || []).map(slugifyTag).filter(Boolean),
      functionName,
      description: buildDescription(raw),
      starterCode: {
        javascript: javascript.endsWith('\n') ? javascript : `${javascript}\n`,
        typescript: typescript.endsWith('\n') ? typescript : `${typescript}\n`,
        python: ensurePythonBody(python),
      },
      tests: mappedTests,
      source: 'neenza/leetcode-problems',
    });
  }

  problems.sort((a, b) => Number(a.frontendId) - Number(b.frontendId) || a.title.localeCompare(b.title));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(problems));
  writeFileSync(
    META_OUT,
    JSON.stringify(
      {
        count: problems.length,
        withTests,
        generatedAt: new Date().toISOString(),
        sources: [
          'https://github.com/neenza/leetcode-problems',
          'https://github.com/newfacade/LeetCodeDataset',
        ],
      },
      null,
      2,
    ),
  );

  console.log(`Wrote ${problems.length} problems (${withTests} with tests) -> ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
