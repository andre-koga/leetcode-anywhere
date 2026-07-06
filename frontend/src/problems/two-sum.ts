import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'two-sum',
  title: 'Two Sum',
  difficulty: 'easy',
  tags: ['array', 'hash-map'],
  functionName: 'twoSum',
  description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices of the two numbers** that add up to \`target\`.

Each input has **exactly one solution**, and you may not use the same element twice. Return the indices in **ascending order**.

### Example 1

\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] == 9
\`\`\`

### Example 2

\`\`\`
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
\`\`\`

### Constraints

- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i], target <= 10^9\`
- Exactly one valid answer exists.
`,
  starterCode: {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]} indices in ascending order
 */
function twoSum(nums, target) {
  
}
`,
    typescript: `function twoSum(nums: number[], target: number): number[] {
  
}
`,
    python: `def two_sum(nums: list[int], target: int) -> list[int]:
    pass
`,
  },
  tests: [
    { id: 1, args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { id: 2, args: [[3, 2, 4], 6], expected: [1, 2] },
    { id: 3, args: [[3, 3], 6], expected: [0, 1] },
    { id: 4, args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], hidden: true },
    { id: 5, args: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: true },
    { id: 6, args: [[1, 2, 5, 5], 10], expected: [2, 3], hidden: true },
    { id: 7, args: [[5, 75, 25], 100], expected: [1, 2], hidden: true },
  ],
};

export default problem;
