import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import SubmitBtn from "@/components/FormControls/SubmitBtn";

import { AiOutlineUser } from "react-icons/ai";
import { HiOutlineEnvelope } from "react-icons/hi2";

import WizardTitle from "@/partials/auth/signup/WizardTitle";

import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import { auth_endpoints } from "@/utils/auth_endpoints";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import { INDUSTRIES, COMPANY_SIZES } from "@/constants/general_constants.js";

import useRegisterUserStore from "@/stores/useRegisterUserStore";

// 🧠 Form Schema
const formSchema = z.object({
  company_name: z.string().min(1, { message: "Required" }),
  industry: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
  company_size: z.object({
    label: z.string().min(1, { message: "Required" }),
    value: z.string().min(1, { message: "Required" }),
  }),
});

export default function Step3({ afetrSubmit }) {
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

  const onSubmit = async (formData) => {
    try {
      const body = {
        ...formData,
        industry: formData?.industry?.value,
        company_size: formData?.company_size?.value,
        email: email,
      };

      const response = await POST(auth_endpoints.auth.register.step3, body);

      if (response?.status === 200) {
        setNewUserData((prev) => ({ ...prev, formData }));
        toast.success(response.message);
        afetrSubmit(4);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  return (
    <>
      <WizardTitle step={3} />
      <FormProvider
        methods={methods}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <InputControl
          title="Company Name"
          name="company_name"
          type="text"
          placeholder="Company Name"
          icon={AiOutlineUser}
          info="Enter your business name as it appears on official documents"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectControl
            name="industry"
            title="Industry"
            placeholder="Select industry"
            options={INDUSTRIES}
            icon={AiOutlineUser}
            info="Select the industry your company operates in"
          />
          <SelectControl
            name="company_size"
            title="Company Size"
            placeholder="Select company size"
            options={COMPANY_SIZES}
            icon={HiOutlineEnvelope}
            info="How many employees work at your company?"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <button
              type="button"
              onClick={() => afetrSubmit?.(2)}
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
