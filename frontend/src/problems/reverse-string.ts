import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'reverse-string',
  title: 'Reverse String',
  difficulty: 'easy',
  tags: ['string', 'two-pointers'],
  functionName: 'reverseString',
  description: `Write a function that reverses a string. The input is given as an array of characters \`s\`.

Return the reversed array of characters.

### Example 1

\`\`\`
Input: s = ["h", "e", "l", "l", "o"]
Output: ["o", "l", "l", "e", "h"]
\`\`\`

### Example 2

\`\`\`
Input: s = ["H", "a", "n", "n", "a", "h"]
Output: ["h", "a", "n", "n", "a", "H"]
\`\`\`

### Constraints

- \`1 <= s.length <= 10^5\`
- \`s[i]\` is a printable ASCII character.
`,
  starterCode: {
    javascript: `/**
 * @param {string[]} s
 * @return {string[]}
 */
function reverseString(s) {
  
}
`,
    typescript: `function reverseString(s: string[]): string[] {
  
}
`,
    python: `def reverse_string(s: list[str]) -> list[str]:
    pass
`,
  },
  tests: [
    { id: 1, args: [['h', 'e', 'l', 'l', 'o']], expected: ['o', 'l', 'l', 'e', 'h'] },
    { id: 2, args: [['H', 'a', 'n', 'n', 'a', 'h']], expected: ['h', 'a', 'n', 'n', 'a', 'H'] },
    { id: 3, args: [['x']], expected: ['x'], hidden: true },
    { id: 4, args: [['a', 'b']], expected: ['b', 'a'], hidden: true },
    { id: 5, args: [['1', '2', '3', '4', '5', '6']], expected: ['6', '5', '4', '3', '2', '1'], hidden: true },
  ],
};

export default problem;
