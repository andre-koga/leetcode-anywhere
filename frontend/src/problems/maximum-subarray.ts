import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'maximum-subarray',
  title: 'Maximum Subarray',
  difficulty: 'medium',
  tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
  functionName: 'maxSubArray',
  description: `Given an integer array \`nums\`, find the **contiguous subarray** with the largest sum, and return its sum.

### Example 1

\`\`\`
Input: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6
Explanation: The subarray [4, -1, 2, 1] has the largest sum 6.
\`\`\`

### Example 2

\`\`\`
Input: nums = [5, 4, -1, 7, 8]
Output: 23
\`\`\`

### Constraints

- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`

**Follow up:** try to solve it in \`O(n)\` time (Kadane's algorithm).
`,
  starterCode: {
    javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  
}
`,
    typescript: `function maxSubArray(nums: number[]): number {
  
}
`,
    python: `def max_sub_array(nums: list[int]) -> int:
    pass
`,
  },
  tests: [
    { id: 1, args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
    { id: 2, args: [[1]], expected: 1 },
    { id: 3, args: [[5, 4, -1, 7, 8]], expected: 23 },
    { id: 4, args: [[-1]], expected: -1, hidden: true },
    { id: 5, args: [[-2, -1, -3]], expected: -1, hidden: true },
    { id: 6, args: [[8, -19, 5, -4, 20]], expected: 21, hidden: true },
    { id: 7, args: [[0, 0, 0, 0]], expected: 0, hidden: true },
  ],
};

export default problem;
