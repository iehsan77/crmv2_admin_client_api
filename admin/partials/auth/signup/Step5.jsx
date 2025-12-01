import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Custom Components
import CheckBox from "@/components/FormControls/CheckBox";
import Loader from "@/components/Loader";
import WizardTitle from "@/partials/auth/signup/WizardTitle";
import FormProvider from "@/components/FormControls/FormProvider";
import SubmitBtn from "@/components/FormControls/SubmitBtn";

// Helpers
import { POST, GET } from "@/helper/ServerSideActions";
import { handleResponse } from "@/helper/ClientSideActions";
import { auth_endpoints } from "@/utils/auth_endpoints";
import { crm_endpoints } from "@/utils/crm_endpoints";
import { PUBLIC_PATHS } from "@/constants/paths";

// Store
import useRegisterUserStore from "@/stores/useRegisterUserStore";

// Form Schema
const formSchema = z.object({
  modules: z.array(z.string()).min(1, "Select at least one module"),
});

export default function Step5({ afetrSubmit }) {
  const router = useRouter();
  const { newUserData, setNewUserData } = useRegisterUserStore();
  const email = newUserData?.email;

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requiredModuleIds, setRequiredModuleIds] = useState([]);

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modules: [],
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Fetch Apps & Modules and Pre-select Required
  useEffect(() => {
    const fetchAppsWithModules = async () => {
      setIsLoading(true);

      try {


        const response = await GET(crm_endpoints?.apps?.getWithModules);

        if (response?.status === 200 && response?.data) {
          const fetchedData = response.data;
          setData(fetchedData);

          // Extract required module IDs
          const requiredIds = fetchedData
            .flatMap((app) => app.modules || [])
            .filter((module) => module.optional <= 0)
            .map((module) => String(module.id));

          // Set as default selected
          methods.reset({
            modules: requiredIds,
          });

          setRequiredModuleIds(requiredIds);
        } else {
          handleResponse(response);
        }
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppsWithModules();
  }, [methods]);

  const onSubmit = async (formData) => {
    try {
      const groupedApps = {};
      data.forEach((app) => {
        app.modules.forEach((module) => {
          if (formData.modules.includes(String(module?.id))) {
            if (!groupedApps[app.id]) {
              groupedApps[app.id] = [];
            }
            groupedApps[app.id].push(module?.id);
          }
        });
      });

      const body = {
        email,
        apps: JSON.stringify(groupedApps),
      };

      const response = await POST(auth_endpoints.auth.register.step5, body);

      if (response?.status === 200) {
        setNewUserData((prev) => ({ ...prev, formData }));
        toast.success(response.message);
        router.replace(PUBLIC_PATHS?.LOGIN);
      } else {
        handleResponse(response);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  return (
    <>
      <WizardTitle step={5} />
      <FormProvider
        methods={methods}
        onSubmit={handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <h2 className="text-lg font-medium">Choose Features</h2>
        <p className="mb-4 text-xs">
          Select the features you want to use in your platform. You can add or
          remove them later.
        </p>

        {isLoading ? (
          <Loader />
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {data.map((app) =>
              app?.modules?.length ? (
                <Card key={app.id} className="bg-light text-white_">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{app?.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {app?.excerpt}
                        </p>
                      </div>
                      <Badge variant="success">Included with Plan</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm font-medium">Available Modules:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
                      {app.modules.map((module) => {
                        const isRequired = requiredModuleIds.includes(
                          String(module?.id)
                        );
                        return (
                          <div
                            key={module?.id}
                            className="relative border border-gray-800 rounded-md p-4"
                          >
                            {/* Required tag in top-right */}
                            {isRequired && (
                              <span className="absolute top-2 right-2 text-[10px] text-red-400 font-medium">
                                (Required)
                              </span>
                            )}

                            {/* Checkbox and Label in one line */}
                            <div className="flex items-center gap-2">
                              <CheckBox
                                name="modules"
                                value={String(module?.id)}
                                label={module?.title}
                                disabled={isRequired}
                                labelClassName="text-sm"
                              />
                            </div>

                            {/* Excerpt below */}
                            <p className="ml-6 mt-1 text-xs text-muted-foreground">
                              {module?.excerpt}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : null
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4">
          <button
            type="button"
            onClick={() => afetrSubmit?.(4)}
            className="w-full py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 transition duration-200"
          >
            Back
          </button>

          <div />

          {!isLoading && (
            <SubmitBtn
              label="Submit"
              isSubmitting={isSubmitting}
              disabled={false}
            />
          )}
        </div>
      </FormProvider>
    </>
  );
}
