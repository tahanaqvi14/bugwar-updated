import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import { useQuery, gql, useMutation } from "@apollo/client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// GraphQL queries/mutations
const GET_CHALLENGE = gql`
  query Get_challengeall {
    Get_challengeall {
      function_name
      problem_statement
      _id
      difficulty
      testcases {
        case
        expected
      }
    }
  }
`;

const UPDATE_CHALLENGE = gql`
  mutation UpdateChallenge($input: ChallengeInput!) {
    updateChallenge(input: $input) {
      _id
      function_name
      problem_statement
      difficulty
      testcases {
        case
        expected
      }
    }
  }
`;

const DELETE = gql`
  mutation ($id: ID!) {
    deleteChallenge(id_number: $id)
  }
`;

const Admin = () => {
  const [openId, setOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [localData, setLocalData] = useState([]);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  const [updateChallengeMutation] = useMutation(UPDATE_CHALLENGE);
  const [del] = useMutation(DELETE);

  const { data, loading, error } = useQuery(GET_CHALLENGE, {
    onCompleted: (d) => setLocalData(d.Get_challengeall),
  });

  useEffect(() => {
    if (error && error.message.includes("Not authenticated")) {
      setAuthError(true);
      setTimeout(() => {
        navigate("/admin");
      }, 1000);
    }
  }, [error, navigate]);

  if (loading) return <p>Loading...</p>;
  if (error && !error.message.includes("Not authenticated"))
    return <p>Error: {error.message}</p>;
  if (authError)
    return (
      <div className="min-h-screen flex justify-center items-center text-red-500 text-2xl font-bold">
        You need to login
      </div>
    );

  const toggleAccordion = (id) => setOpenId((prev) => (prev === id ? null : id));
  const handleEditClick = (id) => setEditingId(id);

  const handleChange = (e, problem) => {
    const { name, value } = e.target;
    setLocalData((prev) =>
      prev.map((p) => (p._id === problem._id ? { ...p, [name]: value } : p))
    );
  };

  const handleTestcaseChange = (problemId, index, field, value) => {
    setLocalData((prev) =>
      prev.map((p) => {
        if (p._id !== problemId) return p;

        const newTestcases = p.testcases.map((tc, idx) => {
          if (idx !== index) return tc;

          if (field === "case") {
            return { ...tc, caseStr: value }; // keep string while typing
          } else {
            return { ...tc, [field]: value };
          }
        });

        return { ...p, testcases: newTestcases };
      })
    );
  };

  // const handleAddTestcase = (problemId) => {
  //   setLocalData((prev) =>
  //     prev.map((p) => {
  //       if (p._id !== problemId) return p;
  //       const newTestcases = [...p.testcases, { case: [], expected: "" }];
  //       return { ...p, testcases: newTestcases };
  //     })
  //   );
  // };

  const handleSave = async (problem) => {
    try {
      // Convert strings to integers, validate
      const formattedTestcases = problem.testcases.map((tc) => {
        const arr = (tc.caseStr ?? tc.case.join(","))
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n !== ""); // remove empty strings

        // Validate integers only
        if (!arr.every((n) => /^-?\d+$/.test(n))) {
          throw new Error("All testcase values must be integers.");
        }

        // Validate "expected" is a non-empty integer
        if (!/^-?\d+$/.test(tc.expected)) {
          throw new Error(`Expected value in testcase solution must be an integer.`);
        }

        return {
          case: arr.map((n) => parseInt(n, 10)),
          expected: parseInt(tc.expected, 10),
        };
      });

      const { data } = await updateChallengeMutation({
        variables: {
          input: {
            _id: problem._id,
            function_name: problem.function_name,
            problem_statement: problem.problem_statement,
            difficulty: problem.difficulty,
            testcases: formattedTestcases,
          },
        },
      });

      setLocalData((prev) =>
        prev.map((p) => (p._id === problem._id ? data.updateChallenge : p))
      );
      setEditingId(null);
      toast.success("Challenge updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update challenge.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this challenge?")) return;

    try {
      await del({ variables: { id } });
      setLocalData((prev) => prev.filter((p) => p._id !== id));
      toast.success("Challenge deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete challenge.");
    }
  };

  const newpage = () => navigate("/admin/newchallenge");

  return (
    <div
      className="min-h-screen flex justify-center py-10 select-none"
      style={{
        fontFamily: "'Fredoka One', cursive",
        background:
          "linear-gradient(180deg, #8fc6bb 0%, #f9b75a 50%, #f7a72b 100%)",
      }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-[#fce9b8] border-4 border-[#7f4f0a] p-6 rounded-3xl shadow-[6px_6px_0_0_#7f4f0a] space-y-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl font-bold text-[#7a4f0a] drop-shadow-sm">
            Manage Coding Problems
          </h1>
          <button
            onClick={newpage}
            className="text-xl bg-[#f7b63d] border-4 border-[#7f4f0a] px-3 py-1 rounded-xl shadow-[3px_3px_0_0_#7f4f0a] no-hover"
          >
            + New
          </button>
        </div>

        <div className="space-y-5">
          {localData.map((problem) => {
            const isOpen = openId === problem._id;
            const isEditing = editingId === problem._id;

            return (
              <div
                key={problem._id}
                className="bg-[#fff4d6] p-4 rounded-2xl border-4 border-[#7f4f0a]"
              >
                <button
                  onClick={() => toggleAccordion(problem._id)}
                  className="button1 w-full flex justify-between items-center text-2xl text-[#7a4f0a] accordion-btn"
                >
                  <span>{problem.function_name}</span>
                  <span
                    className={`arrow text-3xl text-[#7a4f0a] transition-transform duration-300 ${isOpen ? "rotate-90" : ""
                      }`}
                  >
                    ➤
                  </span>
                </button>

                <div
                  className="accordion-content overflow-auto transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? "700px" : "0px",
                    overflowY: isOpen ? "auto" : "hidden",
                  }}
                >
                  {isOpen && (
                    <div className="pt-4 space-y-3 text-xl text-[#7a4f0a]">
                      <p>
                        <strong>Problem:</strong>{" "}
                        {isEditing ? (
                          <textarea
                            value={problem.problem_statement}
                            name="problem_statement"
                            onChange={(e) => handleChange(e, problem)}
                            className="w-full border-2 border-[#7f4f0a] rounded-md p-1 resize-none"
                            style={{ height: "80px" }}
                          />
                        ) : (
                          problem.problem_statement
                        )}
                      </p>

                      <p>
                        <strong>Difficulty:</strong>{" "}
                        {isEditing ? (
                          <select
                            name="difficulty"
                            value={problem.difficulty}
                            onChange={(e) => handleChange(e, problem)}
                            className="border-2 border-[#7f4f0a] rounded-md p-1"
                          >
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                          </select>
                        ) : (
                          problem.difficulty
                        )}
                      </p>

                      <div>
                        <strong>Testcases:</strong>
                        {problem.testcases && problem.testcases.length > 0 ? (
                          problem.testcases.map((tc, idx) => (
                            <div
                              key={idx}
                              className="ml-4 p-1 border-l-2 border-[#7f4f0a] mt-1"
                            >
                              <p>
                                <strong>Case:</strong>{" "}
                                {isEditing ? (
                                  <input
                                    value={tc.caseStr ?? tc.case.join(",")}
                                    onChange={(e) =>
                                      handleTestcaseChange(
                                        problem._id,
                                        idx,
                                        "case",
                                        e.target.value
                                      )
                                    }
                                    className="border-2 border-[#7f4f0a] rounded-md p-1 w-full"
                                  />
                                ) : (
                                  tc.case.join(", ")
                                )}
                              </p>
                              <p>
                                <strong>Expected:</strong>{" "}
                                {isEditing ? (
                                  <input
                                    value={tc.expected}
                                    onChange={(e) =>
                                      handleTestcaseChange(
                                        problem._id,
                                        idx,
                                        "expected",
                                        e.target.value
                                      )
                                    }
                                    className="border-2 border-[#7f4f0a] rounded-md p-1 w-full"
                                  />
                                ) : (
                                  tc.expected
                                )}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="ml-4 italic">No testcases available.</p>
                        )}
                      </div>

                      <div className="flex space-x-3 pt-2">
                        {isEditing ? (
                          <button
                            onClick={() => handleSave(problem)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-xl shadow-md"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditClick(problem._id)}
                            className="px-3 py-1 bg-[#f7b63d] border-4 border-[#7f4f0a] rounded-xl shadow-md no-hover"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(problem._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-xl shadow-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Admin;
