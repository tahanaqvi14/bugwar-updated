import mongoose from 'mongoose';

const TestcaseSchema = new mongoose.Schema({
  case: { type: [Number], required: true },
  expected: { type: Number, required: true }
});


const challenge = mongoose.Schema({
  function_name: { type: String, required: true, trim: true },
  difficulty: { type: String, required: true, trim: true, enum: ['Easy', 'Medium', 'Hard'] },
  // How the numbers in a test case are passed to the player's function:
  //   numbers     → f(5, 7)              e.g. sumTwoNumbers(a, b)
  //   array       → f([5, 7, 9])         e.g. maxSubarraySum(arr)
  //   array_and_k → f([5, 7], 9)         the last number is k / target / m
  input_type: { type: String, enum: ['numbers', 'array', 'array_and_k'], default: 'numbers' },
  testcases: { type: [TestcaseSchema], default: [] },
  problem_statement: { type: String, required: true, trim: true }
});


export default challenge;
