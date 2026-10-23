import React, { useRef, useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { toast } from "react-toastify";

const VERIFY_OTP_MUTATION = gql`
  mutation VerifyResetOtp($otp: String!) {
    verify_reset_otp(otp: $otp) {
      success
      message
    }
  }
`;

const CHANGE_PASSWORD_MUTATION = gql`
  mutation changepwdd($otp: String!, $pwd: String!) {
    changepwdd(otp: $otp, pwd: $pwd) {
      success
      message
    }
  }
`;

// Password reset for the logged-in user. The OTP was emailed by the Profile page (send_reset_otp);
// the server checks it here, and again when the new password is saved.
const Changepwd = ({ onClose }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [pwdloading, setpwdloading] = useState(false);
    const inputRefs = useRef([]);
    const [verifyOtp] = useMutation(VERIFY_OTP_MUTATION);
    const [update_pwd] = useMutation(CHANGE_PASSWORD_MUTATION);

    const handleOtpChange = (index, value) => {
        if (isVerified) return;
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
        if (isVerified) return;
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

        setLoading(true);
        try {
            const { data } = await verifyOtp({ variables: { otp: otpValue } });
            if (data.verify_reset_otp.success) {
                setIsVerified(true);
                toast.success("OTP Verified Successfully");
            } else {
                toast.error(`${data.verify_reset_otp.message} | Try Again`);
            }
        } catch (err) {
            toast.error(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const verifypwd = async () => {
        const password = inputValue;

        // Password validation (the server checks the same rules)
        if (!password) return toast.error("Password is required");
        if (password.length < 8) return toast.error("Password must be at least 8 characters");
        if (password.length > 20) return toast.error("Password must be at most 20 characters");

        setpwdloading(true);
        try {
            const { data } = await update_pwd({
                variables: {
                    otp: otp.join(''),
                    pwd: password
                }
            });

            if (data?.changepwdd?.success) {
                toast.success("Password changed successfully");
                onClose();
            } else {
                toast.error(data?.changepwdd?.message || "Failed to change password");
            }
        } catch (error) {
            toast.error(error?.message || "Something went wrong");
        } finally {
            setpwdloading(false);
        }
    };

    const otpComplete = otp.join('').length === 6;

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
                                disabled={isVerified}
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
                            type="submit"
                            id='otpverfier'
                            disabled={loading || isVerified}
                            style={{
                                padding: '8px 16px',
                                fontSize: isVerified ? '24px' : '14px',
                                fontWeight: 'bold',
                                backgroundColor: otpComplete ? '#f4b24a' : '#d4a574',
                                color: isVerified ? '#22c55e' : '#5a3a1a',
                                border: '2px solid #7f4f0a',
                                borderRadius: '8px',
                                cursor: loading || isVerified ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                height: '55px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {isVerified ? '✓' : loading ? "..." : "Verify"}
                        </button>
                    </div>

                    <p style={{
                        fontSize: '14px',
                        marginBottom: '20px',
                        fontStyle: 'italic'
                    }}>
                        After confirming the OTP, you can set your new password.
                    </p>
                </form>


                <form onSubmit={(e) => { e.preventDefault(); verifypwd(); }}>
                    <input
                        type="password"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={!isVerified || pwdloading}
                        placeholder='Enter new password'
                        autoComplete="new-password"
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
                        type="submit"
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
