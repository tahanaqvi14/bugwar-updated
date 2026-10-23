import React, { useRef, useEffect, useState } from 'react';
import './Login.css'
import { useMutation, gql } from '@apollo/client'
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../socket/SocketContext';
import { TOAST_OPTIONS } from '../../config';

//zain ka module ha yeh

const input_text1 = ['U', 's', 'e', 'r', 'n', 'a', 'm', 'e'];
const input_text2 = ['P', 'a', 's', 's', 'w', 'o', 'r', 'd'];

const LOGIN_USER_MUTATION = gql`
    mutation user_login($input: loginuser!){
        user_login(input:$input){
            success
            message
        }
    }
`

const Login = () => {
  const { socket, connectSocket } = useSocket();
  const navigate = useNavigate();

  const [login_User] = useMutation(LOGIN_USER_MUTATION);
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef();
  const passwordRef = useRef();

  // Already logged in (the game connection only works with a valid session): go to the main menu
  useEffect(() => {
    if (socket?.connected) navigate('/page2');
  }, [socket, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = usernameRef.current.value.trim();
    const password = passwordRef.current.value;
    setLoading(true);

    try {
      const { data } = await login_User({ variables: { input: { username, password } } });
      const result = data.user_login;

      if (!result.success) {
        toast.error(result.message, TOAST_OPTIONS);
        return;
      }

      toast.success(result.message, TOAST_OPTIONS);
      // Open the game connection with the new session (replaces any old connection)
      const connected = await connectSocket({ force: true });
      if (!connected) {
        toast.warn("Logged in, but the game connection could not be opened yet. It will retry when you press Play.", TOAST_OPTIONS);
      }
      navigate('/page2');
    } catch {
      toast.error("Could not reach the server, please try again", TOAST_OPTIONS);
    } finally {
      setLoading(false);
    }
  }

  function goto_signup() {
    navigate('/signup');
  }


  return (

    <div className="flex justify-center items-center h-screen">
      <div className="rounded-3xl bg-[#fce9b8] border-4 border-[#7f4f0a] shadow-[6px_6px_0_0_#7f4f0a] w-full max-w-md p-6 flex flex-col gap-4 text-[#5a3a1a]">
        <div className="flex justify-between">
          <div>
            <div className="text-lg font-semibold">
              Login to your account
            </div>
            <div className="text-base">
              Enter username and password to login
            </div>
          </div>
          <button className="bg-[#F4B24B] font-bold px-4 rounded-md" onClick={goto_signup}>Sign Up</button>
        </div>

        <form aria-label="Login form" className="rounded-3xl w-full max-w-md p-4 relative" onSubmit={handleSubmit}>
          <div className="wave-group">
            <input required type="text" name="username" id="username" className="input" ref={usernameRef} autoComplete="username" />
            <span className="bar"></span>
            <label htmlFor="username" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text1.map((value, index) => (
                <span className="label-char" key={index} style={{ "--index": index }}>{value}</span>
              ))}
            </label>

          </div>
          <div className="wave-group">
            <input required type="password" name="password" id="password" className="input" ref={passwordRef} autoComplete="current-password" />
            <span className="bar"></span>
            <label htmlFor="password" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text2.map((value, index) => (
                <span className="label-char" key={index} style={{ "--index": index }}>{value}</span>
              ))}
            </label>
          </div>
          <button
            className={`${loading ? '' : 'button1 '}font-fredoka text-2xl text-[#6b4a1e] bg-[#f4b24a] rounded-3xl border-4 border-[#a56f0a] w-full py-3 mb-6 select-none`}
            type="submit" disabled={loading} id='submit-button'>
            {loading ? <div id="loader"></div> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
