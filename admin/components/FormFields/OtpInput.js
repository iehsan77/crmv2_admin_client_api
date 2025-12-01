"use client";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

export default function OtpInput({
  length = 6,
  onChange,
  error,
  helperText,
  label = "Verification Code",
  ...props
}) {
  const { setValue } = useFormContext();
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    setValue(props?.name, newOtp.join(""));

    // Move to next input if current input has a value
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // // Trigger onChange with complete OTP string
    // if (onChange) {
    //   onChange(newOtp.join(""));
    // }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").slice(0, length);
    const pasteArray = pasteData.split("");

    if (pasteArray.length > 0) {
      const newOtp = [...otp];
      pasteArray.forEach((char, i) => {
        if (i < length) {
          newOtp[i] = char;
        }
      });
      setOtp(newOtp);

      // Focus the last input with pasted value
      const lastPastedIndex = Math.min(pasteArray.length - 1, length - 1);
      inputRefs.current[lastPastedIndex].focus();

      if (onChange) {
        onChange(newOtp.join(""));
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-dark mb-2">
        {label}
      </label>

      <div className="flex space-x-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            maxLength={1}
            value={otp[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-12 h-12 text-center text-xl border rounded focus:outline-none focus:ring-2 focus:ring-primary ${
              error ? "border-red-500" : "border-gray-300"
            }`}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        ))}
      </div>

      {helperText && !error && (
        <div className="text-xs text-gray-500 mt-1">{helperText}</div>
      )}

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}
