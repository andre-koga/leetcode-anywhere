import type { Problem } from '../lib/types';
import twoSum from './two-sum';
import validParentheses from './valid-parentheses';
import fizzBuzz from './fizz-buzz';
import containsDuplicate from './contains-duplicate';
import climbingStairs from './climbing-stairs';
import maximumSubarray from './maximum-subarray';
import mergeIntervals from './merge-intervals';
import longestSubstring from './longest-substring';
import reverseString from './reverse-string';

export const PROBLEMS: Problem[] = [
  twoSum,
  reverseString,
  fizzBuzz,
  validParentheses,
  containsDuplicate,
  climbingStairs,
  maximumSubarray,
  longestSubstring,
  mergeIntervals,
];

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
