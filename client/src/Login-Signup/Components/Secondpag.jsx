import React, { useRef, useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from 'react-router-dom';



const CREATE_USER_MUTATION = gql`
    mutation user_creation($input: createuser!){
        user_creation(input:$input){
            success
            message
        }
    }
`

const Secondpag = ({ onClose,userData }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const [create_User] = useMutation(CREATE_USER_MUTATION);
  console.log(userData)

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

    if (otpValue.length !== 6) return;

    try {
      setLoading(true);

      // 👉 SEND ONLY OTP TO BACKEND
      const response = await fetch("https://your-backend-api.com/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpValue }),  // ❗ only OTP sent
      });

      const data = await response.json();

      if (data.success) {
        console.log("OTP Verified Successfully");
        // onClose(); 
      } else {
        alert("Invalid OTP, try again");
      }

    } catch (err) {
      console.error(err);
      alert("Backend error");
    } finally {
      setLoading(false);
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
