import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'contains-duplicate',
  title: 'Contains Duplicate',
  difficulty: 'easy',
  tags: ['array', 'hash-set', 'sorting'],
  functionName: 'containsDuplicate',
  description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice**, and \`false\` if every element is distinct.

### Example 1

\`\`\`
Input: nums = [1, 2, 3, 1]
Output: true
\`\`\`

### Example 2

\`\`\`
Input: nums = [1, 2, 3, 4]
Output: false
\`\`\`

### Constraints

- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\`
`,
  starterCode: {
    javascript: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
function containsDuplicate(nums) {
  
}
`,
    typescript: `function containsDuplicate(nums: number[]): boolean {
  
}
`,
    python: `def contains_duplicate(nums: list[int]) -> bool:
    pass
`,
  },
  tests: [
    { id: 1, args: [[1, 2, 3, 1]], expected: true },
    { id: 2, args: [[1, 2, 3, 4]], expected: false },
    { id: 3, args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
    { id: 4, args: [[7]], expected: false, hidden: true },
    { id: 5, args: [[-1, -1]], expected: true, hidden: true },
    { id: 6, args: [[1000000000, -1000000000, 0]], expected: false, hidden: true },
  ],
};

export default problem;
