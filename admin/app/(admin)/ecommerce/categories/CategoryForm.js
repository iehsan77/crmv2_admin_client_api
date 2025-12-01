"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import FormProvider from "@/components/FormControls/FormProvider";
import InputControl from "@/components/FormControls/InputControl";
import SelectControl from "@/components/FormControls/SelectControl";
import TextEditorControl from "@/components/FormControls/TextEditorControl";
import SwitchControl from "@/components/FormControls/SwitchControl";
import FileUpload from "@/components/FormControls/FileUpload";
import { Button } from "@/components/ui/button";

import {handleResponse} from "@/helper/ClientSideActions";
import { POST, POST_JSON } from "@/helper/ServerSideActions";

import { formSchema } from "./formSchema";
import { getFormDefaultValues } from "./formDefaultValues";
import { getCatsBreadcrumbOptions, slugify } from "@/helper/EcomActions";

import { toast } from "sonner";

const Add = ({ record }) => {
  const router = useRouter();

  // PAGE RELATED - starting
  const [categories, setCategories] = useState([]);
  const model = "Category";
  const pageTitle = "Product " + model;
  const addTitle = pageTitle + " - add";
  const addRecordUrl = ecom_endpoints.products.categories.create;
  const listUrl = ecom_endpoints?.products?.categories?.list;
  // PAGE RELATED - ending

  //const categories = [{ value: "0", label: "Root Category" }]

  // Fetch Records - starting
  useEffect(() => {
    (async () => {
      try {
        const response = await POST_JSON(listUrl, {showAll: true});
        if (response?.status === 200) {
          setCategories(getCatsBreadcrumbOptions(response.data));
        }
      } catch (error) {
        console.error("Error fetching product records:", error);
        set({ loading: false });
      }
    })();
  }, [listUrl]);
  // Fetch Records - ending

  // FORM METHODS - starting
  const defaultValues = useMemo(() => getFormDefaultValues(record), [record]);
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const {
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;
  // FORM METHODS - ending


  // FORM SUBMISSIONS - starting
  const onSubmit = async (formData, gotoListing) => {
    try {
      const body = {
        ...formData,
        parent_id: formData?.parent_id?.value,
      };


      const response = await POST(addRecordUrl, body);
      if (response?.status === 200 || response?.status === 201) {
        if (gotoListing) {
          router.push("/categories");
        } else {
          toast.success("Category updated successfully");
          window.location.reload();
        }
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };
  // FORM SUBMISSIONS - ending

  // CONVERT TO SLUG - starting
  const title = watch("title");
  useEffect(() => {
    if (title) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, setValue]);
  const getDescriptionData = (data) => {
    setValue("description", data);
  };
  // CONVERT TO SLUG - ending

  // RESET RECORD - starting
  useEffect(() => {
    //if (record) {
    methods.reset(defaultValues); // Trigger reset once data is available
    //}
  }, [record, methods, defaultValues]);
  // RESET RECORD - ending

  return (
    <>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-8 gap-4">
          <div className="shadow-xl p-5 rounded-md space-y-5 col-span-6 bg-[white]">
            <div className="w-[80%] space-y-5">
              <InputControl
                title="Title"
                name="title"
                type="text"
                extra="Group your products into categories like Men's Apparel, cosmetics, Electronics, etc."
                // vertical={true}
              />
              <InputControl
                title="URL"
                name="slug"
                type="text"
                extra="https://.../categories/.."
              />
              <SelectControl
                title="Parent Category"
                name="parent_id"
                placeholder="Select Parent Category"
                options={categories}
                //defaultValue={{ value: "0", label: "Rooto Category" }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="">Description</label>
              <p className="text-gray displayPara">
                Enter a description for your category. This will be displayed on
                the category page on your website.
              </p>
              <TextEditorControl
                name="description"
                size="300px"
                control={control}
                errors={errors}
                getData={getDescriptionData}
                defaultValue={""}
              />
            </div>
            <div className="w-[80%] space-y-5">
              <InputControl
                title="SEO Title"
                name="seo_title"
                type="text"
              />
              <InputControl
                title="SEO Keywords"
                name="seo_keywords"
                type="text"
                extra="Enter Keywords related to the category. Separate them using commas.."
              />
              <InputControl
                title="SEO Description"
                name="seo_description"
                type="text"
                extra="Type a description that summarizes the category."
              />
            </div>
          </div>
          <div className="col-span-2 space-y-4">
            <div className="p-4 shadow-xl bg-[white] border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Active Status</h4>
                <SwitchControl name="active" />
              </div>
              <span className="text-gray">
                If you in-active category then it will not functional.
              </span>
            </div>
            <div className="p-4 shadow-xl bg-[white] border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Show in Store</h4>
                <SwitchControl name="show_in_store" />
              </div>
              <span className="text-gray">
                The category will be avabilable on your website, when enabled.
              </span>
            </div>
            <div className="p-4 shadow-xl bg-[white] border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Show in Menu</h4>
                <SwitchControl name="show_in_menu" />
              </div>
              <span className="text-gray">
                The category will be avabilable on your website, menu bar, when
                enabled
              </span>
            </div>

            <div className="p-4 shadow-xl bg-[white] border rounded-md">
              <FileUpload
                title="Thumbnail"
                name="thumbnail"
                titleClassName="displayPara !mb-0 font-semibold !text-gray-dark"
              />
            </div>
            <div className="p-4 shadow-xl bg-[white] border rounded-md">
              <FileUpload
                title="Banner"
                name="banner"
                titleClassName="displayPara !mb-0 font-semibold !text-gray-dark"
              />
            </div>
          </div>

          <div className="flex justify-center lg:justify-between mt-4 col-span-6 space-x-4 mb-6">
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => onSubmit(data, true))}>
              {isSubmitting ? "Loading..." : "Submit & View All"}
            </Button>
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => onSubmit(data, false))}>
              {isSubmitting ? "Loading..." : "Submit & Add New"}
            </Button>
          </div>
        </div>
      </FormProvider>
    </>
  );
};

export default Add;
