import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'fizz-buzz',
  title: 'Fizz Buzz',
  difficulty: 'easy',
  tags: ['math', 'simulation'],
  functionName: 'fizzBuzz',
  description: `Given an integer \`n\`, return a string array \`answer\` (1-indexed) where:

- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by 3.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by 5.
- \`answer[i] == i\` (as a string) otherwise.

### Example

\`\`\`
Input: n = 5
Output: ["1", "2", "Fizz", "4", "Buzz"]
\`\`\`

### Constraints

- \`1 <= n <= 10^4\`
`,
  starterCode: {
    javascript: `/**
 * @param {number} n
 * @return {string[]}
 */
function fizzBuzz(n) {
  
}
`,
    typescript: `function fizzBuzz(n: number): string[] {
  
}
`,
    python: `def fizz_buzz(n: int) -> list[str]:
    pass
`,
  },
  tests: [
    { id: 1, args: [3], expected: ['1', '2', 'Fizz'] },
    { id: 2, args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
    {
      id: 3,
      args: [15],
      expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'],
    },
    { id: 4, args: [1], expected: ['1'], hidden: true },
    {
      id: 5,
      args: [30],
      expected: [
        '1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz',
        '11', 'Fizz', '13', '14', 'FizzBuzz', '16', '17', 'Fizz', '19', 'Buzz',
        'Fizz', '22', '23', 'Fizz', 'Buzz', '26', 'Fizz', '28', '29', 'FizzBuzz',
      ],
      hidden: true,
    },
  ],
};

export default problem;
