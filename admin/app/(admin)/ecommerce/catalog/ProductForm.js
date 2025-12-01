"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormProvider from "@/components/FormControls/FormProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useParams } from "next/navigation";

import { toast } from "sonner";

import { ecom_endpoints } from "@/utils/ecom_endpoints";

import {handleResponse} from "@/helper/ClientSideActions";
import { POST, POST_JSON } from "@/helper/ServerSideActions";

import InputControl from "@/components/FormControls/InputControl";
import TextEditorControl from "@/components/FormControls/TextEditorControl";
import SwitchControl from "@/components/FormControls/SwitchControl";
import SelectControl from "@/components/FormControls/SelectControl";
import FileUpload from "@/components/FormControls/FileUpload";
import { Button } from "@/components/ui/button";

import Modal from "@/components/Modal";

import { getFormDefaultValues } from "../catalog/formDefaultValues";
import { formSchema } from "./formSchema";
import {
  getCatsBreadcrumbOptions,
  getProductTypes,
  slugify
} from "@/helper/EcomActions";
import OtherInformation from "./OtherInformation";

const ProductForm = (record) => {

  // PAGE RELATED - starting
  const router = useRouter();
  const params = useParams(); // ✅ Get route params
  const productId = params.id;
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  const categoriesUrl = ecom_endpoints?.products?.categories?.list;
  const brandsUrl = ecom_endpoints?.products?.brands?.list;
  const tagsUrl = ecom_endpoints?.products?.tags?.list;
  const warehousesUrl = ecom_endpoints?.products?.warehouses?.list;

  const addRecordUrl = ecom_endpoints.products.catalog.create;

  const productTypes = getProductTypes();

  // PAGE RELATED - ending

  // FETCH LISTING DATA - starting
  useEffect(() => {
    (async () => {
      try {
        // FECTHING CATEGORIES
        setCategoriesLoading(true);
        const catsResponse = await POST_JSON(categoriesUrl, {
          showAll: true,
        });
        setCategoriesLoading(false);
        if (catsResponse?.status === 200) {
          setCategories(getCatsBreadcrumbOptions(catsResponse.data));
        }

        // FECTHING BRANDS
        setBrandsLoading(true);
        const brandsResponse = await POST_JSON(brandsUrl, {
          showAll: true,
        });
        setBrandsLoading(false);
        if (brandsResponse?.status === 200) {
          const formattedData = brandsResponse?.data.map((item) => ({
            value: item.id.toString(),
            label: item.title,
          }));
          setBrands(formattedData);
        }

        // FECTHING TAGS
        setTagsLoading(true);
        const tagsResponse = await POST_JSON(tagsUrl, {
          showAll: true,
        });
        setTagsLoading(false);
        if (tagsResponse?.status === 200) {
          const formattedData = tagsResponse?.data.map((item) => ({
            value: item.id.toString(),
            label: item.title,
          }));
          setTags(formattedData);
        }

        // FECTHING WAREHOUSES
        setWarehousesLoading(true);
        const warehousesResponse = await POST_JSON(warehousesUrl, {
          showAll: true,
        });
        setWarehousesLoading(false);
        if (warehousesResponse?.status === 200) {
          const formattedData = warehousesResponse?.data.map((item) => ({
            value: item.id.toString(),
            label: item.title,
          }));
          setWarehouses(formattedData);
        }
      } catch (error) {
        console.error("Error fetching product records:", error);
      }
    })();
  }, [categoriesUrl, brandsUrl, tagsUrl, warehousesUrl]);
  // FETCH LISTING DATA - ending

  // FORM METHODS - starting
  const defaultValues = useMemo(() => getFormDefaultValues(record), [record]);
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const {
    watch,
    control,
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;
  // FORM METHODS - ending


  // FORM SUBMISSIONS - starting
  const onSubmit = async (formData, addMoreDetails) => {
    try {

      let tagIds = "";
      if (formData?.tag_ids?.length) {
        tagIds = formData?.tag_ids.map((tag) => tag.value).join(",");
      }
      const body = {
        ...formData,
        
        active: formData?.active ? 1 : 0,
        is_returnable: formData?.is_returnable ? 1 : 0,

        brand_id: formData?.brand_id?.value,
        brand_title: formData?.brand_id?.label,

        category_id: formData?.category_id?.value,
        category_title: formData?.category_id?.label,

        stock_location_id: formData?.stock_location_id?.value,
        stock_location_title: formData?.stock_location_id?.label,

        product_type: formData?.product_type?.value,
        tag_ids: tagIds,
      };
      const response = await POST(addRecordUrl, body);
      if (response?.status === 200 || response?.status === 201) {
        toast.success(response?.message);
        if (addMoreDetails) {
          router.push(`/ecommerce/catalog/edit/${response.data.id}`);
        } else {
          //window.location.reload();
          router.push("/ecommerce/catalog");
        }
      } else {
        handleResponse(response);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const getDescription = (data) => {
    setValue("description", data);
  };
  // FORM SUBMISSIONS - ending

  // CONVERT TO SLUG - starting
  const title = watch("title");
  useEffect(() => {
    if (title) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, setValue]);
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
        <div className="container !p-0">
          <div className="grid lg:grid-cols-8 gap-4 ">
            <div className="lg:col-span-5 xl:col-span-6  space-y-5">
              <div className="shadow-xl p-5 rounded-sm bg-[white] h-fit border">
                <div>
                  <h5>General</h5>
                </div>
                <div className="w-[80%] space-y-5">
                  <InputControl title="Title" name="title" type="text" />
                  <InputControl
                    title="URL"
                    name="slug"
                    type="text"
                    extra="https://.../products/.."
                  />
                  <SelectControl
                    title="Category"
                    name="category_id"
                    placeholder="Select Product Category"
                    options={categories}
                    defaultValue={{ value: "0", label: "Root Category" }}
                    isLoading={categoriesLoading}
                  />
                  <InputControl
                    title="Model Number"
                    name="model_number"
                    type="text"
                  />
                  <InputControl
                    title="Excerpt"
                    name="excerpt"
                    extra="short description about product"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="">Product Details</label>
                  <p className="text-gray displayPara">
                    Highlight your product&apos;s functionality and features.
                    Thesewill be displayed on the product&apos;s page.
                  </p>
                  <TextEditorControl
                    name="description"
                    size="300px"
                    control={control}
                    errors={errors}
                    getData={getDescription}
                  />
                </div>
              </div>

              <div className="bg-[white] shadow-xl p-5 border rounded-sm">
                <OtherInformation />
              </div>
            </div>
            <div className="lg:col-span-3 xl:col-span-2 space-y-5">
              <div className="p-4 shadow-xl bg-[white] border rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Active</h4>
                  <SwitchControl name="active" defaultValue={true} />
                </div>
                <span className="text-gray">
                  The product will be available on your store, when enabled.
                </span>
              </div>

              <div className="bg-[white] shadow-xl p-5 border rounded-sm">
                <h4 className="font-semibold">Thumbnail</h4>
                <FileUpload name="thumbnail" />
              </div>

              <div className="p-4 shadow-xl bg-[white] border rounded-sm">
                <InputControl
                  vertical={1}
                  title="Cost"
                  name="cost"
                  type="number"
                  tooltip="Enter the product's cost. This price will be used in finance."
                  className="mb-4"
                />
                <InputControl
                  vertical={1}
                  title="Regular Price"
                  name="price"
                  type="number"
                  tooltip="Enter the product's regular price. This price will be displayed next to the selling price and will be crossed out."
                  className="mb-4"
                />
                <InputControl
                  vertical={1}
                  title="Selling Price"
                  name="sale_price"
                  type="number"
                  tooltip="Enter the price at which you're offering this product. If this is a discounted price, enter the product's actual price under Retail Price."
                  className="mb-4"
                />
                <InputControl
                  vertical={1}
                  title="SKU (Stock Keeping Unit) "
                  name="sku"
                  type="text"
                  tooltip="Enter your product's SKU. You'll use it for maintaining your inventory."
                  className="mb-4"
                />
              </div>

              <div className="bg-white p-4 space-y-5 border rounded-sm">
                <SelectControl
                  title="Product Type"
                  name="product_type"
                  placeholder="Product Type"
                  options={productTypes}
                  vertical={true}
                />
                <SelectControl
                  title="Tags"
                  name="tag_ids[]"
                  placeholder="Tags"
                  options={tags}
                  vertical={true}
                  isMulti
                  isLoading={tagsLoading}
                  //defaultValue={defaultTags}
                  //value={[{ value: "simple", label: "Simple Product" }, { value: "variable", label: "Variable Product" },]}
                />
                <SelectControl
                  title="Brand"
                  name="brand_id"
                  placeholder="brand"
                  options={brands}
                  vertical={true}
                  isLoading={brandsLoading}
                />
                <SelectControl
                  title="Stock Location"
                  name="stock_location_id"
                  placeholder="warehouses"
                  options={warehouses}
                  vertical={true}
                  isLoading={warehousesLoading}
                />
              </div>
              <div className="bg-white p-4 space-y-5 border rounded-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Qualifies for Returns</h4>
                    <SwitchControl
                      name="is_returnable"
                      defaultValue={true}
                    />
                  </div>
                  <span className="text-gray">
                    The product can be returned by customers.
                  </span>
                </div>
                <div>
                  <InputControl
                    title="Return Policy"
                    name="return_policy"
                    type="text"
                    vertical={true}
                    extra="Type a description that summarizes your product return policy"
                  />
                </div>
              </div>
            </div>
          </div>

          {!productId ? (
            <>
              <div className="flex justify-center lg:justify-between mt-4 col-span-6 space-x-4 mb-6">
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => onSubmit(data, true))}
                >
                  {isSubmitting ? "Loading..." : "Add More Information"}
                </Button>
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit((data) => onSubmit(data, false))}
                >
                  {isSubmitting ? "Loading..." : "Submit & Add New"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-center lg:justify-between mt-4 col-span-6 space-x-4 mb-6">
              <Button
                variant="gray"
                type="button"
                onClick={() => router.push("/catalog")}
              >
                View All Products
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={handleSubmit((data) => onSubmit(data, false))}
              >
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
            </div>
          )}
        </div>
        <Modal></Modal>
      </FormProvider>
    </>
  );
};

export default ProductForm;
