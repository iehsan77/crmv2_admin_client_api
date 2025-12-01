import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import CheckboxOrRadio from "@/components/FormControls/CheckboxOrRadio";
import SubmitBtn from "@/components/FormControls/SubmitBtn";
import WizardTitle from "@/partials/auth/signup/WizardTitle";

import { BsInfoCircle } from "react-icons/bs";
import { CiGlobe } from "react-icons/ci";

import { POST } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import { auth_endpoints } from "@/utils/auth_endpoints";

import useRegisterUserStore from "@/stores/useRegisterUserStore";

// ✅ Define schema before component
const formSchema = z.object({
  domain_type: z.enum(["subdomain", "domain"]),
  domain: z.string().min(1, { message: "required" }),
}).superRefine((data, ctx) => {
  const domainType = data.domain_type;
  const domainVal = data.domain.trim().toLowerCase();

  if (domainType === "domain") {
    // domain regex: e.g., app.example.com, www.site.co.uk
    const domainRegex = /^(?!:\/\/)(?=.{4,253}$)([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$/;
    if (!domainRegex.test(domainVal)) {
      ctx.addIssue({
        code: "custom",
        path: ["domain"],
        message: "Invalid domain format for domain type 'domain'",
      });
    }
  } else {
    // subdomain regex: only subdomain-safe values
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(domainVal)) {
      ctx.addIssue({
        code: "custom",
        path: ["domain"],
        message: "Invalid domain format for domain type 'subdomain'",
      });
    }
  }
});



export default function Step4({ afetrSubmit }) {
  const [fullDomain, setFullDomain] = useState("yourcompany");

  const { newUserData, setNewUserData } = useRegisterUserStore();
  const email = newUserData?.email;

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain_type: "subdomain",
      domain: "yourcompany",
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const domainType = watch("domain_type");
  const subdomain = watch("domain");
  const domainSuffix = domainType === "subdomain" ? ".businessify.com" : "";
  const sanitizedSubdomain = (subdomain || "").toLowerCase().trim();
    //.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const finalDomain =
    domainType === "subdomain"
      ? `${sanitizedSubdomain || "yourcompany"}.businessify.com`
      : sanitizedSubdomain.includes(".")
      ? sanitizedSubdomain
      : `${sanitizedSubdomain}`;

  const onSubmit = async (formData) => {

    try {
      const body = {
        ...formData,
        email: email,
      };
      const response = await POST(auth_endpoints.auth.register.step4, body);

      if (response?.status === 200) {
        setNewUserData((prev) => ({ ...prev, formData }));
        toast.success(response.message);
        afetrSubmit(5);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  return (
    <>
      <WizardTitle step={4} />
      <FormProvider
        methods={methods}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <h3>Domain Setup</h3>

        <CheckboxOrRadio
          name="domain_type"
          label="Use a subdomain (yourcompany.businessify.com)"
          type="radio"
          value="subdomain"
        />

        <CheckboxOrRadio
          name="domain_type"
          label="Use your own domain (app.yourcompany.com)"
          type="radio"
          value="domain"
        />

        <div>
          <label className="block text-sm font-medium mb-1">
            {domainType === "subdomain" ? "Subdomain" : "Domain Name"}
          </label>
          <div className="flex items-center rounded-md border border-gray-300 pe-3">
            <div className="flex-grow">
              <InputControl
                title=""
                name="domain"
                type="text"
                placeholder=""
                icon={CiGlobe}
                className="w-full bg-transparent shadow-none"
                inputClass="w-full border-none"
                autoComplete="off"
              />
            </div>
            {domainType === "subdomain" && (
              <span className="text-sm text-gray-500 whitespace-nowrap pl-2 border-l border-gray-300 ps-2">
                .businessify.com
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {domainType === "domain"
              ? "Enter a full domain like app.example.com"
              : "Only lowercase letters, numbers, and dashes are allowed"}
          </p>
        </div>

        <div className="rounded-md bg-sky-50 p-4 border border-sky-100 text-sm space-y-2">
          <div className="flex items-center gap-2 text-blue-400">
            <BsInfoCircle />
            <p>Your CRM will be accessible at:</p>
          </div>
          <div className="bg-gray-800 text-white px-3 py-1 rounded inline-block font-mono">
            {finalDomain}
          </div>
          <p className="text-gray-500 text-xs">
            {domainType === "subdomain"
              ? "Your subdomain will be available immediately after setup."
              : "Your domain will be available after setup."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <button
              type="button"
              onClick={() => afetrSubmit?.(3)}
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
