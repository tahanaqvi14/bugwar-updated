

  import mongoose from 'mongoose';

  const TestcaseSchema = new mongoose.Schema({
    case: { type: [Number], required: true },
    expected: { type: mongoose.Schema.Types.Mixed, required: true }
  });


  const challenge = mongoose.Schema({
    function_name: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, trim: true },
    testcases: { type: [TestcaseSchema], default: [] },
    problem_statement: { type: String, required: true, trim: true }
  });


  export default challenge;
