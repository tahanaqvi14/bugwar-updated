import React, { useRef,useContext, useEffect, useState } from 'react';
import './Login.css'
import { useMutation, gql } from '@apollo/client'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../App';

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

const Login = ({ connectSocket }) => {
  const socket = useContext(SocketContext);
  console.log(socket);
  const navigate = useNavigate();  

  const btnRef = useRef();
  const [login_User] = useMutation(LOGIN_USER_MUTATION);
  const usernameRef = useRef();
  const passwordRef = useRef();



  function showLoader() {
    btnRef.current.disabled = true;
    document.getElementById('submit-button').innerHTML = '<div id="loader"></div>';
    document.getElementById('submit-button').classList.remove('button1');
    
  }

  function hideLoader() {
    btnRef.current.disabled = false;
    document.getElementById('submit-button').innerHTML = 'Login';
    document.getElementById('submit-button').classList.add('button1');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const username = usernameRef.current.value;
    const password = passwordRef.current.value;
    showLoader();
    const a=await login_User({ variables: { input: { username: username, password: password } } });
    if (a.data.user_login.success==false) {
      toast.error(a.data.user_login.message, {
        position: "top-center", 
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      })
    }else{
      toast.success(a.data.user_login.message, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      await connectSocket();
      setTimeout(() => {
        navigate('/page2');
      }, 1000);
    }
    hideLoader();
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

        <form aria-label="Sign up form" className="rounded-3xl w-full max-w-md p-4 relative" onSubmit={handleSubmit}>
          <div className="wave-group">
            <input required type="text" name="username" id="username" className="input" ref={usernameRef}/>
            <span className="bar"></span>
            <label htmlFor="username" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text1.map((value, index) => (
                <span className="label-char" key={index} style={{ "--index": index }}>{value}</span>
              ))}
            </label>

          </div>
          <div className="wave-group">
            <input required type="password" name="password" id="password" className="input" ref={passwordRef}/>
            <span className="bar"></span>
            <label htmlFor="password" className="label text-[#6b4a1e] font-semibold text-xl mb-2 select-none">
              {input_text2.map((value, index) => (
                <span className="label-char" key={index} style={{ "--index": index }}>{value}</span>
              ))}
            </label>
          </div>
          <button
            className="button1 font-fredoka text-2xl text-[#6b4a1e] bg-[#f4b24a] rounded-3xl border-4 border-[#a56f0a] w-full py-3 mb-6 select-none"
            type="submit" ref={btnRef} id='submit-button'>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
