import type { Problem } from '../lib/types';

const problem: Problem = {
  id: 'longest-substring-without-repeating',
  title: 'Longest Substring Without Repeating Characters',
  difficulty: 'medium',
  tags: ['string', 'sliding-window', 'hash-set'],
  functionName: 'lengthOfLongestSubstring',
  description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.

### Example 1

\`\`\`
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with a length of 3.
\`\`\`

### Example 2

\`\`\`
Input: s = "bbbbb"
Output: 1
\`\`\`

### Example 3

\`\`\`
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke". Note that "pwke" is a subsequence, not a substring.
\`\`\`

### Constraints

- \`0 <= s.length <= 5 * 10^4\`
- \`s\` consists of English letters, digits, symbols and spaces.
`,
  starterCode: {
    javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  
}
`,
    typescript: `function lengthOfLongestSubstring(s: string): number {
  
}
`,
    python: `def length_of_longest_substring(s: str) -> int:
    pass
`,
  },
  tests: [
    { id: 1, args: ['abcabcbb'], expected: 3 },
    { id: 2, args: ['bbbbb'], expected: 1 },
    { id: 3, args: ['pwwkew'], expected: 3 },
    { id: 4, args: [''], expected: 0, hidden: true },
    { id: 5, args: [' '], expected: 1, hidden: true },
    { id: 6, args: ['au'], expected: 2, hidden: true },
    { id: 7, args: ['dvdf'], expected: 3, hidden: true },
    { id: 8, args: ['abba'], expected: 2, hidden: true },
  ],
};

export default problem;
