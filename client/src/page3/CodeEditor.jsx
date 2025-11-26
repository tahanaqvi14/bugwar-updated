import { useApolloClient } from '@apollo/client';
import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/codeeditor.css';
import { SocketContext } from '../App';
import { useLazyQuery, gql } from "@apollo/client";
import { useStore } from '../../store/Store';
import Navbar from './Navbar';
import Popup from './Popup';

const GET_CHALLENGE = gql`
  query Get_challenge($idnum: ID,$username: String) {
    Get_challenge(idnum: $idnum,username: $username) {
      function_name
      problem_statement
      _id
    }
  }
`;

const GET_RESULT_OF_CODE = gql`
  query checking_user_code($input: checking_code!) {
    checking_user_code(input: $input) {
      success
      message {
        passed
        message
        consolelogs
        results {
          case
          expected
          output
          passed
        }
      }
    }
  }
`;

// ------------------------------------------------------
const GET_LEADERBOARD_INFO = gql`                                                                        
  query {                                                                       
    LeaderBoard_Info {                                                                        
      displayname                                                                       
      points                                                                        
    }
  }                                                                       
`;

const GET_ALL_MATCH = gql`
  query GetAllMatches($username: String!) {
    Get_allmatch(username: $username) {
      matchId
      winner
      status
      matchDate
      endTime
      participants {
        username
        points
        displayname
      }
    }
  }
`;

