import dotenv from "dotenv";
dotenv.config();

import connectDB from './DB/Connection.js'
import challenge from "./models/challenge.js";
import { getUserModel } from "./utils/getUserModel.js";
const data = [

    {
        function_name: "sumTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns their sum. The function should handle 
    positive numbers, negative numbers, and zero correctly.`,
        testcases: [
          { case: [5, 7], expected: 12 },
          { case: [-3, 10], expected: 7 }
        ]
      },
      {
        function_name: "differenceTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns the result of the first minus the second. 
    The function should handle negative results and zero.`,
        testcases: [
          { case: [10, 4], expected: 6 },
          { case: [3, 7], expected: -4 }
        ]
      },
      {
        function_name: "productTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns their product. Make sure it handles 
    positive and negative numbers as well as zero.`,
        testcases: [
          { case: [3, 4], expected: 12 },
          { case: [-3, 5], expected: -15 }
        ]
      },
      {
        function_name: "maxOfTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns the larger of the two. If the numbers 
    are equal, return either of them.`,
        testcases: [
          { case: [10, 20], expected: 20 },
          { case: [-5, -2], expected: -2 }
        ]
      },
      {
        function_name: "minOfTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns the smaller of the two. If the numbers 
    are equal, return either of them.`,
        testcases: [
          { case: [10, 20], expected: 10 },
          { case: [-5, -2], expected: -5 }
        ]
      },
      {
        function_name: "sumAbsoluteTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns the sum of their absolute values. 
    Both positive and negative numbers should be handled correctly.`,
        testcases: [
          { case: [-5, 10], expected: 15 },
          { case: [-3, -7], expected: 10 }
        ]
      },
      {
        function_name: "differenceAbsoluteTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns the absolute difference between them. 
    The function should always return a non-negative integer.`,
        testcases: [
          { case: [10, 4], expected: 6 },
          { case: [3, 7], expected: 4 }
        ]
      },
      {
        function_name: "powerTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers a and b and returns a raised to the power b. 
    Assume b is non-negative.`,
        testcases: [
          { case: [2, 3], expected: 8 },
          { case: [5, 0], expected: 1 }
        ]
      },
      {
        function_name: "modTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns the remainder when the first is 
    divided by the second. Assume the second integer is not zero.`,
        testcases: [
          { case: [10, 3], expected: 1 },
          { case: [20, 6], expected: 2 }
        ]
      },
      {
        function_name: "isEqualTwoNumbers",
        difficulty: "Easy",
        problem_statement: `Write a function that takes two integers and returns 1 if they are equal, otherwise return 0. 
    This checks for exact equality.`,
        testcases: [
          { case: [5, 5], expected: 1 },
          { case: [3, 7], expected: 0 }
        ]
      },
      {
        function_name: "maxSubarraySum",
        difficulty: "Medium",
        problem_statement: `Given an array of integers, find the sum of the contiguous subarray with the largest sum. 
    This tests your understanding of arrays and dynamic programming principles.`,
        testcases: [
          { case: [1, -2, 3, 4, -1, 2, 1, -5, 4], expected: 9 },
          { case: [-2, -3, 4, -1, -2, 1, 5, -3], expected: 7 }
        ]
      },
      {
        function_name: "countPairsWithDifferenceK",
        difficulty: "Medium",
        problem_statement: `Given an array of integers and an integer k, return the number of pairs (i, j) where i < j 
    and the absolute difference between arr[i] and arr[j] is exactly k. Tests counting and hashing skills.`,
        testcases: [
          { case: [1, 5, 3, 4, 2], expected: 3 }, // pairs: (1,2),(5,4),(3,4)
          { case: [1, 2, 2, 3], expected: 2 }
        ]
      },
      {
        function_name: "firstMissingPositive",
        difficulty: "Medium",
        problem_statement: `Given an unsorted array of integers, find the smallest positive integer that does not appear 
    in the array. Tests array manipulation and understanding of edge cases.`,
        testcases: [
          { case: [1, 2, 0], expected: 3 },
          { case: [3, 4, -1, 1], expected: 2 }
        ]
      },
      {
        function_name: "longestConsecutiveSequence",
        difficulty: "Medium",
        problem_statement: `Given an unsorted array of integers, find the length of the longest consecutive elements sequence. 
    The algorithm should run in O(n) time.`,
        testcases: [
          { case: [100, 4, 200, 1, 3, 2], expected: 4 }, // sequence: 1,2,3,4
          { case: [0,3,7,2,5,8,4,6,0,1], expected: 9 }
        ]
      },
      {
        function_name: "removeDuplicatesSortedArray",
        difficulty: "Medium",
        problem_statement: `Given a sorted array of integers, remove the duplicates in-place and return the new length. 
    Do not use extra space for another array.`,
        testcases: [
          { case: [1,1,2], expected: 2 },
          { case: [0,0,1,1,1,2,2,3,3,4], expected: 5 }
        ]
      },
      {
        function_name: "twoSum",
        difficulty: "Medium",
        problem_statement: `Given an array of integers and a target sum, return 1 if any two numbers in the array sum 
    to the target, otherwise return 0. Tests hashing and search techniques.`,
        testcases: [
          { case: [2,7,11,15,9], expected: 1 }, // 2+9=11
          { case: [1,2,3,4], expected: 0 } 
        ]
      },
      {
        function_name: "countSubarraysWithSum",
        difficulty: "Medium",
        problem_statement: `Given an array of integers and an integer k, count the number of contiguous subarrays that 
    sum to k.`,
        testcases: [
          { case: [1,1,1,1], expected: 3 }, // subarrays sum to 2
          { case: [1,2,3], expected: 2 }    // subarrays sum to 3
        ]
      },
      {
        function_name: "maxProductSubarray",
        difficulty: "Medium",
        problem_statement: `Given an array of integers, find the contiguous subarray within an array which has the 
    largest product.`,
        testcases: [
          { case: [2,3,-2,4], expected: 6 },
          { case: [-2,0,-1], expected: 0 }
        ]
      },
      {
        function_name: "findDuplicateNumber",
        difficulty: "Medium",
        problem_statement: `Given an array containing n+1 integers where each integer is between 1 and n (inclusive), 
    find the duplicate number without modifying the array and using O(1) extra space.`,
        testcases: [
          { case: [1,3,4,2,2], expected: 2 },
          { case: [3,1,3,4,2], expected: 3 }
        ]
      },
      {
        function_name: "countPairsWithSumK",
        difficulty: "Hard",
        problem_statement: `Given a set of integers and an integer k, count the number of unique pairs where the sum of 
    the two numbers is exactly k. Optimize for efficiency as the input can be large.`,
        testcases: [
          { case: [1,5,7,-1,5,6], expected: 3 }, // last number 6 is k
          { case: [2,2,2,2,4], expected: 6 }
        ]
      },
      {
        function_name: "maxSubarraySumModulo",
        difficulty: "Hard",
        problem_statement: `Given a list of positive integers followed by an integer m, find the maximum value of the sum 
    of any contiguous subsequence modulo m.`,
        testcases: [
          { case: [3,3,9,9,5,7], expected: 6 }, // last number 7 is m
          { case: [1,2,3,2], expected: 1 }
        ]
      },
      {
        function_name: "firstMissingPositive",
        difficulty: "Hard",
        problem_statement: `Given a list of integers, find the smallest positive integer that does not appear in the list. 
    Input may contain negative numbers and zeros.`,
        testcases: [
          { case: [1,2,0], expected: 3 },
          { case: [3,4,-1,1], expected: 2 }
        ]
      },
      {
        function_name: "longestConsecutiveSequence",
        difficulty: "Hard",
        problem_statement: `Given a set of integers, find the length of the longest consecutive elements sequence. 
    Your algorithm should run in linear time.`,
        testcases: [
          { case: [100,4,200,1,3,2], expected: 4 },
          { case: [0,3,7,2,5,8,4,6,0,1], expected: 9 }
        ]
      },
      {
        function_name: "gcdMultipleNumbers",
        difficulty: "Hard",
        problem_statement: `Given a list of positive integers, find the greatest common divisor (GCD) of all numbers in the list.`,
        testcases: [
          { case: [48,180,12], expected: 12 },
          { case: [7,13,91], expected: 1 }
        ]
      },
      {
        function_name: "lcmMultipleNumbers",
        difficulty: "Hard",
        problem_statement: `Given a list of positive integers, find the least common multiple (LCM) of all numbers in the list.`,
        testcases: [
          { case: [4,6,8], expected: 24 },
          { case: [7,5,10], expected: 70 }
        ]
      },
      {
        function_name: "countDivisiblePairs",
        difficulty: "Hard",
        problem_statement: `Given a list of integers followed by a number k, count the number of pairs (i,j) where i<j 
    and the sum of the pair is divisible by k. Optimize for large lists.`,
        testcases: [
          { case: [1,2,3,4,5,3], expected: 4 }, // last number 3 is k
          { case: [1,3,2,6,1,2], expected: 5 }
        ]
      },
      {
        function_name: "sumOfDigitsMultiple",
        difficulty: "Hard",
        problem_statement: `Given a list of integers followed by an integer k, return the sum of the digits of all numbers 
    that are divisible by k.`,
        testcases: [
          { case: [12,15,20,5], expected: 10 },
          { case: [7,14,21,7], expected: 14 }  
        ]
      },
      {
        function_name: "longestIncreasingSubsequence",
        difficulty: "Hard",
        problem_statement: `Given a list of integers, find the length of the longest strictly increasing subsequence. 
    Elements of the subsequence need not be contiguous.`,
        testcases: [
          { case: [10,9,2,5,3,7,101,18], expected: 4 },
          { case: [0,8,4,12,2,10,6,14,1,9], expected: 6 }
        ]
      },
      {
        function_name: "minStepsToEqual",
        difficulty: "Hard",
        problem_statement: `Given a list of integers, return the minimum number of increment or decrement operations 
    needed to make all numbers equal. Each operation changes a number by 1.`,
        testcases: [
          { case: [1,2,3], expected: 2 },
          { case: [1,1,1], expected: 0 }
        ]
      }
    
    
];

async function seed() {
  try {
    await connectDB();

    const ChallengeModel = getUserModel('Challenges')
    console.log("🚀 Seeding challenges...");

    await ChallengeModel.deleteMany({});
    console.log("🗑️  Old challenges removed.");

    await ChallengeModel.insertMany(data);
    console.log("✅ Challenges inserted successfully!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error while seeding:", err);
    process.exit(1);
  }
}

seed();
