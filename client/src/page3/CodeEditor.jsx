import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/codeeditor.css';
import { SocketContext } from '../App';
import { useQuery, gql, useLazyQuery } from "@apollo/client";
import { useStore } from '../../store/Store';
import Navbar from './Navbar';
import Popup from './Popup'



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

const CodeEditor = () => {
  const setDC = useStore((state) => state.setDC);
  const clientusername = useStore((state) => state.clientusername);

  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [getChallenge, { data: challenge_data, loading: challenge_loading, error: challenge_error }] =
    useLazyQuery(GET_CHALLENGE, {
      onCompleted: (data) => {
        console.log(data)
        console.log(clientusername);
        console.log("✅ getChallenge() called. Data received:", data);
      },
      onError: (err) => {
        console.error("❌ Error fetching challenge:", err);
      },
    });






  // const { data: match_data, loading: match_loading, error: match_error } = useQuery(Get_match);
  // console.log(match_data)
  const [getcode] = useLazyQuery(GET_RESULT_OF_CODE);

  const [result, setresult] = useState([]);
  const [consolelogs, setconsolelogs] = useState([]);
  // const [player, setplayerinfo] = useState([])

  // Refs only for Monaco editor container
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const outputRef = useRef(null); // 👈 new ref for the output box

  // State for UI
  const [code, setCode] = useState("//write code here");
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState(null);

  const [message, setmessage] = useState('');
  // Load Monaco editor once
  const matchinfo = useStore((state) => state.data);

  // useEffect(() => {
  //   if (isEnded) {
  //     socket.emit('game_over',matchinfo)
  //     setShowCard(true);
  //   }
  // }, [isEnded]); 
  const [showCard, setShowCard] = useState(false);



  useEffect(() => {
    getChallenge({ variables: { idnum : "-1", username: clientusername } });
    if (socket) {
      console.log(`Socket connected in codeeditor component:${socket.id}`);
    }

    socket.on('other_player_left', () => {
      setDC(true);
      setShowCard(true);
      setTimeout(() => {
        navigate('/page2')
      }, 10000);
    })

    socket.on('completed', () => {
      setShowCard(true);
      setTimeout(() => {
        navigate('/page2')
      }, 10000);

    })

    // setplayerinfo(matchinfo.participants)

    let loaderScript;

    if (!window.monaco) {
      loaderScript = document.createElement("script");
      loaderScript.src =
        "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/loader.js";

      loaderScript.onload = () => {
        window.require.config({
          paths: {
            vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs",
          },
        });

        window.require(["vs/editor/editor.main"], () => {
          // 🏜️ Define your custom desert-light theme
          window.monaco.editor.defineTheme("desertLight", {
            base: "vs", // start from light theme
            inherit: true,
            rules: [
              { token: "", foreground: "4B2E05", background: "FCE9B8" }, // default text
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

          // ✨ Create the editor using that theme
          editorRef.current = window.monaco.editor.create(containerRef.current, {
            value: code,
            language: "javascript",
            theme: "desertLight", // <-- use your new theme here
            fontFamily: "Fira Code, monospace",
            fontSize: 14,
            minimap: { enabled: false },
          });

          // 🧹 Remove the loader after init
          const loader = document.getElementById("editor-loader");
          if (loader) loader.remove();
        })
      }
      document.body.appendChild(loaderScript);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
      if (loaderScript) {
        document.body.removeChild(loaderScript);
      }
    };
  }, []);

  // Put challenge starter function inside editor
  useEffect(() => {
    if (challenge_loading && editorRef.current) {
      editorRef.current.setValue("loading...");
    }
    else if (challenge_data?.Get_challenge && editorRef.current) {
      editorRef.current.setValue(
        `function ${challenge_data.Get_challenge.function_name}(){ 
    //Write your function inside this
  }\n`
      );
    }
  }, [challenge_loading, challenge_data]);



  const runCode = async (actionType) => {
    const code = editorRef.current.getValue();
    setIsRunning(true);
    setRunningAction(actionType);
    console.log(challenge_data.Get_challenge._id)
    try {
      const { data } = await getcode({
        variables: { input: { code, challengeid: challenge_data.Get_challenge._id } },
      });
      console.log(data.checking_user_code);
      // if(data.checking_user_code.message.results.)
      setresult(data.checking_user_code)

      if (actionType === 'submit') {
        if (data.checking_user_code.message.passed == true) {
          setmessage('🟢 Accepted — All test cases passed! 🎉')
          socket.emit('next_challenge', socket.id, matchinfo)

          // await getChallenge();

          // let funcName = challengeData.Get_challenge.function_name;
          // let initialCode = `function ${funcName}() {\n  // Write your code here\n}`;
          // setCode(initialCode);
          // editorRef.current.setValue(initialCode);

          setTimeout(() => {
            getChallenge({ variables: { idnum: challenge_data.Get_challenge._id , username: clientusername} });
            setOutput("");
            setconsolelogs([]);
            setresult([]);
            setmessage("");


          }, 1000);


        }
        else {
          setmessage('🔴 Unaccepted — Outputs didn’t match expected results. 🤔')
        }
      }

      if (data.checking_user_code.message.consolelogs && data.checking_user_code.message.consolelogs.length > 0) {
        let a = data.checking_user_code.message.consolelogs;
        let a1 = a.slice(0, Math.floor(a.length / 2));
        console.log('results', a1);
        setconsolelogs(a1);
      }

      // const msg = data.checking_user_code.message;
      // console.log(msg)

      // if (msg.consolelogs != null) {
      //   setOutput(msg.consolelogs.join("\n"));

      // } else if (msg.message) {
      //   setOutput(msg.message);
      // }

      // setInputVal(msg.input ? `Input: ${msg.input}` : '');
      // setExpectedVal(msg.expected ? `Expected output: ${msg.expected}` : '');
      // setPassedVal(
      //   msg.passed != null
      //     ? msg.passed
      //       ? "✅ Test cases Passed\n\n"
      //       : "❌ Test cases Failed\n\n"
      //     : ''
      // );

    } catch (err) {
      setOutput("Fetch error: " + err.message);
    } finally {
      setIsRunning(false);
      setRunningAction(null);
    }
  };

  const handleReset = () => {
    const initialCode = `function ${challenge_data.Get_challenge.function_name}(){
    //Write your function inside this
}\n`;
    setCode(initialCode);
    if (editorRef.current) editorRef.current.setValue(initialCode);
  };











  return (
    <div className="maindiv">
      {/* Countdown and Player Section */}
      <Navbar />


      {/* <div style={{ fontSize: "40px", margin: "20px 0" }}>
        {isEnded ? "00:00" : format(timeLeft)}
      </div> */}


      {/* Main Editor + Problem Section */}
      <div className="app-container">
        {/* Left side */}
        <div className="problem-section">
          <h2>Problem Statement</h2>
          <p>
            {challenge_loading
              ? "Loading..."
              : challenge_data?.Get_challenge
                ? challenge_data.Get_challenge.problem_statement
                : "Error loading challenge."
            }
          </p>

          <p>
            {challenge_loading
              ? ""
              : challenge_data?.Get_challenge
                ? "Make sure to wrap your code in " +
                challenge_data.Get_challenge.function_name +
                " function"
                : ""}
          </p>
        </div>

        {/* Right side */}
        <div className="editor-section">
          <div className="button-bar">
            <div className="lang">JavaScript</div>
            <div className="buttons">
              <button onClick={handleReset}>Reset</button>
              <button
                onClick={() => runCode("run")}
                disabled={isRunning}
              >
                {isRunning && runningAction === "run"
                  ? "Running..."
                  : "Run"}
              </button>
              <button
                onClick={() => runCode("submit")}
                disabled={isRunning}
              >
                {isRunning && runningAction === "submit"
                  ? "Submitting..."
                  : "Submit"}
              </button>
            </div>
          </div>

          {/* Monaco container */}
          <div id="container_main" ref={containerRef}>
            <div id="editor-loader">Loading Editor...</div>
          </div>

          {/* Output section */}
          <div className="output" ref={outputRef}>
            <h3>Output</h3>
            <pre>{output}</pre>
            <p>{result.success === false && result.message.message}</p>

            {/* Show test results */}
            <div className="flex gap-4">
              {result?.message?.results?.map((item, index) => (
                <div key={index}>
                  <p className="font-semibold">
                    Case: {item["case"].join(", ")}
                  </p>
                  <p>Expected: {item.expected}</p>
                  <p>Output: {item.output === null ? "undefined (no return value)" : item.output}
                  </p>
                  <p className="mt-2 font-bold">
                    {item.passed ? "✅ Test Passed" : "❌ Test Failed"}
                  </p>
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