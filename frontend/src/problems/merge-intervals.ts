import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  difficulty: 'medium',
  tags: ['array', 'sorting'],
  functionName: 'mergeIntervals',
  description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input, **sorted by start**.

### Example 1

\`\`\`
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: [1,3] and [2,6] overlap, so they merge into [1,6].
\`\`\`

### Example 2

\`\`\`
Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]
Explanation: Intervals touching at a point are considered overlapping.
\`\`\`

### Constraints

- \`1 <= intervals.length <= 10^4\`
- \`0 <= start_i <= end_i <= 10^4\`
`,
  starterCode: {
    javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function mergeIntervals(intervals) {
  
}
`,
    typescript: `function mergeIntervals(intervals: number[][]): number[][] {
  
}
`,
    python: `def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    pass
`,
  },
  tests: [
    { id: 1, args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
    { id: 2, args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
    { id: 3, args: [[[1, 4], [0, 4]]], expected: [[0, 4]] },
    { id: 4, args: [[[1, 4]]], expected: [[1, 4]], hidden: true },
    { id: 5, args: [[[1, 4], [2, 3]]], expected: [[1, 4]], hidden: true },
    { id: 6, args: [[[5, 6], [1, 2]]], expected: [[1, 2], [5, 6]], hidden: true },
    { id: 7, args: [[[1, 10], [2, 3], [4, 5], [11, 12]]], expected: [[1, 10], [11, 12]], hidden: true },
  ],
};

export default problem;