const CodeEditor = () => {
  const client = useApolloClient();

  const clientusername = useStore((state) => state.clientusername);
  const resetStore = useStore((state) => state.resetStore);
  const setDC = useStore((state) => state.setDC);
  const matchinfo = useStore((state) => state.data);

  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [getChallenge, { data: challenge_data, loading: challenge_loading }] = useLazyQuery(GET_CHALLENGE);
  const [getcode] = useLazyQuery(GET_RESULT_OF_CODE);

  const containerRef = useRef(null);
  const editorRef = useRef(null);

  const [result, setresult] = useState([]);
  const [consolelogs, setconsolelogs] = useState([]);
  const [code, setCode] = useState("//write code here");
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState(null);
  const [message, setmessage] = useState('');
  const [showCard, setShowCard] = useState(false);

  // Define theme
  const defineTheme = () => {
    if (!window.monaco) return;
    window.monaco.editor.defineTheme("desertLight", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "4B2E05", background: "FCE9B8" },
        { token: "keyword", foreground: "A65304", fontStyle: "bold" },
        { token: "number", foreground: "B06A14" },
        { token: "string", foreground: "A64B2A" },
        { token: "comment", foreground: "8B7E6A", fontStyle: "italic" },
        { token: "function", foreground: "C75B12" },
        { token: "type", foreground: "A65304" },
      ],
      colors: {
        "editor.background": "#FCE9B8",
        "editor.foreground": "#4B2E05",
        "editorCursor.foreground": "#7A4F0A",
        "editor.lineHighlightBackground": "#F8DFA7",
        "editorLineNumber.foreground": "#C18C46",
        "editor.selectionBackground": "#F7D48B",
        "editor.inactiveSelectionBackground": "#F7D48B66",
        "editorBracketMatch.background": "#F8E0A3",
        "editorBracketMatch.border": "#C18C46",
        "editorIndentGuide.background": "#EFD7A5",
        "editorWhitespace.foreground": "#EFD7A5",
      },
    });
  };

  // Create editor
  const createEditor = () => {
    if (!window.monaco || !containerRef.current) return;
    containerRef.current.innerHTML = ""; // clear previous editor if any
    defineTheme();

    editorRef.current = window.monaco.editor.create(containerRef.current, {
      value: code,
      language: "javascript",
      theme: "desertLight",
      fontFamily: "Fira Code, monospace",
      fontSize: 14,
      minimap: { enabled: false },
    });
  };

  useEffect(() => {
    // Fetch first challenge
    getChallenge({ variables: { idnum: "-1", username: clientusername } });

    // Socket events
    socket.on('other_player_left', () => {
      setDC(true);
      setShowCard(true);
      setTimeout(() => {
        resetStore();
        client.refetchQueries({
          include: [GET_LEADERBOARD_INFO, GET_ALL_MATCH]   // The query name in GQL
        });
      
        navigate('/page2');
      }, 10000);
    });

    socket.on('completed', () => {
      setShowCard(true);
      setTimeout(() => {
        resetStore();
        client.refetchQueries({
          include: ["GET_LEADERBOARD_INFO", "Get_allmatch"]   // The query name in GQL
        });

        navigate('/page2');
      }, 10000);
    });

    // Load Monaco editor
    if (!window.monaco) {
      const loaderScript = document.createElement("script");
      loaderScript.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/loader.js";
      loaderScript.onload = () => {
        window.require.config({
          paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs" },
        });
        window.require(["vs/editor/editor.main"], () => {
          createEditor();
          const loader = document.getElementById("editor-loader");
          if (loader) loader.remove();
        });
      };
      document.body.appendChild(loaderScript);
    } else {
      createEditor();
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
      socket.off('other_player_left');
      socket.off('completed');
    };
  }, []);

  // Update editor when challenge data changes
  useEffect(() => {
    if (challenge_loading && editorRef.current) {
      editorRef.current.setValue("loading...");
    } else if (challenge_data?.Get_challenge && editorRef.current) {
      editorRef.current.setValue(
        `function ${challenge_data.Get_challenge.function_name}(){\n  //Write your function inside this\n}\n`
      );
    }
  }, [challenge_loading, challenge_data]);

  const runCode = async (actionType) => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setIsRunning(true);
    setRunningAction(actionType);

    try {
      const { data } = await getcode({
        variables: { input: { code, challengeid: challenge_data.Get_challenge._id } },
      });
      setresult(data.checking_user_code);

      if (actionType === 'submit') {
        if (data.checking_user_code.message.passed) {
          setmessage('🟢 Accepted — All test cases passed! 🎉');
          socket.emit('next_challenge', socket.id, matchinfo);

          setTimeout(() => {
            getChallenge({ variables: { idnum: challenge_data.Get_challenge._id, username: clientusername } });
            setOutput("");
            setconsolelogs([]);
            setresult([]);
            setmessage("");
          }, 1000);
        } else {
          setmessage('🔴 Unaccepted — Outputs didn’t match expected results. 🤔');
        }
      }

      if (data.checking_user_code.message.consolelogs?.length > 0) {
        setconsolelogs(data.checking_user_code.message.consolelogs.slice(0, Math.floor(data.checking_user_code.message.consolelogs.length / 2)));
      }

    } catch (err) {
      setOutput("Fetch error: " + err.message);
    } finally {
      setIsRunning(false);
      setRunningAction(null);
    }
  };

  const handleReset = () => {
    if (!challenge_data?.Get_challenge || !editorRef.current) return;
    const initialCode = `function ${challenge_data.Get_challenge.function_name}(){\n  //Write your function inside this\n}\n`;
    setCode(initialCode);
    editorRef.current.setValue(initialCode);
  };

  return (
    <div className="maindiv">
      <Navbar />

      <div className="app-container">
        <div className="problem-section">
          <h2 className='font-bold text-2xl mb-3'>Problem Statement</h2>
          <p className='mb-3'>
            {challenge_loading
              ? "Loading..."
              : challenge_data?.Get_challenge?.problem_statement || "Error loading challenge."}
          </p>
          <p>
            {challenge_loading ? "" : challenge_data?.Get_challenge
              ? `Make sure to wrap your code in ${challenge_data.Get_challenge.function_name} function.`
              : ""}
          </p>
        </div>

        <div className="editor-section">
          <div className="button-bar">
            <div className="lang">JavaScript</div>
            <div className="buttons">
              <button onClick={handleReset}>Reset</button>
              <button onClick={() => runCode("run")} disabled={isRunning}>
                {isRunning && runningAction === "run" ? "Running..." : "Run"}
              </button>
              <button onClick={() => runCode("submit")} disabled={isRunning}>
                {isRunning && runningAction === "submit" ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>

          <div id="container_main" ref={containerRef}>
            <div id="editor-loader">Loading Editor...</div>
          </div>

          <div className="output">
            <h3>Output</h3>
            <pre>{output}</pre>
            <p>{result.success === false && result.message.message}</p>
            <div className="flex gap-4">
              {result?.message?.results?.map((item, index) => (
                <div key={index}>
                  <p className="font-semibold">Case: {item["case"].join(", ")}</p>
                  <p>Expected: {item.expected}</p>
                  <p>Output: {item.output === null ? "undefined (no return value)" : item.output}</p>
                  <p className="mt-2 font-bold">{item.passed ? "✅ Test Passed" : "❌ Test Failed"}</p>
                </div>
              ))}
            </div>
            <div className='mt-4'>
              <p>Console Logs:</p>
              <pre>{consolelogs.join("\n")}</pre>
            </div>
            <div className='mt-4'>
              <p>{message}</p>
            </div>
          </div>
        </div>
      </div>

      {showCard && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}>
          <Popup onClose={() => setShowCard(false)} />
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
