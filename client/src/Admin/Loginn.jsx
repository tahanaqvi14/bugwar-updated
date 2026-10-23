import React, { useRef, useEffect, useState } from 'react';
import { useQuery, gql, useMutation } from "@apollo/client";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import { TOAST_OPTIONS } from '../config';


const input_text1 = ['U', 's', 'e', 'r', 'n', 'a', 'm', 'e'];
const input_text2 = ['P', 'a', 's', 's', 'w', 'o', 'r', 'd'];

const LOGIN_ADMIN_MUTATION = gql`
    mutation admin_login($input: loginuser!){
        admin_login(input:$input){
            success
            message
        }
    }
`

const CHECK = gql`
  query Check {
    check
  }
`;

const Loginn = () => {

    const navigate = useNavigate();

    const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [login_User] = useMutation(LOGIN_ADMIN_MUTATION);
    const usernameRef = useRef();
    const passwordRef = useRef();

    const { data, loading } = useQuery(CHECK, {
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        if (!loading && data?.check === true) {
            setAlreadyLoggedIn(true);
            const timer = setTimeout(() => navigate("/admin/adminpage"), 1000);
            return () => clearTimeout(timer);
        }
    }, [data, loading, navigate]);

    if (alreadyLoggedIn)
        return (
            <div className="min-h-screen flex justify-center items-center text-2xl text-red-500 font-bold">
                You are already logged in!
            </div>
        );

    const handleSubmit = async (e) => {
        e.preventDefault();

        const username = usernameRef.current.value;
        const password = passwordRef.current.value;
        setSubmitting(true);
        try {
            const { data } = await login_User({ variables: { input: { username, password } } });
            if (!data.admin_login.success) {
                toast.error(data.admin_login.message, TOAST_OPTIONS);
            } else {
                toast.success(data.admin_login.message, TOAST_OPTIONS);
                navigate('/admin/adminpage');
            }
        } catch {
            toast.error("Could not reach the server, please try again", TOAST_OPTIONS);
        } finally {
            setSubmitting(false);
        }
    }

    return (

        <div className="flex justify-center items-center h-screen">
            <div className="rounded-3xl bg-[#fce9b8] border-4 border-[#7f4f0a] shadow-[6px_6px_0_0_#7f4f0a] w-full max-w-md p-6 flex flex-col gap-4 text-[#5a3a1a]">
                <div className="flex justify-between">
                    <div>
                        <div className="text-lg font-semibold">
                            Login to Admin account
                        </div>
                        <div className="text-base">
                            Enter username and password to login
                        </div>
                    </div>
                </div>

                <form aria-label="Admin login form" className="rounded-3xl w-full max-w-md p-4 relative" onSubmit={handleSubmit}>
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
                        className={`${submitting ? '' : 'button1 '}font-fredoka text-2xl text-[#6b4a1e] bg-[#f4b24a] rounded-3xl border-4 border-[#a56f0a] w-full py-3 mb-6 select-none`}
                        type="submit" disabled={submitting} id='submit-button'>
                        {submitting ? <div id="loader"></div> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    )

}

export default Loginn
