import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery, gql } from "@apollo/client";
import { toast } from 'react-toastify';
import './css/codeeditor.css';
import { useSocket } from '../socket/SocketContext';
import { useStore } from '../../store/Store';
import Navbar from './Navbar';
import Popup from './Popup';

const GET_CHALLENGE = gql`
  query Get_challenge($idnum: ID) {
    Get_challenge(idnum: $idnum) {
      function_name
      problem_statement
      input_type
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
          error
        }
      }
    }
  }
`;

// Parameters of the player's function for each challenge input type (see server models/challenge.js)
const PARAMS = {
  numbers: 'a, b',
  array: 'arr',
  array_and_k: 'arr, k',
};

const starterCode = (challenge) =>
  `function ${challenge.function_name}(${PARAMS[challenge.input_type] ?? ''}) {\n  // Write your code here\n}\n`;

// ------------------------------------------------------
// Monaco editor is loaded once from the CDN and shared by every visit to this page.
// (Before, leaving the page while it was still loading could leave "Loading Editor..." forever.)
const MONACO_CDN = "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs";
let monacoPromise = null;

function loadMonaco() {
  if (window.monaco) return Promise.resolve(window.monaco);
  if (!monacoPromise) {
    monacoPromise = new Promise((resolve, reject) => {
      const loaderScript = document.createElement("script");
      loaderScript.src = `${MONACO_CDN}/loader.js`;
      loaderScript.onload = () => {
        window.require.config({ paths: { vs: MONACO_CDN } });
        window.require(["vs/editor/editor.main"], () => {
          defineTheme(window.monaco);
          resolve(window.monaco);
        }, reject);
      };
      loaderScript.onerror = () => {
        monacoPromise = null;
        reject(new Error("Could not load the code editor"));
      };
      document.body.appendChild(loaderScript);
    });
  }
  return monacoPromise;
}

