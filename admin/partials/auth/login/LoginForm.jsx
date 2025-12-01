"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import PasswordControl from "@/components/FormControls/PasswordControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";

import { LOGIN } from "@/helper/ServerSideActions";
import { ADMIN_PATHS } from "@/constants/paths";
import useUserStore from "@/stores/useUserStore";
import { handleResponse } from "@/helper/ClientSideActions";

import { HiOutlineEnvelope } from "react-icons/hi2";

import { auth_endpoints } from "@/utils/auth_endpoints";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(2, { message: "Please enter your password" }),
});

const LoginForm = () => {
  const router = useRouter();
  const { setUser } = useUserStore();

  const methods = useForm({
    resolver: zodResolver(formSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (formData) => {

    try {
      const response = await LOGIN(formData);

      //console.log("login response"); console.log(response); return false;

      if (response?.status === 200) {
        toast.success(response?.message);

        await setUser(response?.data); // optional: remove `await` if it's not async

        setTimeout(() => {
          router.replace(ADMIN_PATHS.DASHBOARD);
        }, 100);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  return (
    <FormProvider
      methods={methods}
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-4"
    >
      <InputControl
        title="Email"
        name="email"
        type="email"
        placeholder="youremail@gmail.com"
        error={errors.email?.message}
        icon={HiOutlineEnvelope}
      />
      <PasswordControl
        title="Password"
        name="password"
        error={errors.password?.message}
      />
      <SubmitBtn label="Login" isSubmitting={isSubmitting} />
    </FormProvider>
  );
};

export default LoginForm;
