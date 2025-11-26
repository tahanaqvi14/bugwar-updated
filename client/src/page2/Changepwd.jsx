import React, { useRef, useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';



export const CHANGE_PASSWORD_MUTATION = gql`
  mutation changepwdd($username: String!, $pwd: String!) {
    changepwdd(username: $username, pwd: $pwd) {
      success
      message
    }
  }
`;

const Changepwd = ({ onClose, userData }) => {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRefs = useRef([]);
    const btnRef = useRef(null);
    const [pwdloading, setpwdloading] = useState(false);
    const [update_pwd] = useMutation(CHANGE_PASSWORD_MUTATION);
    const passwordRef = useRef();

    function showLoader() {
        btnRef.current.disabled = true;
        const otpVerifierBtn = document.getElementById('otpverfier');
        if (otpVerifierBtn) {
            otpVerifierBtn.innerHTML = '<div id="loader"></div>';
            otpVerifierBtn.classList.remove('button1');
            otpVerifierBtn.disabled = true;
            otpVerifierBtn.style.pointerEvents = 'none';
            otpVerifierBtn.style.cursor = 'not-allowed';
        }
    }

    function showTickMark() {
        const otpVerifierBtn = document.getElementById('otpverfier');
        if (otpVerifierBtn) {
            otpVerifierBtn.innerHTML = '✓';
            otpVerifierBtn.style.fontSize = '24px';
            otpVerifierBtn.style.color = '#22c55e';
            otpVerifierBtn.disabled = true;
            otpVerifierBtn.style.pointerEvents = 'none';
            otpVerifierBtn.style.cursor = 'not-allowed';
            setIsVerified(true);
        }
    }

    function hideLoader() {
        btnRef.current.disabled = false;
        setIsVerified(false);
        const otpVerifierBtn = document.getElementById('otpverfier');
        if (otpVerifierBtn) {
            otpVerifierBtn.innerHTML = 'Verify';
            otpVerifierBtn.classList.add('button1');
            otpVerifierBtn.disabled = false;
            otpVerifierBtn.style.pointerEvents = 'auto';
            otpVerifierBtn.style.cursor = 'pointer';
            otpVerifierBtn.style.fontSize = '14px';
            otpVerifierBtn.style.color = '#5a3a1a';
        }
    }


    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

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
        const otpValue = otp.join('');

        if (otpValue.length !== 6) {
            return toast.error("Please enter the 6-digit OTP");
        }

        showLoader(); // only show loader if OTP length is 6
        setLoading(true);

        try {
            if (otpValue === userData.message) {
                showTickMark(); // tick mark stays
                toast.success("OTP Verified Successfully");
            } else {
                toast.error("Wrong OTP | Try Again");
                hideLoader(); // reset button only if wrong OTP
            }
        } catch (err) {
            toast.error(err?.message || "Something went wrong");
            hideLoader();
        } finally {
            setLoading(false); // stop the React loading state
        }
    };

    const verifypwd = async (e) => {
        setpwdloading(true);
        passwordRef.current.disabled = true;

        let password = inputValue;
        console.log(password);

        try {
            // Password validation
            if (!password) return toast.error("Password is required");
            if (password.length < 8) return toast.error("Password must be at least 8 characters");
            if (password.length > 20) return toast.error("Password must be at most 20 characters");

            const { data } = await update_pwd({
                variables: {
                    username: userData?.username || '',
                    pwd: password
                }
            });

            console.log(data);

            if (data?.changepwdd?.success) {
                toast.success("Password changed successfully");
                onClose();


                // 🔥 Reload after 1 second so the toast shows before refresh
                setTimeout(() => {
                }, 1200);

            } else {
                toast.error("Failed to change password");
            }

        } catch (error) {
            toast.error(error?.message || "Something went wrong");
        } finally {
            setpwdloading(false);
            passwordRef.current.disabled = false;
        }
    };
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div
                style={{
                    backgroundColor: 'rgba(252, 233, 184, 0.95)',
                    color: '#5a3a1a',
                    borderRadius: '12px',
                    padding: '30px 40px',
                    maxWidth: '450px',

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
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
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
                        <button
                            ref={btnRef}
                            type="button"
                            onClick={handleVerifyOTP}
                            id='otpverfier'
                            disabled={loading}
                            style={{
                                padding: '8px 16px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                backgroundColor: otp.join('').length === 6 ? '#f4b24a' : '#d4a574',
                                color: '#5a3a1a',
                                border: '2px solid #7f4f0a',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                height: '55px',
                                whiteSpace: 'nowrap',

                            }}
                            onMouseEnter={(e) => {
                                if (e.target.disabled || e.target.style.pointerEvents === 'none') {
                                    e.target.style.backgroundColor = e.target.style.backgroundColor;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (e.target.disabled || e.target.style.pointerEvents === 'none') {
                                    e.target.style.backgroundColor = e.target.style.backgroundColor;
                                }
                            }}
                        >
                            {loading ? "..." : "Verify"}
                        </button>
                    </div>

                    {/* ORIGINAL TEXT KEPT */}
                    <p style={{
                        fontSize: '14px',
                        marginBottom: '20px',
                        fontStyle: 'italic'
                    }}>
                        After confirming the OTP, you can set your new password.
                    </p>
                </form>


                <form>
                    <input
                        type="password"
                        value={inputValue}
                        ref={passwordRef}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={!isVerified}
                        placeholder='Enter new password'
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '16px',
                            marginBottom: '10px',
                            border: '2px solid #7f4f0a',
                            borderRadius: '8px',
                            backgroundColor: isVerified ? '#fff' : '#f0f0f0',
                            color: isVerified ? '#5a3a1a' : '#999',
                            cursor: isVerified ? 'text' : 'not-allowed',
                            opacity: isVerified ? 1 : 0.6,
                        }}
                    />
                    <button
                        type="button"
                        onClick={verifypwd}
                        disabled={!isVerified || pwdloading}
                        style={{
                            width: '100%',
                            padding: '12px 24px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            backgroundColor: isVerified ? '#f4b24a' : '#d4a574',
                            borderRadius: '10px',
                            cursor: isVerified && !pwdloading ? 'pointer' : 'not-allowed',
                            opacity: pwdloading ? 0.6 : 1,
                        }}
                    >
                        {pwdloading ? "Changing Password..." : "Change Password"}
                    </button>


                </form>

            </div>
        </div>

    );
};

export default Changepwd;
