import React, { useRef, useState } from 'react';
import './Signup.css';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
import Secondpag from "./Secondpag";
import { useMutation, gql } from '@apollo/client'

const SEND_EMAIL_MUTATION = gql`
  mutation SendEmail($email: String!, $username: String!) {
    send_email(email: $email, username: $username) {
      success
      message
    }
  }
`;


const input_text1 = ['D', 'i', 's', 'p', 'l', 'a', 'y', '\u00A0', 'N', 'a', 'm', 'e'];
const input_text2 = ['U', 's', 'e', 'r', 'n', 'a', 'm', 'e'];
const input_text3 = ['E', 'm', 'a', 'i', 'l'];
const input_text4 = ['P', 'a', 's', 's', 'w', 'o', 'r', 'd'];

const Singup = () => {
  const btnRef = useRef();
  const navigate = useNavigate();
  const [showOTPPage, setShowOTPPage] = useState(false)
  const [userData, setUserData] = useState({});
  const [sendEmail, { loading }] = useMutation(SEND_EMAIL_MUTATION);

  const displayRef = useRef();
  const usernameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();

  let displayname, username, password, email;

  function showLoader() {
    btnRef.current.disabled = true;
    document.getElementById('submit-button').innerHTML = '<div id="loader"></div>';
    document.getElementById('submit-button').classList.remove('button1');

  }
  function hideLoader() {
    btnRef.current.disabled = false;
    document.getElementById('submit-button').innerHTML = 'Create Account';
    document.getElementById('submit-button').classList.add('button1');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoader();


    try {
      displayname = displayRef.current.value.trim();
      username = usernameRef.current.value.trim();
      email = emailRef.current.value.trim();
      password = passwordRef.current.value;
      // Display name validation
      if (!displayname) return toast.error("Display name is required");
      if (displayname.length < 3) return toast.error("Display name must be at least 3 characters");
      if (displayname.length > 10) return toast.error("Display name must be at most 10 characters");

      // Username validation
      if (!username) return toast.error("Username is required");
      if (username.length < 4) return toast.error("Username must be at least 4 characters");
      if (username.length > 12) return toast.error("Username must be at most 12 characters");

      // Email validation
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!email) return toast.error("Email is required");
      if (!gmailRegex.test(email)) return toast.error("Email must be a valid Gmail address");

      // Password validation
      if (!password) return toast.error("Password is required");
      if (password.length < 8) return toast.error("Password must be at least 8 characters");
      if (password.length > 20) return toast.error("Password must be at most 20 characters");


      const { data } = await sendEmail({ variables: { email, username } })
      // console.log(data);
      if (!data.send_email.success) {
        return toast.error(data.send_email.message);
      }
      setUserData({ displayname, username, email, password, message: data.send_email.message });
      setShowOTPPage(true);
    } catch (error) {
      return toast.error(`${error}`);
    }finally{
      hideLoader();
    }
  }

  function goto_login() {
    navigate('/');
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
      <div
        className="rounded-3xl bg-[#fce9b8] border-4 border-[#7f4f0a] shadow-[6px_6px_0_0_#7f4f0a] w-full max-w-md p-6 flex flex-col gap-4 text-[#5a3a1a]">
        <div className="flex justify-between">
          <div>
            <div className="text-lg font-semibold">Create your account</div>
            <div className="text-base">Enter your details below to get started</div>
          </div>
          <button onClick={goto_login} className="bg-[#F4B24B] font-bold px-2 button1 rounded-md py-2">Login</button>
        </div>

        <form aria-label="Sign up form" className="rounded-3xl w-full max-w-md p-4 relative" onSubmit={handleSubmit}>
          {/* Display Name */}
          <div className="wave-group">
            <input required type="text" name="name" id="name" className="input" ref={displayRef} />
            <span className="bar"></span>
            <label htmlFor="name" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text1.map((value, index) => (
                <span key={index} className="label-char" style={{ "--index": index }}>{value}</span>
              ))}
            </label>
          </div>

          {/* Username */}
          <div className="wave-group">
            <input required type="text" name="username" id="username" className="input" ref={usernameRef} />
            <span className="bar"></span>
            <label htmlFor="username" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text2.map((value, index) => (
                <span key={index} className="label-char" style={{ "--index": index }}>{value}</span>
              ))}
            </label>
          </div>

          {/* Email */}
          <div className="wave-group">
            <input required type="text" name="email" id="email" className="input" ref={emailRef} />
            <span className="bar"></span>
            <label htmlFor="email" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text3.map((value, index) => (
                <span key={index} className="label-char" style={{ "--index": index }}>{value}</span>
              ))}
            </label>
          </div>

          {/* Password */}
          <div className="wave-group">
            <input required type="password" name="password" id="password" className="input" ref={passwordRef} />
            <span className="bar"></span>
            <label htmlFor="password" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text4.map((value, index) => (
                <span key={index} className="label-char" style={{ "--index": index }}>{value}</span>
              ))}
            </label>
          </div>

          <button
            ref={btnRef}
            className="button1 font-fredoka text-2xl text-[#6b4a1e] bg-[#f4b24a] rounded-xl w-full py-3 mb-6 select-none"
            type="submit" id='submit-button' >
            Create Account
          </button>
        </form>
      </div>


      {/* OTP Page */}
      {showOTPPage && (
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
          <Secondpag
            userData={userData}
            onClose={() => setShowOTPPage(false)} />
        </div>
      )}
    </div>
  )
}

export default Singup;
