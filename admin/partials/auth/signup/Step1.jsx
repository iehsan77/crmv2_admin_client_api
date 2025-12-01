"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { AiOutlineUser } from "react-icons/ai";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { ShieldCheckIcon } from "lucide-react";

import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import { auth_endpoints } from "@/utils/auth_endpoints";

import { crm_endpoints } from "@/utils/crm_endpoints";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import PasswordControl from "@/components/FormControls/PasswordControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import WizardTitle from "@/partials/auth/signup/WizardTitle";
import { Progress } from "@/components/ui/progress";

import useRegisterUserStore from "@/stores/useRegisterUserStore";

const formSchema = z
  .object({
    first_name: z.string().min(1, { message: "Required" }),
    last_name: z.string().min(1, { message: "Required" }),
    email: z.string().email({ message: "Invalid email" }),
    password: z.string().min(8, { message: "Minimum 8 characters" }),
    password2: z.string(),
    agree: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms" }),
    }),
  })
  .refine((data) => data.password === data.password2, {
    path: ["password2"],
    message: "Passwords do not match",
  });

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return score;
};

export default function Step1({ afetrSubmit }) {







  const { setNewUserData } = useRegisterUserStore();

  const methods = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  });

  const {
    handleSubmit,
    control,
    register,
    watch,
    formState: { isSubmitting, isValid },
  } = methods;

  const password = watch("password") || "";
  const agreed = useWatch({ control, name: "agree", defaultValue: false });
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (formData) => {
    try {


      const response = await POST(auth_endpoints.auth.register.step1, formData);

      if (response?.status === 200) {
        setNewUserData(formData);
        toast.success(response.message);
        afetrSubmit(2);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  return (
    <>
      <WizardTitle step={1} />
      <FormProvider
        methods={methods}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputControl
            title="First Name"
            name="first_name"
            type="text"
            placeholder="First Name"
            icon={AiOutlineUser}
          />
          <InputControl
            title="Last Name"
            name="last_name"
            type="text"
            placeholder="Last Name"
            icon={AiOutlineUser}
          />
        </div>

        <InputControl
          title="Email"
          name="email"
          type="email"
          placeholder="youremail@gmail.com"
          icon={HiOutlineEnvelope}
          autoComplete="off"
        />

        <PasswordControl title="Password" name="password" autoComplete="off" />
        <PasswordControl
          title="Confirm Password"
          name="password2"
          autoComplete="off"
        />

        {password && (
          <div className="mt-2 space-y-2">
            <div className="space-y-1">
              <Progress value={passwordStrength} className="h-1" />
              <div className="flex justify-between text-xs">
                {["Weak", "Medium", "Strong"].map((label, idx) => (
                  <span
                    key={label}
                    className={
                      passwordStrength >= (idx + 1) * 33
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <StrengthItem label="Uppercase" check={/[A-Z]/.test(password)} />
              <StrengthItem label="Lowercase" check={/[a-z]/.test(password)} />
              <StrengthItem label="Number" check={/\d/.test(password)} />
              <StrengthItem
                label="Special"
                check={/[^A-Za-z0-9]/.test(password)}
              />
              <StrengthItem
                label="8+ characters"
                check={password.length >= 8}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            id="agree"
            {...register("agree")}
            className="border-gray-300 rounded"
          />
          <label htmlFor="agree" className="text-muted-foreground">
            I agree to the{" "}
            <a href="/terms" className="text-primary underline">
              Terms of Service
            </a>{" "}
            &{" "}
            <a href="/privacy" className="text-primary underline">
              Privacy Policy
            </a>
          </label>
        </div>

        <SubmitBtn
          label="Continue"
          isSubmitting={isSubmitting}
          disabled={!agreed || !isValid}
        />
      </FormProvider>
    </>
  );
}

function StrengthItem({ label, check }) {
  return (
    <div className="flex items-center gap-1">
      <ShieldCheckIcon
        className={`h-3 w-3 ${check ? "text-green-600" : "text-red-500"}`}
      />
      <span className={check ? "text-green-600" : "text-red-500"}>{label}</span>
    </div>
  );
}
