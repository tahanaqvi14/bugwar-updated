import React, { useRef, useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';
// import { useStore } from '../../../store/Store';


const CREATE_USER_MUTATION = gql`
    mutation user_creation($input: createuser!){
        user_creation(input:$input){
            success
            message
        }
    }
`

const Secondpag = ({ onClose, userData }) => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);
    const btnRef = useRef(null);
    const [create_User] = useMutation(CREATE_USER_MUTATION);

    // function showLoader() {
    //     btnRef.current.disabled = true;
    //     document.getElementById('submit-button').innerHTML = '<div id="loader"></div>';
    //     document.getElementById('submit-button').classList.remove('button1');
    // }

    // function hideLoader() {
    //     btnRef.current.disabled = false;
    //     document.getElementById('submit-button').innerHTML = 'Create Account';
    //     document.getElementById('submit-button').classList.add('button1');
    // }


    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return toast.error("Only digits (0-9) are allowed");

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);

        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
            setOtp(newOtp.slice(0, 6));

            const nextIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        // showLoader();
        const otpValue = otp.join('');


        try {
            if (otpValue.length !== 6) return toast.error('Wrong Otp');
            setLoading(true);
            console.log(userData)
            if (otpValue === userData.message) {
                const { data } = await create_User({
                    variables: {
                        input: {
                            displayname: userData.displayname,
                            username: userData.username,
                            password: userData.password,
                            email: userData.email,
                        }
                    }
                });



                if (data?.user_creation?.success === false) {
                    toast.error(data.user_creation.message);
                } else {
                    toast.success("Account Created");
                    setTimeout(() => {
                        navigate("/");

                        setTimeout(() => {
                            window.location.reload();
                        }, 50);
                    }, 1000);

                }
            } else {
                toast.error("Wrong OTP");
            }
        } catch (err) {
            toast.error(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
            // hideLoader();
        }
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div
                style={{
                    backgroundColor: 'rgba(252, 233, 184, 0.95)',
                    color: '#5a3a1a',
                    borderRadius: '12px',
                    padding: '30px 40px',
                    maxWidth: '450px',
                    width: '90%',
                    textAlign: 'center',
                    border: '3px solid #7f4f0a',
                    position: "relative"
                }}
            >
                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>

                {/* ORIGINAL TEXT KEPT */}
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                    Verify Your Email
                </h2>

                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                    OTP is sent to your email
                </p>

                <form onSubmit={handleVerifyOTP}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                style={{
                                    width: '45px',
                                    height: '55px',
                                    fontSize: '24px',
                                    textAlign: 'center',
                                    border: '2px solid #7f4f0a',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                }}
                            />
                        ))}
                    </div>

                    {/* ORIGINAL TEXT KEPT */}
                    <p style={{
                        fontSize: '14px',
                        marginBottom: '20px',
                        fontStyle: 'italic'
                    }}>
                        When you confirm the OTP, your account will be created
                    </p>

                    <button
                        ref={btnRef}
                        type="submit"
                        disabled={otp.join('').length !== 6 || loading}
                        style={{
                            width: '100%',
                            padding: '12px 24px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            backgroundColor: otp.join('').length === 6 ? '#f4b24a' : '#d4a574',
                            borderRadius: '10px',
                            cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>

            </div>
        </div>

    );
};

export default Secondpag;
