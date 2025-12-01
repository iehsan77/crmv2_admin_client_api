"use client";

import { useState } from "react";

import Step1 from "@/partials/auth/signup/Step1";
import Step2 from "@/partials/auth/signup/Step2";
import Step3 from "@/partials/auth/signup/Step3";
import Step4 from "@/partials/auth/signup/Step4";
import Step5 from "@/partials/auth/signup/Step5";

const SignupForm = () => {
  const [step, setStep] = useState(1);
  return (
    <>
      {step && step === 1 && <Step1 afetrSubmit={setStep} />}
      {step && step === 2 && <Step2 afetrSubmit={setStep} />}
      {step && step === 3 && <Step3 afetrSubmit={setStep} />}
      {step && step === 4 && <Step4 afetrSubmit={setStep} />}
      {step && step === 5 && <Step5 afetrSubmit={setStep} />}
    </>
  );
};

export default SignupForm;
