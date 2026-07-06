import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'valid-parentheses',
  title: 'Valid Parentheses',
  difficulty: 'easy',
  tags: ['stack', 'string'],
  functionName: 'isValid',
  description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

An input string is valid if:

1. Open brackets are closed by the same type of bracket.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1

\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 2

\`\`\`
Input: s = "(]"
Output: false
\`\`\`

### Constraints

- \`1 <= s.length <= 10^4\`
- \`s\` consists only of \`()[]{}\`.
`,
  starterCode: {
    javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  
}
`,
    typescript: `function isValid(s: string): boolean {
  
}
`,
    python: `def is_valid(s: str) -> bool:
    pass
`,
  },
  tests: [
    { id: 1, args: ['()'], expected: true },
    { id: 2, args: ['()[]{}'], expected: true },
    { id: 3, args: ['(]'], expected: false },
    { id: 4, args: ['([])'], expected: true },
    { id: 5, args: ['(('], expected: false, hidden: true },
    { id: 6, args: ['){'], expected: false, hidden: true },
    { id: 7, args: ['{[()()]}'], expected: true, hidden: true },
    { id: 8, args: ['((((((()))))))'], expected: true, hidden: true },
  ],
};

export default problem;
