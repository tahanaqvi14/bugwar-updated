import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, gql, useMutation } from "@apollo/client";
import { toast } from "react-toastify";

const CREATE_CHALLENGE = gql`
  mutation createChallenge($input: ChallengeInput!) {
    result: createChallenge(input: $input)
  }
`;

const CHECK = gql`
  query Check {
    check
  }
`;

const Newchallenge = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [createChallengeMutation] = useMutation(CREATE_CHALLENGE);

  const { data, loading } = useQuery(CHECK, {
    fetchPolicy: "network-only",
  });

  // Check login
  useEffect(() => {
    if (!loading) {
      if (data && data.check === false) {
        setAuthError(true);
        toast.error("You need to login!");
        const timer = setTimeout(() => navigate("/admin"), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [data, loading, navigate]);

  if (loading) return <p>Loading...</p>;

  if (authError)
    return (
      <div className="min-h-screen flex justify-center items-center text-2xl text-red-500 font-bold">
        You need to login
      </div>
    );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target.elements;
    const testcase1Input = form.testcase1_input.value;
    const testcase2Input = form.testcase2_input.value;
    const testcase1sol = form.testcase1_solution.value.trim();
    const testcase2sol = form.testcase2_solution.value.trim();

    const function_name = form.funcName.value.trim();
    const problem_statement = form.question.value.trim();
    const difficulty = form.difficulty.value;
    const input_type = form.input_type.value;

    const isValidIntegerList = (str) => {
      const nums = str.split(",").map((s) => s.trim());
      return nums.length > 0 && nums.every((n) => /^-?\d+$/.test(n));
    };

    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(function_name)) {
      toast.error("Function name must be a valid JavaScript name (letters, digits, _ or $)");
      return;
    }

    if (!isValidIntegerList(testcase1Input) || !isValidIntegerList(testcase2Input)) {
      toast.error("Test case inputs must be integers, separated by commas!");
      return;
    }

    if (!/^-?\d+$/.test(testcase1sol) || !/^-?\d+$/.test(testcase2sol)) {
      toast.error("Test case solution must be a single integer");
      return;
    }


    const formattedTestcases = [
      {
        case: testcase1Input.split(",").map((n) => parseInt(n.trim(), 10)),
        expected: parseInt(testcase1sol, 10),
      },
      {
        case: testcase2Input.split(",").map((n) => parseInt(n.trim(), 10)),
        expected: parseInt(testcase2sol, 10),
      },
    ];

    setSubmitting(true);
    try {
      const { data } = await createChallengeMutation({
        variables: {
          input: {
            function_name,
            problem_statement,
            difficulty,
            input_type,
            testcases: formattedTestcases,
          },
        },
      });
      if (data.result === true) {
        toast.success("Problem Created Successfully!");
        navigate("/admin/adminpage");
      } else {
        toast.error("Failed to create problem");
      }
    } catch (err) {
      // e.g. a validation message from the server
      toast.error(err?.message || "Failed to create problem (network/server error)");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex justify-center py-10 select-none"
      style={{
        fontFamily: "'Fredoka One', cursive",
        background:
          "linear-gradient(180deg, #8fc6bb 0%, #f9b75a 50%, #f7a72b 100%)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div className="w-1/2 bg-[#fce9b8] border-4 border-[#7f4f0a] p-6 rounded-3xl shadow-[6px_6px_0_0_#7f4f0a]">
        <h1 className="text-3xl text-[#7a4f0a] mb-6 drop-shadow-sm font-bold">
          Create New Problem
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Function Name */}
          <div>
            <label
              htmlFor="funcName"
              className="block text-[#7a4f0a] font-bold text-xl mb-1"
            >
              Function Name
            </label>
            <input
              type="text"
              id="funcName"
              placeholder="e.g., findMaxElement"
              className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
              required
            />
          </div>

          {/* Difficulty */}
          <div>
            <label
              htmlFor="difficulty"
              className="block text-[#7a4f0a] font-bold text-xl mb-1"
            >
              Difficulty Level
            </label>
            <select
              id="difficulty"
              defaultValue=""
              className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
              required
            >
              <option value="" disabled>
                Select difficulty
              </option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Input type */}
          <div>
            <label
              htmlFor="input_type"
              className="block text-[#7a4f0a] font-bold text-xl mb-1"
            >
              How are the inputs passed?
            </label>
            <select
              id="input_type"
              defaultValue="numbers"
              className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
            >
              <option value="numbers">Separate numbers → f(a, b)</option>
              <option value="array">One array → f(arr)</option>
              <option value="array_and_k">Array + last number → f(arr, k)</option>
            </select>
          </div>

          {/* Question */}
          <div>
            <label
              htmlFor="question"
              className="block text-[#7a4f0a] font-bold text-xl mb-1"
            >
              Question Text
            </label>
            <textarea
              id="question"
              rows={4}
              placeholder="Enter the problem description..."
              className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
              required
            />
          </div>

          {/* Testcase #1 */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-[#7a4f0a]">Test Case #1</h2>

            <div>
              <label className="block text-[#7a4f0a] font-bold mb-1">
                Inputs (comma-separated integers)
              </label>
              <input
                type="text"
                id="testcase1_input"
                className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-[#7a4f0a] font-bold mb-1">
                Expected Output
              </label>
              <textarea
                id="testcase1_solution"
                rows={2}
                className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Testcase #2 */}
          <div className="space-y-3 mt-6">
            <h2 className="text-xl font-bold text-[#7a4f0a]">Test Case #2</h2>

            <div>
              <label className="block text-[#7a4f0a] font-bold mb-1">
                Inputs (comma-separated integers)
              </label>
              <input
                type="text"
                id="testcase2_input"
                className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-[#7a4f0a] font-bold mb-1">
                Expected Output
              </label>
              <textarea
                id="testcase2_solution"
                rows={2}
                className="w-full rounded-md border-2 border-[#7f4f0a] bg-transparent text-[#7a4f0a] text-xl px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#f7b63d] text-white font-bold text-xl py-3 rounded-lg shadow-[3px_3px_0_0_#7f4f0a]"
          >
            {submitting ? "Creating..." : "Create Problem"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Newchallenge;
