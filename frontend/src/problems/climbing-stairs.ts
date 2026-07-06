import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'climbing-stairs',
  title: 'Climbing Stairs',
  difficulty: 'easy',
  tags: ['dynamic-programming', 'math'],
  functionName: 'climbStairs',
  description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can climb either **1** or **2** steps. In how many distinct ways can you climb to the top?

### Example 1

\`\`\`
Input: n = 2
Output: 2
Explanation: 1+1 or 2
\`\`\`

### Example 2

\`\`\`
Input: n = 3
Output: 3
Explanation: 1+1+1, 1+2, or 2+1
\`\`\`

### Constraints

- \`1 <= n <= 45\`
`,
  starterCode: {
    javascript: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  
}
`,
    typescript: `function climbStairs(n: number): number {
  
}
`,
    python: `def climb_stairs(n: int) -> int:
    pass
`,
  },
  tests: [
    { id: 1, args: [2], expected: 2 },
    { id: 2, args: [3], expected: 3 },
    { id: 3, args: [1], expected: 1 },
    { id: 4, args: [10], expected: 89, hidden: true },
    { id: 5, args: [45], expected: 1836311903, hidden: true },
    { id: 6, args: [38], expected: 63245986, hidden: true },
  ],
};

export default problem;