function defineTheme(monaco) {
  monaco.editor.defineTheme("desertLight", {
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
}

const CodeEditor = () => {
  const resetStore = useStore((state) => state.resetStore);
  const setDC = useStore((state) => state.setDC);
  const setIsEnded = useStore((state) => state.setIsEnded);
  const matchinfo = useStore((state) => state.data);

  const { socket } = useSocket();
  const navigate = useNavigate();
  const inMatch = Boolean(socket && matchinfo?.matchId);

  // network-only / no-cache: every request must reach the server (it tracks which challenge you got and solved)
  const [getChallenge, { data: challenge_data, loading: challenge_loading }] = useLazyQuery(GET_CHALLENGE, { fetchPolicy: 'network-only' });
  const [getcode] = useLazyQuery(GET_RESULT_OF_CODE, { fetchPolicy: 'no-cache' });
  const challenge = challenge_data?.Get_challenge;

  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const timersRef = useRef([]);
  const matchOverRef = useRef(false);
  const startedRef = useRef(false);

  const [editorReady, setEditorReady] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [result, setresult] = useState(null);
  const [consolelogs, setconsolelogs] = useState([]);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState(null);
  const [message, setmessage] = useState('');
  const [showCard, setShowCard] = useState(false);

  const later = useCallback((fn, ms) => {
    timersRef.current.push(setTimeout(fn, ms));
  }, []);

  // Clear pending timers when leaving the page; forget a finished match
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      if (matchOverRef.current) resetStore();
    };
  }, [resetStore]);

  // No match in progress (e.g. the page was refreshed or opened directly): back to the main menu
  useEffect(() => {
    if (inMatch) return;
    const timer = setTimeout(() => navigate('/page2'), 2000);
    return () => clearTimeout(timer);
  }, [inMatch, navigate]);

  // First challenge
  useEffect(() => {
    if (!inMatch || startedRef.current) return;
    startedRef.current = true;
    getChallenge({ variables: { idnum: null } });
  }, [inMatch, getChallenge]);

  // Socket events
  useEffect(() => {
    if (!inMatch) return;

    const backToMenu = () => {
      matchOverRef.current = true;
      later(() => {
        resetStore();
        navigate('/page2');
      }, 10000);
    };
    const onOtherPlayerLeft = () => {
      setDC(true);
      setShowCard(true);
      backToMenu();
    };
    const onCompleted = () => {
      setIsEnded(true); // the server ended the match (its clock is the one that counts)
      setShowCard(true);
      backToMenu();
    };
    const onServerError = (data) => toast.error(data?.message || 'Something went wrong');

    socket.on('other_player_left', onOtherPlayerLeft);
    socket.on('completed', onCompleted);
    socket.on('server_error', onServerError);

    return () => {
      socket.off('other_player_left', onOtherPlayerLeft);
      socket.off('completed', onCompleted);
      socket.off('server_error', onServerError);
    };
  }, [inMatch, socket, navigate, resetStore, setDC, setIsEnded, later]);

  // Load Monaco editor
  useEffect(() => {
    if (!inMatch) return;
    let cancelled = false;

    loadMonaco()
      .then((monaco) => {
        if (cancelled || !containerRef.current) return;
        editorRef.current = monaco.editor.create(containerRef.current, {
          value: "// loading...",
          language: "javascript",
          theme: "desertLight",
          fontFamily: "Fira Code, monospace",
          fontSize: 14,
          minimap: { enabled: false },
        });
        setEditorReady(true);
      })
      .catch((error) => {
        if (!cancelled) setEditorError(error.message);
      });

    return () => {
      cancelled = true;
      editorRef.current?.dispose();
      editorRef.current = null;
      setEditorReady(false);
    };
  }, [inMatch]);

  // Update editor when challenge data changes
  useEffect(() => {
    if (!editorReady || !editorRef.current) return;
    if (challenge_loading) {
      editorRef.current.setValue("// loading...");
    } else if (challenge) {
      editorRef.current.setValue(starterCode(challenge));
    }
  }, [editorReady, challenge_loading, challenge]);

  const runCode = async (actionType) => {
    if (!editorRef.current || !challenge) return;
    const code = editorRef.current.getValue();
    setIsRunning(true);
    setRunningAction(actionType);
    setOutput('');
    setmessage('');

    try {
      const { data, error } = await getcode({
        variables: { input: { code, challengeid: challenge._id } },
      });
      if (error) throw error;
      const checked = data.checking_user_code;
      setresult(checked);
      setconsolelogs(checked.message?.consolelogs ?? []);

      if (actionType === 'submit') {
        if (checked.success && checked.message?.passed) {
          setmessage('🟢 Accepted — All test cases passed! 🎉');
          // The server checks that this challenge really was solved before giving points
          socket.emit('next_challenge', { challengeId: challenge._id });

          later(() => {
            getChallenge({ variables: { idnum: challenge._id } });
            setOutput("");
            setconsolelogs([]);
            setresult(null);
            setmessage("");
          }, 1000);
        } else {
          setmessage('🔴 Unaccepted — Outputs didn’t match expected results. 🤔');
        }
      }
    } catch (err) {
      setOutput("Fetch error: " + err.message);
    } finally {
      setIsRunning(false);
      setRunningAction(null);
    }
  };

  const handleReset = () => {
    if (!challenge || !editorRef.current) return;
    editorRef.current.setValue(starterCode(challenge));
  };

  if (!inMatch) {
    return (
      <p className="text-center mt-10 text-lg">
        No match in progress. Taking you back to the main menu...
      </p>
    );
  }

  return (
    <div className="maindiv">
      <Navbar />

      <div className="app-container">
        <div className="problem-section">
          <h2 className='font-bold text-2xl mb-3'>Problem Statement</h2>
          <p className='mb-3'>
            {challenge_loading
              ? "Loading..."
              : challenge?.problem_statement || "Error loading challenge."}
          </p>
          {!challenge_loading && challenge && (
            <>
              <p className='mb-2'>
                Make sure to wrap your code in the <strong>{challenge.function_name}</strong> function.
              </p>
              <p>
                It is called like this: <code>{challenge.function_name}({PARAMS[challenge.input_type]})</code>
                {challenge.input_type === 'array' && ' where arr is an array of integers.'}
                {challenge.input_type === 'array_and_k' && ' where arr is an array of integers and k is the extra number from the problem (k, target or m).'}
                {challenge.input_type === 'numbers' && ' where a and b are integers.'}
              </p>
            </>
          )}
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

          <div id="container_main" style={{ position: 'relative' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            {!editorReady && (
              <div id="editor-loader" style={{ position: 'absolute', inset: 0 }}>
                {editorError || "Loading Editor..."}
              </div>
            )}
          </div>

          <div className="output">
            <h3>Output</h3>
            <pre>{output}</pre>
            <p>{result?.success === false && result.message?.message}</p>
            <div className="flex gap-4">
              {result?.message?.results?.map((item, index) => (
                <div key={index}>
                  <p className="font-semibold">Case: {item.case.join(", ")}</p>
                  <p>Expected: {item.expected}</p>
                  <p>Output: {item.error ? `Error: ${item.error}` : item.output === null ? "undefined (no return value)" : item.output}</p>
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
          <Popup />
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
