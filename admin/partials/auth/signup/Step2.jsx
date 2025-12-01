import { useState, useRef } from "react";

import FormProvider from "@/components/FormControls/FormProvider";
import SubmitBtn from "@/components/FormControls/SubmitBtn";

import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import { auth_endpoints } from "@/utils/auth_endpoints";

import WizardTitle from "@/partials/auth/signup/WizardTitle";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import useRegisterUserStore from "@/stores/useRegisterUserStore";

// 🧠 Form Schema
const formSchema = z.object({});

export default function Step2({ afetrSubmit }) {
  // STEP 1 DATA - starting
  const { newUserData, setNewUserData } = useRegisterUserStore();
  const email = newUserData?.email;
  // STEP 1 DATA - ending

  // FORM RELATED - starting
  const methods = useForm({
    resolver: zodResolver(formSchema),
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
  // FORM RELATED - ending

  const [code, setCode] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 1); // only one digit
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    // move to next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    //if (newCode.every((char) => char !== "")){ onVerify?.(newCode.join("")); }
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      newCode.forEach((val, i) => {
        if (inputsRef.current[i]) inputsRef.current[i].value = val;
      });
      //onVerify?.(pasted);
    }
    e.preventDefault();
  };

  const onSubmit = async () => {
    try {
      const body = {
        verification_code: Number(code.join("")),
        email: email,
      };

      const response = await POST(auth_endpoints?.auth?.register?.step2, body);

      if (response?.status === 200) {
        setNewUserData((prev) => ({ ...prev, code }));
        toast.success(response?.message);
        afetrSubmit(3);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  return (
    <>
      <WizardTitle step={2} />
      <FormProvider
        methods={methods}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <div className="flex flex-col items-center space-y-4">
          <p className="text-gray-600 text-center">
            Enter the 6-digit code sent to your email
          </p>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                ref={(el) => (inputsRef.current[i] = el)}
                className="w-12 h-12 text-center border border-gray-300 rounded-md text-lg focus:outline-blue-500"
                onChange={(e) => handleChange(e, i)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <button
              type="button"
              onClick={() => afetrSubmit?.(1)}
              className="w-full py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 transition duration-200"
            >
              Back
            </button>
          </div>
          <div></div>
          <div>
            <SubmitBtn
              label="Continue"
              isSubmitting={isSubmitting}
              disabled={false}
            />
          </div>
        </div>
      </FormProvider>
    </>
  );
}
