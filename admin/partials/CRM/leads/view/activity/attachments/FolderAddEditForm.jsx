"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormProvider as Form } from "react-hook-form";
import Button from "@/components/Button";
import { useDrawer } from "@/context/drawer-context";
// import { useFoldersStore } from "@/stores/useAffiliateStore";
import MultilineInput from "@/components/FormFields/MultilineInput";
import TextInput from "@/components/FormFields/TextInput";

export default function FolderAddEditForm({
  initialData,
  currentData,
  onSuccess,
}) {
  const { hideDrawer } = useDrawer();
  // const { saveFolder, updateFolder } = useFoldersStore();

  const formSchema = z.object({
    id: z.number().default(0),
    title: z.string().min(1, { message: "required" }),
  });

  const defaultValues = {
    id: currentData?.id || Date.now(), // agar naya hai to unique id
    title: initialData?.title || currentData?.title || "",
  };

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    watch,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (body) => {
    try {
      // if (currentData) {
      //   updateFolder(body);
      // } else {
      //   saveFolder(body);
      // }
      onSuccess && (await onSuccess(body));
      hideDrawer();
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (name, value) => {
    setValue(name, value);
  };

  return (
    <Form {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="pt-8 space-y-8">
          <TextInput
            label="Folder"
            value={watch("title")}
            maxLength={100}
            error={errors.title?.message}
            {...register("title")}
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="lg"
              type="button"
              className="bg-transparent"
              onClick={() => hideDrawer()}
            >
              Cancel
            </Button>
            <Button size="lg" type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
